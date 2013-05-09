function GraphDrawing(graph, svg, use_transitions) {
	this.graph = graph;
	this.svg = svg;
	this.use_transitions = use_transitions;
	this.svgGroup = this.svg.append("g");
  this.edgeGroup = this.svgGroup.append("g").attr("id", "edgeGroup");
  this.nodeGroup = this.svgGroup.append("g").attr("id", "nodeGroup");
}
GraphDrawing.prototype = {
	render: function(viewBox) {

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

		var circle_groups = new_nodes_elems
			.append("g")
				.attr("class", "circles");

		circle_groups.each(function(n) {
			var circles = d3.select(this);
			function addCircles(num_circles) {
				for(var i=0; i<num_circles; i++) {
					circles
						.append("circle")
						.attr("cx", 0)
						.attr("cy", 5*((num_circles-1)/2 - (num_circles-i-1)))
						.attr("r", function(n) { return n.cfg.radius; })
						.attr("stroke-width", function(e) { return d3.select(this.parentNode).datum().cfg["stroke-width"]; });
				}
			}
			addCircles(n.referent.multiple ? 3 : 1);
		});

	  var labels = new_nodes_elems
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
      .attr("y", function(n) {return -this.getBBox().height - $('.circles', this.parentNode)[0].getBBox().height/2 - 4; })

		nodes_elems.each(function(n) {
	    var bbox = this.getBBox();
	    n.bbox = bbox;
	    n.width = bbox.width;
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
	    .data(function(e) { return e.path_items; }, function(r) {return r.id;})

	  var new_edges_paths = edges_paths
	  	.enter()
    		.append("path")
    		.attr("stroke-width", function(e) { return d3.select(this.parentNode).datum().cfg["stroke-width"]; });

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

	  (this.use_transitions ? updated_edges_paths.transition().duration(this.graph.cfg.render_duration) : updated_edges_paths)
	  	.attr("d", function(path_item) {
	    	var edge = d3.select(this.parentNode).datum();
	    	return edge.spline(path_item);
	    })
	    
	  new_edges_paths
	  	.attr("d", function(path_item) {
	    	var edge = d3.select(this.parentNode).datum();
	    	return edge.spline(path_item);
	    })
	    .attr("stroke", function(path_item) {
	    	var edge = d3.select(this.parentNode).datum();
	    	return edge.graph.pathColors(path_item.id);
	    }).each(function(path_item) {
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