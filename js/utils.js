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

String.prototype.toTitleCase = function () {
    return this.replace(/([^\W_]+[^\s-]*) */g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
};

Array.prototype.toEnglishList = function () {
    var len = this.length;
    if(len == 0) {
      return "";
    } else if(len == 1) {
      return this[0];
    } else if(len == 2) {
      return this[0] + ' and ' + this[1];
    } else if(len > 2) {
      this[len-1] = 'and ' + this[len-1];
      return this.join(", ");
    }
};

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000)
             .toString(16)
             .substring(1);
};

function guid() {
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
         s4() + '-' + s4() + s4() + s4();
}