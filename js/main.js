//(function() {

  _.templateSettings.variable = "t";

  var data = {
    init: function(cfg) {
      var create_dt = function(dt_cfg){ return new DataType(dt_cfg);};

      this.data_types = _.flatten(_(cfg.tasks.map(function(task_cfg) {
        return task_cfg.out_data_types.map(create_dt);
      })).union(cfg.initial_data_types.map(create_dt)), true);

      this.tasks = cfg.tasks.map(function(task_cfg) {
        return new Task(task_cfg);
      });

      this.data_formats = cfg.data_formats.map(function(df_cfg) {
        return new DataFormat(df_cfg);
      });

      // _(app.data_types).each(function(dt) {
      //  dt.data_formats = _(app.data_formats).filter(function(df) {return df.data_type === dt; });
      // });

      this.tools = cfg.tools.map(function(tool_cfg) {
        return new Tool(tool_cfg);
      });

      this.workflows = cfg.workflows.map(function(wf_cfg) {
        return new Workflow(wf_cfg);
      });
      _(this.tasks).each(function(task) {
        task.workflows = _(this.workflows).filter(function(wf) {return _(wf.tasks).contains(task); }, this);
      });

      this.pipelines = cfg.pipelines.map(function(pl_cfg) {
        return new Pipeline(pl_cfg);
      });
      _(this.workflows).each(function(wf) {
        wf.pipelines = _(this.pipelines).filter(function(pl) {return pl.workflow === wf; }, this);
      });
    }
  }

  var widgets = {
    logo: {
      init: function() {
        this.$link = $('#logo a');
        this.$link.on("click", function(e) {
          e.preventDefault();
          app.showContent('global');
        });
      }
    },
    main_nav: {
      template: _.template($('#main_nav_template').html()),
      init: function() {
        this.$el = $('#main_nav'); 
        this.$el.html(this.template({workflows: data.workflows, pipelines: data.pipelines, tools: data.tools}));
        this.$links = this.$el.find("li ul a");
        this.$links.on("click", function(e) {
          e.preventDefault();
          var item_id = $(e.target).parent().data("id");
          var item_type = $(e.target).parents("li[data-type]").data("type");
          app.showContent(_(data[item_type]).find(by_id(item_id)));
        });
      },
      transition: function() {
        var complete = $.Deferred();

        window.setTimeout(function() {
          complete.resolve();
        }, 2000);

        return complete.promise();
      }
    },
    info: {
      templates: {
        'global': _.template($('#info_global_template').html()),
        'workflow': _.template($('#info_workflow_template').html()),
        'pipeline': _.template($('#info_pipeline_template').html()),
        'tool': _.template($('#info_tool_template').html())
      },
      init: function() {
        this.$el = $('#info'); 
      },
      transition: function() {
        this.$el.html(this.templates[app.viewType(app.content)](app.content));

      }
    }
  }

  // app object exists mainly to distinguish app-level data and methods
  var app = {};

  app.showContent = function(item) {
    if(this.is_transitioning) {
      this.queued_content = item;
    } else {
      console.log(item);
      this.queued_content = null;
      this.old_content = this.content;
      this.content = item;
      this.is_transitioning = true;
      this.transition((function() {
        this.is_transitioning = false;
        if(this.queued_content) {
          this.showContent(this.queued_content);
        }
      }).bind(this));
    }
  }

  app.viewType = function(item) {
    return typeof item == "string" ? item : item.constructor.name.toLowerCase();
  }

  app.transition = function(onTransitionEnd) {
    
    $.when( widgets.main_nav.transition(),
            widgets.info.transition() )
    .then(function() {
      onTransitionEnd();
    });
    
  }

  app.enableInteractivity = function() {
    widgets.main_nav.enableInteractivity();
  }

  // initialize data
  data.init(app_json);

  // start in global view
  app.old_content = null;
  app.content = null;
  app.queued_content = null;
  app.is_transitioning = false;

  // initialize widgets
  widgets.logo.init();
  widgets.main_nav.init();
  widgets.info.init();

  app.showContent('global');

//})();

    // app.breadcrumbs = {
    //   init: function(element, options) {
    //     this.element = element;
    //     //bind event handlers
    //     $(this.element).on("click", "a", function(event){
    //       var $t = $(event.target);
    //       if($t.hasClass("global") ) {
    //         app.activateItem(app);
    //       } else if($t.hasClass("workflow") ) {
    //         app.activateItem(app.current_workflow);
    //       } else if($t.hasClass("pipeline") ) {
    //         app.activateItem(app.current_pipeline);
    //       }
    //     });
    //   },
    //   update: function() {
    //     $(this.element).html(app.templates.breadcrumbs(app));
    //   }
    // }

    // app.activateItem = function(item) {
    //   if(item == app) {
    //     this.current_workflow = this.current_pipeline = this.current_tool = null;
    //   } else if (item instanceof Workflow) {
    //     this.current_pipeline = this.current_tool = null;
    //     this.current_workflow = item;
    //   } else if (item instanceof Pipeline) {
    //     this.current_tool = null;
    //     this.current_pipeline = item;
    //     //this.current_workflow = pipeline.workflow;
    //   } else if (item instanceof Tool) {
    //     this.current_tool = item;
    //   }
    //   this.graph.update();
    //   this.breadcrumbs.update();
    // }

    // app.activeItemType = function() {
    //   if(this.current_tool) {return 'tool';}
    //   else if(this.current_pipeline) {return 'pipeline';}
    //   else if(this.current_workflow) {return 'workflow';}
    //   else {return 'global';}
    // }

    // app.activeItem = function() {
    //   switch(this.activeItemType() ) {
    //     case 'tool':
    //       return this.current_tool;
    //     case 'pipeline':
    //       return this.current_pipeline;
    //     case 'workflow':
    //       return this.current_workflow;
    //     case 'global':
    //       return this;
    //   }
    // }

    // app.templates.nav.global = _.template($('#nav-template-global').html(), null, {variable: 'workflows'});
    // app.templates.nav.workflow = _.template($('#nav-template-workflow').html(), null, {variable: 'pipelines'});
    // app.templates.nav.pipeline = _.template($('#nav-template-pipeline').html(), null, {variable: 'tools'});
    // app.templates = {
    //   breadcrumbs: _.template($('#breadcrumbs-template').html(), null, {variable: 'app'})
    // };
 

    // app.graph = new Graph({display_svg: document.getElementById('display_svg'), layout_svg: document.getElementById('layout_svg')});
    // app.breadcrumbs.init(document.getElementById('breadcrumbs'));
    // app.activateItem(app);
    //app.graph.load_pipeline(app.pipelines[0]);

    //app.graph.load_workflows([app.workflows[3]]);
    
    

