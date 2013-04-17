
		_.mixin({
		  // ### _.objFilter
		  // _.filter for objects, keeps key/value associations
		  // but only includes the properties that pass test().
		  objFilter: function (input, test, context) {
		    return _.reduce(input, function (obj, v, k) {
		             if (test.call(context, v, k, input)) {
		               obj[k] = v;
		             }
		             return obj;
		           }, {}, context);
		  }
		});

	  // creates a dictionary from an array of objects. each object in
	  // the array must have a unique value for key_property that is
	  // a syntactically valid JS object key (defaults to "id")
	  Object.defineProperties(Array.prototype, {
		  "toDict": {
		  	value: function(key_property) {
			  	new_obj = {};
			  	key_property = key_property || "id";
			  	_.each(this, function(element, index) {
			  		new_obj[element[key_property]] = element;
			  	});
			  	return new_obj;
			  }
		  }
		});

    // basic data structures
    
    var app = {};

    function DataType(cfg) {
    	_(this).extend(_(cfg).pick('id', 'order', 'name'));

    	// references populated later
    	this.objectives_consuming = {};
    	this.objectives_producing = {};
    }

    function Objective(cfg) {
    	_(this).extend(_(cfg).pick('id', 'order', 'name'));
    	this.in_data_types = _.objFilter(app.data_types, function(dt) { return _(cfg.in_data_types_ids).contains(dt.id); });
    	this.out_data_types = _.objFilter(app.data_types, function(dt) { return _(cfg.out_data_types_ids).contains(dt.id); });
    
    	// references populated later
    	this.workflows = {};
    }

    function Workflow(cfg) {
    	_(this).extend(_(cfg).pick('id', 'order', 'name'));

    	this.objectives = _.objFilter(app.objectives, function(obj) { return _(cfg.objectives_ids).contains(obj.id); });
    	this.data_types = _.extend.apply({}, 
    		_(this.objectives).map(function(obj) {return _.extend({}, obj.in_data_types, obj.out_data_types); })
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
    	this.workflows = _.objFilter(app.workflows, function(wf) { return _(cfg.workflows_ids).contains(wf.id); });

    	this.data_format_usages = cfg.data_format_usages.map(function(dfu_cfg, order) {
	    	return new DataFormatUsage(_.extend(dfu_cfg, {order: order, pipeline: this}));
	    }, this).toDict();
    	
    	this.tool_usages = cfg.tool_usages.map(function(tu_cfg, order) {
	    	return new ToolUsage(_.extend(tu_cfg, {order: order, pipeline: this}));
	    }, this).toDict();

    }

    function DataFormatUsage(cfg) {
    	_(this).extend(_(cfg).pick('id', 'order', 'pipeline'));
    	this.data_format = app.data_formats[cfg.data_format_id];
    }

    function ToolUsage(cfg) {
    	_(this).extend(_(cfg).pick('id', 'order', 'pipeline'));
    	this.tool = app.tools[cfg.tool_id];
    	this.objective = app.objectives[cfg.objective_id] || null;

    	this.in_data_format_usages = _.objFilter(this.pipeline.data_format_usages, function(dfu) { return _(cfg.in_data_format_usages_ids).contains(dfu.id); });
    	this.out_data_format_usages = _.objFilter(this.pipeline.data_format_usages, function(dfu) { return _(cfg.out_data_format_usages_ids).contains(dfu.id); });
    }

    

    app.initialize_data_structures = function(cfg) {

	    app.data_types = cfg.data_types.map(function(dt_cfg, order) {
	    	return new DataType(_.extend(dt_cfg, {order: order}) );
	    }).toDict();
	    
	    app.objectives = cfg.objectives.map(function(obj_cfg, order) {
	    	return new Objective(_.extend(obj_cfg, {order: order}) );
	    }).toDict();

	    _(app.data_types).each(function(dt) {
	  		dt.objectives_consuming = _(app.objectives).objFilter(function(obj) {return _(obj.in_data_types).contains(dt); });
	  		dt.objectives_producing = _(app.objectives).objFilter(function(obj) {return _(obj.out_data_types).contains(dt); });
	  	});
	    
	    app.workflows = cfg.workflows.map(function(wf_cfg, order) {
	    	return new Workflow(_.extend(wf_cfg, {order: order}) );
	    }).toDict();
	    _(app.objectives).each(function(obj) {
	  		obj.workflows = _(app.workflows).objFilter(function(wf) {return _(wf.objectives).contains(obj); });
	  	});

	    app.data_formats = cfg.data_formats.map(function(df_cfg, order) {
	    	return new DataFormat(_.extend(df_cfg, {order: order}) );
	    }).toDict();

	    app.tools = cfg.tools.map(function(tool_cfg, order) {
	    	return new Tool(_.extend(tool_cfg, {order: order}) );
	    }).toDict();

	    app.pipelines = cfg.pipelines.map(function(pl_cfg, order) {
	    	return new Pipeline(_.extend(pl_cfg, {order: order}) );
	    }).toDict();

  	}

  	// "Graph" is used as a base class and is never instantiated outside of derived class constructors
  	function Node(referent, label) {
  		this.referent = referent;
  		this.label = label;
  		this.edges = [];
  	}
  	Node.prototype = {

  	}

  	function Edge(source_node, target_node) {
  		this.source = source_node;
  		this.target = target_node;
  	}
  	Edge.prototype = {

  	}

  	function Graph() {
  		this.nodes = _.union(this.primary_nodes, this.secondary_nodes);
  		//debugger;
  		this.edges.forEach(function(e) {
  			e.source.edges.push(e);
  			e.target.edges.push(e);
  		});
  	}
  	Graph.prototype = {

  	}

  	Graph.prototype.render = function() {

  		var nodePadding = 10;

  		function spline(e) {

  			function horzDiag(source, target) {
  				var diag_points = {source: {x: source.y, y: source.x}, target: {x: target.y, y: target.x}};
  				return d3.svg.diagonal().projection(function(d) { return [d.y, d.x]; })
		      (diag_points);
  			}

  			function horzLine(line_points) {
  				return d3.svg.line()
		      .x(function(d) { return d.x; })
		      .y(function(d) { return d.y; })
		      .interpolate("linear")
		      (line_points)
  			}

	      var points = e.dagre.points.slice(0);
	      var start = {x: e.source.dagre.x+e.source.dagre.width/2, y: e.source.dagre.y};
			  var end = {x: e.target.dagre.x-e.target.dagre.width/2, y: e.target.dagre.y};

	      if(points[1].x == points[0].x && points[1].y == points[0].y) {
			    return horzDiag(start, end);
			  } else {
			  	return horzDiag(start, points[0])+horzLine([points[0], points[1]])+horzDiag(points[1], end);
			  }

		}

		  // Translates all points in the edge using `dx` and `dy`.
		  function translateEdge(e, dx, dy) {
		    e.dagre.points.forEach(function(p) {
		      p.x = Math.max(0, Math.min(svgBBox.width, p.x + dx));
		      p.y = Math.max(0, Math.min(svgBBox.height, p.y + dy));
		    });
		  }

		  // Now start laying things out
		  var svg = d3.select("svg");
		  var svgGroup = svg.append("g").attr("transform", "translate(5, 5)");

		  // `nodes` is center positioned for easy layout later
		  var nodes_elems = svgGroup
		    .selectAll("g .node")
		    .data(this.nodes)
		    .enter()
		      .append("g")
		      .attr("class", "node")
		      .classed("objective", function(d) { return d instanceof Objective;})
		      .classed("data_type", function(d) { return d instanceof DataType;})
		      .attr("id", function(d) { return "node-" + d.label });

		  var edges_elems = svgGroup
		    .selectAll("path .edge")
		    .data(this.edges)
		    .enter()
		      .append("path")
		      .attr("class", "edge")
		      //.attr("marker-end", "url(#arrowhead)");

		  // Append rectangles to the nodes. We do this before laying out the text
		  // because we want the text above the rectangle.
		  var rects = nodes_elems.append("rect");

		  // Append text
		  var labels = nodes_elems
		    .append("text")
		      .attr("text-anchor", "middle")
		      .attr("x", 0);

		  labels
		    .append("tspan")
		    .attr("x", 0)
		    .attr("dy", "-1em")
		    .text(function(d) { return d.label; });

		  // We need width and height for layout.
		  labels.each(function(d) {
		    var bbox = this.getBBox();
		    d.bbox = bbox;
		    d.width = bbox.width + 2 * nodePadding;
		    d.height = bbox.height + 2 * nodePadding;
		  });

		  rects
		    .attr("x", function(d) { return -(d.bbox.width / 2 + nodePadding); })
		    .attr("y", function(d) { return -(d.bbox.height / 2 + nodePadding); })
		    .attr("width", function(d) { return d.width; })
		    .attr("height", function(d) { return d.height; });

		  labels
		    .attr("x", function(d) { return -d.bbox.width / 2; })
		    .attr("y", function(d) { return -d.bbox.height / 2; });

		  // Create the layout and get the graph
		  dagre.layout()
		    .nodeSep(50)
		    .edgeSep(10)
		    .rankSep(50)
		    .rankDir("LR")
		    .nodes(this.nodes)
		    .edges(this.edges)
		    .debugLevel(1)
		    .run();

		  nodes_elems.attr("transform", function(d) { return 'translate('+ d.dagre.x +','+ d.dagre.y +')'; });

		  // Ensure that we have at least two points between source and target
		  edges_elems.each(function(d) {
		    var points = d.dagre.points;
		    if (!points.length) {
		      var s = d.source.dagre;
		      var t = d.target.dagre;
		      points.push({ x: (s.x + t.x) / 2, y: (s.y + t.y) / 2 });
		    }

		    if (points.length === 1) {
		    	console.log("test_1");
		      points.push({ x: points[0].x, y: points[0].y });
		    }
		  });

		  edges_elems
		  .attr("num_points", function(e) { return e.dagre.points.length; })
		    // Set the id. of the SVG element to have access to it later
		    .attr('id', function(e) { return e.dagre.id; })
		    .attr("d", function(e) { return spline(e); });
		    

		  // Resize the SVG element
		  var svgBBox = svg.node().getBBox();
		  // debugger;

		  svg.attr("viewBox", "0 0 "+ (svgBBox.width + 10)+" "+(svgBBox.height + 10) );

		  // Drag handlers
		  var nodeDrag = d3.behavior.drag()
		    // Set the right origin (based on the Dagre layout or the current position)
		    .origin(function(d) { return d.pos ? {x: d.pos.x, y: d.pos.y} : {x: d.dagre.x, y: d.dagre.y}; })
		    .on('drag', function (d, i) {
		      var prevX = d.dagre.x,
		          prevY = d.dagre.y;

		      // The node must be inside the SVG area
		      d.dagre.x = Math.max(d.width / 2, Math.min(svgBBox.width - d.width / 2, d3.event.x));
		      d.dagre.y = Math.max(d.height / 2, Math.min(svgBBox.height - d.height / 2, d3.event.y));
		      d3.select(this).attr('transform', 'translate('+ d.dagre.x +','+ d.dagre.y +')');

		      var dx = d.dagre.x - prevX,
		          dy = d.dagre.y - prevY;

		      // Edges position (inside SVG area)
		      d.edges.forEach(function(e) {
		        translateEdge(e, dx, dy);
		        d3.select('#'+ e.dagre.id).attr('d', spline(e));
		      });
		    });

		  var edgeDrag = d3.behavior.drag()
		    .on('drag', function (d, i) {
		      translateEdge(d, d3.event.dx, d3.event.dy);
		      d3.select(this).attr('d', spline(d));
		    });

		  nodes_elems.call(nodeDrag);
		  edges_elems.call(edgeDrag);
  	}

  	// "ObjectivesGraph" is used as a base class and is never instantiated outside of derived class constructors
  	function ObjectivesGraph() {
  		this.edges = _.flatten(this.objectives_nodes.map(function(obj_node) {
  			var source_edges = _(obj_node.referent.out_data_types).map(function(dt) {
  				return new Edge(obj_node, _(this.data_types_nodes).find(function(dt_node) { return dt_node.referent == dt;}));
  			}, this);
  			var target_edges = _(obj_node.referent.in_data_types).map(function(dt) {
  				return new Edge(_(this.data_types_nodes).find(function(dt_node) { return dt_node.referent == dt;}), obj_node);
  			}, this);
  			return _.union(source_edges, target_edges);
  		}, this), true);

  		Graph.call(this);
  	}
  	ObjectivesGraph.prototype = Object.create(Graph.prototype);

  	function GlobalGraph() {
  		this.primary_nodes = this.objectives_nodes = _(app.objectives).map(function(obj) { return new Node(obj, obj.name);});
  		this.secondary_nodes = this.data_types_nodes = _(app.data_types).map(function(dt) { return new Node(dt, dt.name);});
  		ObjectivesGraph.call(this);

  	}
  	GlobalGraph.prototype = Object.create(ObjectivesGraph.prototype);

  	function WorkflowGraph(workflow) {
  		this.primary_nodes = this.objectives_nodes = _(workflow.objectives).map(function(obj) { return new Node(obj, obj.name);});
  		this.secondary_nodes = this.data_types_nodes = _.flatten(_(workflow.objectives).map(function(obj) { return _.union(obj.in_data_types, obj.out_data_types);}))
  																										.map(function(dt) { return new Node(dt, dt.name);});
  		ObjectivesGraph.call(this);

  	}
  	WorkflowGraph.prototype = Object.create(ObjectivesGraph.prototype);

  	function PipelineGraph(pipeline) {
  		this.primary_nodes = this.tool_usages_nodes = _(pipeline.tool_usages).map(function(tu) { return new Node(tu, tu.tool.name);});
  		this.secondary_nodes = this.data_format_usages_nodes = _(pipeline.data_format_usages).map(function(dfu) { return new Node(dfu, dfu.data_format.name);});

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
 		//app.graph = new GlobalGraph();
 		app.graph = new PipelineGraph(app.pipelines.pipeline_1);
 		app.graph.render();

