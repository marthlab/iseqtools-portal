
//Immediately-Invoked Function Expression 
// (function() {

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

    // global w.r.t. the containing IIFE
    
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

    	this.tool_usages = cfg.tool_usages.map(function(tu_cfg, order) {
	    	return new ToolUsage(_.extend(tu_cfg, {order: order, pipeline: this}));
	    }, this).toDict();

    }

    function ToolUsage(cfg) {
    	_(this).extend(_(cfg).pick('id', 'order', 'pipeline'));
    	this.tool = app.tools[cfg.tool_id];
    	//var num_tool_uses = _(this.pipeline.tool_usages).filter(function(tu) { return tu.tool == this.tool;}, this).size();
    	//this.id = "pipelineid__"+this.pipeline.id+"__toolid__"+this.tool.id+"__tu__"+num_tool_uses;
    	this.objective = app.objectives[cfg.objective_id] || null;
    	this.nontool_in_data_formats = _.objFilter(app.data_formats, function(df) { return _(cfg.nontool_in_data_formats).contains(df.id); });
    	this.nontool_out_data_formats = _.objFilter(app.data_formats, function(df) { return _(cfg.nontool_out_data_formats).contains(df.id); });

    	this.next_steps = [];
    }

    app.initialize_data_structures = function(cfg) {
  		// add data in order of logical dependencies, and add convenience properties for nested objects
	    
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

	    // hackish way of avoiding chicken and egg problem with target tool usages
	    _(app.pipelines).each(function(pl) {
	    	var tu_cfgs = cfg.pipelines[pl.order].tool_usages;
	    	_(pl.tool_usages).each(function(tu){
	    		tu.next_steps = tu_cfgs[tu.order].next_steps.map(function(ns_cfg) {
			    	return {
			    		source_tool_usage: tu,
			    		target_tool_usage: pl.tool_usages[ns_cfg.target_tool_usage_id],
			    		data_formats: _.objFilter(app.data_formats, function(df) { return _(ns_cfg.data_formats_ids).contains(df.id); })
			    	};
			    }, this);
	    	});
	    });

  	}
    
 		

    app.render_global = function() {
  		app.g.states = _(_({}).extend(app.objectives, app.data_types)).toArray();
  		app.g.states.forEach(function(s) {
  			s.label = s.name;
  			s.edges = [];
  		});

  		app.g.transitions = _(_(app.objectives).map(function(obj){
  			var source_edges = _(obj.out_data_types).map(function(dt) {
  				return {source: obj, target: dt};
  			});
  			var target_edges = _(obj.in_data_types).map(function(dt) {
  				return {source: dt, target: obj};
  			});
  			return _.union(source_edges, target_edges);
  		})).flatten();

  		app.g.transitions.forEach(function(t) {
  			t.source.edges.push(t);
  			t.target.edges.push(t);
  		});
  	}

  	app.initialize_data_structures(app_json);
  	app.g = {
  		cfg: {
  			nodePadding: 10
  		}
  	};
  	debugger;
  	app.render_global();

  	// add more properties and data structures for dagre rendering

  	  function spline(e) {

		    var source = {x: e.source.dagre.x+e.source.dagre.width/2, y: e.source.dagre.y};
		    var target = {x: e.target.dagre.x-e.target.dagre.width/2, y: e.target.dagre.y};

		    var points = {source: source, target: target};
		    var points_inv = {source: {x: source.y, y: source.x}, target: {x: target.y, y: target.x}};

		    return d3.svg.diagonal().projection(function(d) { return [d.y, d.x]; })
		      (points_inv)
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
		  var nodes = svgGroup
		    .selectAll("g .node")
		    .data(app.g.states)
		    .enter()
		      .append("g")
		      .attr("class", "node")
		      .classed("objective", function(d) { return d instanceof Objective;})
		      .classed("data_type", function(d) { return d instanceof DataType;})
		      .attr("id", function(d) { return "node-" + d.label });

		  var edges = svgGroup
		    .selectAll("path .edge")
		    .data(app.g.transitions)
		    .enter()
		      .append("path")
		      .attr("class", "edge")
		      //.attr("marker-end", "url(#arrowhead)");

		  // Append rectangles to the nodes. We do this before laying out the text
		  // because we want the text above the rectangle.
		  var rects = nodes.append("rect");

		  // Append text
		  var labels = nodes
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
		    d.width = bbox.width + 2 * app.g.cfg.nodePadding;
		    d.height = bbox.height + 2 * app.g.cfg.nodePadding;
		  });

		  rects
		    .attr("x", function(d) { return -(d.bbox.width / 2 + app.g.cfg.nodePadding); })
		    .attr("y", function(d) { return -(d.bbox.height / 2 + app.g.cfg.nodePadding); })
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
		    .nodes(app.g.states)
		    .edges(app.g.transitions)
		    .debugLevel(1)
		    .run();

		  nodes.attr("transform", function(d) { return 'translate('+ d.dagre.x +','+ d.dagre.y +')'; });

		  // Ensure that we have at least two points between source and target
		  edges.each(function(d) {
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

		  edges
		    // Set the id. of the SVG element to have access to it later
		    .attr('id', function(e) { return e.dagre.id; })
		    .attr("d", function(e) { return spline(e); });

		  // Resize the SVG element
		  var svgBBox = svg.node().getBBox();
		  // debugger;

		  // var r1 = svgBBox.width/window.innerWidth;
		  // var r2 = svgBBox.height/window.innerHeight;
		  // r3 = Math.max(r1,r2);
		  // svg.style("width", (svgBBox.width/r3)+'px');
		  // svg.style("height", (svgBBox.height/r3)+'px');
		  
		  //svg.attr("width", svgBBox.width + 10);
		  //svg.attr("height", svgBBox.height + 10);
		  svg.attr("viewBox", "0 0 "+ (svgBBox.width + 10)+" "+(svgBBox.height + 10) );

		  //$("#svg_1 > g").appendTo("#svg_2");

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

		  nodes.call(nodeDrag);
		  edges.call(edgeDrag);

// }()); 