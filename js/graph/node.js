function Node(options) {
	this.gdatum = options.gdatum;
	this.label = options.label;
	this.graph = options.graph;
}
Node.prototype = {
	edges: function(dir) {
			return this.graph.edges.filter(function(e){ return e[dir === "in" ? "target" : "source"] === this;}, this);
	},
	type: function() {
		return _([Task, ToolUsage]).contains(this.gdatum.constructor) ? 'primary' : 'secondary';
	},
	numPathsIn: function() {
		return _.sum(this.edges("in").map(function(e) {return e.edge_paths.length;}));
	},
	numPathsOut: function() {
		return _.sum(this.edges("out").map(function(e) {return e.edge_paths.length;}));
	},
	pathOrder: function(edge, edge_path, dir) {
		var sorted_edges = _.sortBy(this.edges(dir), function(e) {
  		return (e.dagre.points.length == 1 ? e[dir === "out" ? "target" : "source"].dagre.y : e.dagre.points[0].y);
  	});
		var prior_edges = sorted_edges.slice(0, sorted_edges.indexOf(edge));
		var paths_in_prior_edges = _.sum(prior_edges.map(function(e) {return e.edge_paths.length;}));
		var order_within_edge = edge.edge_paths.indexOf(edge_path);
		return paths_in_prior_edges+order_within_edge;
	}
}
Node.key = function(node) {	return node.key; }