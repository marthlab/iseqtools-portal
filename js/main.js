
//Immediately-Invoked Function Expression 
// (function() {

		_.mixin({
		  // ### _.objFilter
		  // _.filter for objects, keeps key/value associations
		  // but only includes the properties that pass test().
		  objFilter: function (input, test, context) {
		    return _.reduce(input, function (obj, v, k) {
		             if (test.call(context, v, k, input)) {
		               obj[k] = v;
		             }
		             return obj;
		           }, {}, context);
		  }
		});

	  // creates a dictionary from an array of objects. each object in
	  // the array must have a unique value for key_property that is
	  // a syntactically valid JS object key (defaults to "id")
	  Array.prototype.toDict = function(key_property) {
	  	new_obj = {};
	  	key_property = key_property || "id";
	  	_.each(this, function(element, index) {
	  		new_obj[element[key_property]] = element;
	  	});
	  	return new_obj;
	  }

    function DataFormat(config, data_type) {
    	this.id = config.id;
    	this.order = config.order;
    	this.name = config.name;
    	this.data_type = data_type;
    }

    function DataType(config) {
    	this.id = config.id;
    	this.order = config.order;
    	this.name = config.name;

	    this.data_formats = config.data_formats.map(function(df_cfg, order) {
	    	return new DataFormat(_.extend(df_cfg, {order: order}), this);
	    }, this).toDict();

    	// backreferences populated later
    	this.in_objectives = {};
    	this.out_objectives = {};
    }

    function Tool(config, objective) {
    	this.id = config.id;
    	this.order = config.order;
    	this.name = config.name;
    	this.objective = objective;
    	this.in_data_formats = _(app.data_formats).objFilter(function(df) {
    		return _(config.in_data_formats).contains(df.id);
    	});
    	this.out_data_formats = _(app.data_formats).objFilter(function(df) {
    		return _(config.out_data_formats).contains(df.id);
    	});

    	// backreferences populated later
    	this.pipelines = {};
    }

    function Objective(config) {
    	this.id = config.id;
    	this.order = config.order;
    	this.name = config.name;
    	this.nontool_out_data_formats = _.objFilter(app.data_formats, function(df) {
    		return _(config.nontool_out_data_format_ids).contains(df.id);
    	});

	    this.tools = config.tools.map(function(tool_cfg, order) {
	    	return new Tool(_.extend(tool_cfg, {order: order}), this);
	    }, this).toDict();

    	// convenience properties
    	this.in_data_formats = _.extend.apply({}, _(this.tools).map(function(tool) {return tool.in_data_formats;}));
    	this.in_data_types = _(this.in_data_formats).map(function(df) {return df.data_type;}).toDict();
    	this.out_data_formats = _.extend.apply({}, _(this.tools).map(function(tool) {return tool.out_data_formats;}));
    	this.out_data_types = _(this.out_data_formats).map(function(df) {return df.data_type;}).toDict();
    }

    function Workflow(config) {
    	this.id = config.id;
    	this.order = config.order;
    	this.name = config.name;

    	this.pipelines = config.pipelines.map(function(pipeline_cfg, order) {
	    	return new Pipeline(_.extend(pipeline_cfg, {order: order}), this);
	    }, this).toDict();

    	// convenience properties
    	this.tools = _.extend.apply({}, _(this.pipelines).map(function(pl) {return pl.tools;}));
    	this.objectives = _.extend.apply({}, _(this.pipelines).map(function(pl) {return pl.objectives;}));
    }

    function Pipeline(config, workflow) {
    	this.id = config.id;
    	this.order = config.order;
    	this.name = config.name;
    	this.workflow = workflow;
    	this.tools = _(app.tools).objFilter(function(tool) {
    		return _(config.tool_ids).contains(tool.id);
    	});

    	// convenience properties
    	this.objectives = _(this.tools).map(function(tool) {return tool.objective;}).toDict();
    }

    // global w.r.t. the containing IIFE
    var app = {};

    // add data in order of logical dependencies, and add convenience properties for nested objects
    app.data_types = app_json.data_types.map(function(dt_cfg, order) {
    	return new DataType(_.extend(dt_cfg, {order: order}) );
    }).toDict();
    app.data_formats = _.extend.apply({}, _(app.data_types).map(function(dt) {return dt.data_formats;}));

    app.objectives = app_json.objectives.map(function(obj_cfg, order) {
    	return new Objective(_.extend(obj_cfg, {order: order}) );
    }).toDict();
    app.tools = _.extend.apply({}, _(app.objectives).map(function(obj) {return obj.tools;}));

    app.workflows = app_json.workflows.map(function(wf_cfg, order) {
    	return new Workflow(_.extend(wf_cfg, {order: order}) );
    }).toDict();
    app.pipelines = _.extend.apply({}, _(app.workflows).map(function(obj) {return obj.pipelines;}));

  	// add backreferences
  	_(app.pipelines).each(function(pl) {
    	_(pl.tools).each(function(tool) {
  			tool.pipelines[pl.id] = pl;
  		});
  	});

  	_(app.objectives).each(function(obj) {
    	_(obj.in_data_types).each(function(dt) {
  			dt.in_objectives[obj.id] = obj;
  		});
  		_(obj.out_data_types).each(function(dt) {
  			dt.out_objectives[obj.id] = obj;
  		});
  	});

// }());