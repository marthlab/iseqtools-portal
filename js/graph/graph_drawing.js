function GraphDrawing(options) {
  this.svg = options.svg;
  this.for_display = options.for_display;
  this.container_width = options.container_width;
  this.max_height = options.max_height;
  this.defs = this.svg.append("defs");
  this.svgGroup = this.svg.append("g");
  this.edgeGroup = this.svgGroup.append("g").attr("id", "edgeGroup");
  this.nodeGroup = this.svgGroup.append("g").attr("id", "nodeGroup");

  //this.svg.call(grayscale("grayscale", this.defs));
  _.each(gdata.workflows, function(wf) {
    this.svg.call(glow("glow-"+wf.id, this.defs).rgb(wf.color()).stdDeviation(4));
  }, this);
}
GraphDrawing.prototype = {
  padRectangle: function(rect, hpf, vpf) {
    var horz_padding_fraction = hpf || 0.14;
    var vert_padding_fraction = vpf || 0.12;
    return {
              x: Math.floor(rect.x-rect.width*horz_padding_fraction/2),
              y: Math.floor(rect.y-rect.height*vert_padding_fraction/2),
              width: Math.ceil(rect.width*(1+horz_padding_fraction)),
              height: Math.ceil(rect.height*(1+vert_padding_fraction))
            };
  },
  getViewBoxString: function(rect) {
     return Math.floor(rect.x)
            +" "
            +Math.floor(rect.y)
            +" "
            +Math.ceil(rect.width)
            +" "
            +Math.ceil(rect.height);
  },
  render: function(graph, old_graph, options) { // options uses "end_rect", "container_width", and "max_height"
    var options = options || {};

    function edgePathSpline(edge, edge_path) {

      var e = edge, s = e.source, t = e.target;
      // console.log(s.dagre);
      // console.log(t.dagre);
      
      var s_exit = {
        x: s.dagre.x+s.dagre.width/2,
        y: s.dagre.y + settings.graph.path_width*(1+settings.graph.path_gap)*((s.pathOrder(e, edge_path, "out")-s.numPathsOut()/2)+1/2)
      };
      var t_enter = {
        x: t.dagre.x-t.dagre.width/2,
        y: t.dagre.y + settings.graph.path_width*(1+settings.graph.path_gap)*((t.pathOrder(e, edge_path, "in")-t.numPathsIn()/2)+1/2)
      };
      var s_circ_intersect = {
        x: s.dagre.x+Math.sqrt(Math.pow(settings.nodes[s.type()].radius, 2)-Math.pow(s_exit.y-s.dagre.y, 2)),
        y: s_exit.y
      };
      var t_circ_intersect = {
        x: t.dagre.x-Math.sqrt(Math.pow(settings.nodes[t.type()].radius, 2)-Math.pow(t_enter.y-t.dagre.y, 2)),
        y: t_enter.y
      };
      var rank_exit = {
        x: Math.max.apply(this, graph.nodes.filter(function(n){ return n.dagre.rank === s.dagre.rank}).map(function(n){ return n.dagre.x+n.dagre.width/2;})),
        y: s_exit.y
      };
      var rank_enter = {
        x: Math.min.apply(this, graph.nodes.filter(function(n){ return n.dagre.rank === t.dagre.rank}).map(function(n){ return n.dagre.x-n.dagre.width/2;})),
        y: t_enter.y
      }


      function line(start, end) {
        return d3.svg.line()
          .x(function(d) { return d.x; })
          .y(function(d) { return d.y; })
          .interpolate("linear")
          ([start, end])
      }

      function curve(start, end) {

        var base_offset = (end.x-start.x)*settings.graph.edge_curvature;
        var order = e.edge_paths.indexOf(edge_path);
        var slope = (end.y-start.y)/(end.x-start.x);
        // FIXME: there MUST be a more theoretically sound way of calculating path_offset
        var path_offset_base = Math.min(Math.abs(slope), 1.4)*1.2*settings.graph.path_width*sign(slope);
        var path_offset_start = (e.edge_paths.length-1-order)*path_offset_base;
        var path_offset_end = order*path_offset_base;

        return d3.svg.line(start, end)
          .x(function(d) { return d.x; })
          .y(function(d) { return d.y; })
          .interpolate("basis")
          ([start,
            {x: start.x + base_offset + path_offset_start, y: start.y},
            {x: end.x - base_offset - path_offset_end, y: end.y},
            end])
                 
      }

      function straight_curve(start, end) {
        return d3.svg.line(start, end)
          .x(function(d) { return d.x; })
          .y(function(d) { return d.y; })
          .interpolate("basis")
          ([start,
            {x: start.x, y: start.y},
            {x: end.x, y: end.y},
            end])
      }

      // construct path string
      var path_string = "";
      path_string += line(s_circ_intersect, rank_exit)

      if(Math.abs(t.dagre.rank-s.dagre.rank) <= 2) {
        path_string += straight_curve(rank_exit, rank_exit)
        path_string += curve(rank_exit, rank_enter)
        path_string += straight_curve(rank_enter, rank_enter)
      } else {
        var points = [{x: rank_exit.x + settings.graph.rankSep, y: e.dagre.points[0].y},
                    {x: rank_enter.x - settings.graph.rankSep, y: e.dagre.points[1].y}];
        path_string += curve(rank_exit, points[0])
        path_string += straight_curve(points[0], points[1])
        path_string += curve(points[1], rank_enter)
      }

      path_string += line(rank_enter,  t_circ_intersect);

      return path_string;
    }

    function getTransform(d) { return 'translate('+ d.dagre.x +','+ d.dagre.y +')'; }

    var self = this;

    var svg = this.svg;

    var is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

    if(options && options.start_rect) {
      var start_rect = this.padRectangle(options.start_rect);

      var start_height = Math.min(start_rect.height*(this.container_width/start_rect.width) || 0, this.max_height);

      svg.attr("viewBox", this.getViewBoxString(start_rect) );
      if(options.change_container_height && !options.end_rect) {
        d3.select("#graph").transition().duration(settings.graph.render_duration).style("height", start_height+"px");
      }
      if(!options.animate_height && !options.end_rect) {
        svg.style("height", start_height+"px");
      }
    }

    if(options && options.end_rect) {
      
      var end_rect = this.padRectangle(options.end_rect);
      var end_viewBox = this.getViewBoxString(end_rect);

      var end_height = Math.min(end_rect.height*(this.container_width/end_rect.width), this.max_height);

      if(!options.animate_height) {
        svg.style("height", end_height+"px");
      }

    }

    // handle nodes
    var nodes_elems = this.nodeGroup.selectAll("g .node")
      .data(graph.nodes, Node.key);

    var new_nodes_elems = nodes_elems
      .enter()
        .append("g")
          .attr("class", "node")
          .classed("primary", function(n) { return n.type() === 'primary'; })
          .classed("secondary", function(n) { return n.type() === 'secondary'; })
          .classed("optional", function(n) { return n.gdatum.type() === 'data_format_usage' && n.gdatum.optional; })


    var old_nodes_elems = nodes_elems
      .exit()
    
    var updated_nodes_elems = nodes_elems.filter(function(d, i) { return !_(new_nodes_elems[0]).contains(this);});

    new_nodes_elems
      .append("g")
        .attr("class", "circles")
        .each(function(n) {
          var num_circles = n.gdatum.multiple ? 3 : 1;
          var circle_group;
          for(var i=0; i<num_circles; i++) {
            circle_group = d3.select(this);

            circle_group
              .append("circle")
                .attr("cx", 0)
                .attr("cy", 5*((num_circles-1)/2 - (num_circles-i-1)))
                .attr("r", function(n) { return settings.nodes[n.type()].radius; })
                .attr("stroke-width", settings.graph.path_width)
                .attr("stroke", settings.nodes.stroke)

            circle_group
              .each(function(n) {
                if(n.gdatum.type() == 'task') {
                  var rad = settings.nodes[n.type()].radius*0.73;
                  d3.select(this)
                    .append("use")
                      .attr("xlink:href", app.base_url+"/img/tasks/"+n.gdatum.id+".svg#Layer_1")
                      .attr("x", -rad)
                      .attr("y", -rad)
                      .attr("width", 2*rad)
                      .attr("height", 2*rad)
                }
              });
                
          }
        })
        .append("g")
          .attr("class", "circle_paths");

    nodes_elems.classed("link", function(n) { return n.gdatum && n.gdatum !== graph.content && n.gdatum.type() === "tool_usage"; })

    var new_labels = new_nodes_elems
      .append("g")
      .attr("class", "text")
      .each(function(n) {
        var text_elem = d3.select(this).append("text");

        // split on spaces
        var fragments = n.label.split(" ");
        fragments = fragments.map(function(word, index) {
            return word + (index == fragments.length-1 ? "" : " "); 
        });
console.log(fragments);
        //split on hyphens
        var fragments = _.flatten(fragments.map(function(fragment) {
          hypenated_fragments = fragment.split("-");
          return hypenated_fragments.map(function(word, index) {
            return word + (index == hypenated_fragments.length-1 ? "" : "-"); 
          })
        }), true);
console.log(fragments);
        // split on underscores
        fragments = _.flatten(fragments.map(function(fragment) {
          underscored_fragments = fragment.split("_");
          return underscored_fragments.map(function(word, index) {
            return word + (index == underscored_fragments.length-1 ? "" : "_"); 
          })
        }), true);
console.log(fragments);
        // split on uppercase letter preceded by lowercase letter
        fragments = _.flatten(fragments.map(function(fragment) {
          var components = [fragment[0] || ""];
          for(var i=1; i<fragment.length; i++) {
            if(fragment[i] !== fragment[i].toLowerCase() && fragment[i-1] !== fragment[i-1].toUpperCase()) {
              components.push(fragment[i]);
            } else {
              components[components.length-1] += fragment[i];
            }
          }
          return components;
        }), true);
console.log(fragments);
        var label_lines = [[]];
        for (var i=0; i<fragments.length; i++) {
          text_elem.text(label_lines[label_lines.length-1].join("") + fragments[i].trim());
          if (text_elem.node().getBBox().width > settings.nodes[n.type()].label_max_width) {
            label_lines.push([]); 
          }
          label_lines[label_lines.length-1].push(fragments[i]);
        }

        text_elem.remove();

        var textbox = d3.select(this);
        label_lines.forEach(function(line, line_index) {
          textbox
            .append("text")
            .attr("x", 0)
            .attr("dy", line_index-label_lines.length+1+"em")
            .text(line.join("").trim());
        });
      })
      .attr("text-anchor", "middle")
      .attr("transform", function(d,i) { return "translate(0, "+(-d3.select(this.parentNode).select('.circles').node().getBBox().height/2 - 9)+")";});

    var updated_labels = updated_nodes_elems.selectAll(".text");
      
    nodes_elems.each(function(n) {
      var bbox = this.getBBox();
      n.width = bbox.width;
      n.height = bbox.height;
      if(n.gdatum && n.gdatum.type() === 'data_type') {
        d3.select(this).classed("link", true);
      }
      // populate graph nodes with dagre data from old graph to facilitate pre-animation positioning of new nodes/edges
      if(old_graph) {
        old_node = _.find(old_graph.nodes, function(old_node){ return old_node.key === n.key;});
        if(old_node) {
          n.dagre = _.clone(old_node.dagre);
          n.dagre.id = "old";
        }
      }
    });

    new_nodes_elems.each(function(n){
      var twins = updated_nodes_elems.filter(function(d) { return d.gdatum === n.gdatum; });
      if(twins && twins.data().length === 1 && old_graph) {
        var twin_datum = d3.select(twins[0][0]).datum();
        n.dagre = _.clone(twin_datum.dagre);
        n.dagre.id = "copy";
        n.dagre.rank += 2;
        d3.select(this).attr("transform", getTransform);
      }
    })

    // handle edges

    var edges_elems = this.edgeGroup
      .selectAll("g.edge")
      .data(graph.edges, Edge.key)

    var new_edges_elems = edges_elems
      .enter()
        .append("g")
        .attr("class", "edge")

    var old_edges_elems = edges_elems
      .exit()

    var updated_edges_elems = edges_elems.filter(function(d, i) { return !_(new_edges_elems[0]).contains(this);});

    // handle paths

    var edges_paths = edges_elems
      .selectAll("path")
      .data(function(e) { return e.edge_paths; }, EdgePath.key)

    var new_edges_paths = edges_paths
      .enter()
        .append("path")
        .attr("stroke-width", settings.graph.path_width);

    // try scoping to edges between identical gdata
    new_edges_paths
      .filter(function(d) {
        var edge = d3.select(this.parentNode).datum();
        return edge.source.gdatum === edge.target.gdatum && edge.source.dagre && edge.target.dagre;
      })
      .attr("d", function(edge_path) {
        //debugger;
        var edge = d3.select(this.parentNode).datum();
        return edgePathSpline(edge, edge_path);
      });

    // new_edges_paths.each
    //   .append("svg:title")
    //     .text(function(d) { return d.gdatum.name; });

    edges_paths.each(function(ep){
      if(ep.gdatum && ep.gdatum.type() === 'workflow' && ep.gdatum.pipelines.length == 0) {
        d3.select(this).attr("stroke-dasharray", "7,3");
      } else if(ep.gdatum) {
        d3.select(this).classed("link", true);
      }

      if(ep.gdatum) {
        var that = this;
        $(this).qtip({
          content: {
              text: function(event, api) {
                return d3.select(that).datum().gdatum.name; 
              }
          },
          position: {
            target: 'mouse'
          }
        });
      }

    });


    var old_edges_paths = edges_paths.exit()

    var updated_edges_paths = edges_paths.filter(function(d, i) {
      return !new_edges_paths.map(function(nep) { return _(nep).contains(this); }, this).reduce(function(memo, val) {return memo || val;}, false);
    })

    dagre.layout()
      .nodeSep(settings.graph.nodeSep)
      .edgeSep(settings.graph.edgeSep)
      .rankSep(settings.graph.rankSep)
      .rankDir("LR")
      .nodes(graph.nodes)
      .edges(graph.edges)
      .debugLevel(0)
      .run();

    old_nodes_elems.each(function(n){
      var twins = nodes_elems.filter(function(d) { return d.gdatum === n.gdatum && d !== n});
      if(twins && twins.data().length === 1) {
        //n.dagre = {x: twins.datum().dagre.x, y: twins.datum().dagre.y};
        n.dagre = _.clone(twins.datum().dagre);
        n.dagre.id = "old_copy";
        n.dagre.rank += 2;
      }
    })

    if(this.for_display) {
      old_nodes_elems
        .transition()
        .duration(settings.graph.render_duration)
        .style("opacity", 0)
        .attrTween("transform", function tween(d, i, a) {
          return d3.interpolateString(this.getAttribute("transform"), getTransform(d) );
        })
        .remove();
    } else {
      old_nodes_elems.style("opacity", 0).attr("transform", getTransform).remove();
    }

    var exiting_edges_to_animate = old_edges_elems.selectAll('path').filter(function(p) {
      return p.edge.source.gdatum === p.edge.target.gdatum && _.find(graph.nodes, function(node){ return node.gdatum === p.edge.source.gdatum || node.gdatum === p.edge.target.gdatum});
    });

    (this.for_display ? exiting_edges_to_animate.transition().duration(settings.graph.render_duration) : exiting_edges_to_animate)
      .attr("d", function(edge_path) {
        var node = edge_path.edge.source.dagre.id !== "old_copy" ? edge_path.edge.target : edge_path.edge.source;
        var path_string = '';
        var point = {x: node.dagre.x+node.dagre.width/2, y: node.dagre.y+node.dagre.height/2};
        path_string += d3.svg.line()
          .x(function(d) { return d.x; })
          .y(function(d) { return d.y; })
          .interpolate("linear")
          ([point, point]);
        for(var i=0; i<3; i++) {
          path_string += d3.svg.line(point, point)
          .x(function(d) { return d.x; })
          .y(function(d) { return d.y; })
          .interpolate("basis")
          ([point, point, point, point]);
        }
        path_string += d3.svg.line()
          .x(function(d) { return d.x; })
          .y(function(d) { return d.y; })
          .interpolate("linear")
          ([point, point]);
        return path_string;
      })
      .style("stroke-opacity", 0)
      .remove();

    (this.for_display ? old_edges_paths.transition().duration(settings.graph.render_duration) : old_edges_paths)
      .style("stroke-opacity", 0)
      .remove();

    (this.for_display ? old_edges_elems.transition().duration(settings.graph.render_duration) : old_edges_elems)
      .style("opacity", 0)
      .remove();

    if(this.for_display) {
      nodes_elems
        .transition()
        .duration(settings.graph.render_duration)
        .style("opacity", 1)
        .attrTween("transform", function tween(d, i, a) {
          return d3.interpolateString(this.getAttribute("transform"), getTransform(d) );
        });
    } else {
      nodes_elems.style("opacity", 1).attr("transform", getTransform);
    }

    (this.for_display ? updated_labels.transition().duration(settings.graph.render_duration) : updated_labels)
     .attr("transform", function(d,i) { return "translate(0, "+(-d3.select(this.parentNode).select('.circles').node().getBBox().height/2 - 9)+")";});  

    (this.for_display ? new_edges_paths.transition().duration(settings.graph.render_duration) : new_edges_paths)
      .attr("d", function(edge_path) {
        var edge = d3.select(this.parentNode).datum();
        return edgePathSpline(edge, edge_path);
      })
      .attr("stroke", function(edge_path) {
        if(edge_path.gdatum) {
          return edge_path.gdatum.color();
        } else if(graph.content_type === "pipeline") {
          return graph.content.color();
        } else if(graph.content_type === "tool_usage") {
          return graph.content.pipeline.color();
        }
      })
      .style("stroke-opacity", 1);

    (this.for_display ? updated_edges_paths.transition().duration(settings.graph.render_duration) : updated_edges_paths)
      .attr("d", function(edge_path) {
        var edge = d3.select(this.parentNode).datum();
        return edgePathSpline(edge, edge_path);
      })
      .attr("stroke", function(edge_path) {
        if(edge_path.gdatum) {
          return edge_path.gdatum.color();
        } else if(graph.content_type === "pipeline") {
          return graph.content.color();
        } else if(graph.content_type === "tool_usage") {
          return graph.content.pipeline.color();
        }
      })
      .style("stroke-opacity", 1);

    edges_paths
      .each(function(edge_path) {
        var edge_path_elem = this;
        this.onclick = function() { if(hasClassSVG(edge_path_elem, 'link')) { app.requestResource(edge_path.gdatum.url()); } };
        this.onmouseover = function() {
          $(edge_path_elem).qtip('api') && $(edge_path_elem).qtip('api').show();
          edges_paths.classed("hover", function(ep) {
            return ep.gdatum === edge_path.gdatum; }
          );
        };
        this.onmouseout = function() {
          $(edge_path_elem).qtip('api') && $(edge_path_elem).qtip('api').hide();
          edges_paths.classed("hover", false);
        };
      });

    nodes_elems.each(function(node) {
      var node_elem = this;
      this.onclick = function() { if(hasClassSVG(node_elem, 'link')) { app.requestResource(node.gdatum.url()); } };
    });

    nodes_elems
      .each(function(node) {
        var node_elem = this;
        this.onclick = function() { if(hasClassSVG(node_elem, 'link')) { app.requestResource(node.gdatum.url()); } };
      });

    if(this.for_display && options.end_rect) {

    d3.transition()
      .duration(settings.graph.render_duration)
      .each(function() {

        if(end_height > 1 || !is_firefox) {
          svg.transition().attr("viewBox", end_viewBox);
        }
        if(options.animate_height) {
          svg.transition().style("height", end_height+"px");
        }
        if(options.change_container_height) {
          d3.select("#graph").transition().style("height", end_height+"px");
        }
  
    })

    }

  },
  highlightAllWorkflows: function() {
    this.edgeGroup
      .selectAll("g.edge").selectAll("path")
      .attr("stroke", function(ep,i){
        return ep.gdatum.color();
      })
      .attr("filter", null);
  },
  highlightWorkflow: function(workflow) {
    this.edgeGroup
      .selectAll("g.edge").selectAll("path")
      .attr("stroke", function(ep,i){
        var color = ep.gdatum.color();
        var grayscale = rgbToGrayscale(color);
        //debugger;
        return (workflow !== null && workflow === ep.gdatum ? color : grayscale); 
      })
      .attr("filter", function(ep,i){
        return (workflow !== null && workflow === ep.gdatum ? "url(#glow-"+workflow.id+")" : ""); 
      });
  },
  getRect: function() {
    //var bcr = this.svgGroup.node().getBoundingClientRect();
    return this.svg.node().getBBox();

  },
  getInnerRect: function(gdatum) {

    //var node_path_elems = this.nodeGroup.selectAll("circle.circle_path").filter(function(np) { return np.gdatum === gdatum; });
    var edge_path_elems = this.edgeGroup.selectAll("path").filter(function(ep) { return ep.gdatum === gdatum; });
    var node_elems = this.nodeGroup.selectAll("g .node").filter(function(ep) { return ep.gdatum === gdatum; });
    var x_min = Number.POSITIVE_INFINITY;
    var y_min = Number.POSITIVE_INFINITY;
    var x_max = Number.NEGATIVE_INFINITY;
    var y_max = Number.NEGATIVE_INFINITY;

    node_elems.each(function(d, i) {
      var dagre_data = this.__data__.dagre;
      var path_bbox = {
        x: dagre_data.x-dagre_data.width/2,
        y: dagre_data.y-dagre_data.height/2,
        width: dagre_data.width,
        height: dagre_data.height
      };
      x_min = Math.min(x_min, path_bbox.x);
      x_max = Math.max(x_max, path_bbox.x+path_bbox.width);
      y_min = Math.min(y_min, path_bbox.y);
      y_max = Math.max(y_max, path_bbox.y+path_bbox.height);
    })

    edge_path_elems.each(function(d, i) {
      var path_bbox = this.getBBox();
      x_min = Math.min(x_min, path_bbox.x);
      x_max = Math.max(x_max, path_bbox.x+path_bbox.width);
      y_min = Math.min(y_min, path_bbox.y);
      y_max = Math.max(y_max, path_bbox.y+path_bbox.height);
    })

    // paths are one-dimensional objects, so we need to prevent possibilities of zero width or height
    if(x_max-x_min === 0) {
      x_min -= 5;
      x_max += 5;
    }
    if(y_max-y_min === 0) {
      y_min -= 5;
      y_max += 5;
    }

    return {x: x_min, y: y_min, width: x_max-x_min, height: y_max-y_min};

    
  }
}