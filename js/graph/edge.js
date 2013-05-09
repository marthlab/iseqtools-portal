function Edge(source_node, target_node, graph) {
	this.graph = graph;
	this.source = source_node;
	this.target = target_node;
	this.path_items = this.graph.getEdgeReferents(this);

	this.cfg = app.cfg.edges;
}
Edge.prototype = {
	spline: function(path_item) {

		var e = this, s = e.source, t = e.target;
		
    var s_exit = {
    	x: s.dagre.x+s.dagre.width/2,
    	y: s.dagre.y + e.cfg["stroke-width"]*((s.pathOrder(e, path_item, "out")-s.numPathsOut()/2)+1/2)
    };
	  var t_enter = {
	  	x: t.dagre.x-t.dagre.width/2,
	  	y: t.dagre.y + e.cfg["stroke-width"]*((t.pathOrder(e, path_item, "in")-t.numPathsIn()/2)+1/2)
	  };
	  var s_circ_intersect = {
	  	x: s.dagre.x+Math.sqrt(Math.pow(s.cfg.radius, 2)-Math.pow(s_exit.y-s.dagre.y, 2)),
	  	y: s_exit.y
	  };
	  var t_circ_intersect = {
	  	x: t.dagre.x-Math.sqrt(Math.pow(t.cfg.radius, 2)-Math.pow(t_enter.y-t.dagre.y, 2)),
	  	y: t_enter.y
	  };

	  function line(start, end) {
			return d3.svg.line()
	      .x(function(d) { return d.x; })
	      .y(function(d) { return d.y; })
	      .interpolate("linear")
	      ([start, end])
		}

		function cubic(start, end) {

			var base_offset = (end.x-start.x)*app.cfg.graph.edge_curvature;
			var order = e.path_items.indexOf(path_item);
			var slope = (end.y-start.y)/(end.x-start.x);
			// FIXME: there MUST be a more theoretically sound way of calculating path_offset
			var path_offset = (order+1)*-Math.min(Math.abs(slope)*1.5, 2.5)*sign(slope);

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
	  	path_string += cubic(s_exit, t_enter);
	  } else {
	  	var points = [{x: s_exit.x + app.cfg.graph.rankSep, y: e.dagre.points[0].y},
  								{x: t_enter.x - app.cfg.graph.rankSep, y: e.dagre.points[1].y}];
	  	path_string +=
	  		( cubic(s_exit, points[0])
	  		+ line(points[0], points[1])
	  		+ cubic(points[1], t_enter)
	  		);
	  }

	  if(t_enter.x < t_circ_intersect.x) {
  		path_string += line(t_enter, t_circ_intersect);
  	}

	  return path_string;
	}
};
Edge.key = function(e) {return  e.source.referent.constructor.name + "__" + e.source.referent.id + "__" + e.target.referent.constructor.name + "__" + e.target.referent.id; }