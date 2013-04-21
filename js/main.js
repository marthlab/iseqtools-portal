
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
    	this.data_format = app.data_formats[cfg.data_format_id];
    }

    function ToolUsage(cfg) {
    	_(this).extend(_(cfg).pick('id', 'order', 'pipeline'));
    	this.tool = app.tools[cfg.tool_id];
    	this.objective = app.objectives[cfg.objective_id] || null;

    	this.in_data_format_usages = cfg.in_data_format_usages_ids.map(function(dfu_id){ return this.pipeline.data_format_usages[dfu_id];}, this);
    	this.out_data_format_usages = cfg.out_data_format_usages.map(function(dfu_cfg){ return this.pipeline.data_format_usages[dfu_cfg.id];}, this);

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
  		}
  	}

  	function Edge(source_node, target_node, graph) {
  		this.graph = graph;
  		this.source = source_node;
  		this.target = target_node;
  	}

  	function ObjectivesGraphEdge(source_node, target_node, graph) {
  		Edge.call(this, source_node, target_node, graph);
  	}

  	ObjectivesGraphEdge.prototype = {
  		getWorkflows: function() {
  			return _.intersection(this.graph.workflows, _.union(this.source.referent.workflows, this.target.referent.workflows));
  		}
  	}

  	function Graph() {
  		this.nodes = _.union(this.primary_nodes, this.secondary_nodes);
  		this.edges.forEach(function(e) {
  			e.source.edges.push(e);
  			e.target.edges.push(e);
  		});
  		this.settings = app.settings.graph;
  	}

  	Graph.prototype.render = function() {

  		function spline(e) {

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

	      var points = e.dagre.points;
	      var start = {x: e.source.dagre.x+e.source.dagre.width/2, y: e.source.dagre.y};
			  var end = {x: e.target.dagre.x-e.target.dagre.width/2, y: e.target.dagre.y};

		  	path_string = line([{x: start.x-e.source.dagre.width/2+e.source.settings.radius, y: start.y}, start])
		  							+ (points.length == 1 ? diag(start, end) : diag(start, points[0])+line([points[0], points[1]])+diag(points[1], end) )
		  							+ line([end, {x: end.x+e.target.dagre.width/2-e.target.settings.radius, y: end.y}]);

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
		      .attr("id", function(d) { return "node-" + d.referent.id; })
		      .classed("primary", function(d) { return d.getType() === 'primary'; })
					.classed("secondary", function(d) { return d.getType() === 'secondary'; });

		  // var edges_elems = svgGroup
		  //   .selectAll(".edge")
		  //   .data(this.edges)
		  //   .enter()
		  //   	.append("g")
		  //   	.attr("class", "edge")
		  //   	.each(function(d, i) {
		  //   		 var edge_paths = d3.selectAll(".edge path");
		  //   		 if(d.getWorkflows) {
		  //   		 		edge_paths
		  //   		 		.data(d.getWorkflows() )
		  //   		 		.enter()
		  //   		 		.append("path")
		  //   		 		.attr("class", "workflow_path")
		  //   		 }

		  //   	});

			var edges_elems = svgGroup
		    .selectAll("path .edge")
		    .data(this.edges)
		    .enter()
		      .append("path")
		      .attr("class", "edge")

	    var circles = nodes_elems.append("circle")
		  	.attr("cx", 0)
				.attr("cy", 0)
				.attr("r", function(d) { return d.settings.radius; })
				

		  var labels = nodes_elems
		    .append("text")
	      .attr("text-anchor", "middle")
	      .attr("x", 0)
	      .attr("y", function(d) { return -d.settings.radius; });

		  labels
		    .append("tspan")
		    .attr("x", 0)
		    .attr("dy", "-0.5em")
		    .text(function(d) { return d.label; });

			nodes_elems.each(function(d) {
		    var bbox = this.getBBox();
		    d.bbox = bbox;
		    d.width = bbox.width;
		    d.height = bbox.height;
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

		  edges_elems
		    // Set the id. of the SVG element to have access to it later
		    .attr('id', function(e) { return e.dagre.id; })
		    .attr("d", function(e) { return spline(e); });

		  // Resize the SVG element
		  var svgBBox = svg.node().getBBox();
		  svg.attr("viewBox", "0 0 "+ (svgBBox.width + 10)+" "+(svgBBox.height + 10) );

  	}

  	// "ObjectivesGraph" is used as a base class and is never instantiated outside of derived class constructors
  	function ObjectivesGraph() {
  		this.edges = _.flatten(this.objectives_nodes.map(function(obj_node) {
  			var source_edges = _(obj_node.referent.out_data_types).map(function(dt) {
  				return new ObjectivesGraphEdge(obj_node, _(this.data_types_nodes).find(function(dt_node) { return dt_node.referent == dt;}), this);
  			}, this);
  			var target_edges = _(obj_node.referent.in_data_types).map(function(dt) {
  				return new ObjectivesGraphEdge(_(this.data_types_nodes).find(function(dt_node) { return dt_node.referent == dt;}), obj_node, this);
  			}, this);
  			return _.union(source_edges, target_edges);
  		}, this), true);

  		Graph.call(this);
  	}
  	ObjectivesGraph.prototype = Object.create(Graph.prototype);

  	function GlobalGraph() {
  		this.workflows = _(app.workflows).toArray();
  		this.primary_nodes = this.objectives_nodes = _(app.objectives).map(function(obj) { return new Node(obj, obj.name, this);}, this);
  		this.secondary_nodes = this.data_types_nodes = _(app.data_types).map(function(dt) { return new Node(dt, dt.name, this);}, this);

  		ObjectivesGraph.call(this);
  	}
  	GlobalGraph.prototype = Object.create(ObjectivesGraph.prototype);

  	function WorkflowGraph(workflow) {
  		this.workflows = [workflow];

  		this.primary_nodes = this.objectives_nodes = _(workflow.objectives).map(function(obj) { return new Node(obj, obj.name, this);}, this);
  		this.secondary_nodes = this.data_types_nodes = _.uniq(_.flatten(_(workflow.objectives).map(function(obj) {
  				return _.union(obj.in_data_types, obj.out_data_types);
			}))).map(function(dt) { return new Node(dt, dt.name, this);}, this);

  		ObjectivesGraph.call(this);
  	}
  	WorkflowGraph.prototype = Object.create(ObjectivesGraph.prototype);

  	function PipelineGraph(pipeline) {
  		this.pipeline = pipeline;

  		this.primary_nodes = this.tool_usages_nodes = _(pipeline.tool_usages).map(function(tu) { return new Node(tu, tu.tool.name, this);}, this);
  		this.secondary_nodes = this.data_format_usages_nodes = _(pipeline.data_format_usages).map(function(dfu) { return new Node(dfu, dfu.data_format.name, this);}, this);

  		this.edges = _.flatten(this.tool_usages_nodes.map(function(tu_node) {
  			var source_edges = _(tu_node.referent.out_data_format_usages).map(function(df_usage) {
  				return new Edge(tu_node, _(this.data_format_usages_nodes).find(function(df_usage_node) { return df_usage_node.referent == df_usage;}));
  			}, this);
  			var target_edges = _(tu_node.referent.in_data_format_usages).map(function(df_usage) {
  				return new Edge(_(this.data_format_usages_nodes).find(function(df_usage_node) { return df_usage_node.referent == df_usage;}), tu_node);
  			}, this);

  			return _.union(source_edges, target_edges);
  		}, this), true);

  		Graph.call(this);
  	}
  	PipelineGraph.prototype = Object.create(Graph.prototype);

  	
  	  
		app.initialize_data_structures(app_json);
 		app.graph = new GlobalGraph();
 		//app.graph = new PipelineGraph(app.pipelines.pipeline_1);
 		//app.graph = new WorkflowGraph(app.workflows.workflow_2);
 		app.graph.render();

