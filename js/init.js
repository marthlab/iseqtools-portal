require.config({
  baseUrl: app_config.base_url+"/js/libs",
  paths: {
      app: '../mylibs' 
  },
  shim: {
    "app/main": {
      deps: ["underscore"]
    },
    davis: {
      deps: ["jquery"]
    },
    jquery_svg: {
      deps: ["jquery"]
    },
    jquery_svgdom: {
      deps: ["jquery", "jquery_svg"]
    },
    underscore: {
      exports: '_'
    }
  }
});

require([
   'jquery', 'underscore', 'app/main'
], function(jquery, underscore, main) {


});