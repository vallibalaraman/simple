//the following code expects base.js for var base, jquery[.min].js for var $, doT.js for var doT, 

window.simplifier = simplifier = (function createSimplifier() {
  "use strict";
  var counter = 0;
  var currentStep = 1;
  //the following variables allow program to prevent duplicates
  var itemEventHandler = false;
  var inputEventHandler = false;
  var resultEventHandler = false;
  var approveAllEventHandler = false;
  var itemTemplate = '';
  var listTemplate = '';
  var textSentToWorker = false;
  var worker = '';
  //this is shared among modules
  var data = {};
  data.notIn1600 = {};
  data.sentences = [];
  data.defaults = {};
  
  
  //for testing:
  var result;
  
  function go() {
    createItems();
    //act as presenter: pass message and cause model to update its presenter
    base.getItem("Steps tool model").setSomeDataEtc({distanceFromFocus: 1});
    $('#page').trigger('create');
  }
  function refresh() {
    $('#page').trigger('create');
  }

  function createItems() {
  
    //Req. 4.2: Steps on every virtual page
    
    //Create Steps tool model (at first with title and orientation), 
    base.createItem({
      localId: "Steps tool model",
      dataEtc: {
        data: {},
        selectedItem: 1,
        distanceFromFocus: 2
      },
    });
    
    //the list view markup
    base.createItem({
      localId: "List view markup",
      dataEtc: {
        dataType: "html",
        requirements: ["doT.js"],
        data: '<form {{=it.newAttribute}}> <fieldset {{=it.newAttribute}} data-role="controlgroup" data-type="{{=it.orientation}}" id="{{=it.elementId}}"></fieldset></form>'
      }
    });
    
    //the view utility
    base.createItem({
      localId: "View utility",
      dataEtc: {
        dataType: "function",
        requirements: ["jQuery", "jQueryMobile", "doT.js"]
      },//end of dataEtc
      updateFrom: function updateFrom(publisher) { 
        var presenter = publisher; 
        //console.log('view: ' + publisher.getLocalId() + ' ' + counter++)
        //get view markup here as set by presenter
        var here = this.getDataEtc().data;
        var viewMarkup = base.getItem(here.viewMarkupId); 
        //get html template from view markup, if not yet
        var templateString = '';
        var template = '';
        if (viewMarkup.getLocalId() == 'Item view markup') {
          if (!itemTemplate) {
            templateString = viewMarkup.getDataEtc().data;
            itemTemplate = doT.template(templateString);
          }
          template = itemTemplate;
        }
        else if (viewMarkup.getLocalId() == 'List view markup') {
          if (!listTemplate) {
            templateString = viewMarkup.getDataEtc().data;
            listTemplate = doT.template(templateString);
          }
          template = listTemplate;
        }
        else {
          templateString = viewMarkup.getDataEtc().data;
          template = doT.template(templateString);
        }
        //insert model data into viewMarkup template and display
        $('#' + here.parentId).append(template(here));
        // removed $('#page').trigger('create'); because major slow-down. Moved it to end of input's on.('click') and also go().
        //$('#page').trigger('create');
        
        if (here.elementId == "Step") { 
          $('#page').append('<br>');
        }
        //modify what's been appended
        
        var id = here.elementId
        var elId = "#" + id;
        
        var idParts = id.split('_');
        //check if list item; if so, apply markup. If list holder (i.e. fieldset), do nothing.
        if (elId.indexOf('_') !== -1 ) {
          //for non-titles:
          //also exclude input and output text areas, which changes them from blue to white and removes arrow icon and makes them unclickable
          if (idParts[1] > 0 && idParts[0] != "Input" && idParts[0] != "Output") {
            var iconString = 'arrow-r';
            var iconPosition = 'right';
            if (idParts[0] == "Step") { 
              iconString = 'arrow-d';
              iconPosition = 'bottom';
            } 
            var themeChar = 'b'
            if (here.isSelected === false) {
              iconString = null;
              themeChar = 'c';
              iconPosition = 'right';
            }
            //apply theme color without rounding corners too much
            $(elId).buttonMarkup({theme: themeChar, corners: false, icon: iconString, iconpos: iconPosition});
          }/*
          else if (elId == "#Input_1" || elId == "#Output_1") {
            iconString = null;
            //apply theme color without rounding corners too much, and disable
            $(elId).buttonMarkup({theme: themeChar, corners: false, icon: iconString, iconpos: iconPosition}).attr("disabled", "disabled").addClass('ui-disabled');
          }*/
          /*
          if (elId === "#Input_0") {
            //not working, but idea is to make 1.2 title stop rounding its bottom corners and rather join to #Input_1
            var parent = $(elId).parents().removeClass('ui-corner-bottom ui-controlgroup-last');
            var child = parent.children().removeClass('ui-corner-bottom ui-controlgroup-last');
            //console.log($(elId).parents()[0])
            //console.log(parent[0])
            //console.log(child[0])
          }
          //round bottom but not top corners on the item that holds textarea, and make it unselectable
          if (elId === "#Input_1" || elId === "#Output_1") {
            $(elId).removeClass('ui-btn').addClass('ui-controlgroup-last ui-corner-bottom');
          }*/
        }//end if list item
        
        //record the highest position associated with this list, for use in event handling
        var permanent = viewMarkup.getDataEtc();
        if (!permanent[idParts[0]] || permanent[idParts[0]] < idParts[1]) {
          var obj = {};
          var num = idParts[1]
          if (num === undefined) {
            num = 0;
          }
          obj[idParts[0]] = num;
          viewMarkup.setSomeDataEtc(obj, this.getLocalId());
        }
        //the following line must be wrong as it does not use setSomeDataEtc or setDataEtc, USED IN TEXTAREA MARKUP .ON
        here.presenterId = publisher.getLocalId();
        viewMarkup.getUpdateFromFunction().call(viewMarkup, this);
      }//end of updateFrom
    }); //end view utility
    
    //Create Steps tool presenter
    base.createItem({
      localId: "Steps tool presenter",
      dataEtc: {
        elementId: "Step", 
        orientation: "horizontal", 
        newAttribute: "", //style='display: block;'
        modelId: "Steps tool model",
        viewId: "View utility",
        viewMarkupId: "List view markup",
        parentId: "page",
        selectedItem: 1,
        isDisplayed: false
      },
      publisherIds: [
        "Steps tool model"
      ],
      updateFrom: presenterUpdateFrom
    });  
    
    function presenterUpdateFrom(publisher) {
      var pInfo = publisher.getDataEtc(); 
      var here = this.getDataEtc(); 
      var model = base.getItem(here.modelId);
      var position = model.getDataEtc().position; 
      var listModel = base.getItem(model.getDataEtc().listModelId);
      if (!listModel) {
        //this is a presenter for a listModel
        listModel = model;
      }
      //check if it's model
      if ("distanceFromFocus" in pInfo) {
        //this should be model; check distanceFromFocus; 1 means displayable, 0 means selected, 2-5 should be preloaded, -1 == "back"/"undo" history
        if (pInfo.distanceFromFocus === 1 || pInfo.distanceFromFocus === 0) {
          //If the data is not displayed, display it
          var displayable = (!$('#' + here.elementId).length);
          /*
          if (!displayable && publisher.getLocalId() == "Instance tool model" && pInfo.selectedHardWord != here.selectedHardWord && $('#Instance_1' ).length) {
            //erase what's been displayed and redisplay
            $('#' + here.elementId).closest('fieldset').empty();
            refresh();
            this.setSomeDataEtc({selectedHardWord: pInfo.selectedHardWord}, this.getLocalId());
            return;
          }
          */
          if (displayable) {
            //set data and publish, allowing presentation function to display view
            var view = base.getItem(this.getDataEtc().viewId);
                this.setSomeDataEtc(pInfo, this.getLocalId());
            //this.setSomeDataEtc({text: pInfo.text, position: pInfo.position}, this.getLocalId());
            view.setSomeDataEtc({data: here}, this.getLocalId());
            view.getUpdateFromFunction().call(view, this);
            this.setSomeDataEtc({isDisplayed: true});
          } 
          if (listModel.getDataEtc().selectedItem && position !== listModel.getDataEtc().selectedItem) {
            this.setSomeDataEtc({isSelected: false}, this.getLocalId());
          }
        } /* the following may be needed for a larger application, but this one is simple and bounded, so leave it out
        else {
          //model is not displayable, so remove 
          //$('#' + here.elementId).closest('form').remove()
          //this.setSomeDataEtc({isDisplayed: false}, this.getLocalId());
        } */
      }    
      //check if it's view
      else if (publisher.getLocalId() == here.viewMarkupId) {
        //this should be view after having set here.something
        if (here.isSelected === true) {
          //it is telling us what button was selected
          if (listModel.getDataEtc().selectedItem) {
            listModel.setSomeDataEtc({selectedItem: position}, this.getLocalId());
          }
          model.setSomeDataEtc({distanceFromFocus: 0});
        }
        if (model.getLocalId() === 'Input Area model' ) {
          //it is telling us the (title from field and) text from textarea after change
          var numChanges = model.getDataEtc().timesChanged + 1;
          model.setSomeDataEtc({timesChanged: numChanges, text: here.text}); //title: here.title,
        }
      } // end if it's view/html
    }//end presenterUpdateFrom
      
  
    //Create Step1 model
    base.createItem({
      localId: "Step 1 model",
      dataEtc: {
        text: 'Step 1: Input',
        distanceFromFocus: 2,
        listModelId: "Steps tool model",
        position: 1
      },
      publisherIds: [
        "Steps tool model"
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    function itemModelUpdateFrom(publisher) {
      //publisher is List model
      var listInfo = publisher.getDataEtc();
      var thisInfo = this.getDataEtc();
      //check if List model is displayable, if so make this displayable in most views
      if (listInfo.distanceFromFocus < 2 && listInfo.distanceFromFocus > -1) {
        if (listInfo.selectedItem === thisInfo.position) {  
          //this should be both displayable and selected
          this.setSomeDataEtc({distanceFromFocus: 0}, this.getLocalId());
        }
        else {
          //this should be displayable in most views
          this.setSomeDataEtc({distanceFromFocus: 1}, this.getLocalId());
        }
      }
      else {
        //this is not displayable in most views
        if (listInfo.selectedItem === thisInfo.position) { 
          this.setSomeDataEtc({distanceFromFocus: listInfo.distanceFromFocus}, this.getLocalId());
        }
        else {
          this.setSomeDataEtc({distanceFromFocus: listInfo.distanceFromFocus + 1}, this.getLocalId());
        }
      }
    }//end itemModelUpdateFrom
  
    //the item view markup for most items
    base.createItem({
      localId: "Item view markup",
      dataEtc: {
        dataType: "html",
        requirements: ["doT.js"],
        data: '<input type="button" data-role="button" data-theme="a" {{=it.newAttribute}} id="{{=it.elementId}}" value="{{=it.text}}" />'
        //lists and their lengths will be inserted here by view utility
      },
      updateFrom: function(viewUtility) { 
        //publisher is view utility
        //var d = this.getDataEtc(); 
        //console.log('itemview: ' + viewUtility.getLocalId() + ' ' + counter++)
        //console.log('view markup has: Step: ' + d.Step + ', Method: ' + d.Method)
        var self = this;
        //prepare to collect user events and pass them to presenter
        if (itemEventHandler) return;
        //prevent multiple event handlers
        itemEventHandler = true;
        $('body').on("click", 'input', function(e) {
          //console.log('on click starting: ' + new Date())
          var selectedId = this.id;
          if (selectedId === 'title__Input_1') return;
          if (selectedId === 'replacement_input') return;
          //Req. 4.2.2, Req. 4.2.4 If one of the main step buttons are clicked, hide unneeded tools and show needed tools
          //Req. 4.2.4.1 If user clicks Step 1 and is not already there, hide Step 2 and Step 3 tools and show Step 1 tools.
          if (selectedId === 'Step_1') {
            if (currentStep != 1) {
              currentStep = 1;
              //hide step 2
              $('#Vocab').closest('form').hide();
              $('#Type').closest('form').hide();
              $('#Hard').closest('form').hide();
              $('#Instance').closest('form').hide();
              $('#PoS').closest('form').hide();
              $('#Replacement').closest('form').hide();
              $('#Result').closest('form').hide();
              //hide step 3
              $('#Conclusion').closest('form').hide();
              $('#Output').closest('form').hide();
              //show step 1
              $('#Introduction').closest('form').show();
              $('#Input').closest('form').show();
              //fix rendering of unselected steps
              $("#Step_2").buttonMarkup({theme: 'c', corners: false, icon: null, iconpos: "right"})
              $("#Step_3").buttonMarkup({theme: 'c', corners: false, icon: null, iconpos: "right"})
            }
          }
          //Req. 4.2.4.2 If user clicks Step 2 and is not already there, hide Step 1 and Step 3 tools and show Step 2 tools.
          if (selectedId === 'Step_2') {
            if (currentStep != 2) {
              currentStep = 2;
              //hide step 1
              $('#Introduction').closest('form').hide();
              $('#Input').closest('form').hide();
              //hide step 3
              $('#Conclusion').closest('form').hide();
              $('#Output').closest('form').hide();
              //show step 2
              $('#Vocab').closest('form').show();
              $('#Type').closest('form').show();
              $('#Hard').closest('form').show();
              $('#Instance').closest('form').show();
              $('#PoS').closest('form').show();
              $('#Replacement').closest('form').show();
              $('#Result').closest('form').show();
              //fix rendering of unselected steps
              $("#Step_1").buttonMarkup({theme: 'c', corners: false, icon: null, iconpos: "right"})
              $("#Step_3").buttonMarkup({theme: 'c', corners: false, icon: null, iconpos: "right"})
            }
          }
          //Req. 4.2.4.3 If user clicks Step 3 and is not already there, hide Step 2 and Step 1 tools and show Step 3 tools.
          if (selectedId === 'Step_3') {
            if (currentStep != 3) {
              currentStep = 3;
              //hide step 1
              $('#Introduction').closest('form').hide();
              $('#Input').closest('form').hide();
              //hide step 2
              $('#Vocab').closest('form').hide();
              $('#Type').closest('form').hide();
              $('#Hard').closest('form').hide();
              $('#Instance').closest('form').hide();
              $('#PoS').closest('form').hide();
              $('#Replacement').closest('form').hide();
              $('#Result').closest('form').hide();
              //show step 3
              $('#Conclusion').closest('form').show();
              $('#Output').closest('form').show();
              //fix rendering of unselected steps
              $("#Step_2").buttonMarkup({theme: 'c', corners: false, icon: null, iconpos: "right"})
              $("#Step_1").buttonMarkup({theme: 'c', corners: false, icon: null, iconpos: "right"})
            }
          }
          
          var idArray = selectedId.split('_');
          var selectedInt = idArray[1];
          var idStarter = "#" + idArray[0];
          var isStep = idStarter == "#Step"; 
          if (!isStep) {
            $(idStarter).children().first().children().first().nextAll().buttonMarkup({theme: 'c', corners: false, icon: null, iconpos: "right"});
          }
          var arrow = isStep ? "arrow-d" : "arrow-r";
          var iconPosition = isStep ? "bottom" : "right";
          $('#' + selectedId).buttonMarkup({theme: 'b', corners: false, icon: arrow, iconpos: iconPosition});
          //if clicked, update presenter, which will allow it to update model
          var presenter;
          //try to recreate what presenter is based on convention
          var presString = idArray[0] + ' presenter';
          if (idArray[0] === 'Step') {
            presString = idArray[0] + ' ' + selectedInt + ' presenter';
          }
          presenter = base.getItem(presString);
          if (!presenter) return;
          //give appropriate details to different objects
          if (idArray[0] === 'Hard' || idArray[0] === 'Replacement' || idArray[0] === 'Instance') {
            presenter.setSomeDataEtc({selectedIndex: selectedInt, selectedHardWord: $('#' + selectedId).val(), whatChanged: "a listed item was selected in presentation layer"}, self.getLocalId());
          }
          else if (idArray[0] === 'Type') {
            var selectedButton = $('#' + selectedId).val();
            var selType = selectedButton.split(' (')[0];
            presenter.setSomeDataEtc({selectedType: selType}, self.getLocalId());
          }
          else {
            presenter.setSomeDataEtc({isSelected: true}, self.getLocalId());
          }
          presenter.getUpdateFromFunction().call(presenter, self);
          //refresh css
          $('#page').trigger('create');
          //console.log('on click ending: ' + new Date())
        });//END .ON?
        
      }
    });
    
    base.createItem({
      localId: "Step 1 presenter",
      dataEtc: {
        elementId: "Step_1", 
        modelId: "Step 1 model",
        viewId: "View utility",
        viewMarkupId: "Item view markup",
        newAttribute: "data-icon='arrow-d' data-iconpos='bottom'",
        parentId: "Step",
        isSelected: true,
        isDisplayed: false
      },
      publisherIds: [
        "Step 1 model"
      ],
      updateFrom: presenterUpdateFrom
    });//end create presenter
  
    //Create Step2 model
    base.createItem({
      localId: "Step 2 model",
      dataEtc: {
        text: 'Step 2: Simplifier',
        listModelId: "Steps tool model",
        distanceFromFocus: 2,
        position: 2
      },
      publisherIds: [
        "Steps tool model"
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    base.createItem({
      localId: "Step 2 presenter",
      dataEtc: {
        elementId: "Step_2", 
        modelId: "Step 2 model",
        viewId: "View utility",
        viewMarkupId: "Item view markup",
        parentId: "Step",
        isSelected: false,
        isDisplayed: false
      },
      publisherIds: [
        "Step 2 model"
      ],
      updateFrom: presenterUpdateFrom
    });//end create presenter
    
    //Create Step3 model
    base.createItem({
      localId: "Step 3 model",
      dataEtc: {
        text: 'Step 3: Output',
        distanceFromFocus: 2,
        listModelId: "Steps tool model",
        position: 3
      },
      publisherIds: [
        "Steps tool model"
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    base.createItem({
      localId: "Step 3 presenter",
      dataEtc: {
        elementId: "Step_3", 
        modelId: "Step 3 model",
        viewId: "View utility",
        viewMarkupId: "Item view markup",
        parentId: "Step",
        isSelected: false,
        isDisplayed: false
        //then outputPresenterFunction will be notified
      },
      publisherIds: [
        "Step 3 model"
      ],
      updateFrom: presenterUpdateFrom
    });//end create presenter
    
    //End of Req. 4.2: Steps on every virtual page
   
   //Moving onto Req. 1
    
    //Create 1.1 User Guide
    base.createItem({
      localId: "Introduction tool model",
      dataEtc: {
        selectedItem: 1,
        distanceFromFocus: 2,
        parentSelectionRequired: 1
      },
      publisherIds: [
        "Steps tool model"
      ],
      updateFrom: focusOnSelect
      
    });
    function focusOnSelect(publisher) {
      var here = this.getDataEtc();
      var pInfo = publisher.getDataEtc();
      var parentDistance = pInfo.distanceFromFocus;
      var inFocus = (parentDistance > -1 && parentDistance < 2);
      if (pInfo.selectedItem === here.parentSelectionRequired && inFocus) {
        //parent has the right thing selected and is itself displayable, so make this displayable
        this.setSomeDataEtc({distanceFromFocus: parentDistance}, this.getLocalId());
      }
    }
    
    //Create 1.1 Import Introduction tool presenter  
    base.createItem({
      localId: "Introduction tool presenter",
      dataEtc: {
        elementId: "Introduction", 
        orientation: "vertical", 
        newAttribute: "style='display: inline-block; width: 300px;'",
        modelId: "Introduction tool model",
        viewId: "View utility",
        viewMarkupId: "List view markup",
        parentId: "page",
        selectedItem: 1,
        isDisplayed: false
      },
      publisherIds: [
        "Introduction tool model"
      ],
      updateFrom: presenterUpdateFrom
    });
    
    //Create 1.1 Import Introduction title model
    base.createItem({
      localId: "Introduction title model",
      dataEtc: {
        text: 'Step 1 User Guide',
        distanceFromFocus: 2,
        listModelId: "Introduction tool model",
        position: 0
      },
      publisherIds: [
        "Introduction tool model"
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    base.createItem({
      localId: "Introduction title presenter",
      dataEtc: {
        elementId: "Introduction_0", 
        modelId: "Introduction title model",
        viewId: "View utility",
        viewMarkupId: "Item view markup",
        newAttribute: "disabled='disabled'",
        parentId: "Introduction",
        isSelected: false,
        isDisplayed: false
      },
      publisherIds: [
        "Introduction title model"
      ],
      updateFrom: presenterUpdateFrom
    });//end create presenter
    
    //Create Instructions Introduction model
    base.createItem({
      localId: "Instructions Introduction model",
      dataEtc: {
        text: 'Welcome. This program helps to control vocabulary size. Type or paste text in the input text area and then proceed to Step 2. The program will find any hard words, which are here defined as words that are not in the Specialized English list of about 1600 simple words (not counting variations of those words or any digits). If you are still connected to the internet, the program will then search for and display suggested replacements from the WordNet database of synonyms. Many of those will also be hard words, but even those may inspire ideas for simple replacements. The download sizes are very small.',
        distanceFromFocus: 2, // not displayable but selected and preloaded
        listModelId: "Introduction tool model",
        position: 1
      },
      publisherIds: [
        "Introduction tool model"
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    base.createItem({
      localId: "Introduction 1 presenter",//use parentId and model position and "presenter"
      dataEtc: {
        elementId: "Introduction_1", //use parentId and model position
        modelId: "Instructions Introduction model",
        viewId: "View utility",
        viewMarkupId: "Item view markup",
        newAttribute: "disabled='disabled' ",
        parentId: "Introduction",
        isSelected: true,
        isDisplayed: false //i.e. not yet
      },
      publisherIds: [
        "Instructions Introduction model"
      ],
      updateFrom: presenterUpdateFrom
    });//end create presenter
    
    
    //Req. 1.2 Create 1.2 Input tool model
    base.createItem({
      localId: "1.2 Input tool model",
      dataEtc: {
        selectedItem: undefined,
        distanceFromFocus: 2,
        parentSelectionRequired: 1
      },
      publisherIds: [
        "Introduction tool model"
      ],
      updateFrom: focusOnSelect
    });
    
    //Create 1.2 Input tool presenter  
    base.createItem({
      localId: "1.2 Input tool presenter",
      dataEtc: {
        elementId: "Input", 
        orientation: "vertical", 
        newAttribute: "style='display: inline-block; width: 600px;'",
        modelId: "1.2 Input tool model",
        viewId: "View utility",
        viewMarkupId: "List view markup",
        parentId: "page",
        selectedItem: undefined,
        isDisplayed: false
      },
      publisherIds: [
        "1.2 Input tool model"
      ],
      updateFrom: presenterUpdateFrom
    });
    
    //Create 1.2 Input text tool title model
    base.createItem({
      localId: "1.2 Input title model",
      dataEtc: {
        text: 'The text to simplify',
        distanceFromFocus: 2,
        listModelId: "1.2 Input tool model",
        position: 0
      },
      publisherIds: [
        "1.2 Input tool model"
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    base.createItem({
      localId: "1.2 Input title presenter",
      dataEtc: {
        elementId: "Input_0", 
        modelId: "1.2 Input title model",
        viewId: "View utility",
        viewMarkupId: "Item view markup",
        newAttribute: "disabled='disabled'",
        parentId: "Input",
        isSelected: false,
        isDisplayed: false
      },
      publisherIds: [
        "1.2 Input title model"
      ],
      updateFrom: presenterUpdateFrom
    });//end create presenter
    
    //Create input area model
    base.createItem({
      localId: "Input Area model",
      dataEtc: {
        placeholder: 'Type or paste text here',
        title: "",
        text: "",
        timesChanged: 0,
        distanceFromFocus: 2,
        listModelId: "1.2 Input tool model",
        position: 1
      },
      publisherIds: [
        "1.2 Input tool model"
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    //the item view markup for text field and textarea
    base.createItem({
      localId: "Textarea view markup",
      dataEtc: {
        dataType: "html",
        requirements: ["doT.js"],
        data: '<div data-theme="b" style="border: 0;" data-shadow="false" {{=it.newAttribute}} id="{{=it.elementId}}"  ><br /><textarea placeholder="{{=it.placeholder}}"  id="{{=it.textareaId}}">{{=it.text}}</textarea></div>' 
      },
      updateFrom: function(viewUtility) {
        //publisher is view utility
        var view = viewUtility.getDataEtc().data;
        var id = view.elementId; 
        //console.log('textareaview: ' + viewUtility.getLocalId() + ' ' + counter++)
        var self = this;
        /* //couldn't make it put focus on the textarea by either method
        var e;
        for (var i; i<4; i++) {
          e = jQuery.Event("keydown");
          e.which = 9; // tab
          $(document).trigger(e);
        }
        setTimeout(function() {
          $('#textarea_Input_1').focus(); console.log('focus attempted')
        }, 0);*/
        
        //prepare to collect user events and pass them to presenter
        $('#' + id).on("change", function(e) {
          e.preventDefault();
          textSentToWorker = false;
          data.notIn1600 = {};
          data['sentences'] = [];
          //delete step 2 in dom
          $('#Vocab').closest('form').remove();
          $('#Type').closest('form').remove();
          $('#Hard').closest('form').remove();
          $('#Instance').closest('form').remove();
          $('#PoS').closest('form').remove();
          $('#Replacement').closest('form').remove();
          $('#Result').closest('form').remove();
          //delete step 3 in dom
          $('#Conclusion').closest('form').remove();
          $('#Output').closest('form').remove();
          //model = base.getItem
          //TODO clear previous results
          /*
          var titleAdded = $('#' + view.titleFieldId).val();
          var textAdded = $('#' + view.textareaId).val(); 
          var presenter = base.getItem(view.presenterId);
          var presD = presenter.getDataEtc();
          //console.log(presD.text + ' ' + textAdded)
          if (presD.text && presD.text == textAdded) {
            console.log('not changed on change')
            return;
          }
          presenter.setSomeDataEtc({title: titleAdded, text: textAdded}, self.getLocalId());
          presenter.getUpdateFromFunction().call(presenter, self);
          */
        });
      }
    });
    
    base.createItem({
      localId: "Input 1 presenter",
      dataEtc: {
        elementId: "Input_1", 
        modelId: "Input Area model",
        viewId: "View utility",
        viewMarkupId: "Textarea view markup",
        newAttribute: "data-mini='true' disabled='disabled'",
        textareaId: "textarea__Input_1",
        titleFieldId: "title__Input_1",
        parentId: "Input",
        isSelected: true,
        isDisplayed: false
      },
      publisherIds: [
        "Input Area model"
      ],
      updateFrom: presenterUpdateFrom
    });//end create presenter
    
    
    //Req. 2.1
    //Create Vocab tool model
    base.createItem({
      localId: "Vocab tool model",
      dataEtc: {
        distanceFromFocus: 4,
        parentSelectionRequired: 2,
        textElement: "textarea__Input_1",
        selectedVocab: "1600"
      },
      publisherIds: [
        "Steps tool model"
      ],
      updateFrom: function(publisher) {
        var here = this.getDataEtc();
        var pInfo = publisher.getDataEtc();
        //If no text, display warning (sorry, a little presentation in model)
        if (publisher.getLocalId() === 'Steps tool model') {
          if (pInfo.selectedItem != 1) {
            if (!$('#textarea__Input_1').val()) {
              if (!$('#no_text_warning').length) {
                $('#page').prepend("<h2 style='margin: 20px; text-align: center;' id='no_text_warning'>There is no input text. Please return to Step 1.</h2>");
              }
              return;
            } 
          }
          else { //back to Step 1, still with no text
            $('#no_text_warning').remove();
          }
        }
        var parentDistance = pInfo.distanceFromFocus;
        var inFocus = (parentDistance > -1 && parentDistance < 2);
        if (pInfo.selectedItem === here.parentSelectionRequired && inFocus) {
          //parent has the right thing selected and is itself displayable, so make this displayable
          this.setSomeDataEtc({distanceFromFocus: parentDistance}, this.getLocalId());
        }
      }
    });//end create Vocab Vocab tool model
    
    
    //Create 2.1 Vocab tool presenter  
    base.createItem({
      localId: "Vocab tool presenter",
      dataEtc: {
        elementId: "Vocab", 
        orientation: "vertical", 
        newAttribute: "style='display: inline-block; width: 200px;'",
        modelId: "Vocab tool model",
        viewId: "View utility",
        viewMarkupId: "List view markup",
        parentId: "page",
        selectedItem: 0,
        isDisplayed: false
      },
      publisherIds: [
        "Vocab tool model"
      ],
      updateFrom: presenterUpdateFrom
    });
    
    //Create Vocab title model
    base.createItem({
      localId: "Vocab title model",
      dataEtc: {
        text: 'Step 2 User Guide',
        distanceFromFocus: 2,
        listModelId: "Vocab tool model",
        Vocabition: 0
      },
      publisherIds: [
        "Vocab tool model"
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    base.createItem({
      localId: "Vocab title presenter",
      dataEtc: {
        elementId: "Vocab_0", 
        modelId: "Vocab title model",
        viewId: "View utility",
        viewMarkupId: "Item view markup",
        newAttribute: "disabled='disabled'",
        parentId: "Vocab",
        isSelected: false,
        isDisplayed: false
      },
      publisherIds: [
        "Vocab title model"
      ],
      updateFrom: presenterUpdateFrom
    });//end create presenter
     
     
    //Create Instructions for Step 2  model
    base.createItem({
      localId: "Instructions for Step 2 model",
      dataEtc: {
        text: 'No changes will be made in output unless you approve the change. Default+Approve will replace the hard word everywhere it occurs. Approve by itself (if Default is unchecked) will only replace it once, in the current location. In either case, Approve will also save any manual changes you make in the 2.7 Result text area. Any approved replacements will be moved to the Approved status. These are also reflected in 2.4 (Where) for all hard words, and also in Step 3 (Output). Click Approved to double-check results and optionally undo changes. Automatic changes can be undone automatically, and manual changes can be undone manually.',
        distanceFromFocus: 2, // not displayable but selected and preloaded
        listModelId: "Vocab tool model",
        position: 1
      },
      publisherIds: [
        "Vocab tool model"
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    base.createItem({
      localId: "Vocab 1 presenter",//use parentId and model position and "presenter"
      dataEtc: {
        elementId: "Vocab_1", //use parentId and model position
        modelId: "Instructions for Step 2 model",
        viewId: "View utility",
        viewMarkupId: "Item view markup",
        newAttribute: "disabled='disabled' ",
        parentId: "Vocab",
        isSelected: true,
        isDisplayed: false //i.e. not yet
      },
      publisherIds: [
        "Instructions for Step 2 model"
      ],
      updateFrom: presenterUpdateFrom
    });//end create presenter
     
     
     
     
     
        //Req. 2.2
    //Create Type tool model
    base.createItem({
      localId: "Type tool model",
      dataEtc: {
        distanceFromFocus: 4,
        //Req. 2.2, Req. 2.3 the container of hard words referenced in hard words tool will be only one of the containers referenced in Type
        types: ["Unapproved", "Approved"],
        selectedType: "Unapproved"
      },
      publisherIds: [
        "Vocab tool model"
      ],
      updateFrom: function(publisher) {
        var pub = publisher.getDataEtc();
        var here = this.getDataEtc();
        var growingData = data;
        if (pub.distanceFromFocus && pub.distanceFromFocus < 2) {
          if (!Object.keys(growingData.notIn1600).length) {
            for (var i in here.types) {
              growingData.notIn1600[here.types[i]] = {};
            }
          }
          this.setSomeDataEtc({distanceFromFocus: pub.distanceFromFocus}, this.getLocalId());
        }
      }
    });//end create Type tool model
    
    
    //Create 2.2 Type tool presenter  
    base.createItem({
      localId: "Type tool presenter",
      dataEtc: {
        elementId: "Type", 
        orientation: "vertical", 
        newAttribute: "style='display: inline-block;'",
        modelId: "Type tool model",
        viewId: "View utility",
        viewMarkupId: "List view markup",
        parentId: "page",
        selectedItem: 0,
        isDisplayed: false
      },
      publisherIds: [
        "Type tool model"
      ],
      updateFrom: presenterUpdateFrom
    });
    
    //Create Type title model
    base.createItem({
      localId: "Type title model",
      dataEtc: {
        text: '2.2 Status',
        distanceFromFocus: 2,
        listModelId: "Type tool model",
        position: 0
      },
      publisherIds: [
        "Type tool model"
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    base.createItem({
      localId: "Type title presenter",
      dataEtc: {
        elementId: "Type_0", 
        modelId: "Type title model",
        viewId: "View utility",
        viewMarkupId: "Item view markup",
        newAttribute: "disabled='disabled'",
        parentId: "Type",
        isSelected: false,
        isDisplayed: false
      },
      publisherIds: [
        "Type title model"
      ],
      updateFrom: presenterUpdateFrom
    });//end create presenter
     
    
    //create presenter for auto-generated model data regarding sentences/Types
    base.createItem({
      localId: "Type presenter",
      dataEtc: {
        viewId: "View utility",
        selectedHardWord: '',
        sentenceArray: [],
        selectedType: '',
        selectedIndex: 0,
        isDisplayed: false
      },
      publisherIds: [
        "Type tool model"
      ],
      updateFrom: function(publisher) {
        var pub = publisher.getDataEtc();
        var pubId = publisher.getLocalId();
        var here = this.getDataEtc();
        if (pubId == "Item view markup") {
          //user clicked on a type, so update model
          var model = base.getItem('Type tool model');
          model.setSomeDataEtc({selectedType: here.selectedType}, this.getLocalId());
          //model.getUpdateFromFunction().call(model, this);
        }
        if ($('#Type_1').length) {
          return;
        }
        var type = pub.selectedType; 
        var types = pub.types;  
        var text = '';
        for (var i in types) {
          //set data and publish to view
          var view = base.getItem(this.getDataEtc().viewId);
          var selection = false;
          var newAttr = "data-iconpos='right'";
          if (type === types[i]) {
            selection = true;
            newAttr = "data-iconpos='right' data-icon='arrow-r'";
            text = types[i]
          }
          else {
            text = types[i] + ' (0)'
          }
          var place = parseInt(i) +1;
          var elementId = 'Type_' + place;
          var thisData = {text: text, position: place, isSelected: selection, parentId: 'Type', elementId: elementId, 
            viewMarkupId: "Item view markup", newAttribute: newAttr}; 
          view.setSomeDataEtc({data: thisData}, this.getLocalId());
          view.getUpdateFromFunction().call(view, this);
        }
        /*
        //Approve all option, not yet implemented, partly because suggestions are not yet mature enough to be approved without checking
        $('#Type').append('<div data-theme="b" style="border: 0;" data-shadow="false" ><label style=" border: 0; padding: 0px;">Approve all<br />(not recommended)<input type="checkbox" id="Approve_all" data-mini="true" disabled="disabled" /></label></div>')
        */
        this.setSomeDataEtc({isDisplayed: true}, this.getLocalId());
      }//end updateFrom
    });//end create Type presenter
    
    
    
    //Req. 2.3
    //Create Hard Word tool model with analyzer (chunker and checker)
    base.createItem({
      localId: "Hard Words tool model",
      dataEtc: {
        selectedHardWord: '', //nothing selected yet, because contents to be generated dynamically
        distanceFromFocus: 2,
        latestHardWords: ['multiword placeholder'],
        selectedType: '',
        whatChanged: ''
      },
      publisherIds: [
        "Type tool model"
      ],
      updateFrom: function(publisher) {
        var pub = publisher.getDataEtc();
        var here = this.getDataEtc();
        //for observer, if received from presenter, keep
        var whatChanged = here.whatChanged;
        var hCount = 0;
        if (pub.distanceFromFocus && pub.distanceFromFocus < 2) {
          if (pub.selectedType != here.selectedType) {
            whatChanged = "selected type and therefore probably selected word";
          }
          if (!textSentToWorker) {
            if (!worker.addEventListener) {
              worker = new Worker("js/analyze.js");
              worker.addEventListener('message', onMsg, false);
            }
            worker.postMessage($('#textarea__Input_1').val());
            textSentToWorker = true;
          }
          //whether first time or publisher is just changing selected type, the save procedure can be the same:
          this.setSomeDataEtc({distanceFromFocus: pub.distanceFromFocus, selectedType: pub.selectedType, whatChanged: whatChanged}, this.getLocalId());
        }
        var growingData, newHardWords, selected;
        var self = this;
        function onMsg(e) {
          //first a short case used later in the program, in ajax callback:
          if (e.data.arr) {
            for (var i in e.data.arr) {
              var info = e.data.arr[i];
              data.notIn1600[info.type][info.originalWord].suggestions[info.poS][info.index].vocab = info.isEasy ? 'easy' : 'hard';
            }
            self.setSomeDataEtc({whatChanged: "Suggestion vocab level found"}, self.getLocalId());
          }
          //now for the end of the processing of the main text:
          else if (e.data.status === 'finished') {
            //update counts
            var unapproved = $('#Type_1').parent().find('.ui-btn-text').first().text();
            $('#Type_1').parent().find('.ui-btn-text').first().text(unapproved + " (" + hCount + ")");
            //remove "(loading)"
            $('#Hard').find('.ui-btn-text').first().text("2.3 Hard Word");
            //refresh css
            setTimeout(refresh, 0);
            //remove latestHardWords so that program knows to enter a new mode where user can choose Approved or Unapproved and change hard words lists
            self.setSomeDataEtc({latestHardWords: [[]], whatChanged: "no more hard words or sentences coming"}, self.getLocalId());
            hCount = 0;
            return;
          }
          newHardWords = [[]];
          selected = here.selectedHardWord;
          if (!$("#Hard_1").length) {
            //new/refreshed page
            selected = '';
          }
          data.sentences.push({textArray: e.data.textArray, replace: {}});
          growingData = data;
          for (var word in e.data.hardWords) {
            if (growingData.notIn1600["Unapproved"][word]) {
              if (word == selected) {
                whatChanged = "extra sentence for selected hard word";
              }
              else {
                whatChanged = "extra sentence for non-selected hard word";
              }
              //a sentence index should only be stored in one type at a time, which in this case is Unapproved.
              //Worker analyzer.js sends a sentence's worth: its textArray, its number, and its hardWords with some of their info.
              //Some info, not all, because it is doing one sentence at a time, and a hard word may be in multiple sentences.
              //Therefore for each hardWord.sentenceInfo we must add the current sentence number as a key with its object of hardIndices and parts of speech
              //Later other keys (i.e. indices and sub-indices for other sentences) may be added to hardWord.sentenceInfo
              growingData.notIn1600["Unapproved"][word].sentenceInfo[e.data.sentenceNumber] = e.data.hardWords[word].sentenceInfo[e.data.sentenceNumber];
            }
            else if (!growingData.notIn1600["Unapproved"][word]) {
              //we have found a new hard word, which needs to be stored in both Approved and Unapproved, but the sentence location only in Unapproved
              //if it's not in one, it's not in both, so create in both; e.data.hardWords[word] includes sentence number and textArrayIndex (hardIndex)
              growingData.notIn1600["Approved"][word] = {};
              growingData.notIn1600["Approved"][word].sentenceInfo = {}
              growingData.notIn1600["Unapproved"][word] = e.data.hardWords[word];
              if (!growingData.notIn1600["Unapproved"][word].sentenceInfo) {
                growingData.notIn1600["Unapproved"][word].sentenceInfo = {};
              }
              whatChanged = "new hard word found";
              if (!newHardWords[0].length) newHardWords = []
              newHardWords.push(word);
              //Req. 2.3.3
              if (hCount++ == 4) {
                refresh()
              }
              if (hCount == 1) {
                selected = word;
                whatChanged = "selected hard word";
              }
            }
          }
          self.setSomeDataEtc({selectedHardWord: selected, latestHardWords: newHardWords, whatChanged: whatChanged}, self.getLocalId());
        }//end onMsg
      }//end updateFrom
    });//end create Hard Words model tool
    
    //Create 2.3 Hard Words tool presenter  
    base.createItem({
      localId: "Hard Words tool presenter",
      dataEtc: {
        elementId: "Hard", 
        orientation: "vertical", 
        newAttribute: "style='display: inline-block;'",
        modelId: "Hard Words tool model",
        viewId: "View utility",
        viewMarkupId: "List view markup",
        parentId: "page",
        selectedItem: 0,
        isDisplayed: false
      },
      publisherIds: [
        "Hard Words tool model"
      ],
      updateFrom: presenterUpdateFrom
    });
    
    //Create 2.3 Hard Words title model
    base.createItem({
      localId: "Hard Words title model",
      dataEtc: {
        text: '2.3 Hard Word (loading)',
        distanceFromFocus: 2,
        listModelId: "Hard Words tool model",
        position: 0
      },
      publisherIds: [
        "Hard Words tool model"
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    base.createItem({
      localId: "Hard Words title presenter",
      dataEtc: {
        elementId: "Hard_0", 
        modelId: "Hard Words title model",
        viewId: "View utility",
        viewMarkupId: "Item view markup",
        newAttribute: "disabled='disabled'",
        parentId: "Hard",
        isSelected: false,
        isDisplayed: false
      },
      publisherIds: [
        "Hard Words title model"
      ],
      updateFrom: presenterUpdateFrom
    });//end create presenter
    
    //create presenter for auto-generated model data from Hard Words tool model
    base.createItem({
      localId: "Hard presenter",
      dataEtc: {
        viewId: "View utility",
        modelId: "Hard Words tool model",
        selectedType: 'Unapproved',
        selectedHardWord: '',
        selectedIndex: 0,
        lastIndex: 0
      },
      publisherIds: [
        "Hard Words tool model"
      ],
      updateFrom: function(publisher) {
        var pub = publisher.getDataEtc();
        var pubId = publisher.getLocalId();
        var here = this.getDataEtc();
        var newIndex = here.lastIndex;
        if (!$("#Hard_1").length) {
          //program refreshed, so forget last index
          this.setSomeDataEtc({lastIndex: 0}, this.getLocalId());
          newIndex = 0;
        }
        if (publisher.getLocalId() == "Hard Words tool model") {
          var view = base.getItem(this.getDataEtc().viewId);
          var hwCollection;
          if (pub.latestHardWords[0].length && pub.latestHardWords[0] != 'multiword placeholder') {
            //the worker sent a few more, based on a single sentence
            var newIndex = here.lastIndex;
            var arr = pub.latestHardWords;
            for (var i in arr) {
              displayHardWord(arr[i], ++newIndex, this);
            }
            this.setSomeDataEtc({lastIndex: newIndex}, this.getLocalId());
          }//end if latestHardWords
          else if (pub.selectedType == "Approved" || pub.selectedType != here.selectedType) {//the user selected a different type, so need to redisplay
            //Remove existing buttons displaying hard words
            //$('#Instance_0').parent().parent().nextAll().remove();
            $('#Hard_0').closest('div').nextAll().remove();
            //if hard words have sentences listed in this type, display
            var ind = 0;
            for (var hard in data.notIn1600[pub.selectedType]) { 
              if (Object.keys(data.notIn1600[pub.selectedType][hard].sentenceInfo).length) { 
                displayHardWord(hard, ++ind, this);
              }
            }
            if (ind == 0) {
                //remove selectedHardWord as nothing is selected, to inform observers
                publisher.setSomeDataEtc({selectedHardWord: '', whatChanged: "selected hard word"}, this.getLocalId());
            }
            //record type setting to detect future change
            this.setSomeDataEtc({selectedType: pub.selectedType}, this.getLocalId());
          }
        }
        function displayHardWord(word, index, self) {
          var selection = false; 
          var newAttr = "data-iconpos='right'";
          var elementId = 'Hard_' + index;
          //set data and publish to view
          if (index === 1) {
            selection = true;
            newAttr: "data-icon='arrow-r' data-iconpos='right'";
            var model = base.getItem(self.getDataEtc().modelId);
            model.setSomeDataEtc({selectedHardWord: word}, self.getLocalId());
          }
          var thisData = {text: word, position: index, isSelected: selection, parentId: 'Hard', elementId: elementId, 
            viewMarkupId: "Item view markup", newAttribute: newAttr}; 
          view.setSomeDataEtc({data: thisData}, self.getLocalId());
          view.getUpdateFromFunction().call(view, self);
        }//end display function
        if (pubId == 'Item view markup' && here.selectedHardWord) {
          //view updated us on click and is letting us know
          var model = base.getItem(here.modelId);
          model.setSomeDataEtc({selectedHardWord: here.selectedHardWord, whatChanged: 'selected hard word'}, this.getLocalId());
        }
      }//end updateFrom
    });//end create Hard presenter
    
    //Req. 2.4
    //Create Instance tool model
    base.createItem({
      localId: "Instance tool model",
      dataEtc: {
        distanceFromFocus: 4,
        selectedHardWord: '',
        selectedSentence: '',
        selectedSentenceId: undefined,
        whatChanged: '',
      },
      publisherIds: [
        "Hard Words tool model"
      ],
      updateFrom: function(publisher) {
        var pub = publisher.getDataEtc();
        var here = this.getDataEtc();
        var whatChanged = ''; 
        if (pub.whatChanged == "selected hard word" ) {
          if (here.selectedHardWord == pub.selectedHardWord) return;
          //saving will create new hard word here, and data will reveal sentences, and presenter will inform this model of selection
          whatChanged = pub.whatChanged;
          //if there's no hard word selected, the normal algorithm of selecting first displayed sentence won't work, so remove existing values
          var index = here.selectedSentenceId;
          var sentence = here.selectedSentence;
          if (!pub.selectedHardWord) { 
            index = undefined;
            sentence = '';
            //whatChanged = "no more hard words because type changed";
          }
        }
        else whatChanged = pub.whatChanged;
          
        if (pub.distanceFromFocus < 2) {
          this.setSomeDataEtc({distanceFromFocus: pub.distanceFromFocus, selectedHardWord: pub.selectedHardWord, selectedType: pub.selectedType, changeReceived: pub.whatChanged, whatChanged: whatChanged, latestHardWords: pub.latestHardWords}, this.getLocalId());
        }
      }
    });//end create Instance tool model
    
    
    //Create 2.4 Instance tool presenter  
    base.createItem({
      localId: "Instance tool presenter",
      dataEtc: {
        elementId: "Instance", 
        orientation: "vertical", 
        newAttribute: "style='display: inline-block; width: 200px;'",
        modelId: "Instance tool model",
        viewId: "View utility",
        viewMarkupId: "List view markup",
        parentId: "page",
        selectedItem: 0,
        selectedWord: '',
        isDisplayed: false
      },
      publisherIds: [
        "Instance tool model"
      ],
      updateFrom: presenterUpdateFrom
    });
    
    //Create Instance title model
    base.createItem({
      localId: "Instance title model",
      dataEtc: {
        text: '2.4 Where',
        distanceFromFocus: 2,
        listModelId: "Instance tool model",
        position: 0
      },
      publisherIds: [
        "Instance tool model"
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    base.createItem({
      localId: "Instance title presenter",
      dataEtc: {
        elementId: "Instance_0", 
        modelId: "Instance title model",
        viewId: "View utility",
        viewMarkupId: "Item view markup",
        newAttribute: "disabled='disabled'",
        parentId: "Instance",
        isSelected: false,
        isDisplayed: false
      },
      publisherIds: [
        "Instance title model"
      ],
      updateFrom: presenterUpdateFrom
    });//end create presenter
     
    
    //create presenter for auto-generated model data regarding sentences/instances
    base.createItem({
      localId: "Instance presenter",
      dataEtc: {
        viewId: "View utility",
        selectedHardWord: '',
        sentenceArray: [],
        selectedIndex: 0,
        lastLength: 0,
        nextPosition: 1,
        isDisplayed: false,
        lastDomIndex: 1
      },
      publisherIds: [
        "Instance tool model"
      ],
      updateFrom: function(publisher) {
        var pub = publisher.getDataEtc(); 
        var here = this.getDataEtc();
        var model = base.getItem("Instance tool model");
        
        if (publisher.getLocalId() == 'Item view markup') {
          //Item view markup has informed us because of user click
          domIndex = here.selectedIndex;
          var indexMap = model.getDataEtc().indexMap;
          var instance = indexMap[domIndex];
          model.setSomeDataEtc({selectedSentenceId: instance.id, hardIndex: instance.hardIndex, whatChanged: "a listed item was selected in presentation layer"}, this.getLocalId());
          return;
        }
        if(pub.whatChanged != "no more hard words or sentences coming" && pub.whatChanged != "selected hard word" && pub.whatChanged != "selected type and therefore probably selected word") return;
        var self = this;
        //this presenter was notified because of some change in model
        //clear display of previous results
        $('#Instance_0').parent().parent().nextAll().remove();
        $('#Instance_0').closest('div').nextAll().remove();
        //console.log('div surrounding title: ' + $($('#Instance')[0].firstChild.firstChild).attr('class'));
        //get selected type
        var type = pub.selectedType;
        //get selected hard word
        var word = pub.selectedHardWord; 
        //find sentence ids for hard word in type
        var typeObj = data.notIn1600[type] || {};
        var wordObj = typeObj[word] || {};
        var idObj = wordObj.sentenceInfo || {};
        //loop through sentences
        var id, hardIndex, poS, textArray, fragIndex, frag, textSentence;
        var domIndex = 1, joinable;
        for (id in idObj) { 
          //find text array indices for each sentence
          //for each sentence, loop based on text array indices (so e.g. if two of a hard word in a sentence, we'll do that sentence twice)
          for (hardIndex in idObj[id]) { 
            poS = idObj[id][hardIndex] || "unknownPoS";
            //find sentence text arrays for ids
            textArray = data.sentences[id].textArray;
            //clear variable
            joinable = [];
            //within each sentence, loop through words
            for (fragIndex in textArray) {
              frag = textArray[fragIndex];
              //ignore non-word fragments
              if (fragIndex % 2 == 0) {
                joinable.push(frag);
                continue;
              }
              //add ** around the hard word in focus
              if (fragIndex == hardIndex) {
                joinable.push('*');
                joinable.push(frag);
                joinable.push('*');
                continue;
              } 
              //apply default changes to each other word
              if (data.defaults[frag]) {
                console.log('default changed "' + frag + '" to "' + data.defaults[frag][poS] + '"')
                frag = data.defaults[frag][poS];
              }
              //apply replacements particular to this instance
              if (data.sentences[id].replace[fragIndex]) {
                console.log('replace changed "' + frag + '" to "' + data.sentences[id].replace[fragIndex] + '"')
                frag = data.sentences[id].replace[fragIndex];
              }
              joinable.push(frag);
            }
            //join sentence
            textSentence = joinable.join('');
            //display sentence
            displayAndSave(textSentence, domIndex++, id, hardIndex, self);
          }//end of looping through displaying sentences
        }//end of looping through original sentences
        
        
        
        //display is used just above
        function displayAndSave(sentence, domIndex, id, hardIndex, self) {
          var view = base.getItem(self.getDataEtc().viewId);
          var selection = false, newAttr = '';
          if (domIndex === 1) {
            selection = true;
            newAttr = "data-icon='arrow-r' data-iconpos='right'";
          }
          var elementId = 'Instance_' + domIndex;
          var thisData = {text: sentence, position: domIndex, isSelected: selection, parentId: 'Instance', elementId: elementId, 
            viewMarkupId: "Item view markup", newAttribute: newAttr}; 
          view.setSomeDataEtc({data: thisData}, self.getLocalId());
          view.getUpdateFromFunction().call(view, self);
          var modelData = {};
          //keep a mapping of domIndex to id so that when a sentence is clicked, it can be found in data
          modelData.indexMap = {};
          modelData.indexMap[domIndex] = {id: id, hardIndex: hardIndex};
          if (selection) {
            //tell model what sentence is selected so observers can be alerted or fetch required info
            modelData.selectedSentenceId = id;
            modelData.hardIndex = hardIndex;
            modelData.whatChanged = "a listed item was selected in presentation layer"
          }
          model.setSomeDataEtc(modelData, self.getLocalId());
        }//end display() 
        
      }//end updateFrom
    });//end create Instance presenter
    
    
    //Req. 2.5
    //Create PoS tool model
    base.createItem({
      localId: "PoS tool model",
      dataEtc: {
        distanceFromFocus: 4,
        selectedType: "",
        selectedWord: "",
        selectedSentence: "",
        partsOfSpeech: ["Noun", "Adj.", "Verb", "Adv.", "Other"],
        selectedPoS: ""
      },
      publisherIds: [
        "Instance tool model"
      ],
      updateFrom: function(publisher) {
        var pub = publisher.getDataEtc();
        if (pub.distanceFromFocus < 2) {
          this.setSomeDataEtc({distanceFromFocus: pub.distanceFromFocus, selectedHardWord: pub.selectedHardWord, selectedType: pub.selectedType, selectedSentenceId: pub.selectedSentenceId, hardIndex: pub.hardIndex, whatChanged: pub.whatChanged, latestHardWords: pub.latestHardWords}, this.getLocalId());
        }
      }
    });//end create PoS tool model
    
    
    //Create 2.5 PoS tool presenter  
    base.createItem({
      localId: "PoS tool presenter",
      dataEtc: {
        elementId: "PoS", 
        orientation: "vertical", 
        newAttribute: "style='display: inline-block;'",
        modelId: "PoS tool model",
        viewId: "View utility",
        viewMarkupId: "List view markup",
        parentId: "page",
        selectedItem: 0,
        isDisplayed: false
      },
      publisherIds: [
        "PoS tool model"
      ],
      updateFrom: presenterUpdateFrom
    });
    
    //Create PoS title model
    base.createItem({
      localId: "PoS title model",
      dataEtc: {
        text: '2.5 PoS',
        distanceFromFocus: 2,
        listModelId: "PoS tool model",
        position: 0
      },
      publisherIds: [
        "PoS tool model"
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    base.createItem({
      localId: "PoS title presenter",
      dataEtc: {
        elementId: "PoS_0", 
        modelId: "PoS title model",
        viewId: "View utility",
        viewMarkupId: "Item view markup",
        newAttribute: "disabled='disabled'",
        parentId: "PoS",
        isSelected: false,
        isDisplayed: false
      },
      publisherIds: [
        "PoS title model"
      ],
      updateFrom: presenterUpdateFrom
    });//end create presenter
     
    
    //create presenter for auto-generated model data regarding sentences/PoSs
    base.createItem({
      localId: "PoS presenter",
      dataEtc: {
        viewId: "View utility",
        selectedHardWord: '',
        sentenceArray: [],
        selectedIndex: 0,
        isDisplayed: false
      },
      publisherIds: [
        "PoS tool model"
      ],
      updateFrom: function(publisher) {
        var here = this.getDataEtc();
        var pub = publisher.getDataEtc();
        if (!here.isDisplayed) {
          var poS = pub.selectedPoS; 
          var partsOfSpeech = pub.partsOfSpeech;   
          for (var i in partsOfSpeech) {
            //set data and publish to view
            var view = base.getItem(this.getDataEtc().viewId);
            var selection = false;
            var newAttr = "data-iconpos='right'";
            if (poS === partsOfSpeech[i]) {
              selection = true;
              newAttr = "data-iconpos='right' data-icon='arrow-r'";
            }
            var place = parseInt(i) +1;
            var elementId = 'PoS_' + place;
            var thisData = {text: partsOfSpeech[i], position: place, isSelected: selection, parentId: 'PoS', elementId: elementId, 
              viewMarkupId: "Item view markup", newAttribute: newAttr}; 
            view.setSomeDataEtc({data: thisData}, this.getLocalId());
            view.getUpdateFromFunction().call(view, this);
          }
          this.setSomeDataEtc({isDisplayed: true}, this.getLocalId());
        }
        else if (pub.whatChanged === "Different sentence selected") {
          //easy way to remove selection until part of speech detection is included: loop and add button markup
          $("#PoS").children().first().children().first().nextAll().buttonMarkup({theme: 'c', corners: false, icon: null, iconpos: "right"});
        }
      }//end updateFrom
    });//end create PoS presenter
    
    
    //Req. 2.6 
    //callback for ajax jsonp
    
    //var callback = function callback(response) {
      //var pub = base.getItem('PoS tool model').getDataEtc();
      //var self = base.getItem('Replacement tool model');
      //ajaxCallback(response, pub, self)
    //}
    function ajaxCallback(response, pub, self) { 
      var here = self.getDataEtc();
      //console.log('in callback, response: ' + response)
      var succeededQueries = here.succeededQueries || {};
      var failedQueries = here.failedQueries || {};
      var arr = [];
      if (response.charAt) {
        //console.log('string response from ajax, returning out of callback');
        return;
      }
      var poS = '', parts, suggestions, queryWord = '';
      for (var i in response) {
        parts = [1, 2]
        if (response[i].charAt) {
          parts = response[i].split(": '");
          if (!parts[1]) {
            //console.log('ajax failed for: ' + parts[0]);
            failedQueries[parts[0]] = new Date();
          }
        }
        if (parts[0] == 'word') {
          //this is the original query word
          queryWord = parts[1].split("'")[0]; 
          //prepare to store suggestions
          if (!data.notIn1600[pub.selectedType][queryWord]) {
            //console.log('unknown word ajaxed, probably undefined in replacement tool model');
            break;
          }
          if (!data.notIn1600[pub.selectedType][queryWord].suggestions) {
            data.notIn1600[pub.selectedType][queryWord].suggestions = {};
          }
          suggestions = data.notIn1600[pub.selectedType][queryWord].suggestions;
          succeededQueries[queryWord] = new Date();
        }
        else if (response[i].length == 0) {
          //console.log('received [[]] for: ' + queryWord)
          succeededQueries[queryWord] = new Date();
          break;
        }
        else if (parts[0] == 'pos') {
          //this is part of Speech
          poS = parts[1].split("'")[0];
          switch(poS) {
            case 'n': poS = 'noun'; break;
            case 'a': 
            case 's': poS = 'adj.'; break;
            case 'r': poS = 'adv.'; break;
            case 'v': poS = 'verb'; break;
            default: poS = '?'; break;
          }
          if (!suggestions[poS]) {
            suggestions[poS] = [];
          }
        }
        else if (response[i].push) {
          //this is a synset--a group of synonyms
          var synset = response[i]; 
          //assume it is hard until proven easy
          var vocab = 'unlimited';
          for (var index in synset) {
            var synonym = synset[index];
            //remove any underscores, replace with spaces ('g' is global flag)
            synonym = synonym.replace(/_/g, ' ');
            //then store the synonym
            //also record which synset each suggestion is in, in case program needs to group them later.
            suggestions[poS].push({suggestion: synonym, vocab: vocab, synset: i});
            //check how easy the synonym is
            var index = suggestions[poS].length - 1;
            arr.push({single: synonym, poS: poS, originalWord: queryWord, type: "Unapproved", index: index});
          }//end for index in synset
        }//end else if array
        else console.log('unknown response in ajax callback');
      }
      //find vocab levels
      worker.postMessage({arr: arr});
      self.setSomeDataEtc({receivedFor: queryWord, succeededQueries: succeededQueries, failedQueries: failedQueries, whatChanged: "Ajax response received"}, self.getLocalId());
    } //end callback for Replacement tool model ajax
    
    
    //Req. 2.6
    //Create Replacement tool model
    base.createItem({
      localId: "Replacement tool model",
      dataEtc: {
        suggestions: [],
        latestHardWords: [],
        requested: {},
        recievedFor: '',
        selectedHardWord: "",
        distanceFromFocus: 4,
        selectedItem: 0,
        selectedType: '',
        selectedReplacement: '',
        succeededQueries: {},
        failedQueries: {}
      },
      publisherIds: [
        "PoS tool model",
      ],
      updateFrom: function(publisher) { 
        var pub = publisher.getDataEtc();
        var pubId = publisher.getLocalId();
        var here = this.getDataEtc();
        var requested = here.requested;
        //get hard words and create suggestion list
        if (pub.distanceFromFocus < 2 && pub.latestHardWords[0] != "multiword placeholder" && pub.latestHardWords[0].length) {
          //ajax for suggestionArray if not already
          var self = this;
          for (var i in pub.latestHardWords) {
            var word = pub.latestHardWords[i];
            if (!requested[word]) {
             setTimeout( function() {
                //if (!Object.keys(requested).length) requestSuggestions(word, pub, self);
                requestSuggestions(word, pub, self)
             }, 0);
              requested[word] = true;
            }//end if requested
          }//end for each lastest hard word
          this.setSomeDataEtc({distanceFromFocus: pub.distanceFromFocus, whatChanged: "More requests ajaxed"}, this.getLocalId());
        }//end if 
        //repl tool is also notified for any change in selectedHardWord or selectedInstance or selectedPoS
        if (pub.selectedSentenceId == undefined || !pub.hardIndex || ( pub.selectedSentenceId == here.selectedSentenceId && pub.hardIndex == here.hardIndex && pub.selectedType == here.selectedType && pub.whatChanged != "Suggestion vocab level found")) return;
        this.setSomeDataEtc({whatChanged: "A sentence is ready to display", selectedType: pub.selectedType, selectedPoS: pub.selectedPoS, selectedSentenceId: pub.selectedSentenceId, hardIndex: pub.hardIndex, selectedHardWord: pub.selectedHardWord}, this.getLocalId());
        //but there's no point in running unless ajax callback finished and worker submitted vocab level
        if (pub.whatChanged != "Suggestion vocab level found" && !here.suggestionArray && pub.whatChanged != "a listed item was selected in presentation layer") return; 
        var self = this;
        setTimeout( function() {
            var remaining = here.requested;
            var succeeded = here.succeededQueries
            if (!succeeded[pub.selectedHardWord]) {
              requestSuggestions(pub.selectedHardWord, pub, self)
            }
            
            loop(0, pub, self);
            self.setSomeDataEtc({succeededQueries: here.succeededQueries, requested: remaining}, self.getLocalId());
        }, 3000);
        function loop(i, pub, self) {
              var here = self.getDataEtc();
              var remaining = here.requested;
              var succeeded = here.succeededQueries;
              var missed = Object.keys(remaining)[i];
              if (succeeded[missed] || !missed) {
                delete remaining[missed]; 
              }
              else {
                requestSuggestions(missed, pub, self); 
              }
              if (i++ < Object.keys(remaining).length) {setTimeout("loop("+i+")", 1000); }
            }
        //when pub change, check for suggestions in order of priority using pub.st/shw/ssi/spos if they exist, and also check error messages
        //save suggestions in array of objects like [{suggestion, poS, vocabLevel, optionalErrorMessage, isDefault}]
        var suggestionArray = [], errorMsg = '';
        //if no pub.selectedHardWord, no suggestions are wanted
        if (!pub.selectedHardWord) {
          errorMsg = 'No hard word is selected.'; console.log(errorMsg);
          suggestionArray.push({errorMsg: errorMsg});
        }
        else if (here.succeededQueries[pub.selectedHardWord]) {
          //try to find suggestions for the new hard word in storage and order appropriately
          //first apply any replacements user chose for this instance
          var particularChoice = data.sentences[pub.selectedSentenceId].replace[pub.hardIndex];
          if (particularChoice) {
            suggestionsArray.push({suggestion: particularChoice, poS: pub.selectedPos, vocabLevel: 'yours', isDefault: false});
          }
          //apply user-chosen default if any
          if (data.defaults[pub.selectedHardWord]) {
            var defaultChoice = data.defaults[pub.selectedHardWord][pub.selectedPoS] || data.defaults[pub.selectedHardWord]["unknownPoS"];
            if (defaultChoice) {
              suggestionsArray.push({suggestion: defaultChoice, poS: pub.selectedPos, vocabLevel: 'yours', isDefault: true});
            }
          }
          //sort suggestions if any
          var easy = [], hard = [];
          var suggestions = data.notIn1600[pub.selectedType][pub.selectedHardWord].suggestions;
          if (!Object.keys(suggestions).length) {
            errorMsg = 'Remote database was contacted but it has no suggestions for "' + pub.selectedHardWord + '".';
          }
          var synonymArray, i, suggestion = '', vocab, whole, view, selection, elementId, thisData, newAttr;
          for (var poS in suggestions) {
            synonymArray = suggestions[poS];
            for (i in synonymArray) {
              suggestion = synonymArray[i].suggestion;
              vocab = synonymArray[i].vocab;
              if (vocab == 'hard') {
                hard.push({suggestion: suggestion, poS: poS, vocabLevel: vocab, isDefault: false});
                //make sure it's not default
                if (data.defaults[pub.selectedHardWord] && (data.defaults[pub.selectedHardWord][poS] == suggestion || data.defaults[pub.selectedHardWord]["unknownPoS"] == suggestion)) {
                  continue;//it's already added
                }
              }
              else {
                easy.push({suggestion: suggestion, poS: poS, vocabLevel: vocab, isDefault: false});
              }
            }//end synonyms for pos
          }//end pos in suggestions
          suggestionArray = suggestionArray.concat(easy);
          suggestionArray = suggestionArray.concat(hard);
          //add original hard word as last suggestion
          suggestionArray.push({suggestion: pub.selectedHardWord, poS: pub.selectedPos, vocabLevel: 'hard', errorMsg: errorMsg, isDefault: false});
        }
        else if (here.failedQueries[pub.selectedHardWord]) {
          errorMsg = 'Tried to get suggestions for "' + pub.selectedHardWord + '" from remote database and failed at ' + here.failedQueries[pub.selectedHardWord] + '. Will try one more time.'; 
          //requestSuggestions(pub.selectedHardWord, pub, this);
        }
        //publish for sake of presenter
          this.setSomeDataEtc({suggestionArray: suggestionArray, whatChanged: "Created array of suggestions to display", selectedType: pub.selectedType, selectedPoS: pub.selectedPoS, selectedSentenceId: pub.selectedSentenceId, hardIndex: pub.hardIndex, selectedHardWord: pub.selectedHardWord}, this.getLocalId());
          
      }//end updateFrom
    });//end create Replacement tool model
    
    function requestSuggestions(word, pub, self) {
      if (!word) return;
      $.ajax({
        url: "http://mc.superstring.org:8805/2/getsyns.php?q=" + word,
        type: 'GET',
        format: "json",
        jsonp: false,
        jsonpCallback: "callback",
        contentType: "application/json",
        dataType: 'jsonp',
        //success: function callback(response) { ajaxCallback(word, pub, self);},
        cache: true
      }).fail(function(jqXHR, textStatus) {
        //console.log('responseText: ' + jqXHR.responseText + ', headers: ' + jqXHR.getAllResponseHeaders() + ', word: ' + word);
        //callback([word], pub, self);
      }).done(function(response) {
        ajaxCallback(response, pub, self);
      });
    }
    
    //Create 2.6 Replacement tool presenter  
    base.createItem({
      localId: "Replacement tool presenter",
      dataEtc: {
        elementId: "Replacement", 
        orientation: "vertical", 
        newAttribute: "style='display: inline-block; width: 200px;'",
        modelId: "Replacement tool model",
        viewId: "View utility",
        viewMarkupId: "List view markup",
        parentId: "page",
        selectedItem: 0,
        isDisplayed: false
      },
      publisherIds: [
        "Replacement tool model"
      ],
      updateFrom: presenterUpdateFrom
    });
    
    //Create Replacement title model
    base.createItem({
      localId: "Replacement title model",
      dataEtc: {
        text: '2.6 Replacement (loading)',
        distanceFromFocus: 2,
        listModelId: "Replacement tool model",
        position: 0
      },
      publisherIds: [
        "Replacement tool model"
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    base.createItem({
      localId: "Replacement title presenter",
      dataEtc: {
        elementId: "Replacement_0", 
        modelId: "Replacement title model",
        viewId: "View utility",
        viewMarkupId: "Item view markup",
        newAttribute: "disabled='disabled'",
        parentId: "Replacement",
        isSelected: false,
        isDisplayed: false
      },
      publisherIds: [
        "Replacement title model"
      ],
      updateFrom: presenterUpdateFrom
    });//end create presenter
    
    //Create Replacement input model
    base.createItem({
      localId: "Replacement input model",
      dataEtc: {
        distanceFromFocus: 2,
        listModelId: "Replacement tool model",
        text: 'your choice here',
        position: 0
      },
      publisherIds: [
        "Replacement tool model"
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    //the input view markup for input items
    base.createItem({
      localId: "Input view markup",
      dataEtc: {
        dataType: "html",
        requirements: ["doT.js"],
        data: '<div data-theme="b" style="border: 0;" data-shadow="false" {{=it.newAttribute}} id="{{=it.elementId}}"  ><input type="text" id="replacement_input" value="{{=it.text}}" /><label style=" border: 0; padding: 0px; margin: 0px 0px 0px 10px;">Approve similar<input type="checkbox" id="replacement_isDefault" data-mini="true" disabled="disabled" /></label></div>' 
      },
      updateFrom: function(viewUtility) {
        //publisher is view utility
        //var d = this.getDataEtc(); 
        //console.log('itemview: ' + viewUtility.getLocalId() + ' ' + counter++)
        //console.log('view markup has: Step: ' + d.Step + ', Method: ' + d.Method)
        var self = this;
        //prepare to collect user events and pass them to presenter
        if (inputEventHandler) return;
        $('#replacement_isDefault').on('change', function(e) {
          var model = base.getItem("Replacement tool model");
          //if manual change in checkbox, notify model chain (which will check for selectedReplacement).
          var replacement = model.getDataEtc().selectedReplacement;
          replacement.isDefault = this.checked;
          model.setSomeDataEtc({selectedReplacement: replacement}, self.getLocalId());
        });
        $('#replacement_input').closest('span').attr('id', 'replacer_span');
        $('#replacer_span').keypress(function (evt) {
          //Deterime where our character code is coming from within the event
          var charCode = evt.charCode || evt.keyCode;
          if (charCode  == 13) { //Enter key's keycode
          //without this, cpu overloads and crashes on Enter, at least in chrome 26
            evt.preventDefault()
            //$('#replacement_input').trigger('change');
          }
        });
        $('#replacement_input').on('keyup', function (evt) {
          var model = base.getItem("Replacement tool model");
          //if manual change in field, on keyup, notify model chain (which will check for selectedReplacement).
          var replacement = {suggestion: $(this).val(), isDefault: $('#replacement_isDefault')[0].checked, vocabLevel: 'yours', poS: model.getDataEtc().selectedPoS};
          model.setSomeDataEtc({selectedReplacement: replacement, whatChanged: "Replacement selected"}, self.getLocalId());
        });
        //prevent multiple event handlers
        inputEventHandler = true;
      }
    });
    
    base.createItem({
      localId: "Replacement input presenter",
      dataEtc: {
        elementId: "Replacement_1", 
        modelId: "Replacement input model",
        viewId: "View utility",
        viewMarkupId: "Input view markup",
        newAttribute: "disabled='disabled'",
        parentId: "Replacement",
        isSelected: false,
        isDisplayed: false
      },
      publisherIds: [
        "Replacement input model"
      ],
      updateFrom: presenterUpdateFrom
    });//end create presenter
     
    
    //create presenter for auto-generated model data regarding sentences/Replacements
    base.createItem({
      localId: "Replacement presenter",
      dataEtc: {
        viewId: "View utility",
        modelId: "Replacement tool model",
        selectedHardWord: '',
        suggestionArray: [],
        selectedIndex: 0,
        lastAjax: 0,
        isDisplayed: false
      },
      publisherIds: [
        "Replacement tool model"
      ],
      updateFrom: function(publisher) {
        var pub = publisher.getDataEtc(); 
        var pubId = publisher.getLocalId();
        var here = this.getDataEtc();
        if (pub.whatChanged == "Ajax response received" || pub.whatChanged == "More requests ajaxed") {
          return;
        }
        
        if (pub.whatChanged == "Created array of suggestions to display") {
          //remove any previous suggested replacements and errors
          //;console.log('removing in rep pres')
          $('#Replacement_1').closest('div').nextAll().remove();
          //$('#replacement_error').remove();
          var arr = pub.suggestionArray;
          var errorMsg = '';
          for (var i in arr) {
            if (arr[i].errorMsg == 'No hard word is selected.') {
              errorMsg = arr[i].errorMsg;
              break;
            }
            if (i == 0) {
              //display will put the suggestion in the text field
              //if default, let the check box be selected
              if (arr[i].isDefault) $('#replacement_isDefault').prop("checked", true).checkboxradio('refresh');
            }
            var poSString = '';
            if (arr[i].poS) {
              poSString = arr[i].poS + ', '
            }
            var moreText = '(' + poSString + arr[i].vocabLevel + ')'
            if (arr[i].errorMsg) errorMsg += arr[i].errorMsg + ' ';
            display(arr[i].suggestion, moreText, parseInt(i)+2, this); 
          }
          $('#Replacement').append('<div id="replacement_error">' + errorMsg + '</div>');
          //remove the "(loading)" from title
          $('#Replacement_0').parent().children().first().children().first().text("2.6 Replacement");
          //$('#Replacement_0').text("2.6 Replacement").trigger('refresh')
          //refresh css
          $('#Replacement').closest('form').trigger('create');
          this.setSomeDataEtc({suggestionArray: arr}, this.getLocalId());
        } //end if pub.whatChanged == "Created array of suggestions to display"
        
        else if (here.selectedIndex) {
          // view updated us on click and is letting us know
          var info = here.suggestionArray[here.selectedIndex - 2]
          //change field
          $('#replacement_input').val(info.suggestion)//.trigger('keyup');
          //change checkbox
          $('#replacement_isDefault').prop("checked", info.isDefault).checkboxradio('refresh');
          //let model chain know
          var model = base.getItem(here.modelId);
          model.setSomeDataEtc({selectedReplacement: info, whatChanged: "Replacement selected"}, this.getLocalId());
        }
        function display(suggestion, moreText, num, self) {
          var view = base.getItem(self.getDataEtc().viewId);
          var selection = false;
          var newAttr = "";
          if (num === 2) {
            selection = true;
            newAttr = "data-icon='arrow-r' data-iconpos='right'"
            //Put the new selection in the field
            $('#replacement_input').val(suggestion)//.trigger('keyup');
          }
          var elementId = 'Replacement_' + num;
          var text = suggestion + ' ' + moreText;
          var thisData = {text: text, position: num, isSelected: selection, parentId: 'Replacement', elementId: elementId, 
            viewMarkupId: "Item view markup", newAttribute: newAttr}; 
          view.setSomeDataEtc({data: thisData}, self.getLocalId());
          view.getUpdateFromFunction().call(view, self);
        }
        if (pub.distanceFromFocus < 2) {
          var self = this;
          setTimeout(function() {
            if (!$('#Replacement_2').length && !$('#replacement_error').length) {
              //taking too long, probably no internet connection
              //add original hard word as last suggestion
              var num = 2;
              display(pub.selectedHardWord, '(hard)', num, self);
              $('#Replacement').append('<div id="replacement_error">Somehow this timed out.</div>');
              //remove the "(loading)" from title
              $('#Replacement').find('.ui-btn-text').first().text("2.6 Replacement");
              //refresh css
              $('#Replacement').closest('form').trigger('create');
            }
          }, 6000);
        }
      }//end updateFrom
    });//end create Replacement presenter
    
    
    //Req. 2.7
    //Create Result tool model
    base.createItem({
      localId: "Result tool model",
      dataEtc: {
        distanceFromFocus: 4,
        text: '',
        sentenceIndex: -1,
        outputSentences: [],
        isApproved: undefined
      },
      publisherIds: [
        "Replacement tool model",
      ],
      updateFrom: function(publisher) {
        var pub = publisher.getDataEtc();
        var pubId = publisher.getLocalId();
        var here = this.getDataEtc();
        var textSentence = here.text;
        var whatChanged = '';
        if (here.distanceFromFocus != pub.distanceFromFocus) {
          this.setSomeDataEtc({distanceFromFocus: pub.distanceFromFocus}, this.getLocalId());
        }
        var id, textArray;
        if (pub.whatChanged == "A sentence is ready to display" || pub.whatChanged == "Replacement selected") {
          id = pub.selectedSentenceId;
          textArray = data.sentences[id].textArray;
        }
        //modify active sentence by replacing hard word with replacement word
        if (pub.whatChanged == "Replacement selected") {
          var replacement = pub.selectedReplacement; // properties: suggestion, poS, vocabLevel, isDefault
          var selectedHardWord = pub.selectedHardWord; 
          var hardIndex = pub.hardIndex;
          var frag, joinable = [], fragIndex;
          for (fragIndex in textArray) {
            frag = textArray[fragIndex];
            //ignore non-word fragments
            if (fragIndex % 2 == 0) {
              joinable.push(frag);
              continue;
            }
            //replace the hard word in focus
            if (fragIndex == hardIndex) {
              joinable.push(replacement.suggestion);
              continue;
            } 
            //apply default changes to each other word
            if (data.defaults[frag]) {
              console.log('default changed "' + frag + '" to "' + data.defaults[frag][poS] + '"')
              frag = data.defaults[frag][poS];
            }
            //apply replacements particular to this instance
            if (data.sentences[id].replace[fragIndex]) {
              console.log('replace changed "' + frag + '" to "' + data.sentences[id].replace[fragIndex] + '"')
              frag = data.sentences[id].replace[fragIndex];
            }
            joinable.push(frag);
          }//end for frag
        }//end if replacement
        if (pub.whatChanged == "A sentence is ready to display" || pub.whatChanged == "Replacement selected") {
          //join sentence
          textSentence = (joinable) ? joinable.join('') : textArray.join('');
          whatChanged = "New value for textarea";
          //store modified sentence so observers (i.e. presentation layer and output) can use it
          this.setSomeDataEtc({distanceFromFocus: pub.distanceFromFocus, text: textSentence, selectedSentenceId: pub.selectedSentenceId, selectedType: pub.selectedType, lastReplacement: pub.selectedReplacement, whatChanged: whatChanged}, this.getLocalId());
          
        }//end if sentence
      }//end updateFrom
    });//end create tool model
    
    //Create 2.7 Result tool presenter  
    base.createItem({
      localId: "Result tool presenter",
      dataEtc: {
        elementId: "Result", 
        orientation: "vertical", 
        newAttribute: "style='display: inline-block; width: 200px;'",
        modelId: "Result tool model",
        viewId: "View utility",
        viewMarkupId: "List view markup",
        parentId: "page",
        selectedItem: 0,
        isDisplayed: false
      },
      publisherIds: [
        "Result tool model"
      ],
      updateFrom: presenterUpdateFrom
    });
    
    //Create Result title model
    base.createItem({
      localId: "Result title model",
      dataEtc: {
        text: '2.7 Result',
        distanceFromFocus: 2,
        listModelId: "Result tool model",
        position: 0
      },
      publisherIds: [
        "Result tool model"
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    base.createItem({
      localId: "Result title presenter",
      dataEtc: {
        elementId: "Result_0", 
        modelId: "Result title model",
        viewId: "View utility",
        viewMarkupId: "Item view markup",
        newAttribute: "disabled='disabled'",
        parentId: "Result",
        isSelected: false,
        isDisplayed: false
      },
      publisherIds: [
        "Result title model"
      ],
      updateFrom: presenterUpdateFrom
    });//end create presenter
    
    //Create Result input model
    base.createItem({
      localId: "Result input model",
      dataEtc: {
        distanceFromFocus: 2,
        listModelId: "Result tool model",
        text: 'Modified sentence coming here...',
        position: 0
      },
      publisherIds: [
        "Result tool model"
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    //the Result view markup
    base.createItem({
      localId: "Result view markup",
      dataEtc: {
        dataType: "html",
        requirements: ["doT.js"],
        data: '<div data-theme="b" style="border: 0;" data-shadow="false" {{=it.newAttribute}} id="{{=it.elementId}}"  ><textarea id="Result_textarea" >{{=it.text}}</textarea><label style=" border: 0; padding: 0px;">Approve word here<input type="checkbox" disabled="disabled" id="result_approve" data-mini="true"  /></label></div>' 
      },
      updateFrom: function(viewUtility) {
        //publisher is view utility
        //var d = this.getDataEtc(); 
        //console.log('itemview: ' + viewUtility.getLocalId() + ' ' + counter++)
        //console.log('view markup has: Step: ' + d.Step + ', Method: ' + d.Method)
        var self = this;
        //prepare to collect user events and pass them to presenter
        if (resultEventHandler) return;
        $('#result_approve').on('change', function(e) {
          var model = base.getItem('Result tool model');
          model.setSomeDataEtc({isApproved: this.checked}, self.getLocalId());
          model.getUpdateFromFunction().call(model, self);
        });
        $('#Result_textarea').closest('span').attr('id', 'replacer_span');
        $('#replacer_span').keypress(function (evt) {
          //Deterime where our character code is coming from within the event
          var charCode = evt.charCode || evt.keyCode;
          if (charCode  == 13) { //Enter key's keycode
          //without this, cpu crashes, at least in chrome 26
          evt.preventDefault()
          $('#Result_textarea').trigger('change');
          }
        });
        $('#Result_textarea').on("change", function(e) {
          //e.preventDefault();
          //console.log('changed to: ' + $('#Result_textarea').val());
          
          
        });//END .ON?
        //prevent multiple event handlers
          resultEventHandler = true;
      }
    });
    
    base.createItem({
      localId: "Result input presenter",
      dataEtc: {
        elementId: "Result_1", 
        modelId: "Result tool model",
        viewId: "View utility",
        viewMarkupId: "Result view markup",
        newAttribute: "disabled='disabled'",
        parentId: "Result",
        isSelected: false,
        isDisplayed: false
      },
      publisherIds: [
        "Result tool model"
      ],
      updateFrom: function (publisher) {
        var pInfo = publisher.getDataEtc(); 
        var here = this.getDataEtc(); 
        var model = base.getItem(here.modelId);
        var position = model.getDataEtc().position; 
        //check if it's model
        if ("distanceFromFocus" in pInfo) {
          //this should be model
          if (pInfo.distanceFromFocus === 1 || pInfo.distanceFromFocus === 0) {
            //If the data is not displayed, display it
            var displayable = (!$('#' + here.elementId).length); 
            if (displayable) {
              //set data and publish, allowing presentation function to display view
              var view = base.getItem(this.getDataEtc().viewId);
              this.setSomeDataEtc(pInfo, this.getLocalId());
              //this.setSomeDataEtc({text: pInfo.text, position: pInfo.position}, this.getLocalId());
              view.setSomeDataEtc({data: here}, this.getLocalId());
              view.getUpdateFromFunction().call(view, this);
              this.setSomeDataEtc({isDisplayed: true});
            } 
            else {
              //already displayed, but need to change value of textarea
              $('#Result_textarea').val(pInfo.text);
            }
          }
        }
        //if (pInfo.whatChanged == "New value for textarea") {
         // $('#Result_textarea').val(pInfo.text);
        //}
        //check if it's view
        else if (publisher.getLocalId() == here.viewMarkupId) {
          //this should be view after having set here.something
          
        } // end if it's view/html
        //let textarea grow to larger than text size (via jquery mobile)
        $('#Result_textarea').trigger('keyup')
      }//end presenterUpdateFrom
    });//end create presenter
   
    
     //Create 3.1 User Guide
    base.createItem({
      localId: "Conclusion tool model",
      dataEtc: {
        selectedItem: 1,
        distanceFromFocus: 2,
        parentSelectionRequired: 3
      },
      publisherIds: [
        "Steps tool model"
      ],
      updateFrom: focusOnSelect
      
    });
    function focusOnSelect(publisher) {
      var here = this.getDataEtc();
      var pInfo = publisher.getDataEtc();
      var parentDistance = pInfo.distanceFromFocus;
      var inFocus = (parentDistance > -1 && parentDistance < 2);
      if (pInfo.selectedItem === here.parentSelectionRequired && inFocus) {
        //parent has the right thing selected and is itself displayable, so make this displayable
        this.setSomeDataEtc({distanceFromFocus: parentDistance}, this.getLocalId());
      }
    }
    
    //Create 3.1 Import Conclusion tool presenter  
    base.createItem({
      localId: "Conclusion tool presenter",
      dataEtc: {
        elementId: "Conclusion", 
        orientation: "vertical", 
        newAttribute: "style='display: inline-block; width: 300px;'",
        modelId: "Conclusion tool model",
        viewId: "View utility",
        viewMarkupId: "List view markup",
        parentId: "page",
        selectedItem: 1,
        isDisplayed: false
      },
      publisherIds: [
        "Conclusion tool model"
      ],
      updateFrom: presenterUpdateFrom
    });
    
    //Create 3.1 Import Conclusion title model
    base.createItem({
      localId: "Conclusion title model",
      dataEtc: {
        text: 'Step 3 User Guide',
        distanceFromFocus: 2,
        listModelId: "Conclusion tool model",
        position: 0
      },
      publisherIds: [
        "Conclusion tool model"
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    base.createItem({
      localId: "Conclusion title presenter",
      dataEtc: {
        elementId: "Conclusion_0", 
        modelId: "Conclusion title model",
        viewId: "View utility",
        viewMarkupId: "Item view markup",
        newAttribute: "disabled='disabled'",
        parentId: "Conclusion",
        isSelected: false,
        isDisplayed: false
      },
      publisherIds: [
        "Conclusion title model"
      ],
      updateFrom: presenterUpdateFrom
    });//end create presenter
    
    //Create Instructions Conclusion model
    base.createItem({
      localId: "Instructions Conclusion model",
      dataEtc: {
        text: 'Congratulations, you should now have text with a controlled vocabulary size (1597 words plus digits plus any extra words you approved). If you do not refresh or close this page, this program should remember your preferences. So, for example, if you just finished simplifying one chapter of your book, you could return to Step 1 and load the next chapter and find sensible defaults already in place.',
        distanceFromFocus: 2, // not displayable but selected and preloaded
        listModelId: "Conclusion tool model",
        position: 1
      },
      publisherIds: [
        "Conclusion tool model"
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    base.createItem({
      localId: "Conclusion 1 presenter",//use parentId and model position and "presenter"
      dataEtc: {
        elementId: "Conclusion_1", //use parentId and model position
        modelId: "Instructions Conclusion model",
        viewId: "View utility",
        viewMarkupId: "Item view markup",
        newAttribute: "disabled='disabled' ",
        parentId: "Conclusion",
        isSelected: true,
        isDisplayed: false //i.e. not yet
      },
      publisherIds: [
        "Instructions Conclusion model"
      ],
      updateFrom: presenterUpdateFrom
    });//end create presenter
     
         //Req. 3.2 Create 3.2 Output tool model
    base.createItem({
      localId: "3.2 Output tool model",
      dataEtc: {
        selectedItem: undefined,
        distanceFromFocus: 2,
        parentSelectionRequired: 3
      },
      publisherIds: [
        "Steps tool model"
      ],
      updateFrom: focusOnSelect
    });
    
    //Create 3.2 Output tool presenter  
    base.createItem({
      localId: "3.2 Output tool presenter",
      dataEtc: {
        elementId: "Output", 
        orientation: "vertical", 
        newAttribute: "style='display: inline-block; width: 600px;'",
        modelId: "3.2 Output tool model",
        viewId: "View utility",
        viewMarkupId: "List view markup",
        parentId: "page",
        selectedItem: undefined,
        isDisplayed: false
      },
      publisherIds: [
        "3.2 Output tool model"
      ],
      updateFrom: presenterUpdateFrom
    });
    
    //Create 3.2 Output text tool title model
    base.createItem({
      localId: "3.2 Output title model",
      dataEtc: {
        text: 'The simplified text',
        distanceFromFocus: 2,
        listModelId: "3.2 Output tool model",
        position: 0
      },
      publisherIds: [
        "3.2 Output tool model"
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    base.createItem({
      localId: "3.2 Output title presenter",
      dataEtc: {
        elementId: "Output_0", 
        modelId: "3.2 Output title model",
        viewId: "View utility",
        viewMarkupId: "Item view markup",
        newAttribute: "disabled='disabled'",
        parentId: "Output",
        isSelected: false,
        isDisplayed: false
      },
      publisherIds: [
        "3.2 Output title model"
      ],
      updateFrom: presenterUpdateFrom
    });//end create presenter
    
    //Create Output area model
    base.createItem({
      localId: "Output Area model",
      dataEtc: {
        placeholder: 'The program will put simplified text here',
        title: "",
        text: "",
        timesChanged: 0,
        distanceFromFocus: 2,
        listModelId: "3.2 Output tool model",
        position: 1
      },
      publisherIds: [
        "3.2 Output tool model"
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    
    base.createItem({
      localId: "Output 1 presenter",
      dataEtc: {
        elementId: "Output_1", 
        modelId: "Output Area model",
        viewId: "View utility",
        viewMarkupId: "Textarea view markup",
        newAttribute: "data-mini='true' disabled='disabled'",
        textareaId: "textarea__Output_1",
        titleFieldId: "title__Output_1",
        parentId: "Output",
        isSelected: true,
        isDisplayed: false
      },
      publisherIds: [
        "Output Area model"
      ],
      updateFrom: presenterUpdateFrom
    });//end create presenter
    
  }
  return {
    go: go
  }
  
})();
  
var gOldOnError = window.onerror;
// Override previous handler.
window.onerror = function myErrorHandler(errorMsg, url, lineNumber) {
  //console.log('global error: ' + errorMsg + " \n url: " + url + " \n line: " + lineNumber)
  //console.log(errorMsg == "Uncaught ReferenceError: loop is not defined")
  if (gOldOnError && errorMsg != "Uncaught ReferenceError: loop is not defined")
    // Call previous handler.
    return gOldOnError(errorMsg, url, lineNumber);

  // Just let default handler run.
  return false;
}
 