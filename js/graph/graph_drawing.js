function GraphDrawing(graph, svg, use_transitions) {
	this.graph = graph;
	this.svg = svg;
	this.use_transitions = use_transitions;
	this.svgGroup = this.svg.append("g");
  this.edgeGroup = this.svgGroup.append("g").attr("id", "edgeGroup");
  this.nodeGroup = this.svgGroup.append("g").attr("id", "nodeGroup");
}
GraphDrawing.prototype = {
	_edgePathSpline: function(edge, path_item) {

		var e = edge, s = e.source, t = e.target;
		
    var s_exit = {
    	x: s.dagre.x+s.dagre.width/2,
    	y: s.dagre.y + app.cfg.graph.path_width*(1+app.cfg.graph.path_gap)*((s.pathOrder(e, path_item, "out")-s.numPathsOut()/2)+1/2)
    };
	  var t_enter = {
	  	x: t.dagre.x-t.dagre.width/2,
	  	y: t.dagre.y + app.cfg.graph.path_width*(1+app.cfg.graph.path_gap)*((t.pathOrder(e, path_item, "in")-t.numPathsIn()/2)+1/2)
	  };
	  var s_circ_intersect = {
	  	x: s.dagre.x+Math.sqrt(Math.pow(s.cfg.radius, 2)-Math.pow(s_exit.y-s.dagre.y, 2)),
	  	y: s_exit.y
	  };
	  var t_circ_intersect = {
	  	x: t.dagre.x-Math.sqrt(Math.pow(t.cfg.radius, 2)-Math.pow(t_enter.y-t.dagre.y, 2)),
	  	y: t_enter.y
	  };
	  // var s_exit = {
   //  	x: s_circ_intersect.x+s.dagre.width/2-s.cfg.radius,
   //  	y: s_exit.y
   //  };
   //  var t_enter = {
	  // 	x: t_circ_intersect.x-t.dagre.width/2+t.cfg.radius,
	  // 	y: t_enter.y
	  // };

	  function line(start, end) {
			return d3.svg.line()
	      .x(function(d) { return d.x; })
	      .y(function(d) { return d.y; })
	      .interpolate("linear")
	      ([start, end])
		}

		function curve(start, end) {

			var base_offset = (end.x-start.x)*app.cfg.graph.edge_curvature;
			var order = e.path_items.indexOf(path_item);
			var slope = (end.y-start.y)/(end.x-start.x);
			// FIXME: there MUST be a more theoretically sound way of calculating path_offset
			var path_offset = order*Math.min(Math.abs(slope), 1)*1.3*app.cfg.graph.path_width*-sign(slope);

			return d3.svg.line(start, end)
	      .x(function(d) { return d.x; })
	      .y(function(d) { return d.y; })
	      .interpolate("basis")
	      ([start,
	      	{x: start.x + base_offset + path_offset, y: start.y},
	      	{x: end.x - base_offset + path_offset, y: end.y},
	      	end])
		}

	  // construct path string
	  var path_string = "";
	  
	  if(s_circ_intersect.x < s_exit.x) {
  		path_string += line(s_circ_intersect, s_exit);
  	}

	  if(Math.abs(s.dagre.rank-t.dagre.rank) == 2) {
	  	path_string += curve(s_exit, t_enter)
	  	//path_string += (curve(s_exit, {x: s_exit.x + app.cfg.graph.rankSep, y: t_enter.y}) + line({x: s_exit.x + app.cfg.graph.rankSep, y: t_enter.y}, t_enter))
	  } else {
	  	var points = [{x: s_exit.x + app.cfg.graph.rankSep, y: e.dagre.points[0].y},
  								{x: t_enter.x - app.cfg.graph.rankSep, y: e.dagre.points[1].y}];
	  	path_string +=
	  		( curve(s_exit, points[0])
	  		+ line(points[0], points[1])
	  		+ curve(points[1], t_enter)
	  		);
	  }

	  if(t_enter.x < t_circ_intersect.x) {
  		path_string += line(t_enter, t_circ_intersect);
  	}

	  return path_string;
	},
	render: function(viewBox) {

		var self = this;

	  // handle nodes
    var nodes_elems = this.nodeGroup.selectAll("g .node")
	    .data(this.graph.nodes, Node.key);

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
					var num_circles = n.referent.multiple ? 3 : 1;
					var circle_group;
					for(var i=0; i<num_circles; i++) {
						circle_group = d3.select(this);

						circle_group
							.append("circle")
								.attr("cx", 0)
								.attr("cy", 5*((num_circles-1)/2 - (num_circles-i-1)))
								.attr("r", function(n) { return n.cfg.radius; })
								.attr("stroke-width", app.cfg.graph.path_width)
								.attr("stroke", app.cfg.nodes.stroke)
								
					}
				})
				.append("g")
					.attr("class", "circle_paths");

		var circle_paths = nodes_elems.select("g.circles").select("g.circle_paths")
			.selectAll("circle.circle_path")
			.data(function(n) { return n.path_items; }, function(pi) {return pi.constructor.name + "__" + pi.id;});

		var new_circle_paths = circle_paths
	  		.enter()
	    		.append("circle")
	  			.attr("class", "circle_path")
	  			.attr("cx", 0)
					.attr("cy", 0)
					.attr("r", function(path_item) {
						var node = d3.select(this.parentNode).datum();
	    			return node.cfg.radius+(node.path_items.indexOf(path_item)+1)*app.cfg.graph.path_width;
					})
	  			.attr("stroke", function(path_item) {
	  				var node = d3.select(this.parentNode).datum();
	    			return node.graph.pathColors(path_item.id);
	  			})
	  			.attr("stroke-width", app.cfg.graph.path_width);

		var old_circle_paths = circle_paths
			.exit();

	  var new_labels = new_nodes_elems
	    .append("text")
	    .each(function(n) {
	    	var text_elem = d3.select(this);
	    	var fragments = _.flatten(n.label.split(" ").map(function(fragment) {
	    		hypenated_fragments = fragment.split("-");
	    		return hypenated_fragments.map(function(word, index) {
	    			return word + (index == hypenated_fragments.length -1 ? "" : "-"); 
	    		})
	    	}), true);

	    	var label_lines = [[]];
				for (var i=0; i<fragments.length; i++) {
					text_elem.text(label_lines+ " " + fragments[i]);
				  if (text_elem.node().getBBox().width > app.cfg.nodes.label_max_width) {
				    label_lines.push([]); 
				  }
				  label_lines[label_lines.length-1].push(fragments[i]);
				}

				text_elem.text("");
	    	label_lines.forEach(function(line, line_index) {
			    text_elem
				    .append("tspan")
				    .attr("x", 0)
				    .attr("dy", "1em")
				    .text(line.join(" "));
	    	});
	    })
	    .attr("text-anchor", "middle")
      .attr("x", 0)
      .attr("y", function(n) {return -this.getBBox().height - $('.circles', this.parentNode)[0].getBBox().height/2 - 4; });

    var labels = nodes_elems.select(".node text");
    	

		nodes_elems.each(function(n) {
	    var bbox = this.getBBox();
	    n.bbox = bbox;
	    n.width = bbox.width;
	    n.offsetheight = -$(this).children('text')[0].getBBox().y;
	    n.height = bbox.height;
	  });

		// handle edges

		var edges_elems = this.edgeGroup
	    .selectAll("g.edge")
	    .data(this.graph.edges, Edge.key)

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
	    .data(function(e) { return e.path_items; }, function(pi) {return pi.constructor.name + "__" + pi.id;})

	  var new_edges_paths = edges_paths
	  	.enter()
    		.append("path")
    		.attr("stroke-width", app.cfg.graph.path_width);

	  var old_edges_paths = edges_paths.exit()

		var updated_edges_paths = edges_paths.filter(function(d, i) {
			return !new_edges_paths.map(function(nep) { return _(nep).contains(this); }, this).reduce(function(memo, val) {return memo || val;}, false);
		})

	  dagre.layout()
	    .nodeSep(this.graph.cfg.nodeSep)
	    .edgeSep(this.graph.cfg.edgeSep)
	    .rankSep(this.graph.cfg.rankSep)
	    .rankDir("LR")
	    .nodes(this.graph.nodes)
	    .edges(this.graph.edges)
	    .debugLevel(1)
	    .run();

	  (this.use_transitions ? old_nodes_elems.transition().duration(this.graph.cfg.render_duration) : old_nodes_elems)
	  	.style("opacity", 0)
	  	.remove();


	  (this.use_transitions ? old_circle_paths.transition().duration(this.graph.cfg.render_duration) : old_circle_paths)
			.style("stroke-opacity", 0)
  		.remove();
	 

	 	(this.use_transitions ? old_edges_paths.transition().duration(this.graph.cfg.render_duration) : old_edges_paths)
	  	.style("stroke-opacity", 0)
	  	.remove();

	  (this.use_transitions ? old_edges_elems.transition().duration(this.graph.cfg.render_duration) : old_edges_elems)
	  	.style("opacity", 0)
	  	.remove();


	  var getTransform = function(d) { return 'translate('+ d.dagre.x +','+ d.dagre.y +')'; };

	  new_nodes_elems.attr("transform", getTransform);

	  (this.use_transitions ? new_nodes_elems.transition().duration(this.graph.cfg.render_duration) : new_nodes_elems)
	  	.style("opacity", 1);

	  if(this.use_transitions) {
	  	updated_nodes_elems
		  	.transition()
      	.duration(this.graph.cfg.render_duration)
      	.attrTween("transform", function tween(d, i, a) {
		      return d3.interpolateString(this.getAttribute("transform"), getTransform(d) );
		    });
	  } else {
	  	updated_nodes_elems.attr("transform", getTransform);
	  }

	  (this.use_transitions ? new_circle_paths.transition().duration(this.graph.cfg.render_duration) : new_circle_paths)
			.style("stroke-opacity", 1);

	  (this.use_transitions ? labels.transition().duration(this.graph.cfg.render_duration) : labels)
	  	.attr("y", function(n) {return -this.getBBox().height - $('.circles', this.parentNode)[0].getBBox().height/2 - 4; });

	  (this.use_transitions ? updated_edges_paths.transition().duration(this.graph.cfg.render_duration) : updated_edges_paths)
	  	.attr("d", function(path_item) {
	    	var edge = d3.select(this.parentNode).datum();
	    	return self._edgePathSpline(edge, path_item);
	    })
	  
	  new_edges_paths
	  	.attr("d", function(path_item) {
	    	var edge = d3.select(this.parentNode).datum();
	    	return self._edgePathSpline(edge, path_item);
	    })
	    .attr("stroke", function(path_item) {
	    	var edge = d3.select(this.parentNode).datum();
	    	return edge.graph.pathColors(path_item.id);
	    }).each(function(path_item) {
	    	this.addEventListener("click", app.activateItem.bind(app, path_item));
	    });

	  new_circle_paths
	    .each(function(path_item) {
	    	this.addEventListener("click", app.activateItem.bind(app, path_item));
	    });

	  (this.use_transitions ? new_edges_paths.transition().duration(this.graph.cfg.render_duration) : new_edges_paths)
	  	.style("stroke-opacity", 1)

   	if(viewBox) {
	   	(this.use_transitions ? this.svg.transition().duration(this.graph.cfg.render_duration) : this.svg)
	   		.attr("viewBox", viewBox);
	  }

	}
}