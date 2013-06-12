var gdata_mixin = {
	type: function() { return this.constructor.name.toUnderscore(); },
	url: function() { 
		var type = this.type();
		if(type == "summary") {
			return "/";
		} else if(type == "tool_usage") {
			return '/pipelines/'+this.pipeline.id+'/tool_usages/'+this.id;
		} else {
			return '/'+type+'s/'+this.id;
		}
	}
}

function Summary(cfg) {
	_(this).extend(_(cfg).pickStrings('description'));
}
_.extend(Summary.prototype, gdata_mixin);
Summary.prototype.graphable = true;

function Team(cfg) {
	_(this).extend(_(cfg).pickStrings('id', 'name'));
}
_.extend(Team.prototype, gdata_mixin);
Team.prototype.graphable = false;

function DataType(cfg) {
	_(this).extend(_(cfg).pickStrings('id', 'name'));
}
_.extend(DataType.prototype, gdata_mixin);
DataType.prototype.graphable = false;

function Task(cfg) {
	_(this).extend(_(cfg).pickStrings('id', 'name'));
	this.in_data_types = cfg.in_data_types_ids.map(function(dt_id){ return _(gdata.data_types).find(by_id(dt_id));});
	this.out_data_types = cfg.out_data_types.map(function(dt_cfg){ return _(gdata.data_types).find(by_id(dt_cfg.id));});

	// references populated later
	this.workflows = {};
}
_.extend(Task.prototype, gdata_mixin);
Task.prototype.graphable = false;

function Workflow(cfg) {
	_(this).extend(_(cfg).pickStrings('id', 'name', 'question'));
	this.tasks = cfg.tasks_ids.map(function(task_id){ return _(gdata.tasks).find(by_id(task_id));});

	this.data_types = _.union.apply(this,
		this.tasks.map(function(task) { return _.union(task.in_data_types, task.out_data_types); })
	);

	this.in_data_types = this.data_types.filter(function(dt) { return _(this.tasks.filter(function(task){ return _(task.out_data_types).contains(dt); })).isEmpty();}, this);
	this.out_data_types = this.data_types.filter(function(dt) { return _(this.tasks.filter(function(task){ return _(task.in_data_types).contains(dt); })).isEmpty();}, this);
}
_.extend(Workflow.prototype, gdata_mixin);
Workflow.prototype.graphable = true;

function DataFormat(cfg) {
	_(this).extend(_(cfg).pickStrings('id'));
	this.name = cfg.name || cfg.id;
	//this.data_type = _(gdata.tasks).find(by_id(cfg.data_type_id)) || null;
}
_.extend(DataFormat.prototype, gdata_mixin);
DataFormat.prototype.graphable = false;

function Tool(cfg) {
	_(this).extend(_(cfg).pickStrings('id'));
	this.name = cfg.name || cfg.id;

	this.parent_tool = cfg.parent_tool || null;
	this.team = (this.parent_tool && this.parent_tool.team) || (!this.parent_tool && _(gdata.teams).find(by_id(cfg.team_id))) || null;

	this.subtools = (cfg.subtools || []).map(function(subtool_cfg){
		return new Tool(_.extend(subtool_cfg, {parent_tool: this}));
	}, this);

}
_.extend(Tool.prototype, gdata_mixin);
Tool.prototype.graphable = false;

function Pipeline(cfg) {
	_(this).extend(_(cfg).pickStrings('id', 'name'));
	cfg.initial_data_format_usages = cfg.initial_data_format_usages || [];

	this.team = _(gdata.teams).find(by_id(cfg.team_id)) || null;
	this.workflow = _(gdata.workflows).find(by_id(cfg.workflow_id));
	this.data_types = cfg.data_types_ids.map(function(dt_id){ return _(gdata.data_types).find(by_id(dt_id));});

	var create_dfu = function(dfu_cfg){
		return new DataFormatUsage(_.extend(dfu_cfg, {pipeline: this}));
	};

	this.in_data_format_usages = cfg.initial_data_format_usages.map(create_dfu, this);

  this.data_format_usages = _.flatten(_(cfg.tool_usages.map(function(tu_cfg) {
  	return tu_cfg.out_data_format_usages.map(create_dfu, this);
  }, this)).union(this.in_data_format_usages), true);
	
	this.tool_usages = cfg.tool_usages.map(function(tu_cfg) {
  	return new ToolUsage(_.extend(tu_cfg, {pipeline: this}));
  }, this);

  this.out_data_format_usages = this.data_format_usages.filter(function(dfu) {
  	return _(this.tool_usages.filter(function(tu){
  		return _(tu.in_data_format_usages).contains(dfu);
  	})).isEmpty();
  }, this);

  this.tools = _.uniq(this.tool_usages.map(function(tu) { return tu.tool;}));
}
_.extend(Pipeline.prototype, gdata_mixin);
Pipeline.prototype.graphable = true;

function DataFormatUsage(cfg) {
	_(this).extend(_(cfg).pickStrings('id'));
	this.multiple = cfg.multiple || false;
	this.pipeline = cfg.pipeline;
	this.data_format = _(gdata.data_formats).find(by_id(cfg.data_format_id));
}
_.extend(DataFormatUsage.prototype, gdata_mixin);
DataFormatUsage.prototype.graphable = false;

function ToolUsage(cfg) {
	_(this).extend(_(cfg).pickStrings('id'));
	this.pipeline = cfg.pipeline;
	this.tool = _(gdata.tools).find(by_id(cfg.tool_id));
	this.task = _(gdata.tasks).find(by_id(cfg.task_id)) || null;

	this.in_data_format_usages = cfg.in_data_format_usages_ids.map(function(dfu_id){ return _(this.pipeline.data_format_usages).find(by_id(dfu_id));}, this);
	this.out_data_format_usages = cfg.out_data_format_usages.map(function(dfu_cfg){ return _(this.pipeline.data_format_usages).find(by_id(dfu_cfg.id));}, this);
}
_.extend(ToolUsage.prototype, gdata_mixin);
ToolUsage.prototype.graphable = true;