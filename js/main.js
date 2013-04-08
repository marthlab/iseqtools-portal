
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

    	// backreferences populated later
    	this.in_objectives = [];
    	this.out_objectives = [];
    }

    function Tool(config, objective) {
    	this.id = config.id;
    	this.name = config.name;
    	this.objective = objective;
    	this.in_data_formats = app.data_formats.filter(function(df) {
    		return config.in_data_formats.contains(df.id);
    	});
    	this.out_data_formats = app.data_formats.filter(function(df) {
    		return config.out_data_formats.contains(df.id);
    	});

    	// backreferences populated later
    	this.pipelines = [];
    }

    function Objective(config) {
    	this.id = config.id;
    	this.name = config.name;
    	this.nontool_out_data_formats = app.data_formats.filter(function(df) {
    		return config.nontool_out_data_format_ids.contains(df.id);
    	});

    	this.tools = config.tools.map(function(tool_config) {
    		return new Tool(tool_config, this);
    	}, this);

    	// convenience properties
    	this.in_data_formats = this.tools.map(function(tool) {return tool.in_data_formats;}).flatten().unique();
    	this.in_data_types = this.in_data_formats.map(function(df) {return df.data_type;}).unique();
    	this.out_data_formats = this.tools.map(function(tool) {return tool.out_data_formats;}).flatten().union(config.nontool_out_data_formats).unique();
    	this.out_data_types = this.out_data_formats.map(function(df) {return df.data_type;}).unique();
    	
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
  	
  	// add backreferences
  	app.pipelines.forEach(function(pl) {
    	pl.tools.forEach(function(tool) {
  			tool.pipelines.push(pl);
  		});
  	});

  	app.objectives.forEach(function(obj) {
    	obj.in_data_types.forEach(function(dt) {
  			dt.in_objectives.push(obj);
  		});
  		obj.out_data_types.forEach(function(dt) {
  			dt.out_objectives.push(obj);
  		});
  	});

}());