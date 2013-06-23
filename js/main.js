//(function() {

  _.templateSettings.variable = "t";

  var gdata = {
    init: function(cfg) {
      this.generic_pages = cfg.generic_pages.map(function(gp_cfg) {
        return new GenericPage(gp_cfg);
      });

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
        this.$el.html(this.template(_(gdata).pick('workflows', 'pipelines', 'root_tools', 'teams', 'generic_pages')));
      },
      transition: function() {
        // var complete = $.Deferred();

        // window.setTimeout(function() {
        //   complete.resolve();
        // }, 2000);

        // return complete.promise();
      }
    },
    workflows_carousel_widget: {
      template: _.template($('#workflows_carousel_template').html()),
      init: function() {
        this.$el = $('#workflows_carousel');
        this.$el.html(this.template({workflows: gdata.workflows}));
        this.$el.carousel({interval: 3500}).on('slid', (function (e) {
          widgets.graph_widget.active_drawing_for_display.highlightWorkflow(gdata.workflows[this._currIndex()]);
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
        widgets.graph_widget.active_drawing_for_display.highlightWorkflow(null);
        this.$el.slideUp(1000, on_complete);
      },
      _show: function(on_complete) {
        this.visible = true;
        this.$el.carousel(0);
        this.$el.slideDown(1000, (function() {
          this.$el.mouseover();
          this.$el.carousel('cycle');
          on_complete();
        }).bind(this));
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
          svg: d3.select($('#layout_svg')[0]),
          for_display: false,
          container_width: this.$el.width(),
          max_height: parseInt(this.$el.css('maxHeight'), 10)
        });
        this.active_drawing_for_display = new GraphDrawing({
          svg: d3.select($('.display_svg')[0]).classed("active", true),
          for_display: true,
          container_width: this.$el.width(),
          max_height: parseInt(this.$el.css('maxHeight'), 10)
        });
        this.inactive_drawing_for_display = new GraphDrawing({
          svg: d3.select($('.display_svg')[1]).classed("active", false),
          for_display: true,
          container_width: this.$el.width(),
          max_height: parseInt(this.$el.css('maxHeight'), 10)
        });
        

        // create new graph object
      },
      transition: function() {
        //console.log("transition");
        var trans_completion = $.Deferred();
        var updater = this._update.bind(this, trans_completion.resolve);

        updater();

        return trans_completion.promise();

      },
      _update: function(on_complete) {
        //console.log("updated");
        this.old_graph = this.graph;
        //console.log(app.content)
        this.graph = new Graph(app.content);

        if(!this.old_graph || this.graph.overlaps_old_graph) { // old graph and new graph have visual overlap (or there is no old graph)
          this.drawing_for_layout.render(this.graph);
          this.active_drawing_for_display.render(this.graph, {
            end_rect: this.drawing_for_layout.getRect(),
            change_container_height: true,
            animate_height: true
          });
        } else {
          var rel = app.content.visualRelationshipTo(app.old_content);
          if(rel.length === 0) { // old graph content and new graph content have no ancestor-descendant relationship
            //console.log("test A");
            this.drawing_for_layout.render(this.graph);
            this._switchActiveDisplayDrawing();
            this.inactive_drawing_for_display.render(new Graph());
            this.active_drawing_for_display.render(this.graph, {
              start_rect: this.drawing_for_layout.getRect(),
              change_container_height: true,
              animate_height: false
            });
          } else if(rel.length === 1) { // content is itself - illegal transition
            //throw "Illegal transition: cannot transition from content item to itself";
            console.log("test X");
          } else if(rel[0] === app.content) { // content is visual descendant of old content
            console.log("test B");
            this.drawing_for_layout.render(this.graph);

            var old_start_rect = this.active_drawing_for_display.getRect();
            var old_end_rect = this.active_drawing_for_display.getInnerRect(rel[rel.length-2]);
            var new_end_rect = this.drawing_for_layout.getRect();
            var new_start_rect = this._correspondingOuterRect(old_end_rect, old_start_rect, _.clone(new_end_rect) );
            //var new_start_rect = this.drawing_for_layout.getOuterRect();
            //var new_start_rect = {x: -4264, y: -1806, width: 5596, height: 2061};
            //var new_start_rect = {x: 0, y: 0, width: 5596, height: 2061};

            //console.log(new_start_rect);
            //{x:-1000, y:1000, height:1000, width:1000}
            //this.drawing_for_layout.getOuterRect();
            //this._correspondingOuterRect(old_end_rect, old_start_rect, _(new_end_rect).clone() );

            this._switchActiveDisplayDrawing();

            this.inactive_drawing_for_display.render(new Graph(), {
              end_rect: old_end_rect,
              change_container_height: false,
              animate_height: true
            });
            this.active_drawing_for_display.render(this.graph, {
              start_rect: new_start_rect,
              end_rect: new_end_rect,
              change_container_height: true,
              animate_height: true
            });
          } else if(rel[0] === app.old_content){ // content is visual ancestor of old content
            console.log("test C");
            this.drawing_for_layout.render(this.graph);

            var old_start_rect = this.active_drawing_for_display.getRect();
            var new_end_rect = this.drawing_for_layout.getRect();
            var new_start_rect = this.drawing_for_layout.getInnerRect(rel[rel.length-2]); 
            var old_end_rect = this._correspondingOuterRect(new_end_rect, new_start_rect, _(old_start_rect).clone());
            //var old_end_rect = this.active_drawing_for_display.getOuterRect();
            
            

            this._switchActiveDisplayDrawing();
            this.inactive_drawing_for_display.render(new Graph(), {
              end_rect: old_end_rect,
              change_container_height: false,
              animate_height: true
            });
            //debugger;
            this.active_drawing_for_display.render(this.graph, {
              start_rect: new_start_rect,
              end_rect: new_end_rect,
              change_container_height: true,
              animate_height: false
            });
          }
        }

        if(app.content.type() === "summary") {
          this.active_drawing_for_display.highlightWorkflow(gdata.workflows[0]);
        }
        
        
        
        on_complete();
      },
      _switchActiveDisplayDrawing: function() {

        var currHeight = this.active_drawing_for_display.svg.style("height");

        var temp = this.active_drawing_for_display;
        this.active_drawing_for_display = this.inactive_drawing_for_display;
        this.inactive_drawing_for_display = temp;


        this.active_drawing_for_display.svg.style("height", currHeight);
        this.inactive_drawing_for_display.svg.style("height", currHeight);

        this.active_drawing_for_display.svg.classed("active", true);
        this.inactive_drawing_for_display.svg.classed("active", false);
      },
      _correspondingOuterRect: function(inner_1, outer_1, inner_2) {

        // extend the height or width of inner_2 to match proportions of inner_1 (while keeping the same center point)
        if(inner_1.width/inner_1.height <= inner_2.width/inner_2.height) {
          // extend the height of inner_2 to equalize_proportions
          console.log("case 1");
          var old_height = inner_2.height;
          inner_2.height = inner_1.height/inner_1.width * inner_2.width;
          inner_2.y = inner_2.y - (inner_2.height - old_height)/2;
          console.log("height ratio: "+ inner_2.height/old_height);
        } else if(inner_1.width/inner_1.height > inner_2.width/inner_2.height) {
          console.log("case 2");
          // extend the width of inner_2 to equalize proportions
          var old_width = inner_2.width;
          inner_2.width = inner_1.width/inner_1.height * inner_2.height;
          inner_2.x = inner_2.x - (inner_2.width - old_width)/2;
          console.log("width ratio: "+ inner_2.width/old_width);
        }

        // compute tentative result
        var outer_2 = {
          width: Math.ceil(inner_2.width * outer_1.width/inner_1.width),
          height: Math.ceil(inner_2.height * outer_1.height/inner_1.height),
          x: Math.floor(inner_2.x - (inner_2.width * (inner_1.x - outer_1.x) / inner_1.width)), // (inner_1.x - outer_1.x) / inner_1.width) == (inner_2.x - outer_2.x) / inner_2.width)
          y: Math.floor(inner_2.y - (inner_2.height * (inner_1.y - outer_1.y) / inner_1.height))
        }

        console.log(outer_2);

        // // because the viewBox is inexplicably inaccurate when the rectangle is too large, we clamp the tentative result before returning
        // var clamp_factor = Math.min(Math.min(outer_2.width, 1500)/outer_2.width, Math.min(outer_2.height, 1000)/outer_2.height);
        // var inner_1_center = {x: inner_1.x+inner_1.width/2, y:inner_1.y+inner_1.height/2};
        // var inner_1_center_relative_location = {x: (inner_1_center.x-outer_1.x)/outer_1.width, y: (inner_1_center.y-outer_1.y)/outer_1.height};

        // outer_2 = {
        //   width: outer_2.width * clamp_factor,
        //   height: outer_2.height * clamp_factor,
        //   x: inner_1_center.x - outer_2.width * clamp_factor * inner_1_center_relative_location.x,
        //   y: inner_1_center.y - outer_2.height * clamp_factor * inner_1_center_relative_location.y 
        // }

        // console.log(inner_1_center_relative_location);
        // console.log(outer_2);

        return outer_2;



      }
      
    },
    info_widget: {
      templates: {
        'about': _.template($('#info_about_template').html()),
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
        var type = content.type();
        this.$el.html(this.templates[type === "generic_page" ? content.id : type](content));
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
    this.get('/:generic_page_id', function (req) {
      app._showContent(_(gdata.generic_pages).find(by_id(req.params['generic_page_id'])));
    });
  });

  app.router.start();

