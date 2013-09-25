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

        <link href='http://fonts.googleapis.com/css?family=Quicksand:300,400' rel='stylesheet' type='text/css'>
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
            <a class="brand" id="logo" href="<?php echo $base_url; ?>/">iSeqTools</a>
            <a class="brand" id="nhgri" href="http://genome.gov">an NHGRI project</a>
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
          <svg preserveAspectRatio="xMidYMid meet" class="display_svg" id="display_svg_1">
          </svg>
          <svg preserveAspectRatio="xMidYMid meet" class="display_svg" id="display_svg_2">
          </svg>
          <svg id="layout_svg" preserveAspectRatio="none">
          </svg>
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
        <script src="<?php echo $base_url; ?>/js/vendor/jquery.qtip.min.js"></script>
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
            <a class="dropdown-toggle" data-toggle="dropdown">Data Types <b class="caret"></b></a>
            <ul class="dropdown-menu">
            <% _(t.data_types).each(function(dt){ %>
              <li><a class="dropdown-toggle" data-toggle="dropdown" href="<%= dt.url() %>"><%= dt.name.toTitleCase() %></a></li>
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
          <li class="dropdown">
            <a class="dropdown-toggle" data-toggle="dropdown" href="<%= t.pegasus.url() %>"><%= t.pegasus.name %></a>
          </li>
          <% _(t.generic_pages).each(function(gp){ %>
          <li class="dropdown">
            <a class="dropdown-toggle" data-toggle="dropdown" href="<%= gp.url() %>"><%= gp.name %></a>
          </li>
          <% }); %>
          
        </script>

        <script type="text/html" id='workflows_carousel_template'>
          

          <div class="carousel-inner">
            <div class="active item heading"><a>Find software for your sequence analysis project</a></div>
          <% _(t.workflows).each(function(wf, i){ %>
            <div class="item"><a href="<%= wf.url() %>"><%= wf.name %></a></div>
          <% }); %>
            <div class="item"><a href="<%= t.pegasus.url() %>">Manage Your Workflows</a></div>
          </div>

          <ol class="carousel-indicators">
            <li data-target="#workflows_carousel" data-slide-to="0" class="active heading"></li>
          <% _(t.workflows).each(function(wf, i){ %>
            <li style="background-color:<%= wf.color() %>; border-color:<%= wf.color() %>" data-target="#workflows_carousel" data-slide-to="<%= i+1 %>" ></li>
          <% }); %>
            <li style="background-color:green; border-color:green" data-target="#workflows_carousel" data-slide-to="<%= t.workflows.length+1 %>" class=""></li>
          </ol>

          <a class="carousel-control left" data-slide="prev">&lsaquo;</a>
          <a class="carousel-control right" data-slide="next">&rsaquo;</a>
        </script>

        <script type="text/html" id='breadcrumbs_template'>
            <% var crumbs = t.crumbs.reverse(); %>
            <% _.each(crumbs, function(item, i){ %>
              <% var item_name = _(["pipeline", "tool", "tool_usage"]).contains(item.type()) ? item.name : item.name.toTitleCase() %>
              <% if(i === crumbs.length-1) { %>
              <span><%= item_name %></span>
              <% } else { %>
              <a href="<%= item.url() %>"><%= item_name %></a>&nbsp;&nbsp;&gt;&gt;&nbsp;
              <% } %>
            <% }); %>
             
        </script>

        <script type="text/html" id='info_about_template'>
        
<p>
  Genomic analysis consists of complex problems, and involves various data types and numerous fast-changing tools.
  This site organizes genomic analysis information around identified genomic workflows comprising nuclear genomic tasks such as read mapping or structural variant calling.
  These tasks operate on as input, and produce as output, genomic data such as sequencing reads, alignments, or annotated variants.
  Multiple software pipelines produced by GS-IT participants may be available as disparate implementations of the same workflow.
  
  The <b>visual GS-IT network explorer</b> is organized around the above-introduced concepts, in four semantic “zoom levels” corresponding to increased detail and decreased generality.
</p>

  <ul>
<li><b>Zoom level 1: Overview.</b> This level displays all workflows implemented by GS-IT project participants. Upon selecting a colored path representing a workflow, the view will transition to the next zoom level.
</li>
<li><b>Zoom level 2: Workflow.</b> This level reveals the individual pipelines implementing a workflow, which are represented as differently-colored paths linking genomic tasks. Some pipelines may implement only a subset of tasks within a particular workflow. The information panel also shows these constituent pipelines as a conventional list.  Upon selecting a colored path representing a pipeline, the view will transition to the next zoom level.
</li>
<li><b>Zoom level 3: Pipeline.</b> This level shows how a specific pipeline links together various tools to accomplish certain tasks. The information panel shows further textual information about the pipeline, as well as a list of the tools employed. Each tool employed by the pipeline can be selected to transition to the next zoom level. The information panel may also include links to demos, downloads, and external resources such as Biostar discussions.
</li>
<li><b>Zoom level 4: Tool.</b> This level shows what inputs and outputs are associated with a tool in the context of a particular pipeline. The information panel shows further textual information about the tool.
</li>
  </ul>

        </script>

        <script type="text/html" id='info_pegasus_template'>
<h1>Pegasus Workflow Management System</h1>
            <div class="info_inline">
            <h3>Developed by:</h3> <a href="/teams/usc">USC</a><br>
            <h3>Website:</h3> <a href="http://pegasus.isi.edu/">http://pegasus.isi.edu/</a>
            </div>
<ul>
  <li>
    <b>Pegasus is a workflow planner ("compiler") which can handle everything from single-task workflows to workflows with millions of tasks</b>
    <ul>
      <li>Workflows enables parallel computation</li>
      <li>Pegasus workflows are described in a higher level portable and reusable format</li>
      <li>Enables execution on standard compute infrastructures (clouds, grids, campus clusters, ...)</li>
    </ul>
  </li>
  <li>
    <b>Pegasus automatically restructures the workflow to improve performance and data management</b>
    <ul>
      <li>Task clustering - combining short tasks into longer jobs</li>
      <li>Workflow reduction / data reuse - workflows are minimized based on existing data</li>
      <li>Data cleanup - Pegasus maintains a minimal storage footprint during execution</li>
    </ul>
  </li>
  <li>
 <b> Pegasus automatically plans and optimizes data placement</b>
  </li>
  <li>
    <b>Pegasus is not just for large-scale workflows. Other reasons for using Pegasus:</b>
    <ul>
      <li>Well defined failure recovery - automatic retries in case of failure to increase the overall reliability</li>
      <li>Monitoring - provenance data</li>
      <li>Debugging - tools to pinpoint failures</li>
    </ul>
  </li>
</ul>




        </script>

        <script type="text/html" id='info_summary_template'>
          <p>
Welcome to the Genome Sequencing Informatics Tools (GS-IT) Program, funded by the National Human Genome Research Institute. Six participant informatics groups are developing powerful and “researcher-friendly” sequence analysis tools. This portal is designed for users and developers to explore the tools and pipelines built by project participants.
        </script>

        <script type="text/html" id='info_data_type_template'>
          <h1>Data Type: <%= t.name.toTitleCase() %></h1>
          <p><%= t.description %></p>
          <% if(t.pipelines_dedicated.length > 0) { %>
          <div class="info_float">
            <h2><a href="#" class="tooltipped" data-toggle="tooltip" data-placement="right" title="Pipelines that both consume and produce the same type of data">Utility pipelines</a> for <%= t.name %>:</h2>
            <ul>
            <% _(t.pipelines_dedicated).each(function(pl){ %>
              <li><a href="<%= pl.url() %>"><%= pl.name %></a> (<a href="<%= pl.team.url() %>"><%= pl.team.name %></a>)</li>
            <% }); %>
            </ul>
          </div>
          <% } %>
          <% if(t.pipelines.length > 0) { %>
          <div class="info_float">
            <h2>All pipelines involving <%= t.name %>:</h2>
            <ul>
            <% _(t.pipelines).each(function(pl){ %>
              <li><a href="<%= pl.url() %>"><%= pl.name %></a> (<a href="<%= pl.team.url() %>"><%= pl.team.name %></a>)</li>
            <% }); %>
            </ul>
          </div>
          <% } %>
          
        </script>

        <script type="text/html" id='info_workflow_template'>
          <h1>Workflow: <%= t.name %></h1>
          <h2><%= t.question %></h2>
          <p>This workflow consumes <%= t.in_data_types.map(function(dt){return dt.name;}).toEnglishList() %> and produces <%= t.out_data_types.map(function(dt){return dt.name}).toEnglishList()%>.</p>
          <% if(t.pipelines.length > 0) { %>
          <div class="info_float">
            <h2>Pipelines implementing this workflow:</h2>
            <ul>
            <% _(t.pipelines).each(function(pl){ %>
              <li><a href="<%= pl.url() %>"><%= pl.name %></a> (<a href="<%= pl.team.url() %>"><%= pl.team.name %></a>)</li>
            <% }); %>
            </ul>
          </div>
          <% } %>
          
        </script>

        <script type="text/html" id='info_pipeline_template'>
          <h1>Pipeline: <%= t.name %></h1>
          <% if(t.team) { %>
            <div class="info_inline">
            <h3>Developed by:</h3> <a href="<%= t.team.url() %>"><%= t.team.name %></a>
            </div>
          <% } %>
          <% var filelist = _.uniq(t.in_data_format_usages.map(function(dfu){return dfu.label;})); %>
          <p>This pipeline accepts the following file(s) as input: <%= filelist.toEnglishList() %>.</p>
          <% if(t.workflow) { %>
          <p>This pipeline implements the <a href="<%= t.workflow.url() %>"><%= t.workflow.name %></a> workflow.</p>
          <% } %>
          <% if(t.tools.length > 0) { %>
          <div class="info_float">
            <h2>Tools incorporated:</h2>
            <ul>
            <% _(t.tools).each(function(tool){ %>
              <li><a href="<%= tool.url() %>"><%= tool.name %></a><% if(tool.team) { %> (<a href="<%= tool.team.url() %>"><%= tool.team.name %></a>)<% } %></li>
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

        <script type="text/html" id='info_tool_usage_template'>
          <h1>Tool used: <%= t.tool.name %></h1>
          <% if(t.tool.team) { %>
            <div class="info_inline">
            <h3>Developed by:</h3> <a href="<%= t.tool.team.url() %>"><%= t.tool.team.name %></a>
            </div>
          <% } %>
          <p>In this context, <%= t.tool.name %> consumes <%= t.inputsAsEnglish() %> and produces <%= t.outputsAsEnglish() %>.</p>
          <% if(t.tool.parent_tool) { %>
            <div class="info_inline">
            <h3>Parent tool:</h3> <a href="<%= t.tool.parent_tool.url() %>"><%= t.tool.parent_tool.name %></a>
            </div>
          <% } %>
          <% if(t.tool.subtools.length > 0) { %>
            <div class="info_float">
              <h2>Subtools:</h2>
              <% _(t.tool.subtools).each(function(subtool){ %>
                <li><a href="<%= subtool.url() %>"><%= subtool.name %></a></li>
              <% }); %>
            </div>
          <% } %>
          <% if(t.tool.pipelines.filter(function(pl){return pl !== t.pipeline;}).length > 0) { %>
            <div class="info_float">
              <h2>Incorporated in other pipelines:</h2>
              <ul>
              <% _(t.tool.pipelines.filter(function(pl){return pl !== t.pipeline;})).each(function(pl){ %>
                <li><a href="<%= pl.url() %>"><%= pl.name %></a><% if(pl.team){ %> (<a href="<%= pl.team.url() %>"><%= pl.team.name %></a>)<% } %></li>
              <% }); %>
              </ul>
            </div>
          <% } %>
          <% if(t.tool.tutorials.length > 0) { %>
            <div class="info_float">
              <h2>Tutorials:</h2>
              <ul>
              <% _(t.tool.tutorials).each(function(tutorial){ %>
                <li><a href="<%= tutorial.url %>"><%= tutorial.label %></a></li>
              <% }); %>
              </ul>
            </div>
          <% } %>
          <% if(t.tool.demos.length > 0) { %>
            <div class="info_float">
              <h2>Demos:</h2>
              <ul>
              <% _(t.tool.demos).each(function(demo){ %>
                <li><a href="<%= demo.url %>"><%= demo.label %></a></li>
              <% }); %>
              </ul>
            </div>
          <% } %>
          
        </script>

        <script type="text/html" id='info_team_template'>
          <h1>Team: <%= t.name %></h1>
          <div class="info_inline">
            <h3>Principal Investigator<%= t.principal_investigators.length > 1 ? 's':'' %>:</h3>
            <ul>
            <% _(t.principal_investigators).each(function(pi, i){ %><%= (i !== 0) ? ', ':'' %>
              <li><a href=mailto:<%= pi.email %>><%= pi.name %></a></li><% }); %>
            </ul>
          </div>
          <div class="info_inline">
            <h3>Project Title:</h3>
            <p><%= t.project_title %></p>
          </div>
          <% if(t.project_url) { %>
            <div class="info_inline">
            <h3>Project Site:</h3> <a href="<%= t.project_url %>"><%= t.project_url %></a>
            </div>
          <% } %>
          <% if(t.group_url) { %>
            <div class="info_inline">
            <h3>Group Site:</h3> <a href="<%= t.group_url %>"><%= t.group_url %></a>
            </div>
          <% } %>
          <% if(t.institution_urls.length > 0) { %>
            <div class="info_inline">
            <h3>Institution Site<%= t.institution_urls.length > 1 ? 's':'' %>:</h3> <%= _(t.institution_urls).map(function(url){
              return '<a href="'+url+'">'+url+'</a>';
            }).join(', ') %>
            </div>
          <% } %>
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
          <% if(t.team) { %>
            <div class="info_inline">
            <h3>Developed by:</h3> <a href="<%= t.team.url() %>"><%= t.team.name %></a>
            </div>
          <% } %>
          <% if(t.parent_tool) { %>
            <div class="info_inline">
            <h3>Parent tool:</h3> <a href="<%= t.parent_tool.url() %>"><%= t.parent_tool.name %></a>
            </div>
          <% } %>
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
                <li><a href="<%= pl.url() %>"><%= pl.name %></a><% if(pl.team){ %> (<a href="<%= pl.team.url() %>"><%= pl.team.name %></a>)<% } %></li>
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
