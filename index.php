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
        <link href="/css/bootstrap.css" rel="stylesheet">
        <link href="/css/bootstrap-responsive.css" rel="stylesheet">
        <link href="/css/main.css" rel="stylesheet">

        <script src="/js/vendor/modernizr-2.6.2.min.js"></script>
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

      <div class="container" id="main">

        <div id="workflows_carousel" class="carousel slide">

        </div>

        <div id="graph">
          <svg height="0" preserveAspectRatio="xMidYMid meet" id="display_svg"></svg>
          <svg id="layout_svg" preserveAspectRatio="none"></svg>
        </div>

        <!-- Main hero unit for a primary marketing message or call to action -->
        <div class="hero-unit" id="info">
          <div id="info_inner"></div>
        </div>

        <div id="teams">

        </div>

      </div> <!-- /container -->
        <!--[if lt IE 7]>
            <p class="chromeframe">You are using an <strong>outdated</strong> browser. Please <a href="http://browsehappy.com/">upgrade your browser</a> or <a href="http://www.google.com/chromeframe/?redirect=true">activate Google Chrome Frame</a> to improve your experience.</p>
        <![endif]-->


<!--         <div id="graph_container">
          <div id="graph_nav"></div>
          <div id="graph"></div>
        </div> -->

        

        <!-- <nav id="breadcrumbs"></nav>
        <div id="main">
          <svg preserveAspectRatio="xMidYMid meet" id="display_svg"></svg>
        </div>
        <svg preserveAspectRatio="xMidYMid meet" id="layout_svg"></svg> -->

        <script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
        <script>window.jQuery || document.write('<script src="/js/vendor/jquery-1.9.1.min.js"><\/script>')</script>
        <script src="/js/vendor/davis.min.js"></script>
        <script src="/js/vendor/bootstrap.js"></script>
        <script src="/js/vendor/underscore-min.js"></script>
        <script src="/js/vendor/d3.js"></script>
        <script src="/js/vendor/dagre.js"></script>
        <script src="/js/vendor/colorbrewer.js"></script>
        <script src="/js/vendor/glow.js"></script>

        <script type="text/html" id='main_nav_template'>
          <li data-type="workflows" class="dropdown">
            <a class="dropdown-toggle" data-toggle="dropdown">Workflows <b class="caret"></b></a>
            <ul class="dropdown-menu">
            <% _(t.workflows).each(function(wf){ %>
              <li data-id="<%= wf.id %>"><a class="dropdown-toggle" data-toggle="dropdown" href="/workflows/<%= wf.id %>"><%= wf.name %></a></li>
            <% }); %>
            </ul>
          </li>
          <li data-type="pipelines" class="dropdown">
            <a class="dropdown-toggle" data-toggle="dropdown">Pipelines <b class="caret"></b></a>
            <ul class="dropdown-menu">
            <% _(t.pipelines).each(function(pl){ %>
              <li data-id="<%= pl.id %>"><a class="dropdown-toggle" data-toggle="dropdown" href="/pipelines/<%= pl.id %>"><%= pl.name %></a></li>
            <% }); %>
            </ul>
          </li>
          <li data-type="tools" class="dropdown">
            <a class="dropdown-toggle" data-toggle="dropdown">Tools <b class="caret"></b></a>
            <ul class="dropdown-menu">
            <% _(t.root_tools).each(function(tool){ %>
              <% var has_subtools = tool.subtools.length > 0 %>
              <li data-id="<%= tool.id %>" class="<%= has_subtools ? 'dropdown-submenu' : '' %>">
                <a class="dropdown-toggle" data-toggle="dropdown" href="/tools/<%= tool.id %>"><%= tool.name %></a>
                <% if(has_subtools) { %>
                <ul class="dropdown-menu">
                <% _(tool.subtools).each(function(subtool){ %>
                  <li data-id="<%= subtool.id %>"><a class="dropdown-toggle" data-toggle="dropdown" href="/tools/<%= subtool.id %>"><%= subtool.name %></a></li>
                <% }); %>
                </ul>
                <% } %>
              </li>
            <% }); %>
            </ul>
          </li>
          <li data-type="teams" class="dropdown">
            <a class="dropdown-toggle" data-toggle="dropdown">Teams <b class="caret"></b></a>
            <ul class="dropdown-menu">
            <% _(t.teams).each(function(team){ %>
              <li data-id="<%= team.id %>"><a class="dropdown-toggle" data-toggle="dropdown" href="/teams/<%= team.id %>"><%= team.name %></a></li>
            <% }); %>
            </ul>
          </li>
        </script>

        <script type="text/html" id='workflows_carousel_template'>
          <ol class="carousel-indicators">
          <% _(t.workflows).each(function(wf, i){ %>
            <li data-target="#workflows_carousel" data-slide-to="<%= i %>" class="<%= i==0 ? 'active':'' %>"></li>
          <% }); %>
          </ol>

          <div class="carousel-inner">
          <% _(t.workflows).each(function(wf, i){ %>
            <div class="<%= i==0 ? 'active':'' %> item"><a href="/workflows/<%= wf.id %>"><%= wf.question %></a></div>
          <% }); %>
          </div>

          <a class="carousel-control left" data-slide="prev">&lsaquo;</a>
          <a class="carousel-control right" data-slide="next">&rsaquo;</a>
        </script>

        <script type="text/html" id='breadcrumbs_template'>
          <div>Breadcrumbs</div>
        </script>

        <script type="text/html" id='graph_template'>
          <div>Graph</div>
        </script>

        <script type="text/html" id='info_summary_template'>
          <h2>Welcome!</h2>

          <p>Sed imperdiet lorem eu quam hendrerit, at faucibus justo varius. Donec et sagittis diam. Sed condimentum massa sed tellus bibendum, id ultrices nibh euismod. Quisque sit amet sem id ligula lacinia molestie. Vivamus ut tellus neque. Nulla feugiat nulla nec lorem posuere vulputate. Nunc porttitor, urna non volutpat faucibus, ante felis porttitor lorem, in laoreet justo justo eget mauris. Suspendisse vel libero sed mi vulputate adipiscing. Donec neque mi, volutpat nec lobortis quis, ullamcorper in erat. Ut pharetra massa eget cursus congue. Suspendisse metus neque, tincidunt et nunc sed, cursus ultrices metus. Nullam venenatis euismod pretium. Vivamus vitae leo in lacus lacinia tempor eu eu urna.</p>

          <p>Phasellus vel eros ornare, viverra felis at, semper dui. Suspendisse tempus risus felis, ac tempor lorem ullamcorper iaculis. Etiam at orci sapien. Duis justo urna, aliquam quis ornare vitae, hendrerit quis diam. Phasellus ac ante tincidunt, elementum mauris at, laoreet risus. In hac habitasse platea dictumst. In velit elit, commodo tristique luctus sit amet, consequat vel massa.</p>

        </script>

        <script type="text/html" id='info_workflow_template'>
          <h1>Workflow: <%= t.name %></h1>
          <h2><%= t.question %></h1>
          <p>This workflow consumes <%= t.in_data_types.map(function(dt){return dt.name;}).toEnglishList() %> and produces <%= t.out_data_types.map(function(dt){return dt.name}).toEnglishList()%>.</p>
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
          <p>This pipeline consumes <%= t.in_data_format_usages.map(function(dfu){return dfu.data_format.id.toUpperCase();}).toEnglishList() %> files and produces <%= t.out_data_format_usages.map(function(dfu){return dfu.data_format.id.toUpperCase();}).toEnglishList() %> files.</p>
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
          <% _(t.root_tools).each(function(root_tool){ %>
            <li data-id="<%= root_tool.id %>"><a href="/tools/<%= root_tool.id %>"><%= root_tool.name %></a></li>
          <% }); %>
          </ul>
          <p>Pipelines developed:</p>
          <ul>
          <% _(t.pipelines).each(function(pl){ %>
            <li data-id="<%= pl.id %>"><a href="/pipelines/<%= pl.id %>"><%= pl.name %></a></li>
          <% }); %>
          </ul>
          
        </script>

        <script type="text/html" id='info_tool_template'>
          <h1>Tool: <%= t.name %></h1>
          <% if(t.team) { %><p>Developed by: <a href="/teams/<%= t.team.id %>"><%= t.team.name %></a></p><% } %>
          <% if(t.parent_tool) { %><p>Parent tool: <a href="/tools/<%= t.parent_tool.id %>"><%= t.parent_tool.name %></a></p><% } %>
          <% if(t.subtools.length > 0) { %>
            <p>This tool includes the following subtools:</p>
            <% _(t.subtools).each(function(subtool){ %>
              <li data-id="<%= subtool.id %>"><a href="/tools/<%= subtool.id %>"><%= subtool.name %></a></li>
            <% }); %>
          <% } %>
          <% if(t.pipelines.length > 0) { %>
            <p>This tool is part of the following pipelines:</p>
            <ul>
            <% _(t.pipelines).each(function(pl){ %>
              <li data-id="<%= pl.id %>"><a href="/pipelines/<%= pl.id %>"><%= pl.name %></a></li>
            <% }); %>
            </ul>
          <% } %>
          
        </script>

        <script type="text/html" id='teams_template'>
          <% _(t.teams).each(function(team, i){ %>
            <%= i % 4 == 0 ? '<div class="row">' : '' %>
            <div class="span3 team" data-id="<%= team.id %>"><a href="/teams/<%= team.id %>"><%= team.name %></a></div>
            <%= i % 4 == 3 ? '</div>' : '' %>
          <% }); %>
        </script>

        <script>
        var app_json = <?php echo file_get_contents('./js/app.json'); ?>;
        var app = {};
        </script>

        <script src="/js/utils.js"></script>
        <script src="/js/settings.js"></script>
        <script src="/js/gdata.js"></script>
        <script src="/js/graph/graph.js"></script>
        <script src="/js/graph/node.js"></script>
        <script src="/js/graph/edge.js"></script>
        <script src="/js/graph/graph_drawing.js"></script>
        <script src="/js/main.js"></script>

        <script>
            var _gaq=[['_setAccount','UA-XXXXX-X'],['_trackPageview']];
            (function(d,t){var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
            g.src=('https:'==location.protocol?'//ssl':'//www')+'.google-analytics.com/ga.js';
            s.parentNode.insertBefore(g,s)}(document,'script'));
        </script>
    </body>
</html>
