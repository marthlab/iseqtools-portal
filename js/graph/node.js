function Node(referent, label, graph) {
	this.referent = referent;
	this.label = label;
	this.graph = graph;
	this.cfg = _({}).extend(app.cfg.nodes, app.cfg.nodes[this.type()]);
}
Node.prototype = {
	edges: function(dir) {
			return this.graph.edges.filter(function(e){ return e[dir === "in" ? "target" : "source"] === this;}, this);
	},
	type: function() {
		return _([Task, ToolUsage]).contains(this.referent.constructor) ? 'primary' : 'secondary';
	},
	numPathsIn: function() {
		return _.sum(this.edges("in").map(function(e) {return e.path_items.length;}));
	},
	numPathsOut: function() {
		return _.sum(this.edges("out").map(function(e) {return e.path_items.length;}));
	},
	pathOrder: function(edge, path_item, dir) {
		var sorted_edges = _.sortBy(this.edges(dir), function(e) {
  		return (e.dagre.points.length == 1 ? e[dir === "out" ? "target" : "source"].dagre.y : e.dagre.points[0].y);
  	});
		var prior_edges = sorted_edges.slice(0, sorted_edges.indexOf(edge));
		var paths_in_prior_edges = _.sum(prior_edges.map(function(e) {return e.path_items.length;}));
		var order_within_edge = edge.path_items.indexOf(path_item);
		return paths_in_prior_edges+order_within_edge;
	}
}
Node.key = function(n) {	return n.referent.constructor.name + "__" + n.referent.id; }