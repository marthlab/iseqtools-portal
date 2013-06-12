function Edge(options) {
	this.source = options.source;
	this.target = options.target;
	this.graph = options.graph;
}
Edge.prototype = {
	
};
Edge.key = function(edge) { return edge.key; }

function EdgePath(options) {
	this.edge = options.edge;
	this.gdatum = options.gdatum;
}
EdgePath.key = function(edge_path) {	return edge_path.key; }