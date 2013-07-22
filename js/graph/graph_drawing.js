function GraphDrawing(options) {
  this.svg = options.svg;
  this.for_display = options.for_display;
  this.container_width = options.container_width;
  this.max_height = options.max_height;
  this.svgGroup = this.svg.append("g");
  this.edgeGroup = this.svgGroup.append("g").attr("id", "edgeGroup");
  this.nodeGroup = this.svgGroup.append("g").attr("id", "nodeGroup");

  this.svg.call(glow("myGlow").rgb("orange").stdDeviation(3));
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
  render: function(graph, options) { // options uses "end_rect", "container_width", and "max_height"
    var options = options || {};

    function edgePathSpline(edge, edge_path) {

      var e = edge, s = e.source, t = e.target;
      
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
        var path_offset = order*Math.min(Math.abs(slope), 1)*1.3*settings.graph.path_width*-sign(slope);

        return d3.svg.line(start, end)
          .x(function(d) { return d.x; })
          .y(function(d) { return d.y; })
          .interpolate("basis")
          ([start,
            {x: start.x + base_offset + path_offset, y: start.y},
            {x: end.x - base_offset + path_offset, y: end.y},
            end])
      }

      function straight_curve(start, end) {

        var base_offset = (end.x-start.x)*settings.graph.edge_curvature;
        var order = e.edge_paths.indexOf(edge_path);
        var slope = (end.y-start.y)/(end.x-start.x);
        // FIXME: there MUST be a more theoretically sound way of calculating path_offset
        var path_offset = order*Math.min(Math.abs(slope), 1)*1.3*settings.graph.path_width*-sign(slope);

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

      if(Math.abs(t.dagre.rank-s.dagre.rank) == 2) {
        path_string += straight_curve(rank_exit, rank_exit)
        path_string += curve(rank_exit, rank_enter)
        path_string += straight_curve(rank_enter, rank_enter)
        //path_string += curve(points[1], rank_enter)
      } else {
        //var connection_y = e.dagre.points[0].y; // same as e.dagre.points[1].y
        var points = [{x: rank_exit.x + settings.graph.rankSep, y: e.dagre.points[0].y},
                    {x: rank_enter.x - settings.graph.rankSep, y: e.dagre.points[1].y}];
        path_string += curve(rank_exit, points[0])
        path_string += straight_curve(points[0], points[1])
        path_string += curve(points[1], rank_enter)
      }

      path_string += line(rank_enter,  t_circ_intersect);

      return path_string;
    }

    var self = this;

    var svg = this.svg;

    var is_firefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;

    if(options && options.start_rect) {
      var start_rect = this.padRectangle(options.start_rect);

      var start_height = Math.min(start_rect.height*(this.container_width/start_rect.width), this.max_height);

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

    var circle_paths = nodes_elems.select("g.circles").select("g.circle_paths")
      .selectAll("circle.circle_path")
      .data(function(n) { return n.node_paths; }, NodePath.key);

    var new_circle_paths = circle_paths
        .enter()
          .append("circle")
          .attr("class", "circle_path")
          .attr("cx", 0)
          .attr("cy", 0)
          .attr("r", function(node_path) {
            var node = d3.select(this.parentNode).datum();
            return settings.nodes[node.type()].radius+(node.node_paths.indexOf(node_path)+1)*settings.graph.path_width;
          })
          .attr("stroke", function(node_path) {
            var node = d3.select(this.parentNode).datum();
            return graph.pathColors(node_path.gdatum && node_path.gdatum.id);
          })
          .attr("stroke-width", settings.graph.path_width);

    circle_paths.classed("link", function(np) { return true; })

    var old_circle_paths = circle_paths
      .exit();

    var new_labels = new_nodes_elems
      .append("g")
      .attr("class", "text")
      .each(function(n) {
        var text_elem = d3.select(this).append("text");
        var split_by_spaces = n.label.split(" ");
        var fragments = _.flatten(split_by_spaces.map(function(fragment) {
          hypenated_fragments = fragment.split("-");
          return hypenated_fragments.map(function(word, index) {
            return word + (index == hypenated_fragments.length-1 ? " " : "-"); 
          })
        }), true);

        var label_lines = [[]];
        for (var i=0; i<fragments.length; i++) {
          text_elem.text(label_lines[label_lines.length-1].join("") + fragments[i].trim());
          if (text_elem.node().getBBox().width > settings.nodes.label_max_width) {
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
    });

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

    edges_paths.classed("link", function(ep) { return ep.gdatum && !(ep.gdatum.type() == 'workflow' && ep.gdatum.pipelines.length == 0);});

    edges_paths.each(function(ep){
      if(ep.gdatum && !(ep.gdatum.type() == 'workflow' && ep.gdatum.pipelines.length == 0)) {
        d3.select(this).classed("link", true);
      } else {
        d3.select(this).attr("stroke-dasharray", "10,10");
      }
    });

    var old_edges_paths = edges_paths.exit()

    var updated_edges_paths = edges_paths.filter(function(d, i) {
      return !new_edges_paths.map(function(nep) { return _(nep).contains(this); }, this).reduce(function(memo, val) {return memo || val;}, false);
    })
//debugger; 
    dagre.layout()
      .nodeSep(settings.graph.nodeSep)
      .edgeSep(settings.graph.edgeSep)
      .rankSep(settings.graph.rankSep)
      .rankDir("LR")
      .nodes(graph.nodes)
      .edges(graph.edges)
      .debugLevel(0)
      .run();

    (this.for_display ? old_nodes_elems.transition().duration(settings.graph.render_duration) : old_nodes_elems)
      .style("opacity", 0)
      .remove();


    (this.for_display ? old_circle_paths.transition().duration(settings.graph.render_duration) : old_circle_paths)
      .style("stroke-opacity", 0)
      .remove();
   

    (this.for_display ? old_edges_paths.transition().duration(settings.graph.render_duration) : old_edges_paths)
      .style("stroke-opacity", 0)
      .remove();

    (this.for_display ? old_edges_elems.transition().duration(settings.graph.render_duration) : old_edges_elems)
      .style("opacity", 0)
      .remove();


    var getTransform = function(d) { return 'translate('+ d.dagre.x +','+ d.dagre.y +')'; };

    new_nodes_elems.attr("transform", getTransform);

    (this.for_display ? new_nodes_elems.transition().duration(settings.graph.render_duration) : new_nodes_elems)
      .style("opacity", 1);

    if(this.for_display) {
      updated_nodes_elems
        .transition()
        .duration(settings.graph.render_duration)
        .attrTween("transform", function tween(d, i, a) {
          return d3.interpolateString(this.getAttribute("transform"), getTransform(d) );
        });
    } else {
      updated_nodes_elems.attr("transform", getTransform);
    }

    (this.for_display ? new_circle_paths.transition().duration(settings.graph.render_duration) : new_circle_paths)
      .style("stroke-opacity", 1);

    (this.for_display ? updated_labels.transition().duration(settings.graph.render_duration) : updated_labels)
     .attr("transform", function(d,i) { return "translate(0, "+(-d3.select(this.parentNode).select('.circles').node().getBBox().height/2 - 9)+")";});  

    (this.for_display ? updated_edges_paths.transition().duration(settings.graph.render_duration) : updated_edges_paths)
      .attr("d", function(edge_path) {
        var edge = d3.select(this.parentNode).datum();
        return edgePathSpline(edge, edge_path);
      })
      .attr("stroke", function(edge_path) {
        return edge_path.gdatum ? edge_path.gdatum.color() : graph.content.color();
      })
    
    new_edges_paths
      .attr("d", function(edge_path) {
        var edge = d3.select(this.parentNode).datum();
        return edgePathSpline(edge, edge_path);
      })
      .attr("stroke", function(edge_path) {
        return edge_path.gdatum ? edge_path.gdatum.color() : graph.content.color();
      })

    edges_paths
      .each(function(edge_path) {
        var edge_path_elem = this;
        this.onclick = function() { if(hasClassSVG(edge_path_elem, 'link')) { app.requestResource(edge_path.gdatum.url()); } };
        this.onmouseover = function() { edges_paths.classed("hover", function(ep) { return ep.gdatum === edge_path.gdatum; }); };
        this.onmouseout = function() { edges_paths.classed("hover", false); };
      });

    circle_paths
      .each(function(node_path) {
        var node_path_elem = this;
        this.onclick = function() { if(hasClassSVG(node_path_elem, 'link')) { app.requestResource(node_path.gdatum.url()); } };
      })
      .attr("stroke", function(node_path) {
        return node_path.gdatum ? node_path.gdatum.color() : graph.content.color();
      })

    nodes_elems // node.gdatum && node.gdatum.type() == "tool_usage"
      .each(function(node) {
        var node_elem = this;
        this.onclick = function() { if(hasClassSVG(node_elem, 'link')) { app.requestResource(node.gdatum.url()); } };
      });

    (this.for_display ? new_edges_paths.transition().duration(settings.graph.render_duration) : new_edges_paths)
      .style("stroke-opacity", 1)

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
  highlightWorkflow: function(workflow) {
    this.edgeGroup
      .selectAll("g.edge").selectAll("path")
      .style("filter", function(ep,i){
        return (workflow !== null && workflow === ep.gdatum ? "url(#myGlow)" : ""); 
      });
  },
  getRect: function() {
    //var bcr = this.svgGroup.node().getBoundingClientRect();
    return this.svg.node().getBBox();

  },
  getInnerRect: function(gdatum) {

    var node_path_elems = this.nodeGroup.selectAll("circle.circle_path").filter(function(np) { return np.gdatum === gdatum; });
    var edge_path_elems = this.edgeGroup.selectAll("path").filter(function(ep) { return ep.gdatum === gdatum; });

    var x_min = Number.POSITIVE_INFINITY;
    var y_min = Number.POSITIVE_INFINITY;
    var x_max = Number.NEGATIVE_INFINITY;
    var y_max = Number.NEGATIVE_INFINITY;

    node_path_elems.each(function(d, i) {
      var dagre_data = this.parentElement.parentElement.parentElement.__data__.dagre;
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

    return {x: x_min, y: y_min, width: x_max-x_min, height: y_max-y_min};

    
  }
}