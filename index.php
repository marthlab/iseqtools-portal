<?php

switch ($_SERVER['SERVER_NAME']) {
    case '127.0.0.1':
        $base_route = '';
        $base_url = 'http://127.0.0.1:8081' . $base_route;
        break;
    case 'bioinformatics.bc.edu':
        $base_route = '/marthlab/iseqtools-portal';
        $base_url = 'http://bioinformatics.bc.edu' . $base_route;
        break;
}

?>

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

        <link href="<?php echo $base_url; ?>/css/bootstrap.css" rel="stylesheet">
        <link href="<?php echo $base_url; ?>/css/bootstrap-responsive.css" rel="stylesheet">
        <link href="<?php echo $base_url; ?>/css/main.css" rel="stylesheet">

        <script src="<?php echo $base_url; ?>/js/vendor/modernizr-2.6.2.min.js"></script>
    </head>
    <body>
      <div id="navbar" class="navbar navbar-inverse navbar-fixed-top">
        <div class="navbar-inner">
          <div class="container">
            <button type="button" class="btn btn-navbar" data-toggle="collapse" data-target=".nav-collapse">
              <span class="icon-bar"></span>
              <span class="icon-bar"></span>
              <span class="icon-bar"></span>
            </button>
            <a class="brand" id="logo" href="<?php echo $base_url; ?>">iSeqTools</a>
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

        <div id="breadcrumbs"></div>
        <div id="graph">
          
          <svg preserveAspectRatio="xMidYMid meet" class="display_svg" id="display_svg_1"></svg>
          <svg preserveAspectRatio="xMidYMid meet" class="display_svg" id="display_svg_2"></svg>
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

        <script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
        <script>window.jQuery || document.write('<script src="<?php echo $base_url; ?>/js/vendor/jquery-1.9.1.min.js"><\/script>')</script>
        <script src="<?php echo $base_url; ?>/js/vendor/jquery.svg.min.js"></script>
        <script src="<?php echo $base_url; ?>/js/vendor/davis.min.js"></script>
        <script src="<?php echo $base_url; ?>/js/vendor/bootstrap.js"></script>
        <script src="<?php echo $base_url; ?>/js/vendor/underscore-min.js"></script>
        <script src="<?php echo $base_url; ?>/js/vendor/d3.js"></script>
        <script src="<?php echo $base_url; ?>/js/vendor/dagre.js"></script>
        <script src="<?php echo $base_url; ?>/js/vendor/colorbrewer.js"></script>
        <script src="<?php echo $base_url; ?>/js/vendor/glow.js"></script>

        <script type="text/html" id='main_nav_template'>
          <li class="dropdown">
            <a class="dropdown-toggle" data-toggle="dropdown">Workflows <b class="caret"></b></a>
            <ul class="dropdown-menu">
            <% _(t.workflows).each(function(wf){ %>
              <li><a class="dropdown-toggle" data-toggle="dropdown" href="<%= wf.url() %>"><%= wf.name %></a></li>
            <% }); %>
            </ul>
          </li>
          <li class="dropdown">
            <a class="dropdown-toggle" data-toggle="dropdown">Pipelines <b class="caret"></b></a>
            <ul class="dropdown-menu">
            <% _(t.pipelines).each(function(pl){ %>
              <li><a class="dropdown-toggle" data-toggle="dropdown" href="<%= pl.url() %>"><%= pl.name %></a></li>
            <% }); %>
            </ul>
          </li>
          <li class="dropdown">
            <a class="dropdown-toggle" data-toggle="dropdown">Tools <b class="caret"></b></a>
            <ul class="dropdown-menu">
            <% _(t.root_tools).each(function(tool){ %>
              <% var has_subtools = tool.subtools.length > 0 %>
              <li class="<%= has_subtools ? 'dropdown-submenu' : '' %>">
                <a class="dropdown-toggle" data-toggle="dropdown" href="<%= tool.url() %>"><%= tool.name %></a>
                <% if(has_subtools) { %>
                <ul class="dropdown-menu">
                <% _(tool.subtools).each(function(subtool){ %>
                  <li><a class="dropdown-toggle" data-toggle="dropdown" href="<%= subtool.url() %>"><%= subtool.name %></a></li>
                <% }); %>
                </ul>
                <% } %>
              </li>
            <% }); %>
            </ul>
          </li>
          <li class="dropdown">
            <a class="dropdown-toggle" data-toggle="dropdown">Teams <b class="caret"></b></a>
            <ul class="dropdown-menu">
            <% _(t.teams).each(function(team){ %>
              <li><a class="dropdown-toggle" data-toggle="dropdown" href="<%= team.url() %>"><%= team.name %></a></li>
            <% }); %>
            </ul>
          </li>
          <% _(t.generic_pages).each(function(gp){ %>
          <li class="dropdown">
            <a class="dropdown-toggle" data-toggle="dropdown" href="<%= gp.url() %>"><%= gp.name %></a>
          </li>
          <% }); %>
          
        </script>

        <script type="text/html" id='workflows_carousel_template'>
          <ol class="carousel-indicators">
          <% _(t.workflows).each(function(wf, i){ %>
            <li data-target="#workflows_carousel" data-slide-to="<%= i %>" class="<%= i==0 ? 'active':'' %>"></li>
          <% }); %>
          </ol>

          <div class="carousel-inner">
          <% _(t.workflows).each(function(wf, i){ %>
            <div class="<%= i==0 ? 'active':'' %> item"><a href="<%= wf.url() %>"><%= wf.question %></a></div>
          <% }); %>
          </div>

          <a class="carousel-control left" data-slide="prev">&lsaquo;</a>
          <a class="carousel-control right" data-slide="next">&rsaquo;</a>
        </script>

        <script type="text/html" id='breadcrumbs_template'>
            <% var crumbs = t.crumbs.reverse(); %>
            <% _.each(crumbs, function(item, i){ %>
              <% if(i === crumbs.length-1) { %>
              <span><%= item.name %></span>
              <% } else { %>
              <a href="<%= item.url() %>"><%= item.name %></a>&nbsp;&nbsp;&gt;&gt;&nbsp;
              <% } %>
            <% }); %>
             
        </script>

        <script type="text/html" id='info_about_template'>
        <p>
          Aliquam fermentum lacus sit amet tellus porta molestie. Sed commodo lacinia egestas. Aliquam vitae varius metus. Sed faucibus imperdiet molestie. Integer dignissim, justo non facilisis tempor, magna eros viverra risus, eget viverra ipsum enim vel mauris. Cras congue odio nunc, eu pellentesque tortor elementum vitae. Etiam sagittis convallis libero, eget tristique dui fringilla id. Nullam luctus ultrices justo, vel convallis mi tempor nec. Cum sociis natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Fusce eleifend consequat lacus vel molestie. Curabitur vehicula eget nisi eu vestibulum. Nam eget venenatis augue.
        </p>
        <p>
          Ut eget purus quis lacus rhoncus scelerisque. Integer sed odio et sapien aliquet porta et ut massa. Mauris vel congue tellus, eget egestas ipsum. Phasellus facilisis dictum sapien, a vehicula eros imperdiet quis. Maecenas eget viverra metus. Donec non mauris nec turpis blandit pharetra vitae a velit. Ut vel nisl semper, gravida tellus quis, dictum justo. Sed consectetur ullamcorper ipsum. Proin eu ligula scelerisque, tincidunt erat at, viverra felis. Nullam et arcu vel risus adipiscing fermentum. Aliquam iaculis interdum euismod. Nullam at orci pretium, tempus libero sit amet, pellentesque mauris. Vivamus vestibulum magna lectus, a iaculis leo elementum vitae. Nam turpis turpis, bibendum vitae erat ut, imperdiet placerat orci. Donec aliquam fringilla ultricies. Vestibulum non tortor eu velit congue suscipit.
        </p>
        </script>

        <script type="text/html" id='info_summary_template'>
          <p>
Welcome to the Genome Sequencing Informatics Tools Project, funded by the National Human Genome Research Institute.<br>
Six participant informatics groups are developing software tools for genome sequence analysis.</p>
        </script>

        <script type="text/html" id='info_workflow_template'>
          <h1>Workflow: <%= t.name %></h1>
          <h2><%= t.question %></h1>
          <p>This workflow consumes <%= t.in_data_types.map(function(dt){return dt.name;}).toEnglishList() %> and produces <%= t.out_data_types.map(function(dt){return dt.name}).toEnglishList()%>.</p>
          <% if(t.pipelines.length > 0) { %>
          <div class="info_float">
            <h2>Pipelines implementing this workflow:</h2>
            <ul>
            <% _(t.pipelines).each(function(pl){ %>
              <li><a href="<%= pl.url() %>"><%= pl.name %></a></li>
            <% }); %>
            </ul>
          </div>
          <% } %>
          
        </script>

        <script type="text/html" id='info_pipeline_template'>
          <h1>Pipeline: <%= t.name %></h1>
          <% if(t.team) { %><p>Developed by: <a href="<%= t.team.url() %>"><%= t.team.name %></a></p><% } %>
          <p>This pipeline consumes <%= t.in_data_format_usages.map(function(dfu){return dfu.data_format.id.toUpperCase();}).toEnglishList() %> files and produces <%= t.out_data_format_usages.map(function(dfu){return dfu.data_format.id.toUpperCase();}).toEnglishList() %> files.</p>
          <p>This pipeline implements the <a href="<%= t.workflow.url() %>"><%= t.workflow.name %></a> workflow.</p>
          <% if(t.tools.length > 0) { %>
          <div class="info_float">
            <h2>Tools incorporated:</h2>
            <ul>
            <% _(t.tools).each(function(tool){ %>
              <li><a href="<%= tool.url() %>"><%= tool.name %></a></li>
            <% }); %>
            </ul>
          </div>
          <% } %>
          <% if(t.tutorials.length > 0) { %>
            <div class="info_float">
              <h2>Tutorials:</h2>
              <ul>
              <% _(t.tutorials).each(function(tutorial){ %>
                <li><a href="<%= tutorial.url %>"><%= tutorial.label %></a></li>
              <% }); %>
              </ul>
            </div>
          <% } %>
          <% if(t.demos.length > 0) { %>
            <div class="info_float">
              <h2>Demos:</h2>
              <ul>
              <% _(t.demos).each(function(demo){ %>
                <li><a href="<%= demo.url %>"><%= demo.label %></a></li>
              <% }); %>
              </ul>
            </div>
          <% } %>
          
        </script>

        <script type="text/html" id='info_team_template'>
          <h1>Team: <%= t.name %></h1>
          <% if(t.root_tools.length > 0) { %>
          <div class="info_float">
            <h2>Tools developed:</h2>
            <ul>
            <% _(t.root_tools).each(function(root_tool){ %>
              <li><a href="<%= root_tool.url() %>"><%= root_tool.name %></a></li>
            <% }); %>
            </ul>
          </div>
          <% } %>
          <% if(t.pipelines.length > 0) { %>
          <div class="info_float">
            <h2>Pipelines developed:</h2>
            <ul>
            <% _(t.pipelines).each(function(pl){ %>
              <li><a href="<%= pl.url() %>"><%= pl.name %></a></li>
            <% }); %>
            </ul>
          </div>
          <% } %>
          
        </script>

        <script type="text/html" id='info_tool_template'>
          <h1>Tool: <%= t.name %></h1>
          <% if(t.team) { %><p>Developed by: <a href="<%= t.team.url() %>"><%= t.team.name %></a></p><% } %>
          <% if(t.parent_tool) { %><p>Parent tool: <a href="<%= t.parent_tool.url() %>"><%= t.parent_tool.name %></a></p><% } %>
          <% if(t.subtools.length > 0) { %>
            <div class="info_float">
              <h2>Subtools:</h2>
              <% _(t.subtools).each(function(subtool){ %>
                <li><a href="<%= subtool.url() %>"><%= subtool.name %></a></li>
              <% }); %>
            </div>
          <% } %>
          <% if(t.pipelines.length > 0) { %>
            <div class="info_float">
              <h2>Incorporated in pipelines:</h2>
              <ul>
              <% _(t.pipelines).each(function(pl){ %>
                <li><a href="<%= pl.url() %>"><%= pl.name %></a></li>
              <% }); %>
              </ul>
            </div>
          <% } %>
          <% if(t.tutorials.length > 0) { %>
            <div class="info_float">
              <h2>Tutorials:</h2>
              <ul>
              <% _(t.tutorials).each(function(tutorial){ %>
                <li><a href="<%= tutorial.url %>"><%= tutorial.label %></a></li>
              <% }); %>
              </ul>
            </div>
          <% } %>
          <% if(t.demos.length > 0) { %>
            <div class="info_float">
              <h2>Demos:</h2>
              <ul>
              <% _(t.demos).each(function(demo){ %>
                <li><a href="<%= demo.url %>"><%= demo.label %></a></li>
              <% }); %>
              </ul>
            </div>
          <% } %>
          
        </script>

        <script type="text/html" id='teams_template'>
          <% _(t.teams).each(function(team, i){ %>
            <%= i % 4 == 0 ? '<div class="row">' : '' %>
            <div class="span3 team"><a href="<%= team.url() %>"><%= team.name %></a></div>
            <%= i % 4 == 3 ? '</div>' : '' %>
          <% }); %>
        </script>

        <script>
        var app_data = <?php echo file_get_contents('./js/app.json'); ?>;
        var app = {base_url: '<?php echo $base_url; ?>', base_route: '<?php echo $base_route; ?>'};
        </script>

        <script src="<?php echo $base_url; ?>/js/utils.js"></script>
        <script src="<?php echo $base_url; ?>/js/settings.js"></script>
        <script src="<?php echo $base_url; ?>/js/gdata.js"></script>
        <script src="<?php echo $base_url; ?>/js/graph/graph.js"></script>
        <script src="<?php echo $base_url; ?>/js/graph/node.js"></script>
        <script src="<?php echo $base_url; ?>/js/graph/edge.js"></script>
        <script src="<?php echo $base_url; ?>/js/graph/graph_drawing.js"></script>
        <script src="<?php echo $base_url; ?>/js/main.js"></script>

        <script>
            var _gaq=[['_setAccount','UA-XXXXX-X'],['_trackPageview']];
            (function(d,t){var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
            g.src=('https:'==location.protocol?'//ssl':'//www')+'.google-analytics.com/ga.js';
            s.parentNode.insertBefore(g,s)}(document,'script'));
        </script>
    </body>
</html>
