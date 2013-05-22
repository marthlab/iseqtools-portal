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
        <meta name="viewport" content="width=device-width">

        <link rel="stylesheet" href="css/normalize.min.css">
        <link rel="stylesheet" href="css/main.css">

        <script src="js/vendor/modernizr-2.6.2.min.js"></script>
    </head>
    <body>
        <!--[if lt IE 7]>
            <p class="chromeframe">You are using an <strong>outdated</strong> browser. Please <a href="http://browsehappy.com/">upgrade your browser</a> or <a href="http://www.google.com/chromeframe/?redirect=true">activate Google Chrome Frame</a> to improve your experience.</p>
        <![endif]-->

        <h1 id="logo"><a href="#">iSeqTools</a></h1>

        <ul id="main_nav"></ul>

        <div id="info"></div>

        <nav id="breadcrumbs"></nav>
        <div id="main">
            <svg preserveAspectRatio="xMidYMid meet" id="display_svg"></svg>
        </div>
        <svg preserveAspectRatio="xMidYMid meet" id="layout_svg"></svg>

        <script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
        <script>window.jQuery || document.write('<script src="js/vendor/jquery-1.9.1.min.js"><\/script>')</script>
        <script src="js/vendor/underscore-min.js"></script>
        <!-- <script src="js/vendor/jquery.svg.min.js"></script> 
        <script src="js/vendor/jquery.svgdom.min.js"></script> -->
        <script src="js/vendor/d3.js"></script>
        <script src="js/vendor/dagre.js"></script>

        <script type="text/html" id='main_nav_template'>
          <li data-type="workflows">
            <h2>Workflows</h2>
            <ul>
              <% _(t.workflows).each(function(wf){ %>
                <li data-id="<%= wf.id %>"><a href="/workflows/<%= wf.id %>"><%= wf.name %></a></li>
              <% }); %>
            </ul>
          </li>
          <li data-type="pipelines">
            <h2>Pipelines</h2>
            <ul>
              <% _(t.pipelines).each(function(pl){ %>
                <li data-id="<%= pl.id %>"><a href="/pipelines/<%= pl.id %>"><%= pl.name %></a></li>
              <% }); %>
            </ul>
          </li>
          <li data-type="tools">
            <h2>Tools</h2>
            <ul>
              <% _(t.tools).each(function(tool){ %>
                <li data-id="<%= tool.id %>"><a href="/tools/<%= tool.id %>"><%= tool.name %></a></li>
              <% }); %>
            </ul>
          </li>
        </script>

        <script type="text/html" id='info_global_template'>
          <div>Global view informational content</div>
        </script>

        <script type="text/html" id='info_workflow_template'>
          <div>Workflow informational content</div>
          <p>Workflow ID: <%= t.id %></p>
          <p>Workflow Name: <%= t.name %></p>
        </script>

        <script type="text/html" id='info_pipeline_template'>
          <div>Pipeline informational content</div>
          <p>Pipeline ID: <%= t.id %></p>
          <p>Pipeline Name: <%= t.name %></p>
        </script>

        <script type="text/html" id='info_tool_template'>
          <div>Tool informational content</div>
          <p>Tool ID: <%= t.id %></p>
          <p>Tool Name: <%= t.name %></p>
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
