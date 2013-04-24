
	  _.sum = function(obj) {
		  if (!$.isArray(obj) || obj.length == 0) return 0;
		  return _.reduce(obj, function(sum, n) {
		    return sum += n;
		  });
		}

	  function by_id(id) {
			return function(element) { return element.id === id; }
		}

    // basic data structures
    
    var app = {};

    app.cfg = {
    	graph: {
    		nodeSep: 50,
		    edgeSep: 10,
		    rankSep: 50
    	},
    	nodes: {
    		"stroke-width": 2
    	},
    	node_types: {
    		primary: {
	    		radius: 30
	    	},
	    	secondary: {
	    		radius:8
	    	}
    	},
    	edges: {
    		"stroke-width": 2
    	}
    }

    function DataType(cfg) {
    	_(this).extend(_(cfg).pick('id', 'order', 'name'));
    }

    function Objective(cfg) {
    	_(this).extend(_(cfg).pick('id', 'order', 'name'));
    	this.in_data_types = cfg.in_data_types_ids.map(function(dt_id){ return _(app.data_types).find(by_id(dt_id));});
    	this.out_data_types = cfg.out_data_types_ids.map(function(dt_id){ return _(app.data_types).find(by_id(dt_id));});
    
    	// references populated later
    	this.workflows = {};
    }

    function Workflow(cfg) {
    	_(this).extend(_(cfg).pick('id', 'order', 'name'));
    	this.objectives = cfg.objectives_ids.map(function(obj_id){ return _(app.objectives).find(by_id(obj_id));});
    	this.data_types = _.union.apply(
    		this.objectives.map(function(obj) {return _.union(obj.in_data_types, obj.out_data_types); })
  		);
    }

    function DataFormat(cfg) {
    	_(this).extend(_(cfg).pick('id', 'order', 'name'));
    }

    function Tool(cfg) {
    	_(this).extend(_(cfg).pick('id', 'order', 'name'));
    	this.objective = _(app.objectives).find(by_id(cfg.objective_id)) || null;
    }

    function Pipeline(cfg) {
    	_(this).extend(_(cfg).pick('id', 'order', 'name'));
    	cfg.initial_data_format_usages = cfg.initial_data_format_usages || [];

    	this.workflows = cfg.workflows_ids.map(function(wf_id){ return _(app.workflows).find(by_id(wf_id));});

    	var create_dfu = function(dfu_cfg, order){
    		return new DataFormatUsage(_.extend(dfu_cfg, {order: order, pipeline: this}));
    	};

	    this.data_format_usages = _.flatten(_(cfg.tool_usages.map(function(tu_cfg) {
	    	return tu_cfg.out_data_format_usages.map(create_dfu, this);
	    }, this)).union(cfg.initial_data_format_usages.map(create_dfu, this)), true);
    	
    	this.tool_usages = cfg.tool_usages.map(function(tu_cfg, order) {
	    	return new ToolUsage(_.extend(tu_cfg, {order: order, pipeline: this}));
	    }, this);

    }

    function DataFormatUsage(cfg) {
    	_(this).extend(_(cfg).pick('id', 'order', 'pipeline'));
    	this.data_format = _(app.data_formats).find(by_id(cfg.data_format_id));
    }

    function ToolUsage(cfg) {
    	_(this).extend(_(cfg).pick('id', 'order', 'pipeline'));
    	this.tool = _(app.tools).find(by_id(cfg.tool_id));

    	this.in_data_format_usages = cfg.in_data_format_usages_ids.map(function(dfu_id){ return _(this.pipeline.data_format_usages).find(by_id(dfu_id));}, this);
    	this.out_data_format_usages = cfg.out_data_format_usages.map(function(dfu_cfg){ return _(this.pipeline.data_format_usages).find(by_id(dfu_cfg.id));}, this);

    }

    

    app.initialize_data_structures = function(cfg) {

	    app.data_types = cfg.data_types.map(function(dt_cfg, order) {
	    	return new DataType(_.extend(dt_cfg, {order: order}) );
	    });
	    
	    app.objectives = cfg.objectives.map(function(obj_cfg, order) {
	    	return new Objective(_.extend(obj_cfg, {order: order}) );
	    });
	    
	    app.workflows = cfg.workflows.map(function(wf_cfg, order) {
	    	return new Workflow(_.extend(wf_cfg, {order: order}) );
	    });
	    _(app.objectives).each(function(obj) {
	  		obj.workflows = _(app.workflows).filter(function(wf) {return _(wf.objectives).contains(obj); });
	  	});

	    app.data_formats = cfg.data_formats.map(function(df_cfg, order) {
	    	return new DataFormat(_.extend(df_cfg, {order: order}) );
	    });

	    app.tools = cfg.tools.map(function(tool_cfg, order) {
	    	return new Tool(_.extend(tool_cfg, {order: order}) );
	    });

	    app.pipelines = cfg.pipelines.map(function(pl_cfg, order) {
	    	return new Pipeline(_.extend(pl_cfg, {order: order}) );
	    });

  	}

  	function Node(referent, label, graph) {
  		this.referent = referent;
  		this.label = label;
  		this.graph = graph;
  		this.cfg = _({}).extend(app.cfg.nodes, app.cfg.node_types[this.type()]);
  	}
  	Node.prototype = {
  		edges: function(dir) {
  				return this.graph.edges.filter(function(e){ return e[dir === "in" ? "target" : "source"] === this;}, this);
  		},
  		type: function() {
  			return _([Objective, ToolUsage]).contains(this.referent.constructor) ? 'primary' : 'secondary';
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
  	Node.key = function(n) {	return n.referent.id; }

  	function Edge(source_node, target_node, graph) {
  		this.graph = graph;
  		this.source = source_node;
  		this.target = target_node;
  		this.path_items = this.graph.getEdgeReferents(this);

  		this.cfg = app.cfg.edges;
  	}
  	Edge.prototype = {
  		spline: function(path_item) {
  
  			function diag(source, target) {
  				var diag_points = {source: {x: source.y, y: source.x}, target: {x: target.y, y: target.x}};
  				return d3.svg.diagonal().projection(function(d) { return [d.y, d.x]; })
		      (diag_points);
  			}

  			function line(line_points) {
  				return d3.svg.line()
		      .x(function(d) { return d.x; })
		      .y(function(d) { return d.y; })
		      .interpolate("linear")
		      (line_points)
  			}

  			var e = this, s = e.source, t = e.target;

  			var start_y = s.dagre.y + e.cfg["stroke-width"]*(s.pathOrder(e, path_item, "out")-s.numPathsOut()/2);
  			var end_y = t.dagre.y + e.cfg["stroke-width"]*(t.pathOrder(e, path_item, "in")-t.numPathsIn()/2);
	      var points = e.dagre.points;
	      var start = {x: s.dagre.x+s.dagre.width/2, y: start_y};
			  var end = {x: t.dagre.x-t.dagre.width/2, y: end_y};

		  	path_string = line([{x: start.x-s.dagre.width/2+s.cfg.radius, y: start.y}, start])
		  							+ (points.length == 1 ? diag(start, end) : diag(start, points[0])+line([points[0], points[1]])+diag(points[1], end) )
		  							+ line([end, {x: end.x+t.dagre.width/2-t.cfg.radius, y: end.y}]);

			  return path_string;
			}
  	};
  	Edge.key = function(e) {	return e.source.referent.id + "__" + e.target.referent.id; }

  	app.graph = {
  		cfg: app.cfg.graph,
  		init: function() {
  			this.svg = d3.select("svg");
			  this.svgGroup = this.svg.append("g").attr("transform", "translate(5, 5)");
			  this.edgeGroup = this.svgGroup.append("g");
			  this.nodeGroup = this.svgGroup.append("g");
  		}
  	};



  	app.graph.render = function() {

		  

	    var new_nodes_elems = this.nodeGroup.selectAll("g .node")
	    	.each(function(n) { console.log(n); delete n["dagre"]; delete n["width"]; delete n["height"]; delete n["bbox"];})
		    //.each(function(n) { console.log(n); delete n["dagre"];})
		    //.each(function(n) { console.log('S');})
		    .data(this.nodes, Node.key)
		    .enter()
		      .append("g")
		      .each(function(n) { console.log("entering: "); console.log(n);})
		      .attr("class", "node")
		      .attr("id", function(n) { return "node-" + n.referent.id; })
		      .classed("primary", function(n) { return n.type() === 'primary'; })
					.classed("secondary", function(n) { return n.type() === 'secondary'; });
				
			var nodes_elems = this.nodeGroup.selectAll("g .node");

		  var new_edges_elems = this.edgeGroup
		    .selectAll("g.edge")
		    .data(this.edges, Edge.key)
		    .enter()
		    	.append("g")
		      .attr("class", "edge");

		  var edges_elems = this.edgeGroup
		    .selectAll("g.edge")

		  var new_edges_paths =  edges_elems
		  	.selectAll("path")
		    .data(function(e) { return e.path_items; }, function(r) {return r.id;})
		    .enter()
		    	.append("path")
		    	.attr("stroke-width", function(e) { return d3.select(this.parentNode).datum().cfg["stroke-width"]; });

		  var edges_paths = edges_elems
		  	.selectAll("path")

	    var circles = new_nodes_elems.append("circle")
		  	.attr("cx", 0)
				.attr("cy", 0)
				.attr("r", function(n) { return n.cfg.radius; })
				.attr("stroke-width", function(e) { return d3.select(this.parentNode).datum().cfg["stroke-width"]; })	

		  var labels = new_nodes_elems
		    .append("text")
	      .attr("text-anchor", "middle")
	      .attr("x", 0)
	      .attr("y", function(n) { return -n.cfg.radius; });

		  labels
		    .append("tspan")
		    .attr("x", 0)
		    .attr("dy", "-0.5em")
		    .text(function(n) { return n.label; });

			nodes_elems.each(function(n) {
		    var bbox = this.getBBox();
		    n.bbox = bbox;
		    n.width = bbox.width;
		    n.height = bbox.height;
		  });
debugger;
		  dagre.layout()
		    .nodeSep(this.cfg.nodeSep)
		    .edgeSep(this.cfg.edgeSep)
		    .rankSep(this.cfg.rankSep)
		    .rankDir("LR")
		    .nodes(this.nodes)
		    .edges(this.edges)
		    .debugLevel(1)
		    .run();
//debugger;
		  nodes_elems.attr("transform", function(d) { return 'translate('+ d.dagre.x +','+ d.dagre.y +')'; });

		  edges_paths
		    .attr("d", function(path_item) {
		    	var edge = d3.select(this.parentNode).datum();
		    	return edge.spline(path_item);
		    })
		    .attr("stroke", function(path_item) {
		    	var edge = d3.select(this.parentNode).datum();
		    	return edge.graph.pathColors(path_item.id);
		    })

		  // Resize the SVG element
		  var svgBBox = this.svg.node().getBBox();
		  this.svg.attr("viewBox", "0 0 "+ (svgBBox.width + 10)+" "+(svgBBox.height + 10) );

  	}

  	app.graph.test = function() {

  	}

  	app.graph.load_workflows = function(workflows) {

  		this.workflows = workflows || app.workflows;

			var objectives = _.union.apply(this, this.workflows.map(function(w) {return w.objectives}));

  		this.primary_nodes = this.objectives_nodes = objectives.map(function(obj) { return new Node(obj, obj.name, this);}, this);

  		this.secondary_nodes = this.data_types_nodes = _.union.apply(this, objectives.map(function(obj) {return _.union(obj.in_data_types, obj.out_data_types);}))
  																										.map(function(dt) { return new Node(dt, dt.name, this);}, this);

  		this.getEdgeReferents = function(edge) {
				return _.intersection(this.workflows, _.union(edge.source.referent.workflows || [], edge.target.referent.workflows || []));
			}

  		this.edges = _.union.apply(this, this.objectives_nodes.map(function(obj_node) {
  			var edges_out = obj_node.referent.out_data_types.map(function(dt) {
  				return new Edge(obj_node, _(this.data_types_nodes).find(function(dt_node) { return dt_node.referent == dt;}), this);
  			}, this);
  			var edges_in = obj_node.referent.in_data_types.map(function(dt) {
  				return new Edge(_(this.data_types_nodes).find(function(dt_node) { return dt_node.referent == dt;}), obj_node, this);
  			}, this);
  			return _.union(edges_in, edges_out);
  		}, this));

  		this.nodes = _.union(this.primary_nodes, this.secondary_nodes);

  		this.pathColors = d3.scale.category10()
  										 .domain(app.workflows.map(function(w){return w.id}));
  		
  	}

  	app.graph.load_pipeline = function(workflows) {
  		this.pipeline = pipeline;
  		this.primary_nodes = this.tool_usages_nodes = pipeline.tool_usages.map(function(tu) { return new Node(tu, tu.tool.name, this);}, this);
  		this.secondary_nodes = this.data_format_usages_nodes = pipeline.data_format_usages.map(function(dfu) { return new Node(dfu, dfu.data_format.name, this);}, this);

  		this.getEdgeReferents = function(edge) {
				return [(edge.source.referent.tool && edge.source.referent.tool.objective) || 
								(edge.target.referent.tool && edge.target.referent.tool.objective) ||
								 this.pipeline];
			}

  		this.edges = _.union.apply(this, this.tool_usages_nodes.map(function(tu_node) {
  			var edges_out = tu_node.referent.out_data_format_usages.map(function(df_usage) {
  				return new Edge(tu_node, _(this.data_format_usages_nodes).find(function(df_usage_node) { return df_usage_node.referent == df_usage;}), this);
  			}, this);
  			var edges_in = tu_node.referent.in_data_format_usages.map(function(df_usage) {
  				return new Edge(_(this.data_format_usages_nodes).find(function(df_usage_node) { return df_usage_node.referent == df_usage;}), tu_node, this);
  			}, this);

  			return _.union(edges_in, edges_out);
  		}, this));

  		this.nodes = _.union(this.primary_nodes, this.secondary_nodes);

  		this.pathColors = d3.scale.category10()
  										 .domain(app.objectives.map(function(obj){return obj.id}).push(this.pipeline.id));

  		
  	}
  	
  	  
		app.initialize_data_structures(app_json);
 		app.graph.init();
 		//app.graph.load_pipeline();
 		//app.graph.load_workflows();
 		app.graph.load_workflows([app.workflows[1], app.workflows[3]]);
 		app.graph.render();
 		

