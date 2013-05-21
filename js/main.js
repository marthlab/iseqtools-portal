
    app.initialize_domain_objects = function(cfg) {

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

	    // _(app.data_types).each(function(dt) {
  		// 	dt.data_formats = _(app.data_formats).filter(function(df) {return df.data_type === dt; });
  	  // });

	    app.tools = cfg.tools.map(function(tool_cfg) {
	    	return new Tool(tool_cfg);
	    });

	    app.workflows = cfg.workflows.map(function(wf_cfg) {
	    	return new Workflow(wf_cfg);
	    });
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
		
		app.initialize_domain_objects(app_json);

 		app.graph = new Graph({display_svg: document.getElementById('display_svg'), layout_svg: document.getElementById('layout_svg')});
 		app.breadcrumbs.init(document.getElementById('breadcrumbs'));
 		app.activateItem(app);
 		//app.graph.load_pipeline(app.pipelines[0]);
 		
 		//app.graph.load_workflows([app.workflows[3]]);
 		

