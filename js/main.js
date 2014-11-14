window.mainRunner = function() {

  $.reject({  
    reject : {  
        msie5: true, msie6: true, msie7: true, msie8: true
    },
    closeESC: false,
    close: false,
    imagePath: './img/browsers/',
    paragraph1: 'Your browser is out of date, and is not compatible with '+  
                'our website. A list of the most popular web browsers can be '+  
                'found below.',  
    paragraph2: 'Just click on the icons to get to the download page.',  
    browserInfo: {
        firefox: {  
            text: 'Firefox', 
            url: 'http://www.mozilla.com/firefox/'
        },  
        safari: {  
            text: 'Safari',  
            url: 'http://www.apple.com/safari/download/'  
        },  
        opera: {  
            text: 'Opera',  
            url: 'http://www.opera.com/download/',
            allow: { all: false} 
        },  
        chrome: {  
            text: 'Chrome ',  
            url: 'http://www.google.com/chrome/'  
        },  
        msie: {  
            text: 'Internet Explorer',  
            url: 'http://www.microsoft.com/windows/Internet-explorer/',
            allow: { all: false}  
        },  
        gcf: {  
            text: 'Google Chrome Frame',  
            url: 'http://code.google.com/chrome/chromeframe/',
            allow: { all: false, msie: false }  
        }  
    }
  });

  isIE = (document.body.attachEvent && window.ActiveXObject);

  _.templateSettings.variable = "t";

  gdata = {
    init: function(cfg) {
      this.generic_pages = cfg.generic_pages.map(function(gp_cfg) {
        return new GenericPage(gp_cfg);
      });

      this.pegasus = new Pegasus(cfg.pegasus);

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

      this.root_tools = _.sortBy(cfg.tools.map(function(tool_cfg){ return new Tool(tool_cfg);}), function(t){return t.name.toLowerCase();});
      this.subtools = _.sortBy(_.flatten(this.root_tools.map(function(tool) {return tool.subtools;})), function(t){return t.name.toLowerCase();});
      this.tools = _.sortBy(_.union(this.root_tools, this.subtools), function(t){return t.name.toLowerCase();});
    
      this.workflows = cfg.workflows.map(function(wf_cfg) {
        return new Workflow(wf_cfg);
      });

      this.pipelines = _.sortBy(cfg.pipelines.map(function(pl_cfg) {
        return new Pipeline(pl_cfg);
      }), function(pl) {return pl.name.toUpperCase(); });

      _(this.data_types).each(function(dt) {
        dt.pipelines = _(this.pipelines).filter(function(pl) {return _(pl.data_types).contains(dt); }, this);
        dt.pipelines_dedicated = _(this.pipelines).filter(function(pl) {return _.isEqual(pl.data_types, [dt]); }, this);
      }, this);

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

  widgets = {
    main_nav_widget: {
      template: _.template($('#main_nav_template').html()),
      init: function() {
        this.$el = $('#main_nav'); 
        this.$el.html(this.template({
          workflows: _.filter(gdata.workflows, function(wf) {return wf.pipelines.length > 0;}),
          pipelines: gdata.pipelines,
          root_tools: gdata.root_tools,
          root_tool_groups: {
            "A - G": _.filter(gdata.root_tools, function(rt){var chr = rt.name[0].toLowerCase(); return chr >= "a" && chr <= "g"; }),
            "H - R": _.filter(gdata.root_tools, function(rt){var chr = rt.name[0].toLowerCase(); return chr >= "h" && chr <= "r"; }),
            "S - Z": _.filter(gdata.root_tools, function(rt){var chr = rt.name[0].toLowerCase(); return chr >= "s" && chr <= "z"; }),
          },
          teams: gdata.teams,
          generic_pages: gdata.generic_pages,
          pegasus: gdata.pegasus,
          data_types: gdata.data_types
        }));
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
        var featured_workflows = _(gdata.workflows).filter(function(wf){return wf.featured;});
        var first_run = true;
        this.$el = $('#workflows_carousel');
        this.$el.html(this.template({workflows: featured_workflows, pegasus: gdata.pegasus}));
        this.$el.carousel({interval: 3500}).on('slid', (function() {
          app.buffer.add(
            (function (on_complete) {
              var index = this._currIndex();

              if(index === 0) {
                first_run = false;
                widgets.graph_widget.active_drawing_for_display.highlightAllWorkflows();
                on_complete();
              } else if(index === this._getLength()-1) {                
                widgets.graph_widget.active_drawing_for_display.pegasusAnimation(on_complete);
              } else if(app.content === gdata.summary){
                widgets.graph_widget.active_drawing_for_display.highlightWorkflow(featured_workflows[index-1]);
                on_complete();
              }
              if (!first_run) this.$el.carousel('pause'); 
            }).bind(this)
          );
        }).bind(this) );
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

        if(app.content.type() === "summary") {
          this._show(trans_completion.resolve);
        } else if(app.content.type() !== "summary") {
          this._hide(trans_completion.resolve);
        }

      },
      _currIndex: function() {
        return this.$el.find(".carousel-inner > .active").index(".carousel-inner > div");
      },
      _getLength: function() {
        return this.$el.find(".carousel-inner > div").length;
      },
      _hide: function(on_complete) {
        this.$el.carousel('pause');
        this.$el.slideUp(1000, on_complete);
      },
      _show: function(on_complete) {
        this.$el.carousel(0);
        this.$el.slideDown(1000, (function() {
          this.$el.mouseover();
          this.$el.carousel('cycle');
          on_complete();
        }).bind(this));
      }
    },
    graph_widget: {
      breadcrumbs_template: _.template($('#breadcrumbs_template').html()),
      init: function() {
        this.$el = $('#graph');
        this.$breadcrumbs_el = $('#breadcrumbs');
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
        var trans_completion = $.Deferred();
        var updater = this._update.bind(this, trans_completion.resolve);

        updater();

        return trans_completion.promise();

      },
      _update: function(on_complete) {
        this.old_graph = this.graph;
        this.graph = new Graph(app.content);

        
        this.$breadcrumbs_el.fadeOut(500, _.bind(function() {
          this.$breadcrumbs_el.html(this.breadcrumbs_template({crumbs: app.content.getBreadcrumbs()}));
          this.$breadcrumbs_el.fadeIn(500);
        }, this));
        

        var rel = app.transition_relationship;

        if(!this.old_graph || this.graph.overlaps_old_graph) { // old graph and new graph have visual overlap (or there is no old graph)
          this.drawing_for_layout.render(this.graph);
          this.active_drawing_for_display.render(this.graph, this.old_graph, {
            end_rect: this.drawing_for_layout.getRect(),
            change_container_height: true,
            animate_height: true
          });
        } else {
          if(rel.length === 0 || this.graph.nodes.length === 0) { // old graph content and new graph content have no ancestor-descendant relationship, OR new graph is empty
            this.drawing_for_layout.render(this.graph, this.old_graph);
            this._switchActiveDisplayDrawing();
            this.inactive_drawing_for_display.render(new Graph(), this.old_graph);
            this.active_drawing_for_display.render(this.graph, this.old_graph, {
              start_rect: this.drawing_for_layout.getRect(),
              change_container_height: true,
              animate_height: false
            });
          } else if(rel.length === 1) { // content is itself - illegal transition
            //throw "Illegal transition: cannot transition from content item to itself";
          } else if(rel[0] === app.content) { // content is visual descendant of old content
          
            this.drawing_for_layout.render(this.graph, this.old_graph);

            var old_start_rect = this.active_drawing_for_display.getRect();
            var old_end_rect = this.active_drawing_for_display.getInnerRect(rel[rel.length-2]);
            var new_end_rect = this.drawing_for_layout.getRect();
            var new_start_rect = this._correspondingOuterRect(old_end_rect, old_start_rect, _.clone(new_end_rect) );

            this._switchActiveDisplayDrawing();

            this.inactive_drawing_for_display.render(new Graph(), this.old_graph, {
              end_rect: old_end_rect,
              change_container_height: false,
              animate_height: true
            });
            this.active_drawing_for_display.render(this.graph, this.old_graph, {
              start_rect: new_start_rect,
              end_rect: new_end_rect,
              change_container_height: true,
              animate_height: true
            });
          } else if(rel[0] === app.old_content){ // content is visual ancestor of old content
            this.drawing_for_layout.render(this.graph, this.old_graph);

            var old_start_rect = this.active_drawing_for_display.getRect();
            var new_end_rect = this.drawing_for_layout.getRect();
            var new_start_rect = this.drawing_for_layout.getInnerRect(rel[rel.length-2]); 
            var old_end_rect = this._correspondingOuterRect(new_start_rect, new_end_rect, _.clone(old_start_rect));   

            this._switchActiveDisplayDrawing();
            this.inactive_drawing_for_display.render(new Graph(), this.old_graph, {
              end_rect: old_end_rect,
              change_container_height: false,
              animate_height: true
            });
            this.active_drawing_for_display.render(this.graph, this.old_graph, {
              start_rect: new_start_rect,
              end_rect: new_end_rect,
              change_container_height: true,
              animate_height: false
            });
          }
        }

        if(_(["summary", "workflow", "data_type"]).contains(app.content.type())) {
          this.active_drawing_for_display.highlightAllWorkflows();
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
          var old_height = inner_2.height;
          inner_2.height = inner_1.height/inner_1.width * inner_2.width;
          inner_2.y = inner_2.y - (inner_2.height - old_height)/2;
        } else if(inner_1.width/inner_1.height > inner_2.width/inner_2.height) {
          // extend the width of inner_2 to equalize proportions
          var old_width = inner_2.width;
          inner_2.width = inner_1.width/inner_1.height * inner_2.height;
          inner_2.x = inner_2.x - (inner_2.width - old_width)/2;
        }

        // compute tentative result
        return {
          width: Math.ceil(inner_2.width * outer_1.width/inner_1.width),
          height: Math.ceil(inner_2.height * outer_1.height/inner_1.height),
          x: Math.floor(inner_2.x - (inner_2.width * (inner_1.x - outer_1.x) / inner_1.width)), // (inner_1.x - outer_1.x) / inner_1.width) == (inner_2.x - outer_2.x) / inner_2.width)
          y: Math.floor(inner_2.y - (inner_2.height * (inner_1.y - outer_1.y) / inner_1.height))
        }

      }
    },
    info_widget: {
      templates: {
        'about': _.template($('#info_about_template').html()),
        'media': _.template($('#info_media_template').html()),
        'pegasus': _.template($('#info_pegasus_template').html()),
        'summary': _.template($('#info_summary_template').html()),
        'workflow': _.template($('#info_workflow_template').html()),
        'pipeline': _.template($('#info_pipeline_template').html()),
        'tool_usage': _.template($('#info_tool_usage_template').html()),
        'team': _.template($('#info_team_template').html()),
        'tool': _.template($('#info_tool_template').html()),
        'data_type': _.template($('#info_data_type_template').html())     
      },
      init: function() {
        this.$el = $('#info_inner'); 
      },
      transition: function() {
        var type = app.content.type();
        this.$el.html(this.templates[type === "generic_page" ? app.content.id : type](app.content));
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

  // PUBLIC METHODS

  // used to programatically change state (links/forms are handled automatically by the Davis router)
  app.requestResource = function(url) {
    console.log(url);
    Davis.location.assign(new Davis.Request(url));
  }

  // PRIVATE METHODS

  app.buffer = {
    commands: [],
    add: function(fn) {
      function next() {
        commands.shift();
        if (commands.length) commands[0](next);
      }
      var commands = this.commands;
      commands.push(fn);
      if (commands.length === 1) fn(next);
    }
  };

  app._showContent = function(item, req) {
    ga('send', 'pageview', {
      'page': req
    });
    this.buffer.add((function(on_complete){
      if(item !== this.content) { // halt if trying to navigate to current content
        this.old_content = this.content;
        this.content = item;
        this.transition_relationship = this.content.visualRelationshipTo(app.old_content);
        this.is_transitioning = true;
        this._transition(on_complete);
      } else {
        on_complete();
      }
    }).bind(this));
  };

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
  gdata.init(app_data);

  //set up color functions
  app.colors = {
    workflow: d3.scale.ordinal()
      .domain(gdata.workflows.map(function(wf){return wf.id;}))
      .range(d3.scale.category10().range()),
    pipeline: d3.scale.ordinal()
      .domain(gdata.pipelines.map(function(pl){return pl.id;}))
      .range(d3.scale.category20().range())
  };

  // start in summary view
  app.old_content = null;
  app.content = null;
  app.queued_content = null;
  app.is_transitioning = false;

  // bootstrap tooltips
  $('body').tooltip({
    selector: '[data-toggle=tooltip]'
  });

  // initialize widgets
  Object.keys(widgets).forEach(function(w_name) {
    widgets[w_name].init();
  });



  //initialize router  
  Davis.extend(Davis.hashRouting());
  app.router = Davis(function () {
    this.bind('lookupRoute', function(request) {
      if (request.queryString != undefined) {
        var path = request.queryString.replace(/=|&/g,'/');
        request.path += path;
      }
    });
    this.configure(function(){
      this.generateRequestOnPageLoad = true;
    });
    this.scope(app.base_route, function () {
      this.get('/pipelines/:pipeline_id/tool_usages/:tu_id', function (req) {
        var tu = _(_(gdata.pipelines).find(by_id(decodeURIComponent(req.params['pipeline_id']))).tool_usages).find(by_id(decodeURIComponent(req.params['tu_id'])));
        app._showContent(tu, req);
      });
      this.get('/:type/:id', function (req) {
        var item = _(gdata[req.params['type']]).find(by_id(decodeURIComponent(req.params['id'])));
        app._showContent(item, req);
      });
      this.get('/', function (req) {
        app._showContent(gdata.summary, req);
      });
      this.get('/pegasus', function (req) {
        app._showContent(gdata.pegasus, req);
      });
      this.get('/:generic_page_id', function (req) {
        app._showContent(_(gdata.generic_pages).find(by_id(decodeURIComponent(req.params['generic_page_id']))), req);
      });
    });
  });
  app.router.start();
  

}
