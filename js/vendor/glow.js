function grayscale(url, defs) {
  var colorMatrix = "0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0 0 0 1 0";

  function my() {

    var filter = defs.append("filter")
        .attr("id", url)
      .call(function() {
        this.append("feColorMatrix")
            .attr("type", "matrix")
            .attr("values", colorMatrix);

      });

  }

  return my;
}

function glow(url, defs) {
  var stdDeviation = 2,
      rgb = "#000",
      colorMatrix = "0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0";

  if (!arguments.length) {
    url = "glow";
  }

  function my() {

    var filter = defs.append("filter")
        .attr("id", url)
        .attr("x", "-20%")
        .attr("y", "-20%")
        .attr("width", "140%")
        .attr("height", "140%")
      .call(function() {
        this.append("feGaussianBlur")
            .attr("stdDeviation", stdDeviation)
            .attr("result", "coloredBlur");
      });

    filter.append("feMerge")
      .call(function() {
        
        this.append("feMergeNode")
            .attr("in", "SourceGraphic");
        this.append("feMergeNode")
            .attr("in", "coloredBlur");

      });
  }

  my.rgb = function(value) {
    if (!arguments.length) return color;
    rgb = value;
    color = d3.rgb(value);
    var matrix = "0 0 0 red 0 0 0 0 0 green 0 0 0 0 blue 0 0 0 1 0";
    colorMatrix = matrix
      .replace("red", color.r)
      .replace("green", color.g)
      .replace("blue", color.b);

    return my;
  };

  my.stdDeviation = function(value) {
    if (!arguments.length) return stdDeviation;
    stdDeviation = value;
    return my;
  };

  return my;
}