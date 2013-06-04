function Summary(cfg) {
	_(this).extend(_(cfg).pickStrings('description'));
}
Summary.prototype.graphable = false;

function Team(cfg) {
	_(this).extend(_(cfg).pickStrings('id', 'name'));
}
Team.prototype.graphable = false;

function DataType(cfg) {
	_(this).extend(_(cfg).pickStrings('id', 'name'));
}
DataType.prototype.graphable = false;

function Task(cfg) {
	_(this).extend(_(cfg).pickStrings('id', 'name'));
	this.in_data_types = cfg.in_data_types_ids.map(function(dt_id){ return _(gdata.data_types).find(by_id(dt_id));});
	this.out_data_types = cfg.out_data_types.map(function(dt_cfg){ return _(gdata.data_types).find(by_id(dt_cfg.id));});

	// references populated later
	this.workflows = {};
}
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
Workflow.prototype.graphable = true;

function DataFormat(cfg) {
	_(this).extend(_(cfg).pickStrings('id'));
	this.name = cfg.name || cfg.id;
	//this.data_type = _(gdata.tasks).find(by_id(cfg.data_type_id)) || null;
}
DataFormat.prototype.graphable = false;

function Tool(cfg) {
	_(this).extend(_(cfg).pickStrings('id'));
	this.name = cfg.name || cfg.id;

	this.parent_tool = cfg.parent_tool || null;
	this.team = _(gdata.teams).find(by_id(cfg.team_id)) || (this.parent_tool && this.parent_tool.team) || null;

	this.subtools = (cfg.subtools || []).map(function(subtool_cfg){
		return new Tool(_.extend(subtool_cfg, {parent_tool: this}));
	}, this);

}
Tool.prototype.graphable = false;
Tool.prototype.getTeam = function() {

}

function Pipeline(cfg) {
	_(this).extend(_(cfg).pickStrings('id', 'name'));
	cfg.initial_data_format_usages = cfg.initial_data_format_usages || [];

	this.team = _(gdata.teams).find(by_id(cfg.team_id)) || null;
	this.workflow = _(gdata.workflows).find(by_id(cfg.workflow_id));
	this.data_types = cfg.data_types_ids.map(function(dt_id){ return _(gdata.data_types).find(by_id(dt_id));});

	var create_dfu = function(dfu_cfg){
		return new DataFormatUsage(_.extend(dfu_cfg, {pipeline: this}));
	};

  this.data_format_usages = _.flatten(_(cfg.tool_usages.map(function(tu_cfg) {
  	return tu_cfg.out_data_format_usages.map(create_dfu, this);
  }, this)).union(cfg.initial_data_format_usages.map(create_dfu, this)), true);
	
	this.tool_usages = cfg.tool_usages.map(function(tu_cfg) {
  	return new ToolUsage(_.extend(tu_cfg, {pipeline: this}));
  }, this);

  this.tools = _.uniq(this.tool_usages.map(function(tu) { return tu.tool;}));
}
Pipeline.prototype.graphable = true;

function DataFormatUsage(cfg) {
	_(this).extend(_(cfg).pickStrings('id'));
	this.multiple = cfg.multiple || false;
	this.pipeline = cfg.pipeline;
	this.data_format = _(gdata.data_formats).find(by_id(cfg.data_format_id));
}
DataFormatUsage.prototype.graphable = false;

function ToolUsage(cfg) {
	_(this).extend(_(cfg).pickStrings('id'));
	this.pipeline = cfg.pipeline;
	this.tool = _(gdata.tools).find(by_id(cfg.tool_id));
	this.task = _(gdata.tasks).find(by_id(cfg.task_id)) || null;

	this.in_data_format_usages = cfg.in_data_format_usages_ids.map(function(dfu_id){ return _(this.pipeline.data_format_usages).find(by_id(dfu_id));}, this);
	this.out_data_format_usages = cfg.out_data_format_usages.map(function(dfu_cfg){ return _(this.pipeline.data_format_usages).find(by_id(dfu_cfg.id));}, this);
}
ToolUsage.prototype.graphable = true;