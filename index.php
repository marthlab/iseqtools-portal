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

        <!-- <h1>Graph Visualization</h1> -->
        <nav id="breadcrumbs"></nav>
        <div id="main">
            <svg preserveAspectRatio="xMidYMid meet" id="display_svg"></svg>
        </div>
        <svg preserveAspectRatio="xMidYMid meet" id="layout_svg"></svg>

        <script src="//ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js"></script>
        <script>window.jQuery || document.write('<script src="js/vendor/jquery-1.9.1.min.js"><\/script>')</script>
        <script src="http://cdnjs.cloudflare.com/ajax/libs/underscore.js/1.4.4/underscore-min.js"></script>
        <script src="js/vendor/d3.js"></script>
        <script src="js/vendor/dagre.js"></script>

          <script type="text/javascript" src="js/vendor/svg-edit/browser.js"></script>
          <script type="text/javascript" src="js/vendor/svg-edit/svgtransformlist.js"></script>
          <script type="text/javascript" src="js/vendor/svg-edit/math.js"></script>
          <script type="text/javascript" src="js/vendor/svg-edit/units.js"></script>
          <script type="text/javascript" src="js/vendor/svg-edit/svgutils.js"></script>
          <script type="text/javascript" src="js/vendor/svg-edit/sanitize.js"></script>
          <script type="text/javascript" src="js/vendor/svg-edit/history.js"></script>
          <script type="text/javascript" src="js/vendor/svg-edit/select.js"></script>
          <script type="text/javascript" src="js/vendor/svg-edit/draw.js"></script>
          <script type="text/javascript" src="js/vendor/svg-edit/path.js"></script>
          <script type="text/javascript" src="js/vendor/svg-edit/svgcanvas.js"></script>

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

        <script>var app_json = <?php echo file_get_contents('./js/app.json'); ?>; var debug = null;</script>

        <script src="js/main.js"></script>

        <script>
            var _gaq=[['_setAccount','UA-XXXXX-X'],['_trackPageview']];
            (function(d,t){var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
            g.src=('https:'==location.protocol?'//ssl':'//www')+'.google-analytics.com/ga.js';
            s.parentNode.insertBefore(g,s)}(document,'script'));
        </script>
    </body>
</html>
