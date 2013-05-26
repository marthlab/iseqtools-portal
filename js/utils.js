_.mixin({
  sum : function(arr) {
    if (!$.isArray(arr) || arr.length == 0) return 0;
	  return _.reduce(arr, function(sum, n) {
	    return sum += n;
	  });
  },
  pickStrings : function(obj) {
    var copy = {};
    var keys = Array.prototype.concat.apply(Array.prototype, Array.prototype.slice.call(arguments, 1));
    _.each(keys, function(key) {
      if (key in obj) copy[key] = (obj[key]).toString();
    });
    return copy;
  }
});

function by_id(id) {
	return function(element) { return element.id == id; }
}

function sign(x) { return x ? x < 0 ? -1 : 1 : 0; }

String.prototype.toUnderscore = function(){
  return this.replace(/\W+/g, '_')
                .replace(/([a-z\d])([A-Z])/g, '$1_$2').toLowerCase();
};