<!DOCTYPE html>
<!--[if lt IE 7]>      <html class="no-js lt-ie9 lt-ie8 lt-ie7"> <![endif]-->
<!--[if IE 7]>         <html class="no-js lt-ie9 lt-ie8"> <![endif]-->
<!--[if IE 8]>         <html class="no-js lt-ie9"> <![endif]-->
<!--[if gt IE 8]><!--> <html class="no-js"> <!--<![endif]-->
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
        <title></title>
        <meta name="description" content="">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">

        <!-- <link rel="stylesheet" href="css/normalize.min.css">
        <link rel="stylesheet" href="css/main.css"> -->
        <link href="css/bootstrap.css" rel="stylesheet">
        <link href="css/bootstrap-responsive.css" rel="stylesheet">
        <link href="css/main.css" rel="stylesheet">

        <script src="js/vendor/modernizr-2.6.2.min.js"></script>
    </head>
    <body>
      <div class="navbar navbar-inverse navbar-fixed-top">
        <div class="navbar-inner">
          <div class="container">
            <button type="button" class="btn btn-navbar" data-toggle="collapse" data-target=".nav-collapse">
              <span class="icon-bar"></span>
              <span class="icon-bar"></span>
              <span class="icon-bar"></span>
            </button>
            <a class="brand" id="logo" href="/">iSeqTools</a>
            <div class="nav-collapse collapse">
              <ul id="main_nav" class="nav">
              </ul>
            </div><!--/.nav-collapse -->
          </div>
        </div>
      </div>

      <div class="container">

        <div id="workflows">

        </div>

        <!-- Main hero unit for a primary marketing message or call to action -->
        <div class="hero-unit" id="info">
        </div>

        <div id="teams">

        </div>

      </div> <!-- /container -->
        <!--[if lt IE 7]>
            <p class="chromeframe">You are using an <strong>outdated</strong> browser. Please <a href="http://browsehappy.com/">upgrade your browser</a> or <a href="http://www.google.com/chromeframe/?redirect=true">activate Google Chrome Frame</a> to improve your experience.</p>
        <![endif]-->


        <div id="graph_container">
          <div id="graph_nav"></div>
          <div id="graph"></div>
        </div>

        

        <!-- <nav id="breadcrumbs"></nav>
        <div id="main">
          <svg preserveAspectRatio="xMidYMid meet" id="display_svg"></svg>
        </div>
        <svg preserveAspectRatio="xMidYMid meet" id="layout_svg"></svg> -->

        <script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
        <script>window.jQuery || document.write('<script src="js/vendor/jquery-1.9.1.min.js"><\/script>')</script>
        <script src="js/vendor/davis.min.js"></script>
        <script src="js/vendor/bootstrap.js"></script>
        <script src="js/vendor/underscore-min.js"></script>
        <!-- <script src="js/vendor/jquery.svg.min.js"></script> 
        <script src="js/vendor/jquery.svgdom.min.js"></script> -->
        <script src="js/vendor/d3.js"></script>
        <script src="js/vendor/dagre.js"></script>

        <script type="text/html" id='main_nav_template'>
          <li data-type="workflows" class="dropdown">
            <a class="dropdown-toggle" data-toggle="dropdown">Workflows <b class="caret"></b></a>
            <ul class="dropdown-menu">
            <% _(t.workflows).each(function(wf){ %>
              <li data-id="<%= wf.id %>"><a href="/workflows/<%= wf.id %>"><%= wf.name %></a></li>
            <% }); %>
            </ul>
          </li>
          <li data-type="pipelines" class="dropdown">
            <a class="dropdown-toggle" data-toggle="dropdown">Pipelines <b class="caret"></b></a>
            <ul class="dropdown-menu">
            <% _(t.pipelines).each(function(pl){ %>
              <li data-id="<%= pl.id %>"><a href="/pipelines/<%= pl.id %>"><%= pl.name %></a></li>
            <% }); %>
            </ul>
          </li>
          <li data-type="tools" class="dropdown">
            <a class="dropdown-toggle" data-toggle="dropdown">Tools <b class="caret"></b></a>
            <ul class="dropdown-menu">
            <% _(t.tools).each(function(tool){ %>
              <li data-id="<%= tool.id %>"><a href="/tools/<%= tool.id %>"><%= tool.name %></a></li>
            <% }); %>
            </ul>
          </li>
          <li data-type="teams" class="dropdown">
            <a class="dropdown-toggle" data-toggle="dropdown">Teams <b class="caret"></b></a>
            <ul class="dropdown-menu">
            <% _(t.teams).each(function(team){ %>
              <li data-id="<%= team.id %>"><a href="/teams/<%= team.id %>"><%= team.name %></a></li>
            <% }); %>
            </ul>
          </li>
        </script>

        <script type="text/html" id='workflows_template'>
          <% _(t.workflows).each(function(wf, i){ %>
            <%= i % 4 == 0 ? '<div class="row">' : '' %>
            <div class="span3 workflow" data-id="<%= wf.id %>"><a href="/workflows/<%= wf.id %>"><%= wf.name %></a></div>
            <%= i % 4 == 3 ? '</div>' : '' %>
          <% }); %>
        </script>

        <script type="text/html" id='breadcrumbs_template'>
          <div>Breadcrumbs</div>
        </script>

        <script type="text/html" id='graph_template'>
          <div>Graph</div>
        </script>

        <script type="text/html" id='info_global_template'>
          <h1>Welcome!</h1>
        </script>

        <script type="text/html" id='info_workflow_template'>
          <h1>Workflow: <%= t.name %></h1>
          <h2><%= t.question %></h1>
          <p>This workflow is implemented by the following pipelines:</p>
          <ul>
          <% _(t.pipelines).each(function(pl){ %>
            <li data-id="<%= pl.id %>"><a href="/pipelines/<%= pl.id %>"><%= pl.name %></a></li>
          <% }); %>
          </ul>
          
        </script>

        <script type="text/html" id='info_pipeline_template'>
          <h1>Pipeline: <%= t.name %></h1>
          <% if(t.team) { %><p>Developed by: <a href="/teams/<%= t.team.id %>"><%= t.team.name %></a></p><% } %>
          <p>This pipeline implements the <a href="/workflows/<%= t.workflow.id %>"><%= t.workflow.name %></a> workflow.</p>
          <p>This pipeline uses the following tools:</p>
          <ul>
          <% _(t.tools).each(function(tool){ %>
            <li data-id="<%= tool.id %>"><a href="/tools/<%= tool.id %>"><%= tool.name %></a></li>
          <% }); %>
          </ul>
          
        </script>

        <script type="text/html" id='info_team_template'>
          <h1>Team: <%= t.name %></h1>
          <p>Tools developed:</p>
          <ul>
          <% _(t.tools).each(function(tool){ %>
            <li data-id="<%= tool.id %>"><a href="/tools/<%= tool.id %>"><%= tool.name %></a></li>
          <% }); %>
          </ul>
          
        </script>

        <script type="text/html" id='info_tool_template'>
          <h1>Tool: <%= t.name %></h1>
          <% if(t.team) { %><p>Developed by: <a href="/teams/<%= t.team.id %>"><%= t.team.name %></a></p><% } %>
          <p>This tool is part of the following pipelines:</p>
          <ul>
          <% _(t.pipelines).each(function(pl){ %>
            <li data-id="<%= pl.id %>"><a href="/pipelines/<%= pl.id %>"><%= pl.name %></a></li>
          <% }); %>
          </ul>
          
        </script>

        <script type="text/html" id='teams_template'>
          <% _(t.teams).each(function(team, i){ %>
            <%= i % 4 == 0 ? '<div class="row">' : '' %>
            <div class="span3 team" data-id="<%= team.id %>"><a href="/teams/<%= team.id %>"><%= team.name %></a></div>
            <%= i % 4 == 3 ? '</div>' : '' %>
          <% }); %>
        </script>

        <script type="text/html" id='breadcrumbs-template'>
            <% var type = app.activeItemType(); %>
            
            <% if(type === "global") { %>
            <span class="global current">HOME</span>
            <% } else { %>
            <a href="#" class="global">HOME</a>
            <% } %>

            <% if(type === "workflow") { %>
            &nbsp;&gt;&gt;&nbsp;<span class="workflow current"><%= app.current_workflow.name %></span>
            <% } else if(type === "pipeline" || type === "tool") { %>
            &nbsp;&gt;&gt;&nbsp;<a href="#" class="workflow"><%= app.current_workflow.name %></a>
            <% } %>

            <% if(type === "pipeline") { %>
            &nbsp;&gt;&gt;&nbsp;<span class="pipeline current"><%= app.current_pipeline.name %></span>
            <% } else if(type === "tool") { %>
            &nbsp;&gt;&gt;&nbsp;<a href="#" class="pipeline"><%= app.current_pipeline.name %></a>
            <% } %>

            <% if(type === "tool") { %>
            &nbsp;&gt;&gt;&nbsp;<span class="tool current"><%= app.current_tool.name %></span>
            <% } %>
             
        </script>

        <script>
        var app_json = <?php echo file_get_contents('./js/app.json'); ?>;
        var app = {};
        </script>

        <script src="js/utils.js"></script>
        <script src="js/config.js"></script>
        <script src="js/domain_objects.js"></script>
        <script src="js/graph/graph.js"></script>
        <script src="js/graph/node.js"></script>
        <script src="js/graph/edge.js"></script>
        <script src="js/graph/graph_drawing.js"></script>
        <script src="js/main.js"></script>

        <script>
            var _gaq=[['_setAccount','UA-XXXXX-X'],['_trackPageview']];
            (function(d,t){var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
            g.src=('https:'==location.protocol?'//ssl':'//www')+'.google-analytics.com/ga.js';
            s.parentNode.insertBefore(g,s)}(document,'script'));
        </script>
    </body>
</html>
