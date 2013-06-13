//(function() {

  _.templateSettings.variable = "t";

  var gdata = {
    init: function(cfg) {
      this.summary = new Summary(cfg.summary);

      this.teams = cfg.teams.map(function(team_cfg) {
        return new Team(team_cfg);
      });

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

      this.root_tools = cfg.tools.map(function(tool_cfg){ return new Tool(tool_cfg);});
      this.subtools = _.flatten(this.root_tools.map(function(tool) {return tool.subtools;}));
      this.tools = _.union(this.root_tools, this.subtools);
      
      this.workflows = cfg.workflows.map(function(wf_cfg) {
        return new Workflow(wf_cfg);
      });

      this.pipelines = cfg.pipelines.map(function(pl_cfg) {
        return new Pipeline(pl_cfg);
      });

      _(this.tools).each(function(tool) {
        tool.pipelines = _(this.pipelines).filter(function(pl) {return _(pl.tools).contains(tool); }, this);
      }, this);

      _(this.tasks).each(function(task) {
        task.workflows = _(this.workflows).filter(function(wf) {return _(wf.tasks).contains(task); }, this);
      }, this);

      _(this.teams).each(function(team) {
        team.root_tools = _(this.root_tools).filter(function(tool) {return tool.team === team; }, this);
        team.pipelines = _(this.pipelines).filter(function(pl) {return pl.team === team; }, this);
      }, this);

      _(this.workflows).each(function(wf) {
        wf.pipelines = _(this.pipelines).filter(function(pl) {return pl.workflow === wf; }, this);
      }, this);

    }
  }

  var widgets = {
    main_nav_widget: {
      template: _.template($('#main_nav_template').html()),
      init: function() {
        this.$el = $('#main_nav'); 
        this.$el.html(this.template(_(gdata).pick('workflows', 'pipelines', 'root_tools', 'teams')));
      },
      transition: function() {
        var complete = $.Deferred();

        window.setTimeout(function() {
          complete.resolve();
        }, 2000);

        return complete.promise();
      }
    },
    workflows_carousel_widget: {
      template: _.template($('#workflows_carousel_template').html()),
      init: function() {
        this.$el = $('#workflows_carousel');
        this.$el.html(this.template({workflows: gdata.workflows}));
        this.$el.carousel({interval: 3500}).on('slid', (function (e) {
          widgets.graph_widget.drawing_for_display.highlightWorkflow(gdata.workflows[this._currIndex()]);
        }).bind(this));
        this.$el.carousel('pause');
        this.$el.children('.carousel-control.left').on('click', (function(e) {
          this.$el.carousel('prev');
        }).bind(this));
        this.$el.children('.carousel-control.right').on('click', (function(e) {
          this.$el.carousel('next');
        }).bind(this));

        this.visible = false;
      },
      transition: function() {
        
        var trans_completion = $.Deferred();

        if(!this.visible && app.content.type() === "summary") {
          this._show(trans_completion.resolve);
        } else if(this.visible && app.content.type() !== "summary") {
          this._hide(trans_completion.resolve);
        }

      },
      _currIndex: function() {
        return this.$el.find(".carousel-inner > .active").index(".carousel-inner > div");
      },
      _hide: function(on_complete) {
        this.visible = false;
        this.$el.carousel('pause');
        widgets.graph_widget.drawing_for_display.highlightWorkflow(null);
        this.$el.hide(1000, on_complete);
      },
      _show: function(on_complete) {
        this.visible = true;
        this.$el.carousel(0);
        this.$el.show(1000, (function() {
          this.$el.carousel('cycle');
          on_complete();
        }).bind(this));
      }
    },
    graph_nav_widget: {
      //template: _.template($('#teams_template').html()),
      init: function() {
        this.$el = $('#graph_nav'); 
      },
      transition: function() {


      }
    },
    graph_widget: {
      //template: _.template($('#teams_template').html()),
      init: function() {
        this.$el = $('#graph');
        this.visible = false;
        this.old_graph = null;
        this.graph = null;
        this.drawing_for_layout = new GraphDrawing({
          svg: d3.select(document.getElementById('layout_svg')),
          use_transitions: false
        });
        this.drawing_for_display = new GraphDrawing({
          svg: d3.select(document.getElementById('display_svg')),
          use_transitions: true
        });

        // create new graph object
      },
      transition: function() {

        var trans_completion = $.Deferred();
        var updater = this._update.bind(this, trans_completion.resolve);

        if(!this.visible && app.content.graphable) {
          this._show(updater);
        } else if(this.visible && !app.content.graphable) {
          this._hide(updater);
        } else { // this covers 2 distinct cases: both true and both false
          updater();
        }

        return trans_completion.promise();

      },
      _update: function(on_complete) {
        this.old_graph = this.graph;
        this.graph = new Graph();
        this.drawing_for_layout.render(this.graph);
        this.drawing_for_display.render(this.graph, this.drawing_for_layout.getRect(), this.$el.width() );
        if(app.content.type() === "summary") {
          this.drawing_for_display.highlightWorkflow(gdata.workflows[0]);
        }
        
        on_complete();
      },
      _hide: function(on_complete) {
        this.visible = false;
        this.$el.hide(1000, on_complete);
      },
      _show: function(on_complete) {
        this.visible = true;
        this.$el.show(1000, on_complete);
      }
      
    },
    info_widget: {
      templates: {
        'summary': _.template($('#info_summary_template').html()),
        'workflow': _.template($('#info_workflow_template').html()),
        'pipeline': _.template($('#info_pipeline_template').html()),
        'team': _.template($('#info_team_template').html()),
        'tool': _.template($('#info_tool_template').html())
      },
      init: function() {
        this.$el = $('#info_inner'); 
      },
      transition: function() {
        var content = (app.content.type() == 'tool_usage' ? app.content.tool : app.content);
        this.$el.html(this.templates[content.type()](content));
      }
    },
    teams_widget: {
      template: _.template($('#teams_template').html()),
      init: function() {
        this.$el = $('#teams');
        this.$el.html(this.template({teams: gdata.teams}));
      },
      transition: function() {


      }
    }
  }

  var app = {};

  // PUBLIC METHODS

  // used to programatically change state (links/forms are handled automatically by the Davis router)
  app.requestResource = function(url) {
    Davis.location.assign(new Davis.Request(url));
  }

  // PRIVATE METHODS

  app._showContent = function(item) {
    if(item !== this.content) { // halt if trying to navigate to current content
      if(this.is_transitioning) {
        this.queued_content = item;
      } else {
        this.old_content = this.content;
        this.content = item;
        this.is_transitioning = true;
        this._transition((function() {
          this.is_transitioning = false;
          if(this.queued_content) {
            var next = this.queued_content;
            this.queued_content = null;
            this._showContent(next);
          }
        }).bind(this));
      }
    }
  }

  app._transition = function(onTransitionEnd) {
    
    var widget_transitions = Object.keys(widgets).map(function(w_name) {
      widgets[w_name].transition();
    });

    $.when.apply(null, widget_transitions)
    .then(function() {
      onTransitionEnd();
    });
    
  }

  // APP INITIALIZATION

  // initialize data
  gdata.init(app_json);

  //set up color functions
  app.colors = {
    workflow: d3.scale.ordinal()
      .domain(gdata.workflows.map(function(wf){return wf.id;}))
      .range(colorbrewer.Dark2[gdata.workflows.length]),
    pipeline: d3.scale.ordinal()
      .domain(gdata.pipelines.map(function(pl){return pl.id;}))
      .range(colorbrewer.Set2[gdata.pipelines.length])
  };

  // start in summary view
  app.old_content = null;
  app.content = null;
  app.queued_content = null;
  app.is_transitioning = false;

  // initialize widgets
  Object.keys(widgets).forEach(function(w_name) {
    widgets[w_name].init();
  });

  //initialize router
  app.router = Davis(function () {
    this.configure(function(){
      this.generateRequestOnPageLoad = true;
    });
    this.get('/pipelines/:pipeline_id/tool_usages/:tu_id', function (req) {
      var tu = _(_(gdata.pipelines).find(by_id(req.params['pipeline_id'])).tool_usages).find(by_id(req.params['tu_id']));
      app._showContent(tu);
    });
    this.get('/:type/:id', function (req) {
      var item = _(gdata[req.params['type']]).find(by_id(req.params['id']));
      app._showContent(item);
    });
    this.get('/', function (req) {
      app._showContent(gdata.summary);
    });
  });

  app.router.start();

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
    
    

