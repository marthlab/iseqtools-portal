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

/*
 * parses any RSS/XML feed through Google and returns JSON data
 * source: http://stackoverflow.com/a/6271906/477958
 */
function parseRSS(url, location, container) {
  $.ajax({
    url: document.location.protocol + '//ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=300&callback=?&q=' + encodeURIComponent(url),
    dataType: 'json',
    cache: false,
    success: function(data) {


      window.blog_tags = new Object();
      window.blog_archives = new Object();
      window.blog_content = [];
      window.blog_feed_link = data.responseData.feed.link;

      var idx = 0;
      $.each(data.responseData.feed.entries, function(key, value){
        // Format publish date
        var myDate = new Date(value.publishedDate);
        var dateString = (myDate.getMonth() + 1) + "-" + myDate.getDate() + "-" + myDate.getFullYear();
        // Format author
        var authorString = value.author;
        var re = /.*\((.*)\)/g;
        var tokens = re.exec(authorString);
        if (tokens.length > 1) {
          authorString = tokens[1];
        }
        // Store formatted fields in value
        value.dateString = dateString;
        value.authorString = authorString;
        value.id = idx++;

        var pos = value.link.indexOf(window.blog_feed_link);
        if(pos == 0) {
          value.postID = value.link.substring(window.blog_feed_link.length, value.link.length - 1);
        }



        // Store the blog content in an array
        window.blog_content.push(value);

        // Map the tags (and counts)
        for (var i = 0; i < value.categories.length; i++) {
          var tag = value.categories[i];
          var count = 1;
          if (blog_tags[tag]) {
            count += window.blog_tags[tag];
          } 
          window.blog_tags[tag] = count;
        }

        // Map the blog archive          
        var archive_key = (myDate.getMonth() + 1) + '-' + myDate.getFullYear();        
        var posts = window.blog_archives[archive_key];
        if (posts == null) {
          posts = [];
        } 
        posts.push(value);
        window.blog_archives[archive_key] = posts;



      });


      // Does the url contain a link to a specific url?
      var current_idx = -1;
      var re = /.*?blog#(.*)$/g;
      var tokens = re.exec(window.location.href);
      if (tokens && tokens.length > 1) {
        var post_id= tokens[1];
        for (var i = 0; i < blog_content.length; i++) {
          if (blog_content[i].link == post_id) {
            current_idx = i;
            break;
          }
        }
      }

      if (current_idx == -1) {
        // Display the post cards
        displayBlogCards('All');        
      } else {
        // Display a specific post that was specified in the URL
        displayBlogEntry(current_idx);
      }

      // Display tags
      displayBlogTags();

      // Show recent posts
      $(location).html('<ul id="rsslist"></ul>');
      displayRecentPosts();

      // Display blog archive
      displayPostArchive();


    }
  });
}

function displayBlogTags() {
  var tag_html = "";
  $('#blog_tags').html( '<li class="active"><a href="" id="all">All</a></li>');

  for (var tag in window.blog_tags) {
    $('#blog_tags').append( '<li><a href="" id="' + tag + '">' + tag + '</a></li>');
  }

  $('#blog_tags').click(function(e) { 
    $("#blog_tags li").removeClass("active");
    $("#rsslist li").removeClass("active");
    $("#blog_archives li").removeClass("active");

    var tag = e.target.text;
    displayBlogCards(tag);
  });  
}

function displayRecentPosts() {


    for (var i = 0; i < Math.min(blog_content.length, 5); i++) {
        // Create the blog list item
        var html =  '<li class="blog_list_item" data-post-id="' +blog_content[i].postID + '" id="'+blog_content[i].id+'">'+blog_content[i].title;        
        html     += '</li>'   
        $('#rsslist').append(html);
    }

    // Handle click event on blog list item
    $('#rsslist').click(function(e) { 
      var idx = +e.target.id;
      var postID = e.target.attributes['data-post-id'].value;

      $("#blog_archives li").removeClass("active");
      $("#rsslist li").removeClass("active");
      $('#rsslist li:eq('+(idx)+')').addClass("active");

      displayBlogEntry(idx);

      window.location.href = window.location.href.replace( /[\?#].*|$/, "?blog#" + postID );

    });

}

function displayPostArchive() {

  var html = '';
  for (var archive_key in window.blog_archives) {
    html += '<div>';
    html += archive_key;
    html += '<ul>';

    var posts = window.blog_archives[archive_key];
    for (var i = 0; i < posts.length; i++) {
      var post = posts[i];
      html += '<li class="blog_list_item" data-post-id="' +post.postID + '" id="' + post.id + '">' + post.title + '</li>';
    }
    html += '</ul></div>';
  }

  $('#blog_archives').html(html);

  // Handle click event on blog list item
    $('#blog_archives').click(function(e) { 
      var idx = +e.target.id;
      var postID = e.target.attributes['data-post-id'].value;

      $("#rsslist li").removeClass("active");
      $("#blog_archives li").removeClass("active");
      $('#blog_archives li:eq('+(idx)+')').addClass("active");

      displayBlogEntry(idx);

      window.location.href = window.location.href.replace( /[\?#].*|$/, "?blog#" + postID );

    });

}

function displayBlogCards(tag) {
  // Show all of the blog cards
  $('#blog_entry').css("display", "none");
  $('#blog_cards').css("display", "block");
  $('#blog_cards').html("");

  for (var i = 0; i < blog_content.length; i++) {
    var showCard = false;
    if (tag == null || tag == 'All') {
      showCard = true;
    } else {
      for (var x = 0; x < blog_content[i].categories.length; x++) {
        if (blog_content[i].categories[x] == tag) {
          showCard = true;
          break;
        }
      }
    }
    if (showCard) {
      displayBlogCard(blog_content[i]);
    }
  }

  $('.blog_read_more').click(function(e) { 
    var idx = +e.target.id;
    var postID = e.target.attributes['data-post-id'].value;
    
    displayBlogEntry(idx);
    
    window.location.href = window.location.href.replace( /[\?#].*|$/, "?blog#" + postID );
  });

}

function displayBlogCard(value) {
  var img= null;
  var re = /.*?<img\s+[^>]*src="([^"]*)"[^>]*>.*?/i;
  var tokens = value.content.match(re);
  if (tokens && tokens.length > 1) {
    img = '<img src="' + tokens[1] + '"/>';
  }

  var html = '';
  html += '<div class="blog_card" id="'+value.id+'">';

  html += '<h1 id="blog_title">'+value.title+'</h1>';
 

  if (img) {
    html += '<div class="blog_image">'+ img + '</div>';
  }
    
  html += '<hr>';
  html += '<div class="blog_border" style="background-color:#ED4B1F;"></div>';

  html += '<div id="blog_snippet">' + value.contentSnippet + '</div>';

  html += '<div><a href="#' + value.postID + '" class="blog_read_more" data-post-id="' + value.postID + '" id="' + value.id + '">Read More</a></div>';
  html += '<hr>';

  html += '<div class="blog_info">';
  html += '<span id="blog_author"><i class="icon-user blog_icon"></i>' + value.authorString + '</span>';
  html += '<span id="blog_date"><i class="icon-calendar blog_icon"></i>' + value.dateString + '</span>';
  html += '</div>';  


  html += '</div>'; 

  $('#blog_cards').append(html); 
}

function displayBlogEntry(idx) {
  var html = '<span id="blog_author"><i class="icon-user blog_icon"></i>' + window.blog_content[idx].authorString + '</span>';
  html    += '<span id="blog_date"><i class="icon-calendar blog_icon"></i>' + window.blog_content[idx].dateString + '</span>';


  $('#blog_entry').css("display", "block");
  $('#blog_cards').css("display", "none");
  $('#blog_title').text(window.blog_content[idx].title);
  $('#blog_entry .blog_info').html(html);
  $('#blog_content').html(window.blog_content[idx].content);  
}

/**
 * Capitalizes the first letter of any string variable
 * source: http://stackoverflow.com/a/1026087/477958
 */
function capitaliseFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Customize twitter feed                                                                                                                                                      
function styleTwitterTimeline() {                                                                    
    setTimeout( function() {                                                                           
        var list = document.getElementsByTagName('iframe');                                            
        if (list.length ) {                                                                            
            Array.prototype.forEach.call(                                                              
                list,                                                                                  
                function(element){      
                    var otherhead = element.contentDocument.getElementsByTagName("head")[0];
                    var link = element.contentDocument.createElement("link");
                    link.setAttribute("rel", "stylesheet");
                    link.setAttribute("type", "text/css");
                    link.setAttribute("href", "css/twitter.css");
                    otherhead.appendChild(link);

                    link = element.contentDocument.createElement("link");
                    link.setAttribute("rel", "stylesheet");
                    link.setAttribute("type", "text/css");
                    link.setAttribute("href", "http://fonts.googleapis.com/css?family=Lato");
                    otherhead.appendChild(link);
                });                                                                                    
        }                                                                                              
                                                                                            
    }, 1500);                                                                                          
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