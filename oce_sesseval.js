// Notes: Working fine with Chrome.  But IE is having some problems.
// If I submit data, it works OK, but doesn't issue the command to get
// new counts.  Also, when I tried "select session by name", in IE, at
// least once I got no response until I clicked a different button.
// ding() doesn't work (IE doesn't support .wav used this way).

// TODO: Test this when session titles/names contain & or other characters
// special to HTML.

$(function () {
   
   var evalEntries;  // array indexed by the question index (0-relative),
                     // value is "1".."5" if entered, "0" if not
   var origColor;    // saves the original background color of the 1..5 digits
                     // (Not used since I'm now circling with redoval.png,
                     // but I might want to do this if the image doesn't work)
   var lastEntry;
   var currSession;
   var menuUp;
   var currInfo = {};
   var fieldNames = ["title", "name", "ins1", "ins2"];
      // must be in the order returned by the server
   var currNumIns;
   var currNumEntries;
   var saveQuestions;

   var rowsize = 5;  // number of columns per row

   var addSessEntryTable = function (info, numIns) {
      var tabHTML = "";
      var numEntries;
      var i, j, k, ins, elname;
      
      numIns = numIns || 1;
      if (numIns === currNumIns)
         return;
      if (currNumIns) 
         removeSessEntryTable();
      currNumIns = numIns;

      if (info)
         saveQuestions = info;
      else
         info = saveQuestions;
      numEntries = info.length;

      // Note: There's no actual "submit" for this form; I've set up
      // the Submit button so that it does an Ajax POST directly, since
      // I don't want the browser to actually leave the page.  I'm
      // setting it up as a form, however, so that the browser will
      // still obey some of the rules for forms that I don't override
      // (if there are still any!).
      tabHTML = '<FORM>';
      tabHTML += '<TABLE border="1" frame="border" rules="all" ' +
                 'align="center" width="90%">';
      tabHTML += '<COLGROUP span="' + rowsize + 
                 '" width="' + Math.floor(100 / rowsize) + '%">';
      for (ins = 1; ins <= numIns; ins++)  {
         if (numIns > 1) {
            tabHTML += '<TR><TD align="center" colspan="' + rowsize + '">' +
                       '<SPAN style="color: blue; font-weight: bolder">' +
                       'Instructor ' + ins + '</SPAN></TD>';
         }
         
         // Each row will have up to three input boxes.  This loop loops
         // over each row, with "i" being the index of the first item in
         // the row and being incremented by 'rowsize' each time.
         for (i = 0; i < numEntries; i += rowsize) {
            
            // Set up headings
            tabHTML += "<TR>";
            for (j = 0; j < rowsize && i + j < numEntries; j++) {
               tabHTML += '<TD align="center">' + info[i + j] + "</TD>";
            }
            if (j < rowsize) {
               tabHTML += '<TD rowspan="2" colspan="' + (rowsize - j) + '"></TD>';
            }
            tabHTML += "</TR>";
            
            // Set up the input boxes.  INPUT box names have id
            // entry<n>.  The digits 1..5 have id val<n>-<d> where d is
            // the digit.
            tabHTML += "<TR>";
            for (j = 0; j < rowsize && i + j < numEntries; j++) {
               tabHTML += '<TD align="center">';
               elname = "entry" + ((ins - 1) * numEntries + i + j);
               tabHTML += '<INPUT name="' + elname + '" id="' + elname +
                          '" type="text" ' +
                          'size="2" maxlength="2" class="evalinput"><BR>';
               // The following will result in an inline box composed of
               // five block boxes, each one containing one digit (1..5)
               // centered in the box, and each one with the width and 
               // height set to the dimensions of the red oval that will 
               // encircle it
               tabHTML += '<SPAN style="display: inline-block" align="center">';
//             for (k = 1; k <= 5; k++) {
               for (k = 5; k >= 1; k--) {
                  tabHTML += '<SPAN id="val' + ((ins - 1) * numEntries + i + j)
                             + '-' + k +
                             '" class="evalnum">' + k + '</SPAN>';
               }
               tabHTML += "</SPAN></TD>";
            }
            tabHTML += "</TR>";
         }
      }
      tabHTML += "</TABLE>";
      tabHTML += '<DIV align="center" style="padding-top: 1em; padding-bottom: 1em">';
      tabHTML += '<BUTTON name="submit" id="submitbutton" class="smallbutton">Submit</BUTTON>';
      tabHTML += '<SPAN style="padding-right: 3em"></SPAN>';
      tabHTML += '<BUTTON name="clear" id="clearbutton" class="smallbutton" type="reset">Clear</BUTTON>';
      tabHTML += '</DIV>';
      tabHTML += "</FORM>";
      $("#entrytable").html(tabHTML);
      // PROBABLY: change this to a map.  OCEFixButton should set some sort
      // of data indicating that a button has been fixed.
      OCEFixButton.call($("#submitbutton"));
      OCEFixButton.call($("#clearbutton"));
      for (i = 0; i < numEntries * numIns; i++) {
         $("#entry" + i).keydown(evalKeyPress);
      }
      $("#submitbutton").off("click");
      $("#submitbutton").click(postData);
      $("#clearbutton").off("click");
      $("#clearbutton").click(clearAllEntries);
      evalEntries = [];
      for (i = 0; i < numEntries * numIns; i++)
         evalEntries[i] = "0";
      origColor = $("#val0-1").css("background-color");  
      lastEntry = numEntries * numIns - 1;
   };
   
   var removeSessEntryTable = function () {
      var el, i;
      for (i = 0; i < currNumEntries * currNumIns; i++) {
         $("#entry" + i).off("keydown", evalKeyPress);
      }
   }

   var checkEvalTable = function () {
      var tables = (currInfo.ins2) ? 2 : 1;
      if (tables != currNumIns)
         addSessEntryTable (null, tables);
   }

   var setIndication = function (index) {
      var currVal = evalEntries[index];
      if (currVal !== "0") {
         $("#val" + index + "-" + currVal)
//          .css({"background-color": "red", color: "white"});
            .css("background-image", "url(redoval.png)");
         // TODO: if I can figure out how to catch error if URL is wrong,
         // set things up to revert to background color method
      }
   };

   var clearIndication = function (index) {
      var currVal = evalEntries[index];
      if (currVal !== "0") {
         $("#val" + index + "-" + currVal)
//          .css({"background-color": origColor, color: "black",
            .css("background-image", "none");
      }
   };

   var setEntry = function (index, val) {
      clearIndication(index);
      evalEntries[index] = val;
      setIndication(index);
   };

   var clearEntry = function (index) {
      clearIndication(index);
      evalEntries[index] = "0";
   };

   var clearAllEntries = function () {
      var i;
      for (i = 0; i <= lastEntry; i++) {
         clearEntry(i);
         $("#entry" + i).val("");
      }
      $("#entry0").focus();
   };

   var evalKeyPress = function(e) {
      var matches = this.id.match(/^entry([0-9]+)$/);
      var key, whichEntry, nextEl, whereNext;
      if (matches) {
         if (e.key !== undefined)
            key = e.key;
         else {
            // Chrome doesn't seem to support "key" property
            if (e.keyCode == 8)       key = "Backspace";
            else if (e.keyCode == 37) key = "Left";
            else if (e.keyCode == 39) key = "Right";
            else if (e.keyCode == 9)  key = "Tab";
            else                      key = String.fromCharCode (e.keyCode);
         }
         whichEntry = +matches[1];
         if (key.length === 1 && key >= "0" && key <= "5" || key === " ") {
            if (key >= "1" && key <= "5") 
               setEntry(whichEntry, key);
            else 
               clearEntry(whichEntry);
            this.value = (key === "0") ? " " : key;
            whereNext = 'forward';            
         }
         else if (key.match(/^(backspace|left)$/i)) 
            whereNext = 'backward';
         else if (key.match(/^(tab|right)$/i)) 
            whereNext = 'forward';
         else {
            ding ();
            whereNext = '';
         }
         if (whereNext === 'forward') {
            nextEl = (whichEntry >= lastEntry) ? null :
                        $("#entry" + (whichEntry + 1));
            nextEl = nextEl || $("#submitbutton") || $("#entry0");
               // CHECK: is this correct?
            nextEl.focus();
         }
         else if (whereNext === 'backward') {
            nextEl = (whichEntry <= 0) ? null : $("#entry" + (whichEntry - 1));
            nextEl = nextEl || ("#entry" + lastEntry);
               // CHECK: is this correct?
            nextEl.focus();
         }
         e.preventDefault ();
      }
   };

   var postData = function (e) {
      var data = {};
      var i;
      e.preventDefault();  // appears to be necessary to prevent some 
                           // sort of default.  I have no idea what this
                           // default is.
      for (i = 0; i <= lastEntry; i++) {
         data["entry" + i] = $("#entry" + i).val();
      }
      data["currSession"] = currSession;
      postCheck("addsesseval.php", data, null, "text");
      clearAllEntries();
      updateCounts();
   };

   // selectType is "title" or "name"
   var setupMenu = function (selectType) {
      getJSONCheck("getsessionsby" + selectType + ".php", function (data) {
                        var menu = '<SELECT id="session' + selectType + 
                                   '" name="session' + selectType + 
                                   '">';
                        var cancelName;
                        //menu += '<OPTION value=""></OPTION>';
                        for (var i in data) {
                           menu += '<OPTION value="' + data[i][1] +
                                   '" >' + data[i][0] + '</OPTION>';
                        }
                        menu += '</SELECT>';
                        cancelName = "menucancel" + selectType;
                        menu += '<INPUT type="button" value="Cancel" id="' + cancelName + '">';
                        $("#sessinfo" + selectType).html(menu);
                        $("#" + cancelName).off("click");
                        $("#" + cancelName).click(function (e) {
                           refreshInfo (selectType);
                        });
                        if (menuUp)
                           refreshInfo (menuUp);
                        menuUp = selectType;
                        $("#session" + selectType)
                           .change(function (e) {
                               currSession = this.value;
                               updateCounts();
                               updateInfo();
                            });
                        $("#session" + selectType).toArray()[0].value = "";
                        // .val("") doesn't work in jQuery since "" isn't one
                        // of the menu elements; I've suggested a change
                     });
   }

   var addNewSession = function () {
      var fields = {};
      var setupInputField = function (name) {
          var el = $("#sessinfo" + name);
          el.html
             ('<INPUT type="text" size="40" maxlength="100" name="inputfield'+name+'">');
          fields[name] = el.children().first();
      
      }
      setupInputField ("title");
      setupInputField ("name");
      setupInputField ("ins1");
      setupInputField ("ins2");
                
      $("#sessinfobuttons").show();
      $("#sessinfoaddbutton").hide();
      $("#sessinfoselectbytitlebutton").hide();
      $("#sessinfoselectbynamebutton").hide();

      $("#sessinfookbutton").off("click");
      $("#sessinfookbutton").click(function () {
         var data, m;
         if (fields.title.val() && fields.name.val() && fields.ins1.val()) {
            data = {title: fields.title.val(),
                    name: fields.name.val(),
                    ins1: fields.ins1.val(),
                    ins2: fields.ins2.val()};
            postCheck  ("addsessinfo.php", data, 
                        function (data) {
                           m = data.match(/^ERROR: (.*)$/);
                           if (m) {
                              $("#sessinfomessage").html("<P>" + m[1] + "<P>");
                              $("#sessinfomessage").show();
                           } else {
                              $("#sessinfobuttons").hide();
                              $("#sessinfomessage").hide();
                              $("#sessinfoaddbutton").show();
                              $("#sessinfoselectbytitlebutton").show();
                              $("#sessinfoselectbynamebutton").show();
                              currSession = data;
                              updateInfo();
                              updateCounts();
                           }
                        },
                        "json");
         } else {
            $("#sessinfomessage").hide();
            $("#sessinfomessage").html(
              "<P>The title, session name, and Instruction 1 fields are " +
              "required<P>");
            $("#sessinfomessage").show();
         }
      });
      $("#sessinfocancelbutton").off("click");
      $("#sessinfocancelbutton").click(function () {
         refreshInfo();  
         $("#sessinfobuttons").hide();
         $("#sessinfomessage").hide();
         $("#sessinfoaddbutton").show();
         $("#sessinfoselectbytitlebutton").show();
         $("#sessinfoselectbynamebutton").show();
      });
   }

   var setupInfoButtons = function () {
      $("#sessinfoaddbutton").off("click");
      $("#sessinfoaddbutton").click(addNewSession);
      $("#sessinfoselectbytitlebutton").off("click");
      $("#sessinfoselectbytitlebutton")
          .click(function () { setupMenu ("title"); });
      $("#sessinfoselectbynamebutton").off("click");
      $("#sessinfoselectbynamebutton")
          .click(function () { setupMenu ("name"); });
   }
   
   var updateCounts = function () {
      if (currSession) {
         getJSONCheck  ("getsessevalcount.php", {currSession: currSession},
                        function (data) {
                            $("#sessevalcount").html(data + "");
                        });
      }
      getJSONCheck  ("getsessevaltotal.php", 
                     function (data) {
                         $("#sessevaltotal").html(data + "");
                     });
   }

   var updateInfo = function () {
      getJSONCheck ("getsessinfo.php", {currSession: currSession},
                     function (data) {
                         var fieldName;
                         for (var i = 0; i < fieldNames.length; i++) {
                            fieldName = fieldNames[i];
                            currInfo[fieldName] = (data) ? data[i] : "";
                            $("#sessinfo" + fieldName)
                               .html(currInfo[fieldName]);
                         }
                         menuUp = null;
                         checkEvalTable();
                     });
   }
   
      // if refreshName is present, refreshes only that field, else
      // refreshes all fields
   var refreshInfo = function (refreshName) {
      var fieldName;
      for (var i = 0; i < fieldNames.length; i++) {
         fieldName = fieldNames[i];
         if (!refreshName || fieldName === refreshName) {
            $("#sessinfo" + fieldName).html
                ((currInfo[fieldName] === undefined) ? "" :
                     currInfo[fieldName]);
            if (fieldName === menuUp)
               menuUp = null;
         }
      }     
   }

   getJSONCheck("getsessconfig.php", function (data) {
                   addSessEntryTable(data);
                 });
   setupInfoButtons ();
   updateCounts ();
   $("BUTTON").map(OCEFixButton);
});

