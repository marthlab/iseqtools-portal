function Edge(source_node, target_node, graph) {
	this.graph = graph;
	this.source = source_node;
	this.target = target_node;

	this.cfg = app.cfg.edges;
}
Edge.prototype = {
	
};
Edge.key = function(e) {return  e.source.referent.constructor.name + "__" + e.source.referent.id + "__" + e.target.referent.constructor.name + "__" + e.target.referent.id; }