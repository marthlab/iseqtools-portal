function GraphDrawing(options) {
	this.svg = options.svg;
	this.use_transitions = options.use_transitions;
	this.svgGroup = this.svg.append("g");
  this.edgeGroup = this.svgGroup.append("g").attr("id", "edgeGroup");
  this.nodeGroup = this.svgGroup.append("g").attr("id", "nodeGroup");
}
GraphDrawing.prototype = {
	render: function(graph, viewBox) {

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

		  // construct path string
		  var path_string = "";
		  
		  if(s_circ_intersect.x < s_exit.x) {
	  		path_string += line(s_circ_intersect, s_exit);
	  	}

	  	path_string += line(s_exit, rank_exit)

		  if(Math.abs(t.dagre.rank-s.dagre.rank) == 2) {
		  	path_string += curve(rank_exit, rank_enter)
		  } else {
		  	//var connection_y = e.dagre.points[0].y; // same as e.dagre.points[1].y
		  	var points = [{x: rank_exit.x + settings.graph.rankSep, y: e.dagre.points[0].y},
	  								{x: rank_enter.x - settings.graph.rankSep, y: e.dagre.points[1].y}];
		  	path_string += curve(rank_exit, points[0])
		  	path_string += line(points[0], points[1])
		  	path_string += curve(points[1], rank_enter)
		  }

		  path_string += line(rank_enter, t_enter)

		  if(t_enter.x < t_circ_intersect.x) {
	  		path_string += line(t_enter, t_circ_intersect);
	  	}

		  return path_string;
		}

		var self = this;

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
								
					}
				})
				.append("g")
					.attr("class", "circle_paths");

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
	    			return graph.nodePathColors(node_path.gdatum && node_path.gdatum.id);
	  			})
	  			.attr("stroke-width", settings.graph.path_width);

		var old_circle_paths = circle_paths
			.exit();

	  var new_labels = new_nodes_elems
	    .append("text")
	    .each(function(n) {
	    	var text_elem = d3.select(this);
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

				text_elem.text("");
	    	label_lines.forEach(function(line, line_index) {
			    text_elem
				    .append("tspan")
				    .attr("x", 0)
				    .attr("dy", "1em")
				    .text(line.join("").trim());
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
	    .data(graph.edges)

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
	    .debugLevel(1)
	    .run();

	  (this.use_transitions ? old_nodes_elems.transition().duration(settings.graph.render_duration) : old_nodes_elems)
	  	.style("opacity", 0)
	  	.remove();


	  (this.use_transitions ? old_circle_paths.transition().duration(settings.graph.render_duration) : old_circle_paths)
			.style("stroke-opacity", 0)
  		.remove();
	 

	 	(this.use_transitions ? old_edges_paths.transition().duration(settings.graph.render_duration) : old_edges_paths)
	  	.style("stroke-opacity", 0)
	  	.remove();

	  (this.use_transitions ? old_edges_elems.transition().duration(settings.graph.render_duration) : old_edges_elems)
	  	.style("opacity", 0)
	  	.remove();


	  var getTransform = function(d) { return 'translate('+ d.dagre.x +','+ d.dagre.y +')'; };

	  new_nodes_elems.attr("transform", getTransform);

	  (this.use_transitions ? new_nodes_elems.transition().duration(settings.graph.render_duration) : new_nodes_elems)
	  	.style("opacity", 1);

	  if(this.use_transitions) {
	  	updated_nodes_elems
		  	.transition()
      	.duration(settings.graph.render_duration)
      	.attrTween("transform", function tween(d, i, a) {
		      return d3.interpolateString(this.getAttribute("transform"), getTransform(d) );
		    });
	  } else {
	  	updated_nodes_elems.attr("transform", getTransform);
	  }

	  (this.use_transitions ? new_circle_paths.transition().duration(settings.graph.render_duration) : new_circle_paths)
			.style("stroke-opacity", 1);

	  (this.use_transitions ? labels.transition().duration(settings.graph.render_duration) : labels)
	  	.attr("y", function(n) {return -this.getBBox().height - $('.circles', this.parentNode)[0].getBBox().height/2 - 4; });

	  (this.use_transitions ? updated_edges_paths.transition().duration(settings.graph.render_duration) : updated_edges_paths)
	  	.attr("d", function(edge_path) {
	    	var edge = d3.select(this.parentNode).datum();
	    	return edgePathSpline(edge, edge_path);
	    })
	  
	  new_edges_paths
	  	.attr("d", function(edge_path) {
	    	var edge = d3.select(this.parentNode).datum();
	    	return edgePathSpline(edge, edge_path);
	    })
	    .attr("stroke", function(edge_path) {
	    	var edge = d3.select(this.parentNode).datum();
	    	return graph.edgePathColors(edge_path.gdatum && edge_path.gdatum.id);
	    }).each(function(edge_path) {
	    	if(edge_path.gdatum) {
	    		this.addEventListener("click", app.requestResource.bind(app, edge_path.gdatum.url()));
	    	}
	    });

	  new_circle_paths
	    .each(function(node_path) {
	    	if(node_path.gdatum) {
	    		this.addEventListener("click", app.requestResource.bind(app, node_path.gdatum.url()));
	    	}
	    });

	  (this.use_transitions ? new_edges_paths.transition().duration(settings.graph.render_duration) : new_edges_paths)
	  	.style("stroke-opacity", 1)

   	if(viewBox) {
	   	(this.use_transitions ? this.svg.transition().duration(settings.graph.render_duration) : this.svg)
	   		.attr("viewBox", viewBox);
	  }

	},
	getViewBox: function() {
    var rect = this.svgGroup.node().getBoundingClientRect();
    // fudge factors prevent unwanted clipping of content on sides
    var horz_padding_fraction = 0.06;
    var vert_padding_fraction = 0.03;
    return  -Math.ceil(rect.width*horz_padding_fraction/2)
            +" "
            +Math.floor(rect.top-rect.height*vert_padding_fraction/2)
            +" "
            +Math.ceil(rect.width*(1+horz_padding_fraction))
            +" "
            +Math.ceil(rect.height*(1+vert_padding_fraction));
  }
}