
	  _.sum = function(obj) {
		  if (!$.isArray(obj) || obj.length == 0) return 0;
		  return _.reduce(obj, function(sum, n) {
		    return sum += n;
		  });
		}

	  function by_id(id) {
			return function(element) {
				return element.id === id;
			}
		}

    // basic data structures
    
    var app = {};

    app.settings = {
    	graph: {
    		nodeSep: 50,
		    edgeSep: 10,
		    rankSep: 50
    	},
    	nodes: {

    	},
    	node_types: {
    		primary: {
	    		radius: 30,
	    		fill: "#fff"
	    	},
	    	secondary: {
	    		radius:10,
	    		fill: "#000"
	    	}
    	},
    	edges: {
    		"stroke-width": 2
    	}
    }

    function DataType(cfg) {
    	_(this).extend(_(cfg).pick('id', 'order', 'name'));

    	// references populated later
    	this.objectives_consuming = {};
    	this.objectives_producing = {};
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
    		_(this.objectives).map(function(obj) {return _.union(obj.in_data_types, obj.out_data_types); })
  		);
    }

    function DataFormat(cfg) {
    	_(this).extend(_(cfg).pick('id', 'order', 'name'));
    }

    function Tool(cfg) {
    	_(this).extend(_(cfg).pick('id', 'order', 'name'));
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
    	this.objective = _(app.objectives).find(by_id(cfg.objective_id)) || null;

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

	    _(app.data_types).each(function(dt) {
	  		dt.objectives_consuming = _(app.objectives).filter(function(obj) {return _(obj.in_data_types).contains(dt); });
	  		dt.objectives_producing = _(app.objectives).filter(function(obj) {return _(obj.out_data_types).contains(dt); });
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

  	// "Graph" is used as a base class and is never instantiated outside of derived class constructors
  	function Node(referent, label, graph) {
  		this.referent = referent;
  		this.label = label;
  		this.graph = graph;
  		this.edges = [];
  		this.edges_in = [];
  		this.edges_out = [];
  		this.settings = _({}).extend(app.settings.nodes, app.settings.node_types[this.getType()]);
  	}
  	Node.prototype = {
  		getChildren: function() {
  			return this.edges.map(function(e){ return e.target;}).filter(function(n){ return n !== this;});
  		},
  		getParents: function() {
  			return this.edges.map(function(e){ return e.source;}).filter(function(n){ return n !== this;});
  		},
  		getType: function() {
  			return _([Objective, ToolUsage]).contains(this.referent.constructor) ? 'primary' : 'secondary';
  		},
  		getNumPathsIn: function() {
  			return _.sum(this.edges_in.map(function(e) {return e.referents.length;}));
  		},
  		getNumPathsOut: function() {
  			return _.sum(this.edges_out.map(function(e) {return e.referents.length;}));
  		},
  		getPathInOrder: function(edge, referent) {
				var lower_ordered_edges = this.edges_in.slice(0, Math.max(0, this.edges_in.indexOf(edge)));
  			var order_within_edge = edge.referents.indexOf(referent);
  			return order_within_edge+_.sum(lower_ordered_edges.map(function(e) {return e.referents.length;}));
  		},
  		getPathOutOrder: function(edge, referent) {
				var lower_ordered_edges = this.edges_out.slice(0, Math.max(0, this.edges_out.indexOf(edge)));
  			var order_within_edge = edge.referents.indexOf(referent);
  			return order_within_edge+_.sum(lower_ordered_edges.map(function(e) {return e.referents.length;}));
  		}
  	}

  	function Edge(source_node, target_node, graph) {
  		this.graph = graph;
  		this.source = source_node;
  		this.target = target_node;
  		this.referents = this.graph.getEdgeReferents(this);
  	}
  	Edge.prototype = {

  	}

  	function Graph() {
  		this.nodes = _.union(this.primary_nodes, this.secondary_nodes);
  		this.edges.forEach(function(e) {
  			e.source.edges.push(e);
  			e.source.edges_out.push(e);
  			e.target.edges.push(e);
  			e.target.edges_in.push(e);
  		});
  		this.edgeColors = d3.scale.category10()
  										 .domain(_.uniq(_.flatten(this.edges.map(function(e){ return e.referents.map(function(r){return r.id});}))));

  		this.settings = app.settings.graph;
  	}

  	Graph.prototype.render = function() {

  		function spline(e, path_item) {
  
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

  			var s = e.source, t = e.target;
  			
  			var start_y = s.dagre.y + app.settings.edges["stroke-width"]*(s.getPathOutOrder(e, path_item)-s.getNumPathsOut()/2);
  			var end_y = t.dagre.y + app.settings.edges["stroke-width"]*(t.getPathInOrder(e, path_item)-t.getNumPathsIn()/2);
	      var points = e.dagre.points;
	      var start = {x: s.dagre.x+s.dagre.width/2, y: start_y};
			  var end = {x: t.dagre.x-t.dagre.width/2, y: end_y};

		  	path_string = line([{x: start.x-s.dagre.width/2+s.settings.radius, y: start.y}, start])
		  							+ (points.length == 1 ? diag(start, end) : diag(start, points[0])+line([points[0], points[1]])+diag(points[1], end) )
		  							+ line([end, {x: end.x+t.dagre.width/2-t.settings.radius, y: end.y}]);

			  return path_string;
			}

		  var graph = this;

		  var svg = d3.select("svg");
		  var svgGroup = svg.append("g").attr("transform", "translate(5, 5)");

		  var nodes_elems = svgGroup
		    .selectAll("g .node")
		    .data(this.nodes)
		    .enter()
		      .append("g")
		      .attr("class", "node")
		      .attr("id", function(n) { return "node-" + n.referent.id; })
		      .classed("primary", function(n) { return n.getType() === 'primary'; })
					.classed("secondary", function(n) { return n.getType() === 'secondary'; });

		  var edges_elems = svgGroup
		    .selectAll("g.edge")
		    .data(this.edges)
		    .enter()
		    	.append("g")
		      .attr("class", "edge");

		  var edges_paths =  edges_elems
		  	.selectAll("path")
		    .data(function(e) { return e.referents; })
		    .enter()
		    	.append("path")
		    	.attr("stroke-width", app.settings.edges["stroke-width"])

	    var circles = nodes_elems.append("circle")
		  	.attr("cx", 0)
				.attr("cy", 0)
				.attr("r", function(n) { return n.settings.radius; })
				.attr("stroke-width", app.settings.edges["stroke-width"])
				
				

		  var labels = nodes_elems
		    .append("text")
	      .attr("text-anchor", "middle")
	      .attr("x", 0)
	      .attr("y", function(n) { return -n.settings.radius; });

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

		  dagre.layout()
		    .nodeSep(this.settings.nodeSep)
		    .edgeSep(this.settings.edgeSep)
		    .rankSep(this.settings.rankSep)
		    .rankDir("LR")
		    .nodes(this.nodes)
		    .edges(this.edges)
		    .debugLevel(1)
		    .run();

		  nodes_elems.attr("transform", function(d) { return 'translate('+ d.dagre.x +','+ d.dagre.y +')'; });

		  this.nodes.forEach(function(n) {
		  	n.edges_in = _.sortBy(n.edges_in, function(e) {
		  		return (e.dagre.points.length == 1 ? e.source.dagre.y : e.dagre.points[0].y);
		  	});
		  	n.edges_out = _.sortBy(n.edges_out, function(e) {
		  		return (e.dagre.points.length == 1 ? e.target.dagre.y : e.dagre.points[0].y);
		  	});
		  });

		  edges_elems
		    .attr('id', function(e) { return e.dagre.id; })

		  edges_paths
		    .attr("d", function(referent, referent_index, edge_index) {
		    	var edge = edges_elems[0][edge_index].__data__;
		    	return spline(edge, referent);
		    })
		    .attr("stroke", function(referent, referent_index, edge_index) {
		    	var edge = edges_elems[0][edge_index].__data__;
		    	return edge.graph.edgeColors(referent.id);
		    })

		  // Resize the SVG element
		  var svgBBox = svg.node().getBBox();
		  svg.attr("viewBox", "0 0 "+ (svgBBox.width + 10)+" "+(svgBBox.height + 10) );

  	}

  	function ObjectivesGraph() {
  		this.edges = _.flatten(this.objectives_nodes.map(function(obj_node) {
  			var edges_out = _(obj_node.referent.out_data_types).map(function(dt) {
  				return new Edge(obj_node, _(this.data_types_nodes).find(function(dt_node) { return dt_node.referent == dt;}), this);
  			}, this);
  			var edges_in = _(obj_node.referent.in_data_types).map(function(dt) {
  				return new Edge(_(this.data_types_nodes).find(function(dt_node) { return dt_node.referent == dt;}), obj_node, this);
  			}, this);
  			return _.union(edges_in, edges_out);
  		}, this), true);

  		Graph.call(this);
  	}
  	ObjectivesGraph.prototype = Object.create(Graph.prototype)

  	function GlobalGraph() {
  		this.workflows = app.workflows;
  		this.primary_nodes = this.objectives_nodes = _(app.objectives).map(function(obj) { return new Node(obj, obj.name, this);}, this);
  		this.secondary_nodes = this.data_types_nodes = _(app.data_types).map(function(dt) { return new Node(dt, dt.name, this);}, this);

  		ObjectivesGraph.call(this);
  	}
  	GlobalGraph.prototype = Object.create(ObjectivesGraph.prototype);
  	GlobalGraph.prototype.getEdgeReferents = function(edge) {
			return _.union(edge.source.referent.workflows || [], edge.target.referent.workflows || []);
		}

  	function WorkflowGraph(workflow) {
  		this.workflow = workflow;

  		this.primary_nodes = this.objectives_nodes = _(workflow.objectives).map(function(obj) { return new Node(obj, obj.name, this);}, this);
  		this.secondary_nodes = this.data_types_nodes = _.uniq(_.flatten(_(workflow.objectives).map(function(obj) {
  				return _.union(obj.in_data_types, obj.out_data_types);
			}))).map(function(dt) { return new Node(dt, dt.name, this);}, this);

  		ObjectivesGraph.call(this);
  	}
  	WorkflowGraph.prototype = Object.create(ObjectivesGraph.prototype);
  	WorkflowGraph.prototype.getEdgeReferents = function(edge) {
			return [this.workflow];
		}

  	function PipelineGraph(pipeline) {
  		this.pipeline = pipeline;
  		this.primary_nodes = this.tool_usages_nodes = _(pipeline.tool_usages).map(function(tu) { return new Node(tu, tu.tool.name, this);}, this);
  		this.secondary_nodes = this.data_format_usages_nodes = _(pipeline.data_format_usages).map(function(dfu) { return new Node(dfu, dfu.data_format.name, this);}, this);

  		this.edges = _.flatten(this.tool_usages_nodes.map(function(tu_node) {
  			var edges_out = _(tu_node.referent.out_data_format_usages).map(function(df_usage) {
  				return new Edge(tu_node, _(this.data_format_usages_nodes).find(function(df_usage_node) { return df_usage_node.referent == df_usage;}), this);
  			}, this);
  			var edges_in = _(tu_node.referent.in_data_format_usages).map(function(df_usage) {
  				return new Edge(_(this.data_format_usages_nodes).find(function(df_usage_node) { return df_usage_node.referent == df_usage;}), tu_node, this);
  			}, this);

  			return _.union(edges_in, edges_out);
  		}, this), true);

  		Graph.call(this);
  	}
  	PipelineGraph.prototype = Object.create(Graph.prototype);
  	PipelineGraph.prototype.getEdgeReferents = function(edge) {
			return [this.pipeline];
		}

  	
  	  
		app.initialize_data_structures(app_json);
 		//app.graph = new GlobalGraph();
 		app.graph = new PipelineGraph(app.pipelines[0]);
 		//app.graph = new WorkflowGraph(app.workflows[3]);
 		app.graph.render();

