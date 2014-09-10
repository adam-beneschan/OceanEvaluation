// Need to redo this.  Plan is to convert something like
//             <BUTTON class="largebutton-yb" id="sessinfoselectbynamebutton" style="margin-left: auto; margin-right: auto">Select existing session by name</BUTTON>
//to this, in effect:

//   <BUTTON class="plainbutton" type="button" onfocus="turnred(this);" onblur="turnwhite(this);">
//          <SPAN class="sb2"><IMG src="oval_136x23.png" style="vertical-align: middle"/>
//            <SPAN class="sbtext">OK</SPAN>      
//          </SPAN>
//     </BUTTON>

// class .sb2 in the above example is this; the width can be changed for
// each button using css()
//      .sb2 {
//        position: relative;
//        width: 136px;
//        cursor: default
//      }
// .sbtext: probably use .x-buttontext instead.  Or should properties be
// set up by this function, so that HTML doesn't have to be polluted with
// style sheet?

// OCEFixButton: if "this" is a BUTTON element with class=smallbutton, 
// mediumbutton, or largebutton (followed optionally by something like -yb),
// this function replaces its HTML with HTML to display a blue oval with
// the button text

// PROBLEM: Although I can get it to look like a button and set up a "click"
// function on it, it still doesn't behave like a button in some important
// ways.  I think focus(), onfocus, onblur don't work for it.  Also, RETURN
// should work like click if the focus is on the button.

// Haven't yet fixed the Cancel buttons that show up for menu selection.

var OCEFixButton = function () {
   var size, imageSize, imageStyle, imageName, imageNode;
   var obj = $(this);
   var className = obj.attr("class");
   var matches = className &&
                 className.match(/^(small|medium|large)button(-(.*))?$/);
   if (matches) {
      obj.wrapInner('<SPAN class="x-buttontext"></SPAN>');
      obj.wrapInner('<SPAN></SPAN>');
      
      size = matches[1];
      imageSize = (size === "small") ? "136" :
                  (size === "medium") ? "204" : "269";
      imageStyle = (matches[3]) ? "_" + matches[3] : "";
      imageName = "oval" + imageStyle + "_" + imageSize + "x23.png";
      imageNode = '<IMG src="' + imageName + '" style="vertical-align: middle"/>';
      obj.children().prepend(imageNode);
      obj.children().css({position: "relative",
                          width: imageSize + "px",
                          cursor: "default"});
      
      // FIX: This assumes button has only one class... should fix
      obj.removeClass(className).addClass("x-plainbutton");
      var buttonText = $(".x-buttontext", obj);
      obj.focus (function (e) {
         buttonText.css("color", "red");
      });
      obj.blur (function (e) {
         buttonText.css("color", "white");
      });
   }
}

var showPHPError = function (errorHTML) {
   var errbox = $("#phperror");
   var boxHTML;
   if (errbox) {
      boxHTML =  '<DIV style="padding-bottom: 2em">';
      boxHTML += '<DIV class="phperrorbox">';
      boxHTML += '<DIV><SPAN class="phperrortext">';
      boxHTML += errorHTML;
      boxHTML += '</SPAN></DIV>';
      boxHTML += '<DIV style="padding-top: 0.5em; text-align: center">';
      boxHTML += '<BUTTON id="phperrorclose">Close</BUTTON></DIV>';
      // note: I'd like to see if I can get a button with a small red "x"
      // into the upper right corner and have other text float around it
      boxHTML += '</DIV>';
      boxHTML += '</DIV>';
      errbox.html(boxHTML);
      $("#phperrorclose").off("click");
      $("#phperrorclose").click(function () {
           errbox.html("");
         });
   }
}

var PHPErrorCheck = function (result, url, jqXHR, textStatus, errorThrown) {
   if (textStatus === 'parsererror' &&
       /^ *<br *\/>/.test(result)) {
      showPHPError ("PHP Error in " + url + ":" + result);
   } else {
      showPHPError ("Error in result of " + url + ":<br/>" +
                    errorThrown + "<br/>Data = " +
                    ((result.length >= 60) ?
                      (result.slice(0,57)+"...") :
                      result));
   }
}

var getJSONCheck = function (url, data, success) {
   var savedata;
      // Allow "data" to be optional, like with jQuery.getJSON
   if (typeof(data) === 'function') {
      success = data; data = undefined;
   }
   $.ajax({
      dataType: "json",
      url: url,
      data: data,
      dataFilter: function (data, dataType) {
         savedata = data;  return data;
      },
      success: success,
      error: function (jqXHR, textStatus, errorThrown) {
         PHPErrorCheck (savedata, url, jqXHR, textStatus, errorThrown);
      }
   });
}

var postCheck = function (url, data, success, dataType) {
   var savedata;
      // Allow "data" to be optional, like with jQuery.post
   if (typeof(data) === 'function') {
      dataType = success; success = data; data = undefined;
   }
   $.ajax({
      type: "POST",
      url: url,
      data: data,
      dataType: dataType,
//      success: success,
      success: function (data) { 
        if (success!=null) success(data);
      },
      dataFilter: function (data, dataType) {
         savedata = data;  return data;
      },
      error: function (jqXHR, textStatus, errorThrown) {
         PHPErrorCheck (savedata, url, jqXHR, textStatus, errorThrown);
      }
   });
}

// Note: .wav not supported on IE.  
var dingAudioName = "Windows Ding.wav";

var dingAudio = new Audio(dingAudioName);

var ding = function () {
    dingAudio.play();
    dingAudio = new Audio(dingAudioName);
}
