
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

    function DataFormat(cfg) {
    	_(this).extend(_(cfg).pick('id', 'order', 'name', 'data_type'));
    }

    function DataType(cfg) {
    	_(this).extend(_(cfg).pick('id', 'order', 'name'));

	    this.data_formats = cfg.data_formats.map(function(df_cfg, order) {
	    	return new DataFormat(_.extend(df_cfg, {order: order, data_type: this}));
	    }, this).toDict();

    	// backreferences populated later
    	this.objectives_yielding = {};
    	this.objectives_accepting = {};
    }

    function Tool(cfg) {
    	_(this).extend(_(cfg).pick('id', 'order', 'name', 'objective'));
    	this.data_formats_in = _(app.data_formats).objFilter(function(df) {
    		return _(cfg.data_formats_in).contains(df.id);
    	});
    	this.data_formats_out = _(app.data_formats).objFilter(function(df) {
    		return _(cfg.data_formats_out).contains(df.id);
    	});

    	// backreferences populated later
    	this.pipelines = {};
    }

    function Objective(cfg) {
    	_(this).extend(_(cfg).pick('id', 'order', 'name'));
    	this.nontool_data_formats_out = _.objFilter(app.data_formats, function(df) {
    		return _(cfg.nontool_data_formats_out_ids).contains(df.id);
    	});

	    this.tools = cfg.tools.map(function(tool_cfg, order) {
	    	return new Tool(_.extend(tool_cfg, {order: order, objective: this}));
	    }, this).toDict();

    	// convenience properties
    	this.data_formats_in = _.extend.apply({}, _(this.tools).map(function(tool) {return tool.data_formats_in;})) || {};
    	this.data_types_in = _(this.data_formats_in).map(function(df) {return df.data_type;}).toDict();
    	this.data_formats_out = _(_.extend.apply({}, _(this.tools).map(function(tool) {return tool.data_formats_out;})) || {}).extend(this.nontool_data_formats_out);
    	this.data_types_out = _(this.data_formats_out).map(function(df) {return df.data_type;}).toDict();
    }

    function Workflow(cfg) {
    	_(this).extend(_(cfg).pick('id', 'order', 'name'));

    	this.pipelines = cfg.pipelines.map(function(pipeline_cfg, order) {
	    	return new Pipeline(_.extend(pipeline_cfg, {order: order, workflow: this}));
	    }, this).toDict();

    	// convenience properties
    	this.tools = _.extend.apply({}, _(this.pipelines).map(function(pl) {return pl.tools;}));
    	this.objectives = _.extend.apply({}, _(this.pipelines).map(function(pl) {return pl.objectives;}));
    }

    function Pipeline(cfg) {
    	_(this).extend(_(cfg).pick('id', 'order', 'name', 'workflow'));
    	this.tools = _(app.tools).objFilter(function(tool) {
    		return _(cfg.tool_ids).contains(tool.id);
    	});

    	// convenience properties
    	this.objectives = _(this.tools).map(function(tool) {return tool.objective;}).toDict();
    }

    app.initialize_data_structures = function(cfg) {
  		// add data in order of logical dependencies, and add convenience properties for nested objects
	    app.data_types = cfg.data_types.map(function(dt_cfg, order) {
	    	return new DataType(_.extend(dt_cfg, {order: order}) );
	    }).toDict();
	    app.data_formats = _.extend.apply({}, _(app.data_types).map(function(dt) {return dt.data_formats;}));

	    app.objectives = cfg.objectives.map(function(obj_cfg, order) {
	    	return new Objective(_.extend(obj_cfg, {order: order}) );
	    }).toDict();
	    app.tools = _.extend.apply({}, _(app.objectives).map(function(obj) {return obj.tools;}));

	    app.workflows = cfg.workflows.map(function(wf_cfg, order) {
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
  	}
    
    app.render_global = function() {
  		app.g.states = _(_({}).extend(app.objectives, app.data_types)).toArray();
  		app.g.states.forEach(function(s) {
  			s.label = s.id;
  			s.edges = [];
  		});

  		app.g.transitions = _(_(app.objectives).map(function(obj){
  			var source_edges = _(obj.data_types_out).map(function(dt) {
  				return {source: obj, target: dt};
  			});
  			var target_edges = _(obj.data_types_in).map(function(dt) {
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
  	app.render_global();

  	// add more properties and data structures for dagre rendering

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

		 // prep_global();

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
		      .attr("id", function(d) { return "node-" + d.label });

		  var edges = svgGroup
		    .selectAll("path .edge")
		    .data(app.g.transitions)
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