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

// jQuery's hasClass doesn't work for SVG, but this does!
// takes an object obj and checks for class has
// returns true if the class exits in obj, false otherwise
function hasClassSVG(obj, has) {
    var classes = $(obj).attr('class') || '';
    var index = classes.search(has);
      
    if (index == -1) {
      return false;
    }
    else {
      return true;
    }
}

function rgbToGrayscale(rgb) {
  var intensity = Math.round(.2126 * rgb.r + .7152 * rgb.g + .0722 * rgb.b);
  return d3.rgb('rgb('+intensity+','+intensity+','+intensity+')').toString();
}

if (Function.prototype.name === undefined && Object.defineProperty !== undefined) {
    Object.defineProperty(Function.prototype, 'name', {
        get: function() {
            var funcNameRegex = /function\s+(.{1,})\s*\(/;
            var results = (funcNameRegex).exec((this).toString());
            return (results && results.length > 1) ? results[1] : "";
        },
        set: function(value) {}
    });
}