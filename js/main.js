		_.mixin({
		  sum : function(arr) {
		    if (!$.isArray(arr) || arr.length == 0) return 0;
			  return _.reduce(arr, function(sum, n) {
			    return sum += n;
			  });
		  },
		  pickStrings : function(obj) {
		    var copy = {};
		    var keys = Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(arguments, 1));
		    _.each(keys, function(key) {
		      if (key in obj) copy[key] = (obj[key]).toString();
		    });
		    return copy;
		  }
		});

	  function by_id(id) {
			return function(element) { return element.id == id; }
		}

    // basic data structures
    
    var app = {};

    app.cfg = {
    	graph: {
    		nodeSep: 10,
		    edgeSep: 15,
		    rankSep: 30,
		    render_duration: 2000
    	},
    	nodes: {
    		"stroke-width": 2,
    		primary: {
	    		radius: 30
	    	},
	    	secondary: {
	    		radius:8
	    	}
    	},
    	edges: {
    		"stroke-width": 3
    	}
    }

    function DataType(cfg) {
    	_(this).extend(_(cfg).pickStrings('id', 'name'));
    }

    function Task(cfg) {
    	_(this).extend(_(cfg).pickStrings('id', 'name'));
    	this.in_data_types = cfg.in_data_types_ids.map(function(dt_id){ return _(app.data_types).find(by_id(dt_id));});
    	this.out_data_types = cfg.out_data_types.map(function(dt_cfg){ return _(app.data_types).find(by_id(dt_cfg.id));});

    	// references populated later
    	this.workflows = {};
    }

    function Workflow(cfg) {
    	_(this).extend(_(cfg).pickStrings('id'));
    	this.tasks = cfg.tasks_ids.map(function(task_id){ return _(app.tasks).find(by_id(task_id));});

    	this.data_types = _.union.apply(this,
    		this.tasks.map(function(task) {return _.union(task.in_data_types, task.out_data_types); })
  		);

    	this.in_data_types = this.data_types.filter(function(dt) { return _(this.tasks.filter(function(task){ return _(task.out_data_types).contains(dt); })).isEmpty();}, this);
    	this.out_data_types = this.data_types.filter(function(dt) { return _(this.tasks.filter(function(task){ return _(task.in_data_types).contains(dt); })).isEmpty();}, this);

  		this.name = "From: "
  								+ this.in_data_types.map(function(dt) { return dt.name;}).join(", ")
  								+ " | To: "
  								+ this.out_data_types.map(function(dt) { return dt.name;}).join(", ");
    }

    function DataFormat(cfg) {
    	_(this).extend(_(cfg).pickStrings('id'));
    	this.name = cfg.name || cfg.id;
    	//this.data_type = _(app.tasks).find(by_id(cfg.data_type_id)) || null;
    }

    function Tool(cfg) {
    	_(this).extend(_(cfg).pickStrings('id'));
    	this.name = cfg.name || cfg.id;
    }

    function Pipeline(cfg) {
    	_(this).extend(_(cfg).pickStrings('id', 'name'));
    	cfg.initial_data_format_usages = cfg.initial_data_format_usages || [];

    	this.workflow = _(app.workflows).find(function(wf) {
    		return _.isEqual(_.pluck(wf.tasks, 'id'), cfg.tasks_ids);
    	});

    	var create_dfu = function(dfu_cfg){
    		return new DataFormatUsage(_.extend(dfu_cfg, {pipeline: this}));
    	};

	    this.data_format_usages = _.flatten(_(cfg.tool_usages.map(function(tu_cfg) {
	    	return tu_cfg.out_data_format_usages.map(create_dfu, this);
	    }, this)).union(cfg.initial_data_format_usages.map(create_dfu, this)), true);
    	
    	this.tool_usages = cfg.tool_usages.map(function(tu_cfg) {
	    	return new ToolUsage(_.extend(tu_cfg, {pipeline: this}));
	    }, this);

    }

    function DataFormatUsage(cfg) {
    	_(this).extend(_(cfg).pickStrings('id'));
    	this.pipeline = cfg.pipeline;
    	this.data_format = _(app.data_formats).find(by_id(cfg.data_format_id));
    }

    function ToolUsage(cfg) {
    	_(this).extend(_(cfg).pickStrings('id'));
    	this.pipeline = cfg.pipeline;
    	this.tool = _(app.tools).find(by_id(cfg.tool_id));
    	this.task = _(app.tasks).find(by_id(cfg.task_id)) || null;

    	this.in_data_format_usages = cfg.in_data_format_usages_ids.map(function(dfu_id){ return _(this.pipeline.data_format_usages).find(by_id(dfu_id));}, this);
    	this.out_data_format_usages = cfg.out_data_format_usages.map(function(dfu_cfg){ return _(this.pipeline.data_format_usages).find(by_id(dfu_cfg.id));}, this);

    }

    

    app.initialize_data_structures = function(cfg) {

			var create_dt = function(dt_cfg){
    		return new DataType(dt_cfg);
    	};

	    app.data_types = _.flatten(_(cfg.tasks.map(function(task_cfg) {
	    	return task_cfg.out_data_types.map(create_dt);
	    })).union(cfg.initial_data_types.map(create_dt)), true);
	    
	    app.tasks = cfg.tasks.map(function(task_cfg) {
	    	return new Task(task_cfg);
	    });

	    app.data_formats = cfg.data_formats.map(function(df_cfg) {
	    	return new DataFormat(df_cfg);
	    });

	   //  _(app.data_types).each(function(dt) {
	  	// 	dt.data_formats = _(app.data_formats).filter(function(df) {return df.data_type === dt; });
	  	// });

	    app.tools = cfg.tools.map(function(tool_cfg) {
	    	return new Tool(tool_cfg);
	    });

	    app.workflows = _.uniq(cfg.pipelines.map(function(pl_cfg) {
	    	return _.sortBy(pl_cfg.tasks_ids, function(task_id){
	    		return _.pluck(app.tasks, 'id').indexOf(task_id);
	    	});
	    }), function(tasks_ids){ return tasks_ids.join("__"); })
	    .map(function(tasks_ids, i) { return new Workflow({tasks_ids: tasks_ids, id:"workflow_"+i});});

	    _(app.tasks).each(function(task) {
	  		task.workflows = _(app.workflows).filter(function(wf) {return _(wf.tasks).contains(task); });
	  	});

	    app.pipelines = cfg.pipelines.map(function(pl_cfg) {
	    	return new Pipeline(pl_cfg);
	    });

	    _(app.workflows).each(function(wf) {
	  		wf.pipelines = _(app.pipelines).filter(function(pl) {return pl.workflow === wf; });
	  	});

  	}

  	function Node(referent, label, graph) {
  		this.referent = referent;
  		this.label = label;
  		this.graph = graph;
  		this.cfg = _({}).extend(app.cfg.nodes, app.cfg.nodes[this.type()]);
  	}
  	Node.prototype = {
  		edges: function(dir) {
  				return this.graph.edges.filter(function(e){ return e[dir === "in" ? "target" : "source"] === this;}, this);
  		},
  		type: function() {
  			return _([Task, ToolUsage]).contains(this.referent.constructor) ? 'primary' : 'secondary';
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
  	Node.key = function(n) {	return n.referent.constructor.name + "__" + n.referent.id; }

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

  			var start_y = s.dagre.y + e.cfg["stroke-width"]*((s.pathOrder(e, path_item, "out")-s.numPathsOut()/2)+1/2);
  			var end_y = t.dagre.y + e.cfg["stroke-width"]*((t.pathOrder(e, path_item, "in")-t.numPathsIn()/2)+1/2);
	      var points = e.dagre.points;
	      var start = {x: s.dagre.x+s.dagre.width/2, y: start_y};
			  var end = {x: t.dagre.x-t.dagre.width/2, y: end_y};

		  	path_string = line([{x: start.x-s.dagre.width/2+Math.sqrt(Math.pow(s.cfg.radius, 2)-Math.pow(start.y-s.dagre.y, 2)), y: start.y}, start])
		  							+ (points.length == 1 ? diag(start, end) : diag(start, points[0])+line([points[0], points[1]])+diag(points[1], end) )
		  							+ line([end, {x: end.x+t.dagre.width/2-Math.sqrt(Math.pow(t.cfg.radius, 2)-Math.pow(end.y-t.dagre.y, 2)), y: end.y}]);

			  return path_string;
			}
  	};
  	Edge.key = function(e) {return  e.source.referent.constructor.name + "__" + e.source.referent.id + "__" + e.target.referent.constructor.name + "__" + e.target.referent.id; }

  	function GraphDrawing(graph, svg, use_transitions) {
  		this.graph = graph;
  		this.svg = svg;
  		this.use_transitions = use_transitions;
  		this.svgGroup = this.svg.append("g").attr("transform", "translate(5, 5)");
		  this.edgeGroup = this.svgGroup.append("g").attr("id", "edgeGroup");
		  this.nodeGroup = this.svgGroup.append("g").attr("id", "nodeGroup");
  	}
  	GraphDrawing.prototype = {
  		render: function(viewBox) {

			  // handle nodes

		    var nodes_elems = this.nodeGroup.selectAll("g .node")
			    .data(this.graph.nodes, Node.key);

			  var new_nodes_elems = nodes_elems
				  .enter()
			      .append("g")
				      .attr("class", "node")
				      .classed("primary", function(n) { return n.type() === 'primary'; })
							.classed("secondary", function(n) { return n.type() === 'secondary'; })

				var old_nodes_elems = nodes_elems
					.exit()
				
				var updated_nodes_elems = nodes_elems.filter(function(d, i) { return !_(new_nodes_elems[0]).contains(this);});

				var circles = new_nodes_elems.append("circle")
			  	.attr("cx", 0)
					.attr("cy", 0)
					.attr("r", function(n) { return n.cfg.radius; })
					.attr("stroke-width", function(e) { return d3.select(this.parentNode).datum().cfg["stroke-width"]; })	

			  var labels = new_nodes_elems
			    .append("text")
		      
			    // .append("tspan")
			    // .attr("x", 0)
			    // .attr("dy", "-0.5em")
			    // .text(function(n) { return n.label; });
			    .each(function(n) {
			    	var text = d3.select(this);
			    	var label_words = n.label.split(" ");
			    	label_words.forEach(function(word, word_index) {
					    text
					    .append("tspan")
					    .attr("x", 0)
					    .attr("dy", "1em")
					    .text(word);
			    	});
			    })
			    .attr("text-anchor", "middle")
		      .attr("x", 0)
		      .attr("y", function(n) { return -this.getBBox().height - n.cfg.radius - 4; })

				nodes_elems.each(function(n) {
			    var bbox = this.getBBox();
			    n.bbox = bbox;
			    n.width = bbox.width;
			    n.height = bbox.height;
			  });

				// handle edges

				var edges_elems = this.edgeGroup
			    .selectAll("g.edge")
			    .data(this.graph.edges, Edge.key)

			  var new_edges_elems = edges_elems
			    .enter()
			    	.append("g")
			      .attr("class", "edge")

	     	var old_edges_elems = edges_elems
	     		.exit()

			  var updated_edges_elems = edges_elems.filter(function(d, i) { return !_(new_edges_elems[0]).contains(this);});

			  // handle paths

			  var edges_paths = edges_elems
			  	.selectAll("path")
			    .data(function(e) { return e.path_items; }, function(r) {return r.id;})

			  var new_edges_paths = edges_paths
			  	.enter()
		    		.append("path")
		    		.attr("stroke-width", function(e) { return d3.select(this.parentNode).datum().cfg["stroke-width"]; });

			  var old_edges_paths = edges_paths.exit()

				var updated_edges_paths = edges_paths.filter(function(d, i) {
					return !new_edges_paths.map(function(nep) { return _(nep).contains(this); }, this).reduce(function(memo, val) {return memo || val;}, false);
				})

			  dagre.layout()
			    .nodeSep(this.graph.cfg.nodeSep)
			    .edgeSep(this.graph.cfg.edgeSep)
			    .rankSep(this.graph.cfg.rankSep)
			    .rankDir("LR")
			    .nodes(this.graph.nodes)
			    .edges(this.graph.edges)
			    .debugLevel(1)
			    .run();

			  (this.use_transitions ? old_nodes_elems.transition().duration(this.graph.cfg.render_duration) : old_nodes_elems)
			  	.style("opacity", 0)
			  	.remove();

			 	(this.use_transitions ? old_edges_paths.transition().duration(this.graph.cfg.render_duration) : old_edges_paths)
			  	.style("stroke-opacity", 0)
			  	.remove();

			  (this.use_transitions ? old_edges_elems.transition().duration(this.graph.cfg.render_duration) : old_edges_elems)
			  	.style("opacity", 0)
			  	.remove();


			  var getTransform = function(d) { return 'translate('+ d.dagre.x +','+ d.dagre.y +')'; };

			  new_nodes_elems.attr("transform", getTransform);

			  (this.use_transitions ? new_nodes_elems.transition().duration(this.graph.cfg.render_duration) : new_nodes_elems)
			  	.style("opacity", 1);

			  if(this.use_transitions) {
			  	updated_nodes_elems
				  	.transition()
		      	.duration(this.graph.cfg.render_duration)
		      	.attrTween("transform", function tween(d, i, a) {
				      return d3.interpolateString(this.getAttribute("transform"), getTransform(d) );
				    });
			  } else {
			  	updated_nodes_elems.attr("transform", getTransform);
			  }

			  (this.use_transitions ? updated_edges_paths.transition().duration(this.graph.cfg.render_duration) : updated_edges_paths)
			  	.attr("d", function(path_item) {
			    	var edge = d3.select(this.parentNode).datum();
			    	return edge.spline(path_item);
			    })
			    
			  new_edges_paths
			  	.attr("d", function(path_item) {
			    	var edge = d3.select(this.parentNode).datum();
			    	return edge.spline(path_item);
			    })
			    .attr("stroke", function(path_item) {
			    	var edge = d3.select(this.parentNode).datum();
			    	return edge.graph.pathColors(path_item.id);
			    }).each(function(path_item) {
			    	this.addEventListener("click", app.activateItem.bind(app, path_item));
			    });

			  (this.use_transitions ? new_edges_paths.transition().duration(this.graph.cfg.render_duration) : new_edges_paths)
			  	.style("stroke-opacity", 1)

		   	if(viewBox) {
			   	(this.use_transitions ? this.svg.transition().duration(this.graph.cfg.render_duration) : this.svg)
			   		.attr("viewBox", viewBox);
			  }

  		}
  	}

  	app.graph = {
  		init: function(options) {
  			this.cfg = app.cfg.graph;
  			this.drawing_for_layout = new GraphDrawing(this, d3.select(options.layout_svg), false);
  			this.drawing_for_display = new GraphDrawing(this, d3.select(options.display_svg), true);
  		}
  	};

  	app.graph.update = function() {
  		this["_load_"+app.activeItemType()](app.activeItem());
  		this.drawing_for_layout.render();
  		var svgBBox = this.drawing_for_layout.svg.node().getBBox();
			var viewBox = "0 0 "+ (svgBBox.width + 10)+" "+(svgBBox.height + 10);
  		this.drawing_for_display.render(viewBox);
  	}

  	app.graph._load_global = function() {
			this.graph_type = "global";
			this.getEdgeReferents = function(edge) {
				return _.union(edge.source.referent.workflows || [], edge.target.referent.workflows || []);
			}
			this.pathColors = d3.scale.category10()
  										 .domain(app.workflows.map(function(w){return w.id}));
  		this._tasks_shared_init(app.tasks);
  	}

  	app.graph._load_workflow = function(workflow) {
			this.graph_type = "workflow";
			this.getEdgeReferents = function(edge) {
				return workflow.pipelines;
			}
			this.pathColors = d3.scale.category10()
  										 .domain(workflow.pipelines.map(function(pl){return pl.id}));
  		this._tasks_shared_init(workflow.tasks);
  	}

  	app.graph._load_pipeline = function(pipeline) {
  		this.graph_type = "pipeline";
  		this.getEdgeReferents = function(edge) {
				return [pipeline];
			}
			this.pathColors = d3.scale.category10()
  										 .domain([pipeline.id]);

  		this.primary_nodes = this.tool_usages_nodes = pipeline.tool_usages.map(function(tu) { return new Node(tu, tu.tool.id, this);}, this);
  		this.secondary_nodes = this.data_format_usages_nodes = pipeline.data_format_usages.map(function(dfu) { return new Node(dfu, dfu.data_format.name, this);}, this);
  		
  		this.edges = _.union.apply(this, this.tool_usages_nodes.map(function(tu_node) {
  			var edges_out = tu_node.referent.out_data_format_usages.map(function(df_usage) {
  				if(app.data_formats[df_usage.data_format_id]) {

  				}
  				return new Edge(tu_node, _(this.data_format_usages_nodes).find(function(df_usage_node) { return df_usage_node.referent == df_usage;}), this);
  			}, this);
  			var edges_in = tu_node.referent.in_data_format_usages.map(function(df_usage) {
  				//debugger;
  				return new Edge(_(this.data_format_usages_nodes).find(function(df_usage_node) { return df_usage_node.referent == df_usage;}), tu_node, this);
  			}, this);

  			return _.union(edges_in, edges_out);
  		}, this));

  		this.nodes = _.union(this.primary_nodes, this.secondary_nodes);
  	}

  	app.graph._tasks_shared_init = function(tasks) {
  		this.primary_nodes = this.tasks_nodes = tasks.map(function(task) { return new Node(task, task.name, this);}, this);

  		this.secondary_nodes = this.data_types_nodes = _.union.apply(this, tasks.map(function(task) {return _.union(task.in_data_types, task.out_data_types);}))
  																										.map(function(dt) { return new Node(dt, dt.name, this);}, this);

  		this.edges = _.union.apply(this, this.tasks_nodes.map(function(task_node) {
  			var edges_out = task_node.referent.out_data_types.map(function(dt) {
  				return new Edge(task_node, _(this.data_types_nodes).find(function(dt_node) { return dt_node.referent == dt;}), this);
  			}, this);
  			var edges_in = task_node.referent.in_data_types.map(function(dt) {
  				return new Edge(_(this.data_types_nodes).find(function(dt_node) { return dt_node.referent == dt;}), task_node, this);
  			}, this);
  			return _.union(edges_in, edges_out);
  		}, this));

  		this.nodes = _.union(this.primary_nodes, this.secondary_nodes);
  	}

  	app.breadcrumbs = {
  		init: function(element, options) {
  			this.element = element;
  			//bind event handlers
  			$(this.element).on("click", "a", function(event){
				  var $t = $(event.target);
				  if($t.hasClass("global") ) {
				  	app.activateItem(app);
				  } else if($t.hasClass("workflow") ) {
				  	app.activateItem(app.current_workflow);
				  } else if($t.hasClass("pipeline") ) {
				  	app.activateItem(app.current_pipeline);
				  }
				});
  		},
  		update: function() {
  			$(this.element).html(app.templates.breadcrumbs(app));
  		}
  	}

  	app.activateItem = function(item) {
  		if(item == app) {
  			this.current_workflow = this.current_pipeline = this.current_tool = null;
  		} else if (item instanceof Workflow) {
  			this.current_pipeline = this.current_tool = null;
  			this.current_workflow = item;
  		} else if (item instanceof Pipeline) {
  			this.current_tool = null;
  			this.current_pipeline = item;
  			//this.current_workflow = pipeline.workflow;
  		} else if (item instanceof Tool) {
  			this.current_tool = item;
  		}
  		this.graph.update();
  		this.breadcrumbs.update();
  	}

  	app.activeItemType = function() {
  		if(this.current_tool) {return 'tool';}
  		else if(this.current_pipeline) {return 'pipeline';}
  		else if(this.current_workflow) {return 'workflow';}
  		else {return 'global';}
  	}

  	app.activeItem = function() {
  		switch(this.activeItemType() ) {
  			case 'tool':
  				return this.current_tool;
  			case 'pipeline':
  				return this.current_pipeline;
  			case 'workflow':
  				return this.current_workflow;
  			case 'global':
  				return this;
  		}
  	}

  	// app.templates.nav.global = _.template($('#nav-template-global').html(), null, {variable: 'workflows'});
  	// app.templates.nav.workflow = _.template($('#nav-template-workflow').html(), null, {variable: 'pipelines'});
  	// app.templates.nav.pipeline = _.template($('#nav-template-pipeline').html(), null, {variable: 'tools'});
  	app.templates = {
  		breadcrumbs: _.template($('#breadcrumbs-template').html(), null, {variable: 'app'})
  	};
		
		// initialize application
		app.initialize_data_structures(app_json);

 		app.graph.init({display_svg: document.getElementById('display_svg'), layout_svg: document.getElementById('layout_svg')});
 		app.breadcrumbs.init(document.getElementById('breadcrumbs'));
 		app.activateItem(app);
 		//app.graph.load_pipeline(app.pipelines[0]);
 		
 		//app.graph.load_workflows([app.workflows[3]]);
 		

