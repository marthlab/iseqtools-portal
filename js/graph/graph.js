		function Graph(options) {
			this.cfg = app.cfg.graph;
			this.drawing_for_layout = new GraphDrawing(this, d3.select(options.layout_svg), false);
			this.drawing_for_display = new GraphDrawing(this, d3.select(options.display_svg), true);
		}
  	Graph.prototype = {
  		update: function() {
	  		this._updateData();
	  		this.drawing_for_layout.render();
	  		var viewBox = this._getViewBox();
	  		this.drawing_for_display.render(viewBox);
	  	},
	  	_updateData: function() {
	  		this["_load_"+app.activeItemType()](app.activeItem());
	  		this.edges.forEach(function(edge){
	  			edge.path_items = this.getEdgePathItems(edge);
	  		}, this);
	  		this.nodes.forEach(function(node){
	  			node.path_items = this.getNodePathItems(node);
	  		}, this);
	  	},
	  	_getViewBox: function() {
	  		var rect = this.drawing_for_layout.svgGroup.node().getBoundingClientRect();
	  		// fudge factors prevent unwanted clipping of content on sides
				var horz_padding_fraction = 0.06;
				var vert_padding_fraction = 0.01;
				return	-Math.ceil(rect.width*horz_padding_fraction/2)
								+" "
								+Math.floor(rect.top-rect.height*vert_padding_fraction/2)
								+" "
								+Math.ceil(rect.width*(1+horz_padding_fraction))
								+" "
								+Math.ceil(rect.height*(1+vert_padding_fraction));
	  	},
	  	_load_global: function() {
				this.graph_type = "global";
				this.getEdgePathItems = function(edge) {
					return _.union(edge.source.referent.workflows || [], edge.target.referent.workflows || []);
				}
				this.getNodePathItems = function(node) {
					return [];
				}
				this.pathColors = d3.scale.category10()
	  										 .domain(app.workflows.map(function(w){return w.id}));
	  		this._tasks_shared_init(app.tasks);
	  	},
	  	_load_workflow: function(workflow) {
				this.graph_type = "workflow";
				this.getEdgePathItems = function(edge) {
					return workflow.pipelines.filter(function(pl) {
						var e = edge, s = edge.source, t = edge.target;
						var to_intermediate_task = _(pl.data_types).contains(s.referent)
							&& this.edges.some(function(e2){
								return e2.source === t && _(pl.data_types).contains(e2.target.referent);
							});
						var from_intermediate_task = _(pl.data_types).contains(t.referent)
							&& this.edges.some(function(e2){
								return e2.target === s && _(pl.data_types).contains(e2.source.referent);
							});
						return to_intermediate_task || from_intermediate_task;
					}, this);
				}
				this.getNodePathItems = function(node) {
					return workflow.pipelines.filter(function(pl){ return pl.data_types.length === 1 && node.referent === pl.data_types[0];});
				}
				this.pathColors = d3.scale.category10()
	  										 .domain(workflow.pipelines.map(function(pl){return pl.id}));
	  		this._tasks_shared_init(workflow.tasks);
	  	},
	  	_load_pipeline: function(pipeline) {
	  		this.graph_type = "pipeline";
	  		this.getEdgePathItems = function(edge) {
					return [pipeline];
				}
				this.getNodePathItems = function(node) {
					return [];
				}
				this.pathColors = d3.scale.category10()
	  										 .domain([pipeline.id]);

	  		this.primary_nodes = this.tool_usages_nodes = pipeline.tool_usages.map(function(tu) { return new Node(tu, tu.tool.id, this);}, this);
	  		this.secondary_nodes = this.data_format_usages_nodes = pipeline.data_format_usages
	  			.filter(function(dfu){ return dfu.data_format.id !== "stream"})
	  			.map(function(dfu) { return new Node(dfu, dfu.data_format.name, this);}, this);
	  			
	  		this.nodes = _.union(this.primary_nodes, this.secondary_nodes);

	  		this.edges = _.union.apply(this, this.tool_usages_nodes.map(function(tu_node) {
	  			var edges_out = tu_node.referent.out_data_format_usages
	  				.filter(function(dfu){ return dfu.data_format.id !== "stream"})
	  				.map(function(dfu) { return new Edge(tu_node, _(this.data_format_usages_nodes).find(function(dfu_node) { return dfu_node.referent == dfu;}), this);
	  				}, this);
	  			var stream_edges_out = tu_node.referent.out_data_format_usages
	  				.filter(function(dfu){ return dfu.data_format.id === "stream"})
	  				.map(function(dfu) { return new Edge(tu_node, _(this.tool_usages_nodes).find(function(tu_node) { return _(tu_node.referent.in_data_format_usages).contains(dfu);}), this);
	  				}, this);
	  			var edges_in = tu_node.referent.in_data_format_usages
	  				.filter(function(dfu){ return dfu.data_format.id !== "stream"})
	  				.map(function(df_usage) {
		  				return new Edge(_(this.data_format_usages_nodes).find(function(df_usage_node) { return df_usage_node.referent == df_usage;}), tu_node, this);
		  			}, this);

	  			return _.union(_.union(edges_in, edges_out), stream_edges_out);
	  		}, this));

	  	},
	  	_tasks_shared_init: function(tasks) {
	  		this.primary_nodes = this.tasks_nodes = tasks.map(function(task) { return new Node(task, task.name, this);}, this);

	  		this.secondary_nodes = this.data_types_nodes = _.union.apply(this, tasks.map(function(task) {return _.union(task.in_data_types, task.out_data_types);}))
	  																										.map(function(dt) { return new Node(dt, dt.name, this);}, this);

	  		this.nodes = _.union(this.primary_nodes, this.secondary_nodes);

	  		this.edges = _.union.apply(this, this.tasks_nodes.map(function(task_node) {
	  			var edges_out = task_node.referent.out_data_types.map(function(dt) {
	  				return new Edge(task_node, _(this.data_types_nodes).find(function(dt_node) { return dt_node.referent == dt;}), this);
	  			}, this);
	  			var edges_in = task_node.referent.in_data_types.map(function(dt) {
	  				return new Edge(_(this.data_types_nodes).find(function(dt_node) { return dt_node.referent == dt;}), task_node, this);
	  			}, this);
	  			return _.union(edges_in, edges_out);
	  		}, this));

	  	}
  	}
