// This page retrieves data on questions from getconfconfig.php, which
// is used to build the form.  Predefined question types: 'number'
// allows keypress 0-9, or enter = or # to allow number 10 or larger.
// 'yn' means 1=yes 2=no (also allows YyNn), 'none' outputs the
// question in gray and doesn't set up a box, others need to be
// defined in "answers".  If 'list' is present, the question is
// followed by a sub-question for each list element.  Posted object
// contains properties: answer-<q> is answer to question where <q> is
// "q" property (question number); in list case answer-<q>-<index>,
// index is index in list, 1-relative.

// TODO 5/21/13
// Consider smaller font so that it fits vertically without scrolling
// Need to figure out what to do if options are too long

$(function () {
   
   var inputField = [];
   var evalEntries = [];     // array parallel to inputField, contains
                             // the selected option
   var answerLists;
   
   var createFormInput = function (elname, qtype, ans, question) {
     var item = "";
     var answers, i;
     if (qtype === 'number') {
       item += '<INPUT name="' + elname + '" id="' + elname +
               '" type="text" size="3" maxlength="3">' +
               '<SPAN id="option-' + question + '-val" class="numericval" ' +
               'style="padding-left: 0.4em">' +
               '</SPAN>';
     } else {
       answers = (qtype === 'yn') ? ["Yes", "No"] : 
                 (ans[qtype] || ["Unknown"]);
       item += '<INPUT name="' + elname + '" id="' + elname +
               '" type="text" size="2" maxlength="2">';
       for (i = 0; i < answers.length; i++) {
         item += ' (' + 
                 '<SPAN style="display: inline-block" class="optionnum-box">' +
                 '<SPAN id="option-' + question + '-' + (i+1) +
                 '" class="optionnum">' +
                 (i+1) + '</SPAN></SPAN>' + ') ' + answers[i];
       } 
     }
     return item;
   }

   var setupForm = function (config) {
      var tabHTML, input, cfg, q, elname, qsub;
      var inputIndex = 0;
      tabHTML = '<FORM><TABLE align="center">';
      for (var i = 0; i < config.length; i++) {
        cfg = config[i];
        q = cfg.q;
        if (cfg.answers) {
          answerLists = cfg.answers;
        } else if (q) {
          tabHTML += '<TR><TD>';
          if (cfg.qtype === 'none')
            tabHTML += '<SPAN style="color: gray">';
          tabHTML += q + ") " + cfg.text;
          if (cfg.qtype === 'none')
            tabHTML += '</SPAN>';
          tabHTML += '</TD>';
          if (cfg.qtype !== 'none') {
            if (!cfg.list) {
              elname = "answer-" + q;
              inputItem = createFormInput (elname, cfg.qtype, answerLists, q);
              tabHTML += '<TD>' + inputItem + '</TD>';
              inputField[inputIndex++] = {elname: elname, cfg: cfg, 
                                          question: q};
            }
            if (cfg.list) {
              for (var j = 0; j < cfg.list.length; j++) {
                tabHTML += '<TR><TD><SPAN style="display: inline-block; margin-left: 3em">' + cfg.list[j] +
                           '</SPAN></TD>';
                qsub = q + "-" + (j+1);
                elname = "answer-" + qsub;
                inputItem = createFormInput (elname, cfg.qtype, answerLists, 
                                             qsub);
                tabHTML += '<TD>' + inputItem + '</TD>';
                inputField[inputIndex++] = {elname: elname, cfg: cfg,
                                            question: qsub};
              }
            }
          }
        }
      }
      tabHTML += '</TABLE>';
      tabHTML += '<DIV align="center" style="padding-top: 1em; padding-bottom: 1em">';
      tabHTML += '<BUTTON name="submit" id="submitbutton" class="smallbutton">Submit</BUTTON>';
      tabHTML += '<SPAN style="padding-right: 3em"></SPAN>';
      tabHTML += '<BUTTON name="clear" id="clearbutton" class="smallbutton" type="reset">Clear</BUTTON>';
      tabHTML += '</DIV>';
      tabHTML += '</FORM>';
      $("#confeval").html(tabHTML);
      // PROBABLY: change this to a map.  OCEFixButton should set some sort
      // of data indicating that a button has been fixed.
      OCEFixButton.call($("#submitbutton"));
      OCEFixButton.call($("#clearbutton"));
      for (i = 0; i < inputField.length; i++) {
        $("#" + inputField[i].elname).data("index", i);
        $("#" + inputField[i].elname).keypress(evalKeyPress);
        $("#" + inputField[i].elname).keydown(evalKeyDown);
        // TODO: jquery doc says this isn't an official event, and behavior
        // may vary between browsers.  Check in IE.
      }
      $("#submitbutton").off("click");
      $("#submitbutton").click(postData);
      $("#clearbutton").off("click");
      $("#clearbutton").click(clearAllEntries);
   }

   // copied from sess
   var setIndication = function (index) {
      var currVal = evalEntries[index];
      if (currVal) {
         if (inputField[index].cfg.qtype !== "number") {
            $("#option-" + inputField[index].question + "-" + currVal)
//             .css({"background-color": "red", color: "white"});
               .css("background-image", "url(smallredoval.png)");
         }
         // TODO: if I can figure out how to catch error if URL is wrong,
         // set things up to revert to background color method
      }
   };

   var clearIndication = function (index) {
      var currVal = evalEntries[index];
      if (currVal !== "") {
         if (inputField[index].cfg.qtype !== "number") {
            $("#option-" + inputField[index].question + "-" + currVal)
//             .css({"background-color": origColor, color: "black",
               .css("background-image", "none");
         }
      }
   };

   var setEntry = function (index, val) {
      clearIndication(index);
      evalEntries[index] = val;
      if (val !== "") setIndication(index);
   };

   var clearEntry = function (index) {
      clearIndication(index);
      evalEntries[index] = "";
   };

   var setNumberEntry = function (index, val) {
      evalEntries[index] = val;
      $("#option-" + inputField[index].question + "-val").text(val);
   }
   
   var clearAllEntries = function () {
      var i, elname;
      for (i = 0; i < inputField.length; i++) {
         if (inputField[i].cfg.qtype === "number") 
            setNumberEntry (i, "");
         else
            clearEntry(i);
         elname = inputField[i].elname;
         $("#" + elname).val("");
      }
      elname = inputField[0].elname;
      $("#" + elname).focus();
   };

   var evalKeyPress = function(e) {
      doKey.call (this, e, true);
   }

   var evalKeyDown = function(e) {
      doKey.call (this, e, false);
   }

   var doKey = function(e, press) {
      // This handles both "keydown" and "keypress" events.  press=true
      // for keypress.  keydown handles only backspace, left arrow, and
      // right arrow keys, for which keypress events aren't generated.
      // TODO: saving data, highlighting
      var elem = $("#" + this.id);   // the <INPUT> element
      var index = elem.data("index");
      var normalMode = elem.data("normalMode");
          // "normal mode" means that the field will take a string of
          // characters, rather than just a single character.  Currently
          // used only for a numeric field when user starts by entering
          // # or =.
      var cfg = inputField[index].cfg;
      var ok = true;
      var theAnswer, max, nextEl, nextField;
      var doDefault = false;
      if (e.key !== undefined)
         key = e.key;
      else {
         // Chrome doesn't seem to support "key" property
         if (e.keyCode == 8)       key = "Backspace";
         else if (e.keyCode == 37) key = "Left";
         else if (e.keyCode == 39) key = "Right";
         else if (e.keyCode == 9)  key = "Tab";
         else if (e.keyCode == 13) key = "Return";
         else if (press)           key = String.fromCharCode (e.keyCode);
         else                      key = "";
         // For keydown, all we care about are Backspace, Left, Right,
         // Tab, Return.  Other text keys will return some sort of scan 
         // code, not an ASCII code.  We'll also get an event for Shift 
         // which we don't want.  keypress will return what we want but 
         // will not be triggered for Backspace, Left, or Right.
      }
      if (!press && !key.match(/^(backspace|left|right|tab|return)$/i))
         return;  // ignore the event
      if (press && key.match(/^tab|return$/i))
         return;  // These keys may trigger both keydown and keypress.
                  // Handle them when keydown occurs--otherwise it's hard
                  // to get it to behave the way I want.

      if (key.match(/^(backspace|left)$/i))  {
         // TODO: backspace in normalMode should have normal behavior?
         elem.data ("normalMode", false);
         normalMode = false;
         whereNext = 'backward';
      }
      else if (key.match(/^(tab|right)$/i))  {
         if (normalMode) setNumberEntry (index, this.value);
         elem.data ("normalMode", false);
         normalMode = false;
         whereNext = 'forward';
      }
      else if (normalMode && key.match(/^return$/i)) {
         setNumberEntry (index, this.value);
         elem.data ("normalMode", false);
         normalMode = false;
         whereNext = 'forward';
      }
      else {
         if (key.length === 1) {
            switch (cfg.qtype) {
               case 'number':
                  if (key === "#" || key === "=")  {
                     elem.val("");  // get rid of # or =
                     elem.data ("normalMode", true);
                     normalMode = true;
                  }
                  else if (key === " " && !normalMode)  {  // erase field
                     doDefault = false;
                     this.value = "";
                     setNumberEntry (index, "");
                  }
                  else if (key >= "0" && key <= "9") {
                     doDefault = normalMode;
                     if (!normalMode) {
                        this.value = "" + key;
                        setNumberEntry (index, this.value);
                     }
                  }
                  else
                     ok = false;
                  break;
               case 'yn':
                  if (key.match(/^[1Yy]$/)) 
                     theAnswer = 1;
                  else if (key.match(/^[2Nn]$/)) 
                     theAnswer = 2;
                  else if (key.match(/^[0 ]$/))
                     theAnswer = "";
                  else
                     ok = false;
                  if (ok) this.value = "" + theAnswer;
                  setEntry (index, theAnswer);
                  // TODO: save input
                  break;
               default:
                  max = answerLists[cfg.qtype].length;
                  if (key >= "1" && key <= max)
                     theAnswer = +key;
                  else if (key.match(/^[0 ]$/))
                     theAnswer = "";
                  else
                     ok = false;
                  if (ok) this.value = "" + theAnswer;
                  setEntry (index, theAnswer);
                  // TODO: save input
                  break;
            }
         } else {
            ok = false;
         }
         if (!ok) {
            ding ();
            whereNext = '';
         } 
         else if (normalMode)
            whereNext = '';
         else
            whereNext = 'forward';
      }
      if (whereNext === 'forward') {
         index++;
         nextField = (index >= inputField.length) ? null : inputField[index];
         nextEl = (nextField) ? $("#" + nextField.elname) : $("#submitbutton");
         nextEl.focus();
      }
      else if (whereNext === 'backward') {
         if (index == 0) index = inputField.length;
         index--;
         nextField = inputField[index];
         nextEl = $("#" + nextField.elname);
         nextEl.focus();
      }
      if (!doDefault)
         e.preventDefault ();
   };

   var postData = function (e) {
      var data = {};
      var i, elname;
      e.preventDefault();  // appears to be necessary to prevent some 
                           // sort of default.  I have no idea what this
                           // default is.
      for (i = 0; i < inputField.length; i++) {
         elname = inputField[i].elname;
         data[elname] = $("#" + elname).val();
      }
      postCheck("addconfeval.php", data, null, "text");
      clearAllEntries();
      updateCount ();
   };

   var updateCount = function () {
      getJSONCheck  ("getconfevaltotal.php", 
                     function (data) {
                         $("#confevaltotal").html(data + "");
                     });
   }

   getJSONCheck  ("getconfconfig.php", function (data) {
                     setupForm(data);
                  });
   updateCount ();
   $("BUTTON").map(OCEFixButton);
});

