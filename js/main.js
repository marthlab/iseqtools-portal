
//Immediately-Invoked Function Expression 
(function() {

		function by_id(id) {
			return (function(obj) {
				return obj.hasOwnProperty('id') && obj.id == id;
			});
		}

		Array.prototype.contains = function(obj) {
			return this.indexOf(obj) > -1;
		}

    function DataFormat(config, data_type) {
    	this.id = config.id;
    	this.name = config.name;
    	this.data_type = data_type;
    }

    function DataType(config) {
    	this.id = config.id;
    	this.name = config.name;

    	this.data_formats = config.data_formats.map(function(data_format_config) {
    		return new DataFormat(data_format_config, this);
    	}, this);
    }

    function Tool(config, objective) {
    	this.id = config.id;
    	this.name = config.name;
    	this.objective = objective;
    	this.input_data_formats = app.data_formats.filter(function(df) {
    		return config.input_data_formats.contains(df.id);
    	});
    	this.output_data_formats = app.data_formats.filter(function(df) {
    		return config.output_data_formats.contains(df.id);
    	});
    	this.pipelines = []; // populated by Pipeline constructor
    }

    function Objective(config) {
    	this.id = config.id;
    	this.name = config.name;
    	this.nontool_output_data_formats = app.data_formats.filter(function(df) {
    		return config.nontool_output_data_format_ids.contains(df.id);
    	});

    	this.tools = config.tools.map(function(tool_config) {
    		return new Tool(tool_config, this);
    	}, this);

    	// convenience properties
    	this.input_data_formats = this.tools.map(function(tool) {return tool.input_data_formats;}).flatten();
    	this.output_data_formats = this.tools.map(function(tool) {return tool.output_data_formats;}).flatten().union(config.nontool_output_data_formats);
    }

    function Workflow(config) {
    	this.id = config.id;
    	this.name = config.name;

    	this.pipelines = config.pipelines.map(function(pipeline_config) {
    		return new Pipeline(pipeline_config, this);
    	}, this);

    	// convenience properties
    	this.tools = this.pipelines.map(function(pl) {return pl.tools;}).flatten().unique();
    	this.objectives = this.pipelines.map(function(pl) {return pl.objectives;}).flatten().unique();
    }

    function Pipeline(config, workflow) {
    	this.id = config.id;
    	this.name = config.name;
    	this.workflow = workflow;
    	this.tools = app.tools.filter(function(tool) {
    		return config.tool_ids.contains(tool.id);
    	});

    	// add backreferences to tools
    	this.tools.forEach(function(tool) {
  			tool.pipelines.push(this);
  		}, this);

    	// convenience properties
    	this.objectives = this.tools.map(function(tool) {return tool.objective;});
    }

    // global w.r.t. the containing IIFE
    var app = {};

    // add data in order of logical dependencies, and add convenience properties for nested objects
    app.data_types = app_json.data_types.map(function(data_type_config) {
  		return new DataType(data_type_config);
  	});
  	app.data_formats = app.data_types.map(function(dt){return dt.data_formats;}).flatten();

  	app.objectives = app_json.objectives.map(function(objective_config) {
  		return new Objective(objective_config);
  	});
  	app.tools = app.objectives.map(function(obj){return obj.tools;}).flatten();

  	app.workflows = app_json.workflows.map(function(workflow_config) {
  		return new Workflow(workflow_config);
  	});
  	app.pipelines = app.workflows.map(function(wf){return wf.pipelines;}).flatten();
  	
  	

}());