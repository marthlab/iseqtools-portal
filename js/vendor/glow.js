function glow(url) {
  var colorMatrix = "0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0.3333 0.3333 0.3333 0 0 0 0 0 1 0";

  function my() {

    var defs = this.append("defs");

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