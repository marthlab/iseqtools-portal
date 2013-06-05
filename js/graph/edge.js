function Edge(options) {
	this.source = options.source;
	this.target = options.target;
	this.graph = options.graph;
}
Edge.prototype = {
	
};
//Edge.key = function(e) {return  e.source.gdatum.constructor.name + "__" + e.source.gdatum.id + "__" + e.target.gdatum.constructor.name + "__" + e.target.gdatum.id; }

function EdgePath(options) {
	this.edge = options.edge;
	this.gdatum = options.gdatum;
}
EdgePath.key = function(edge_path) {	return edge_path.key; }