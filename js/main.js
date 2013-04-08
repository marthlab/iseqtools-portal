
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
	  Array.prototype.toDict = function(key_property) {
	  	new_obj = {};
	  	key_property = key_property || "id";
	  	_.each(this, function(element, index) {
	  		new_obj[element[key_property]] = element;
	  	});
	  	return new_obj;
	  }

    function DataFormat(config, data_type) {
    	this.id = config.id;
    	this.order = config.order;
    	this.name = config.name;
    	this.data_type = data_type;
    }

    function DataType(config) {
    	this.id = config.id;
    	this.order = config.order;
    	this.name = config.name;

	    this.data_formats = config.data_formats.map(function(df_cfg, order) {
	    	return new DataFormat(_.extend(df_cfg, {order: order}), this);
	    }, this).toDict();

    	// backreferences populated later
    	this.objectives_yielding = {};
    	this.objectives_accepting = {};
    }

    function Tool(config, objective) {
    	this.id = config.id;
    	this.order = config.order;
    	this.name = config.name;
    	this.objective = objective;
    	this.data_formats_in = _(app.data_formats).objFilter(function(df) {
    		return _(config.data_formats_in).contains(df.id);
    	});
    	this.data_formats_out = _(app.data_formats).objFilter(function(df) {
    		return _(config.data_formats_out).contains(df.id);
    	});

    	// backreferences populated later
    	this.pipelines = {};
    }

    function Objective(config) {
    	this.id = config.id;
    	this.order = config.order;
    	this.name = config.name;
    	this.nontool_data_formats_out = _.objFilter(app.data_formats, function(df) {
    		return _(config.nontool_out_data_format_ids).contains(df.id);
    	});

	    this.tools = config.tools.map(function(tool_cfg, order) {
	    	return new Tool(_.extend(tool_cfg, {order: order}), this);
	    }, this).toDict();

    	// convenience properties
    	this.data_formats_in = _.extend.apply({}, _(this.tools).map(function(tool) {return tool.data_formats_in;}));
    	this.data_types_in = _(this.data_formats_in).map(function(df) {return df.data_type;}).toDict();
    	this.data_formats_out = _.extend.apply({}, _(this.tools).map(function(tool) {return tool.data_formats_out;}));
    	this.data_types_out = _(this.data_formats_out).map(function(df) {return df.data_type;}).toDict();
    }

    function Workflow(config) {
    	this.id = config.id;
    	this.order = config.order;
    	this.name = config.name;

    	this.pipelines = config.pipelines.map(function(pipeline_cfg, order) {
	    	return new Pipeline(_.extend(pipeline_cfg, {order: order}), this);
	    }, this).toDict();

    	// convenience properties
    	this.tools = _.extend.apply({}, _(this.pipelines).map(function(pl) {return pl.tools;}));
    	this.objectives = _.extend.apply({}, _(this.pipelines).map(function(pl) {return pl.objectives;}));
    }

    function Pipeline(config, workflow) {
    	this.id = config.id;
    	this.order = config.order;
    	this.name = config.name;
    	this.workflow = workflow;
    	this.tools = _(app.tools).objFilter(function(tool) {
    		return _(config.tool_ids).contains(tool.id);
    	});

    	// convenience properties
    	this.objectives = _(this.tools).map(function(tool) {return tool.objective;}).toDict();
    }

    // global w.r.t. the containing IIFE
    var app = {};

    // add data in order of logical dependencies, and add convenience properties for nested objects
    app.data_types = app_json.data_types.map(function(dt_cfg, order) {
    	return new DataType(_.extend(dt_cfg, {order: order}) );
    }).toDict();
    app.data_formats = _.extend.apply({}, _(app.data_types).map(function(dt) {return dt.data_formats;}));

    app.objectives = app_json.objectives.map(function(obj_cfg, order) {
    	return new Objective(_.extend(obj_cfg, {order: order}) );
    }).toDict();
    app.tools = _.extend.apply({}, _(app.objectives).map(function(obj) {return obj.tools;}));

    app.workflows = app_json.workflows.map(function(wf_cfg, order) {
    	return new Workflow(_.extend(wf_cfg, {order: order}) );
    }).toDict();
    app.pipelines = _.extend.apply({}, _(app.workflows).map(function(obj) {return obj.pipelines;}));

  	// add backreferences
  	_(app.pipelines).each(function(pl) {
    	_(pl.tools).each(function(tool) {
  			tool.pipelines[pl.id] = pl;
  		});
  	});

  	_(app.objectives).each(function(obj) {
    	_(obj.data_types_in).each(function(dt) {
  			dt.objectives_accepting[obj.id] = obj;
  		});
  		_(obj.data_types_out).each(function(dt) {
  			dt.objectives_yielding[obj.id] = obj;
  		});
  	});

  	// add more properties and data structures for dagre rendering

  	function renderGlobal() {
  		var transitions_from_objectives = _(_(app.objectives).map(function(obj){
  			return _(obj.data_types_out).map(function(dt) { 
  				return {source: obj, target: dt};
  			});
  		})).flatten();

  		var transitions_from_data_types = _(_(app.data_types).map(function(dt){
  			return _(dt.objectives_accepting).map(function(obj) { 
  				return {source: dt, target: obj};
  			});
  		})).flatten();

  		var transitions = _.union(transitions_from_objectives, transitions_from_data_types);
  		
  	}

  	  function spline(e) {
		    var points = e.dagre.points.slice(0);
		    var source = dagre.util.intersectRect(e.source.dagre, points[0]);
		    var target = dagre.util.intersectRect(e.target.dagre, points[points.length - 1]);
		    points.unshift(source);
		    points.push(target);
		    return d3.svg.line()
		      .x(function(d) { return d.x; })
		      .y(function(d) { return d.y; })
		      .interpolate("linear")
		      (points);
		  }

		  // Translates all points in the edge using `dx` and `dy`.
		  function translateEdge(e, dx, dy) {
		    e.dagre.points.forEach(function(p) {
		      p.x = Math.max(0, Math.min(svgBBox.width, p.x + dx));
		      p.y = Math.max(0, Math.min(svgBBox.height, p.y + dy));
		    });
		  }

		  renderGlobal();

		  // Get the data in the right form
		  var stateKeys = {};
		  transitions.forEach(function(d) {
		    var source = stateKeys[d.source],
		        target = stateKeys[d.target];
		    if (!source) source = stateKeys[d.source] = { label: d.source, edges: [] };
		    if (!target) target = stateKeys[d.target] = { label: d.target, edges: [] };
		    source.edges.push(d);
		    target.edges.push(d);
		  });
		  var states = d3.values(stateKeys);
		  transitions.forEach(function(d) {
		    d.source = stateKeys[d.source];
		    d.target = stateKeys[d.target];
		  });

		  // Now start laying things out
		  var svg = d3.select("svg");
		  var svgGroup = svg.append("g").attr("transform", "translate(5, 5)");

		  // `nodes` is center positioned for easy layout later
		  var nodes = svgGroup
		    .selectAll("g .node")
		    .data(states)
		    .enter()
		      .append("g")
		      .attr("class", "node")
		      .attr("id", function(d) { return "node-" + d.label });

		  var edges = svgGroup
		    .selectAll("path .edge")
		    .data(transitions)
		    .enter()
		      .append("path")
		      .attr("class", "edge")
		      .attr("marker-end", "url(#arrowhead)");

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
		    .attr("dy", "1em")
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
		    .nodes(states)
		    .edges(transitions)
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
		      points.push({ x: points[0].x, y: points[0].y });
		    }
		  });

		  edges
		    // Set the id. of the SVG element to have access to it later
		    .attr('id', function(e) { return e.dagre.id; })
		    .attr("d", function(e) { return spline(e); });

		  // Resize the SVG element
		  var svgBBox = svg.node().getBBox();
		  svg.attr("width", svgBBox.width + 10);
		  svg.attr("height", svgBBox.height + 10);

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