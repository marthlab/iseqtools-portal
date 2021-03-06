  function Graph(content) {
    this.content = content;
    this.content_type = this.content && this.content.type();
    this._createNodes();
    this._createEdges();
    this._createEdgePaths();
    this._assignKeys();

    var edge_path_gdatum_ids = _.uniq(this.edge_paths.map( function(ep){ return (ep.gdatum && ep.gdatum.id) || '';}));

    this.pathColors = d3.scale.category10().domain(edge_path_gdatum_ids);

  }
  Graph.prototype = {
    _createNodes: function() {
      switch(this.content_type) {
        case "summary":
          this.primary_nodes = gdata.tasks.map(function(task) {
            return new Node({
              gdatum: task,
              label: task.name,
              graph: this
            });
          }, this);

          this.secondary_nodes = _.union.apply(null, gdata.tasks.map(function(task) {
            return _.union(task.in_data_types, task.out_data_types);
          })).map(function(dt) {
            return new Node({
              gdatum: dt,
              label: dt.name.toTitleCase(),
              graph: this
            });
          }, this);

          break;

        case "workflow":
          var wf = this.content;

          this.primary_nodes = wf.tasks.map(function(task) {
            return new Node({
              gdatum: task,
              label: task.name,
              graph: this
            });
          }, this);

          this.secondary_nodes = _.union.apply(null, wf.tasks.map(function(task) {
            return _.union(task.in_data_types, task.out_data_types);
          })).map(function(dt) {
            return new Node({
              gdatum: dt,
              label: dt.name.toTitleCase(),
              graph: this
            });
          }, this);

          break;

        case "data_type":
          var dt = this.content;

          this.primary_nodes = [];

          if(this.content.pipelines_dedicated.length > 0) {
            this.secondary_nodes = [dt, dt].map(function(dt) {
              return new Node({
                gdatum: dt,
                label: dt.name.toTitleCase(),
                graph: this
              });
            }, this);
          } else {
            this.secondary_nodes = [];
          }
          
          break;

        case "pipeline":
          var pl = this.content;

          this.primary_nodes = pl.tool_usages.map(function(tu) { return new Node({gdatum: tu, label: tu.tool.name, graph: this});}, this);
          this.secondary_nodes = pl.data_format_usages
            .filter(function(dfu){ return !dfu.stream;})
            .map(function(dfu) { return new Node({
              gdatum: dfu,
              label: dfu.label,
              graph: this
            });}, this);

          break;

        case "tool_usage":
          var tu = this.content;

          this.primary_nodes = [new Node({gdatum: tu, label: tu.tool.id, graph: this})];
          this.secondary_nodes = _.union(tu.in_data_format_usages, tu.out_data_format_usages)
                                  .map(function(dfu) { return new Node({
                                    gdatum: dfu,
                                    label: dfu.label,
                                    graph: this
                                  });}, this);
          break;

        default:
          this.primary_nodes = [];
          this.secondary_nodes = [];
      }

      this.nodes = _.union(this.primary_nodes, this.secondary_nodes);
    },
    _createEdges: function() {

      switch(this.content_type) {
        case "summary":
        case "workflow":
          this.edges = _.union.apply(null, this.primary_nodes.map(function(primary_node) {
            //debugger;
            var edges_out = primary_node.gdatum.out_data_types.map(function(dt) {
              //debugger;
              return new Edge({
                source: primary_node,
                target: _(this.secondary_nodes).find(function(secondary_node) { return secondary_node.gdatum == dt;}),
                graph: this
              });
            }, this);
            var edges_in = primary_node.gdatum.in_data_types.map(function(dt) {
              return new Edge({
                source: _(this.secondary_nodes).find(function(secondary_node) { return secondary_node.gdatum == dt;}),
                target: primary_node,
                graph: this
              });
            }, this);
            return _.union(edges_in, edges_out);
          }, this));

          break;

        case "data_type":

          this.edges = [];
          if(this.secondary_nodes.length === 2) {
            this.edges.push(new Edge({
              source: this.secondary_nodes[0],
              target: this.secondary_nodes[1],
              graph: this
            }));    
          }

          break;

        case "pipeline":

          this.edges = _.union.apply(this, this.primary_nodes.map(function(primary_node) {
            var edges_out = primary_node.gdatum.out_data_format_usages
              .filter(function(dfu){ return !dfu.stream})
              .map(function(dfu) {
                return new Edge({
                  source: primary_node,
                  target: _(this.secondary_nodes).find(function(secondary_node) { return secondary_node.gdatum == dfu;}),
                  graph: this
                });
              }, this);
            var stream_edges_out = primary_node.gdatum.out_data_format_usages
              .filter(function(dfu){ return dfu.stream})
              .map(function(dfu) {
                return new Edge({
                  source: primary_node,
                  target: _(this.primary_nodes).find(function(primary_node) { return _(primary_node.gdatum.in_data_format_usages).contains(dfu);}),
                  graph: this
                });
              }, this);
            var edges_in = primary_node.gdatum.in_data_format_usages
              .filter(function(dfu){ return !dfu.stream})
              .map(function(dfu) {
                return new Edge({
                  source: _(this.secondary_nodes).find(function(secondary_node) { return secondary_node.gdatum == dfu;}),
                  target: primary_node,
                  graph: this
                });
              }, this);

            return _.union(_.union(edges_in, edges_out), stream_edges_out);
          }, this));
  
          break;

        case "tool_usage":

            var primary_node = this.primary_nodes[0];
            var edges_out = primary_node.gdatum.out_data_format_usages
              .map(function(dfu) {
                return new Edge({
                  source: primary_node,
                  target: _(this.secondary_nodes).find(function(secondary_node) { return secondary_node.gdatum == dfu;}),
                  graph: this
                });
              }, this);
            var edges_in = primary_node.gdatum.in_data_format_usages
              .map(function(dfu) {
                return new Edge({
                  source: _(this.secondary_nodes).find(function(secondary_node) { return secondary_node.gdatum == dfu;}),
                  target: primary_node,
                  graph: this
                });
              }, this);

            this.edges = _.union(edges_in, edges_out);

          break;

        default:
          this.edges = [];
      }
    },
    _createEdgePaths: function() {
      this.edges.forEach(function(edge) {
        switch(this.content_type) {
          case "summary":
            edge.edge_paths = _.union(edge.source.gdatum.workflows || [], edge.target.gdatum.workflows || []).map(function(wf){
              return new EdgePath({edge: edge, gdatum: wf});
            }, this);
            break;
          case "workflow":
            var workflow = this.content;
            edge.edge_paths = workflow.pipelines.filter(function(pl) {
              var e = edge, s = edge.source, t = edge.target;
              var to_intermediate_task = _(pl.data_types).contains(s.gdatum)
                && this.edges.some(function(e2){
                  return e2.source === t && _(pl.data_types).contains(e2.target.gdatum);
                });
              var from_intermediate_task = _(pl.data_types).contains(t.gdatum)
                && this.edges.some(function(e2){
                  return e2.target === s && _(pl.data_types).contains(e2.source.gdatum);
                });
              return to_intermediate_task || from_intermediate_task;
            }, this).map(function(pl){
              return new EdgePath({edge: edge, gdatum: pl});
            }, this);

            break;
          case "data_type":
            var dt = this.content;
            edge.edge_paths = dt.pipelines_dedicated.map(function(pl){return new EdgePath({edge: edge, gdatum: pl})});
            break
          case "pipeline":
            var pl = this.content;
            edge.edge_paths = [new EdgePath({edge: edge, gdatum: null})];
            break;
          case "tool_usage":
            var tu = this.content;
            edge.edge_paths = [new EdgePath({edge: edge, gdatum: null})];
            break;
          default:
            edge.edge_paths = [];
        }
      }, this);

      this.edge_paths = _.flatten(this.edges.map(function(edge){return edge.edge_paths;}));
    },
    _assignKeys: function() {

      this.overlaps_old_graph = false;

      if(widgets.graph_widget.old_graph) {

        var old_graph = widgets.graph_widget.old_graph;
        var old_nodes = old_graph.nodes;
        var old_edges = old_graph.edges;

        this.nodes.forEach(function(node) {
          var match = node.gdatum && _(old_nodes).find(function(old_node){
            return old_node.gdatum == node.gdatum;
          });
          if(match && !_(this.nodes).some(function(n){return n.key === match.key;})) {
            node.key = match.key;
            this.overlaps_old_graph = true;
          }
        }, this);

        this.edges.forEach(function(edge) {
          var match = edge.source.gdatum && edge.target.gdatum && _(old_edges).find(function(old_edge){
            return old_edge.source.gdatum == edge.source.gdatum && old_edge.target.gdatum == edge.target.gdatum;
          });
          if(match) {
            edge.key = match.key;
            this.overlaps_old_graph = true;
            for(var i=0; i<match.edge_paths.length && i<edge.edge_paths.length; i++) {
              edge.edge_paths[i].key = match.edge_paths[i].key;
            }
          }
        }, this);

      }

      // all nodes and edge_paths that have no corresponding member in the old graph are assigned a random GUID for the key
      this.nodes.forEach(function(node) {
        node.key = node.key || guid();
      });
      this.edges.forEach(function(edge) {
        edge.key = edge.key || guid();
        edge.edge_paths.forEach(function(edge_path) {
          edge_path.key = edge_path.key || guid();
        });
      });

    }
  }

