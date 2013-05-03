// TODO(codedread): Migrate this into svgutils.js
// Function: getStrokedBBox
// Get the bounding box for one or more stroked and/or transformed elements
// 
// Parameters:
// elems - Array with DOM elements to check
// 
// Returns:
// A single bounding box object
getStrokedBBox = function(elems) {
	if(!elems) elems = getVisibleElements();
	if(!elems.length) return false;
	// Make sure the expected BBox is returned if the element is a group
	var getCheckedBBox = function(elem) {
	
		try {
			// TODO: Fix issue with rotated groups. Currently they work
			// fine in FF, but not in other browsers (same problem mentioned
			// in Issue 339 comment #2).
			
			var bb = svgedit.utilities.getBBox(elem);
			
			var angle = svgedit.utilities.getRotationAngle(elem);
			if ((angle && angle % 90) ||
			    svgedit.math.hasMatrixTransform(svgedit.transformlist.getTransformList(elem))) {
				// Accurate way to get BBox of rotated element in Firefox:
				// Put element in group and get its BBox
				
				var good_bb = false;
				
				// Get the BBox from the raw path for these elements
				var elemNames = ['ellipse','path','line','polyline','polygon'];
				if(elemNames.indexOf(elem.tagName) >= 0) {
					bb = good_bb = canvas.convertToPath(elem, true);
				} else if(elem.tagName == 'rect') {
					// Look for radius
					var rx = elem.getAttribute('rx');
					var ry = elem.getAttribute('ry');
					if(rx || ry) {
						bb = good_bb = canvas.convertToPath(elem, true);
					}
				}
				
				if(!good_bb) {
					// Must use clone else FF freaks out
					var clone = elem.cloneNode(true); 
					var g = document.createElementNS(svgns, "g");
					var parent = elem.parentNode;
					parent.appendChild(g);
					g.appendChild(clone);
					bb = svgedit.utilities.bboxToObj(g.getBBox());
					parent.removeChild(g);
				}
				

				// Old method: Works by giving the rotated BBox,
				// this is (unfortunately) what Opera and Safari do
				// natively when getting the BBox of the parent group
// 						var angle = angle * Math.PI / 180.0;
// 						var rminx = Number.MAX_VALUE, rminy = Number.MAX_VALUE, 
// 							rmaxx = Number.MIN_VALUE, rmaxy = Number.MIN_VALUE;
// 						var cx = round(bb.x + bb.width/2),
// 							cy = round(bb.y + bb.height/2);
// 						var pts = [ [bb.x - cx, bb.y - cy], 
// 									[bb.x + bb.width - cx, bb.y - cy],
// 									[bb.x + bb.width - cx, bb.y + bb.height - cy],
// 									[bb.x - cx, bb.y + bb.height - cy] ];
// 						var j = 4;
// 						while (j--) {
// 							var x = pts[j][0],
// 								y = pts[j][1],
// 								r = Math.sqrt( x*x + y*y );
// 							var theta = Math.atan2(y,x) + angle;
// 							x = round(r * Math.cos(theta) + cx);
// 							y = round(r * Math.sin(theta) + cy);
// 		
// 							// now set the bbox for the shape after it's been rotated
// 							if (x < rminx) rminx = x;
// 							if (y < rminy) rminy = y;
// 							if (x > rmaxx) rmaxx = x;
// 							if (y > rmaxy) rmaxy = y;
// 						}
// 						
// 						bb.x = rminx;
// 						bb.y = rminy;
// 						bb.width = rmaxx - rminx;
// 						bb.height = rmaxy - rminy;
			}
			return bb;
		} catch(e) { 
			console.log(elem, e);
			return null;
		} 
	};

	var full_bb;
	$.each(elems, function() {
		if(full_bb) return;
		if(!this.parentNode) return;
		full_bb = getCheckedBBox(this);
	});
	
	// This shouldn't ever happen...
	if(full_bb == null) return null;
	
	// full_bb doesn't include the stoke, so this does no good!
// 		if(elems.length == 1) return full_bb;
	
	var max_x = full_bb.x + full_bb.width;
	var max_y = full_bb.y + full_bb.height;
	var min_x = full_bb.x;
	var min_y = full_bb.y;
	
	// FIXME: same re-creation problem with this function as getCheckedBBox() above
	var getOffset = function(elem) {
		var sw = elem.getAttribute("stroke-width");
		var offset = 0;
		if (elem.getAttribute("stroke") != "none" && !isNaN(sw)) {
			offset += sw/2;
		}
		return offset;
	}
	var bboxes = [];
	$.each(elems, function(i, elem) {
		var cur_bb = getCheckedBBox(elem);
		if(cur_bb) {
			var offset = getOffset(elem);
			min_x = Math.min(min_x, cur_bb.x - offset);
			min_y = Math.min(min_y, cur_bb.y - offset);
			bboxes.push(cur_bb);
		}
	});
	
	full_bb.x = min_x;
	full_bb.y = min_y;
	
	$.each(elems, function(i, elem) {
		var cur_bb = bboxes[i];
		// ensure that elem is really an element node
		if (cur_bb && elem.nodeType == 1) {
			var offset = getOffset(elem);
			max_x = Math.max(max_x, cur_bb.x + cur_bb.width + offset);
			max_y = Math.max(max_y, cur_bb.y + cur_bb.height + offset);
		}
	});
	
	full_bb.width = max_x - min_x;
	full_bb.height = max_y - min_y;
	return full_bb;
}
