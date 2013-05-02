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
  var sharedData = {};
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
          if (!displayable && publisher.getLocalId() == "Instance tool model" && pInfo.hardWord != here.hardWord && $('#Instance_1' ).length) {
            //erase what's been displayed and redisplay
            $('#' + here.elementId).closest('fieldset').empty();
            refresh();
            this.setSomeDataEtc({selectedWord: pInfo.selectedWord}, this.getLocalId());
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
        text: 'Step 1: Import Text',
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
            }
          }
          
          var idArray = selectedId.split('_');
          var selectedInt = idArray[1];
          var idStarter = "#" + idArray[0];
          var unselected = [];
          var permanent = self.getDataEtc();
          for (var i = 1; i <= permanent[idArray[0]]; i++) {
            if (i != selectedInt) {
              unselected.push(i);
            }
          }
          for (var i in unselected) {
            $(idStarter + '_' + unselected[i]).buttonMarkup({theme: 'c', corners: false, icon: null, iconpos: "right"});
          }
          var bool = idStarter == "#Step"; 
          var arrow = bool ? "arrow-d" : "arrow-r";
          var iconPosition = bool ? "bottom" : "right";
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
            presenter.setSomeDataEtc({selectedIndex: selectedInt, selectedWord: $('#' + selectedId).val(), whatChanged: "a listed item was selected in presentation layer"}, self.getLocalId());
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
        text: 'Step 2: Simplify',
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
        text: 'Step 3: Export Text',
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
        data: {
        },
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
        data: {
        },
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
        //<br />Title:<br /><input type="text" placeholder="{{=it.placeholder}}" id="{{=it.titleFieldId}}" value="{{=it.title}}" /><br />Text:
        //taken out because typing in the text field and hitting enter caused chrome to do 100%cpu (crash) and firefox page went blank
      },
      updateFrom: function(viewUtility) {
        //publisher is view utility
        var view = viewUtility.getDataEtc().data;
        var id = view.elementId; 
        //console.log('textareaview: ' + viewUtility.getLocalId() + ' ' + counter++)
        var self = this;
        //this.setSomeDataEtc({updated
        //prepare to collect user events and pass them to presenter
        $('#' + id).on("change", function(e) {
          e.preventDefault();
          textSentToWorker = false;
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
        data: {"1600": {numHardWords: 0}, "3000": {numHardWords: 0}},
        selectedVocab: "1600"
      },
      publisherIds: [
        "Steps tool model"
      ],
      updateFrom: function(publisher) {
        var here = this.getDataEtc();
        var pInfo = publisher.getDataEtc();
        //If no text, display warning
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
        //TODO add something to change selected Vocab
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
        text: 'Proceed from left to right.',
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
        //Req. 2.1, Req. 2.2 the collection of four containers referenced in Type will be only one of the fours/Vocabs/collections referenced in Vocab
        selectedVocab: {},
        //Req. 2.2, Req. 2.3 the container of hard words referenced in hard words tool will be only one of the containers referenced in Type
        types: ["Unapproved", "Approved"],
        data: {},
        selectedType: "Unapproved",
        isRequested: false
      },
      publisherIds: [
        "Vocab tool model"
      ],
      updateFrom: function(publisher) {
        var pub = publisher.getDataEtc();
        var here = this.getDataEtc();
        var growingData = pub.data;
        if (here.distanceFromFocus != pub.distanceFromFocus && pub.distanceFromFocus) {
          if (!here.isRequested) {
            for (var vocab in pub.data) {
              for (var i in here.types) {
                growingData[vocab][here.types[i]] = {};
              }
            }
          }
          this.setSomeDataEtc({distanceFromFocus: pub.distanceFromFocus, selectedVocab: pub.selectedVocab, data: growingData, isRequested: true}, this.getLocalId());
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
        hardWord: '',
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
        if (this.getDataEtc().isDisplayed) {
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
        $('#Type').append('<div data-theme="b" style="border: 0;" data-shadow="false" ><label style=" border: 0; padding: 0px;">Approve all<br />(not recommended)<input type="checkbox" id="Approve_all" data-mini="true"  /></label></div>')
        */
        this.setSomeDataEtc({isDisplayed: true}, this.getLocalId());
      }//end updateFrom
    });//end create Type presenter
    
    
    
    //Req. 2.3
    //Create Hard Word tool model with analyzer (chunker and checker)
    base.createItem({
      localId: "Hard Words tool model",
      dataEtc: {
        selectedWord: '', //nothing selected yet, because contents to be generated dynamically
        distanceFromFocus: 2,
        latestHardWords: ['multiword placeholder'],
        inputArray: [],
        data: {},
        selectedType: '',
        whatChanged: '',
        isRequested: false
      },
      publisherIds: [
        "Type tool model"
      ],
      updateFrom: function(publisher) {
        var pub = publisher.getDataEtc();
        var here = this.getDataEtc();
        //for observer, if received from presenter, keep
        var whatChanged = here.whatChanged;
        if (pub.distanceFromFocus && pub.distanceFromFocus < 2) {
          if (pub.selectedType != here.selectedType) {
            whatChanged = "selected type and therefore probably selected word";
          }
          if (!here.isRequested) {
            if (!worker.addEventListener) {
              worker = new Worker("js/analyze.js");
              worker.addEventListener('message', onMsg, false);
            }
            worker.postMessage($('#textarea__Input_1').val());
          }
          //whether first time or publisher is just changing selected type, the save procedure can be the same:
          this.setSomeDataEtc({distanceFromFocus: pub.distanceFromFocus, isRequested: true, selectedType: pub.selectedType, data: pub.data, whatChanged: whatChanged}, this.getLocalId());
        }
        var growingInput, growingData, newHardWords, selected;
        var self = this;
        var hCount = 0;
        function onMsg(e) {
          if (e.data.status === 'finished') {
            //update counts
            var unapproved = $('#Type_1').parent().find('.ui-btn-text').first().text();
            $('#Type_1').parent().find('.ui-btn-text').first().text(unapproved + " (" + hCount + ")");
            //remove "(loading)"
            $('#Hard').find('.ui-btn-text').first().text("2.3 Hard Word");
            //refresh css
            setTimeout(refresh, 0);
            //remove latestHardWords so that program knows to enter a new mode where user can choose Approved or Unapproved and change hard words lists
            self.setSomeDataEtc({latestHardWords: [], whatChanged: "no more hard words or sentences coming"}, self.getLocalId());
            return;
          }
          newHardWords = [];
          selected = here.selectedWord;
          growingInput = here.inputArray;
          growingInput.push(e.data.textArray);
          growingData = pub.data;
          for (var word in e.data.hardWords) {
            if (word == selected) {
              //we're adding a new sentence onto the existing selected hard word... need to let observers know.
              whatChanged = "extra sentence for existing hard word";
            }
            else if (!growingData['1600']["Unapproved"][word]) {
              //we have found a new hard word, which needs to be stored in both Approved and Unapproved, but the sentence location only in Unapproved
              //if it's not in one, it's not in both, so create in both; e.data.hardWords[word] includes sentence number and textArrayIndex
              growingData['1600']["Approved"][word] = {};
              growingData['1600']["Approved"][word].sentenceInfo = {}
              growingData['1600']["Unapproved"][word] = e.data.hardWords[word];
              if (!growingData['1600']["Unapproved"][word].sentenceInfo) {
                growingData['1600']["Unapproved"][word].sentenceInfo = {};
              }
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
            //a sentence index should only be stored in one type at a time, which in this case is unapproved.
            //if this runs multiple times for a sentence, that's okay as there's no time for the empty object to be filled.
            growingData['1600']["Unapproved"][word].sentenceInfo[growingInput.length-1] = {};
          } 
          self.setSomeDataEtc({selectedWord: selected, inputArray: growingInput, data: growingData, latestHardWords: newHardWords, whatChanged: whatChanged}, self.getLocalId());
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
        selectedWord: '',
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
        if (publisher.getLocalId() == "Hard Words tool model") {
          var view = base.getItem(this.getDataEtc().viewId);
          var hwCollection;
          if (pub.latestHardWords.length && pub.latestHardWords[0] != 'multiword placeholder') {
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
            $('#Hard_0').closest('div').nextAll().remove();
            //if hard words have sentences listed in this type, display
            var ind = 0;
            for (var hard in pub.data['1600'][pub.selectedType]) {
              if (Object.keys(pub.data['1600'][pub.selectedType][hard].sentenceInfo).length) {
                displayHardWord(hard, ++ind, this);
              }
              else {
                //remove selectedWord as nothing is selected, to inform observers
                publisher.setSomeDataEtc({selectedWord: ''}, this.getLocalId());
              }
            }
            if (ind == 1) {
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
            model.setSomeDataEtc({selectedWord: word}, self.getLocalId());
          }
          var thisData = {text: word, position: index, isSelected: selection, parentId: 'Hard', elementId: elementId, 
            viewMarkupId: "Item view markup", newAttribute: newAttr}; 
          view.setSomeDataEtc({data: thisData}, self.getLocalId());
          view.getUpdateFromFunction().call(view, self);
        }//end display function
        if (pubId == 'Item view markup' && here.selectedWord) {
          //view updated us on click and is letting us know
          var model = base.getItem(here.modelId);
          model.setSomeDataEtc({selectedWord: here.selectedWord, whatChanged: 'selected hard word'}, this.getLocalId());
        }
      }//end updateFrom
    });//end create presenter
    
    //Req. 2.4
    //Create Instance tool model
    base.createItem({
      localId: "Instance tool model",
      dataEtc: {
        distanceFromFocus: 4,
        hardWord: '',
        inputArray: [],
        selectedSentence: '',
        selectedSentenceIndex: undefined,
        whatChanged: '',
        data: undefined
      },
      publisherIds: [
        "Hard Words tool model"
      ],
      updateFrom: function(publisher) {
        var pub = publisher.getDataEtc();
        var here = this.getDataEtc();
        var whatChanged = ''
        if ((pub.whatChanged == "selected hard word" || pub.whatChanged == "selected type and therefore probably selected word") && here.hardWord != pub.selectedWord) {
          //saving will create new hard word here, and data will reveal sentences, and presenter will inform this model of selection
          whatChanged = pub.whatChanged;
          //if there's no hard word selected, the normal algorithm of selecting first displayed sentence won't work, so remove existing values
          var index = here.selectedSentenceIndex;
          var sentence = here.selectedSentence;
          if (!pub.selectedWord) {
            index = undefined;
            sentence = '';
            whatChanged = "no more hard words because type changed";
          }
        }
        if (pub.whatChanged == "extra sentence for existing hard word") whatChanged = pub.whatChanged;; //presenter will find it in data
        if (pub.whatChanged == "no more hard words or sentences coming") whatChanged = pub.whatChanged;
          
        if (pub.distanceFromFocus < 2) {
          
          this.setSomeDataEtc({distanceFromFocus: pub.distanceFromFocus, data: pub.data, inputArray: pub.inputArray, hardWord: pub.selectedWord, selectedType: pub.selectedType, selectedSentenceIndex: index, selectedSentence: sentence, changeReceived: pub.whatChanged, whatChanged: whatChanged});
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
        text: '2.4 Sentence',
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
        hardWord: '',
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
        var whatChanged = ''
        var domIndex = undefined;
        var id = undefined;
        if (pub.whatChanged == "extra sentence for existing hard word") {
          //find the index of the sentence in inputArray
          id = pub.inputArray.length - 1;
          domIndex = here.lastDomIndex + 1;
          display(id, "Unapproved", domIndex, this);
          this.setSomeDataEtc({lastDomIndex: domIndex}, this.getLocalId());
        }
        if (pub.whatChanged == "selected type and therefore probably selected word" || 
          pub.whatChanged == "selected hard word" || 
          pub.whatChanged == "no more hard words because type changed") {
          //old sentences should be erased
          $('#Instance_0').closest('div').nextAll().remove();
        }
        if (pub.hardWord && (pub.whatChanged == "selected type and therefore probably selected word" || 
          pub.whatChanged == "selected hard word" ) ) {
          //sentences were erased above
          //for each fresh sentence id, display the sentence
          //find new selected type and word, and use them to find new set of sentence ids in data
          var sentenceIds = pub.data['1600'][pub.selectedType][pub.hardWord].sentenceInfo;
          domIndex = 1;
          for (id in sentenceIds) {
            display(id, pub.selectedType, domIndex++, this);
          }
        }
        //display is called twice just above
        function display(id, type, domIndex, self) {
          //get sentence
          //if selectedType is unapproved, use old sentence
          var textArray = pub.inputArray[id];
          var sentence = textArray.join('');
          //if it's approved, use new sentence if available
          if (type == "Approved") {
            sentence = pub.data.outputArray[id] || sentence;
          }
          //set data and publish to view
          //here = self.getDataEtc();
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
          modelData.indexMap[domIndex] = id;
          if (selection) {
            //tell model what sentence is selected so observers can be alerted or fetch required info
            modelData.selectedSentenceIndex = id;
            modelData.selectedSentence = sentence;
            modelData.whatChanged = "a listed item was selected in presentation layer"
          }
          model.setSomeDataEtc(modelData, self.getLocalId());
        }//end display()
        if (pub.whatChanged == "a listed item was selected in presentation layer") {
          //Item view markup has informed us because of user click
          domIndex = here.selectedIndex;
          var indexMap = model.getDataEtc().indexMap;
          id = indexMap[domIndex];
          model.setSomeDataEtc({selectedSentenceIndex: id, selectedSentence: here.selectedWord, whatChanged: "a listed item was selected in presentation layer"}, this.getLocalId());
        }
      }//end updateFrom
    });//end create presenter
    
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
        if (this.getDataEtc().distanceFromFocus != pub.distanceFromFocus && pub.distanceFromFocus) {
          this.setSomeDataEtc({distanceFromFocus: pub.distanceFromFocus, selectedVocab: pub.selectedVocab}, this.getLocalId());
        }
        //TODO add something to change selected level
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
        hardWord: '',
        sentenceArray: [],
        selectedIndex: 0,
        isDisplayed: false
      },
      publisherIds: [
        "PoS tool model"
      ],
      updateFrom: function(publisher) {
        if (this.getDataEtc().isDisplayed) return;
        var pub = publisher.getDataEtc();
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
      }//end updateFrom
    });//end create presenter
    /*
    //Req. 2.6
    var callback = function callback(response, word, pub, self) {
      if (response.charAt) {
        console.log('string response from ajax');
      }
      //store suggestions
      var growingData = pub.data;
      if (!growingData['1600'][pub.selectedType][word].suggestions) {
        growingData['1600'][pub.selectedType][word].suggestions = {};
      }
      var suggestions = growingData['1600'][pub.selectedType][word].suggestions;
      if (!suggestions) {
        suggestions = {};
      }
      var poS = '';
      var synset = [];
      for (var i in response) {
        if (response[i].length == 0) {
          //console.log('broke')
          break;
        }
        if (i == 0 || i%2 == 0) {
          //this is part of Speech
          poS = response[i].charAt(6);
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
        else {
          //this is a synset--a group of synonyms
          synset = response[i];
          //record which synset each suggestion is in, in case program needs to group them later.
          var synsetNumber = (i+1)/2;
          //assume it is hard until proven easy
          var vocab = 'unlimited';
          for (var index in synset) {
            var synonym = synset[index];
            //remove any underscores, replace with spaces ('g' is global flag)
            synonym = synonym.replace('_', ' ', 'g');
            //TODO check how easy the synonym is
            //then store the synonym
            suggestions[poS].push({suggestion: synonym, /*vocab: vocab,*//* synset: synsetNumber});
          }//end for index in synset
        }//end else
      }
      self.setSomeDataEtc({receivedFor: word, data: growingData}, self.getLocalId());
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
        hardWord: "",
        distanceFromFocus: 4,
        selectedItem: 0,
        selectedType: '',
        replacement: '',
        data: {}
      },
      publisherIds: [
        "Hard Words tool model",
        "Instance tool model"
      ],
      updateFrom: function(publisher) {
        var pub = publisher.getDataEtc();
        var pubId = publisher.getLocalId();
        var here = this.getDataEtc();
        //if publisher is Hard Words tool model, get hard words and create suggestion list
        if (pubId == "Hard Words tool model" && pub.distanceFromFocus < 2 && pub.latestHardWords[0] != "multiword placeholder") {
          //ajax for suggestionArray if not already
          var requested = here.requested;
          var self = this;
          for (var i in pub.latestHardWords) {
            var word = pub.latestHardWords[i];
            if (!requested[word]) {
              setTimeout(requestSuggestions(word, pub, self), 0);
              requested[word] = true;
            }//end if requested
          }//end for each lastest hard word
          this.setSomeDataEtc({hardWord: pub.selectedWord, distanceFromFocus: pub.distanceFromFocus, latestHardWords: pub.latestHardWords, requested: requested, data: pub.data, selectedType: pub.selectedType, replacement: pub.selectedWord}, this.getLocalId());
        }//end if hard words
        if (pubId == "Instance tool model") {
          //check for replacement user may have chosen for this particular sentence
          var chosen = '';
          if (pub.hardWord && pub.data['1600'][pub.selectedType][pub.hardWord].sentenceInfo[pub.selectedSentenceIndex]) {
            chosen = pub.data['1600'][pub.selectedType][pub.hardWord].sentenceInfo[pub.selectedSentenceIndex].replacement;
          }
          //collect info for Replacement input and Results tool to use
          ;console.log('in repl tool mod, repl: ' + chosen + ', sentIdx: ' + pub.selectedSentenceIndex + ', sentence: ' + pub.selectedSentence)
          this.setSomeDataEtc({replacement: chosen, sentenceIndex: pub.selectedSentenceIndex, sentence: pub.selectedSentence}, this.getLocalId());
        }
      }//end updateFrom
    });//end create Replacement tool model
    
    function requestSuggestions(word, pub, self, repeat) {
      $.ajax({
        url: "http://mc.superstring.org:8805/2/getsyns.php?q=" + word,
        type: 'GET',
        format: "json",
        jsonp: false,
        jsonpCallback: "callback",
        contentType: "application/json",
        dataType: 'jsonp',
        cache: true
      }).fail(function(jqXHR, textStatus) {
        console.log('responseText: ' + jqXHR.responseText + ', headers: ' + jqXHR.getAllResponseHeaders());
        callback([[]], word, pub, self);
        //try again once
        /*
        if (!repeat) {
          console.log('trying a second time')
          requestSuggestions(word, pub, self, true);
        }
        *//*
      }).done(function(response) {
        callback(response, word, pub, self);
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
        data: '<div data-theme="b" style="border: 0;" data-shadow="false" {{=it.newAttribute}} id="{{=it.elementId}}"  ><input type="text" id="replacement_input" value="{{=it.text}}" /><label style=" border: 0; padding: 0px; margin: 0px 0px 0px 10px;">Approve similar<input type="checkbox" id="replacement_isDefault" data-mini="true"  /></label></div>' 
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
          console.log('this.checked: ' + this.checked)
          //programmatic change: $('#replacement_isDefault').prop("checked", false).checkboxradio('refresh')
          
          
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
          model.setSomeDataEtc({replacement: $(this).val()}, self.getLocalId());
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
        hardWord: '',
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
        var word = pub.hardWord; 
        //if no hard word is selected (e.g. Approved is clicked early), there is no replacement, so update field
        if (pubId == "Replacement tool model") {
          $("#replacement_input").val(pub.replacement);
          if (!pub.replacement) {
            //remove all below field
            $('#Replacement_1').closest('div').nextAll().remove();
          }
        }
        //get hard word and look it up in hard words to find replacements, if there was a change
        if (pub.distanceFromFocus < 2 && word != here.hardWord && here.isDisplayed && pub.receivedFor) { //removed 
          //There has been a change in the selected hard word.
          //First, if there was an error message, remove it.
          $('#replacement_error').remove();
          //Also, remove any previous suggested replacements
          ;console.log('removing in rep pres')
          $('#Replacement_1').closest('div').nextAll().remove();
          //try to find the new hard word in storage and display
          var suggestions = pub.data['1600'][pub.selectedType][word].suggestions;
          var suggestArray, i, suggestion, poS, whole, view, selection, num = 2, elementId, thisData, newAttr;
          if (pub.replacement != pub.hardWord || !pub.replacement) {
            //the user has already chosen a replacement or changed type/hardWord, so list that first
            display(pub.replacement, '', this);
          }
          for (poS in suggestions) {
            suggestArray = suggestions[poS];
            for (i in suggestArray) {
              suggestion = suggestArray[i].suggestion;
               //later add vocab/level
              display(suggestion, '(' + poS + ')', this);
            }
          }
          //add original hard word as last suggestion
          display(pub.hardWord, '(hard)', this);
          if (!suggestions || !Object.keys(suggestions).length) {
            if (!$('#replacement_error').length) {
              $('#Replacement').append('<div id="replacement_error">No replacement suggestions are found in database.</div>');
            }
          }
          //remove the "(loading)" from title
          $('#Replacement').find('.ui-btn-text').first().text("2.6 Replacement");
          //refresh css
          $('#Replacement').closest('form').trigger('create');
          
        }//end if
        else if (pub.distanceFromFocus < 2) {
          var self = this;
          setTimeout(function() {
            if (!$('#Replacement_2').length) {
              //taking too long, probably no internet connection
              //add original hard word as last suggestion
              num = 2;
              display(pub.hardWord, '(hard)', self);
              if (!$('#replacement_error').length) {
                $('#Replacement').append('<div id="replacement_error">No replacement suggestions were downloaded. Maybe you have no internet connection. Continue without suggestions or, if you want suggestions, try again later.</div>');
              }
              //remove the "(loading)" from title
              $('#Replacement').find('.ui-btn-text').first().text("2.6 Replacement");
              //refresh css
              $('#Replacement').closest('form').trigger('create');
            }
          }, 4000);
        }
        else if (here.selectedWord) {
          // view updated us on click and is letting us know
          var realSelection = here.selectedWord.split(' (')[0]
          $('#replacement_input').val(realSelection)//.trigger('keyup');
          //var model = base.getItem(here.modelId);
          //model.setSomeDataEtc({selectedWord: here.selectedWord}, this.getLocalId());
        }
        function display(suggestion, moreText, self) {
          view = base.getItem(self.getDataEtc().viewId);
          selection = false;
          newAttr = "";
          if (num === 2) {
            selection = true;
            newAttr = "data-icon='arrow-r' data-iconpos='right'"
            //Put the new selection in the field
            $('#replacement_input').val(suggestion)//.trigger('keyup');
          }
          selection = (num === 2) ? true : false;
          elementId = 'Replacement_' + num;
          var text = suggestion + ' ' + moreText;
          thisData = {text: text, position: num, isSelected: selection, parentId: 'Replacement', elementId: elementId, 
            viewMarkupId: "Item view markup", newAttribute: newAttr}; 
          view.setSomeDataEtc({data: thisData}, self.getLocalId());
          view.getUpdateFromFunction().call(view, self);
          num++;
        }
      }//end updateFrom
    });//end create Replacement presenter
    
    
    //Req. 2.7
    //Create Result tool model
    base.createItem({
      localId: "Result tool model",
      dataEtc: {
        distanceFromFocus: 4,
        data: {},
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
        var outputSentences = here.outputSentences || [];// {} would work too, but in some browsers may change the order in a for in loop
        if (pubId == "Replacement tool model" && pub.distanceFromFocus < 2) {
          //modify active sentence by replacing hard word with replacement word
          var changingText = pub.sentence;
          var replacement = pub.replacement || '';
          var hardWord = pub.hardWord; 
          //var allSuchHardWords = '/' + hardWord + '/gm';
          while (hardWord != replacement && changingText.indexOf(hardWord) != -1) {
            changingText = changingText.replace(hardWord, replacement);
          }
          //make sure when replacement is made it is saved in hard word-sentence-replacement
          var changingData = pub.data;
          if (hardWord) {
            var sentenceData = changingData['1600'][pub.selectedType][hardWord].sentenceInfo[pub.sentenceIndex] || {};
            sentenceData.replacement = replacement;
            changingData['1600'][pub.selectedType][hardWord].sentenceInfo[pub.sentenceIndex] = sentenceData;
          }
          //save for output with a key parallel to the replaced text in inputArray (so outputSentences will be sparse, and no join required for output)
          outputSentences[pub.sentenceIndex] = changingText;
          //store modified sentence so observers (i.e. presentation layer and output) can use it
          this.setSomeDataEtc({distanceFromFocus: pub.distanceFromFocus, data: changingData, text: changingText, sentenceIndex: pub.sentenceIndex, selectedType: pub.selectedType, inputArray: pub.inputArray, outputSentences: outputSentences, lastReplacement: pub.replacement}, this.getLocalId());
        }
        else {
          if (here.isApproved != undefined) {
            //isApproved has been set in checkbox and presenter updated this model
            if (here.isApproved) {
              //pub.data["1600"]["Approved"][hardWord] = pub.data["1600"]["Unapproved"][hardWord]
              outputSentences[pub.sentenceIndex] = here.text;
              //pub.data['1600'][pub.selectedType][hardWord].
            }
          }
        }
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
        data: '<div data-theme="b" style="border: 0;" data-shadow="false" {{=it.newAttribute}} id="{{=it.elementId}}"  ><textarea id="Result_textarea" >{{=it.text}}</textarea><label style=" border: 0; padding: 0px;">Approve sentence<input type="checkbox" id="result_approve" data-mini="true"  /></label></div>' 
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
          model.setSomeDataEtc({isApproved: this.checked, text: $("#Result_textarea").val()}, self.getLocalId());
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
          e.preventDefault();
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
        var listModel = base.getItem(model.getDataEtc().listModelId);
        if (!listModel) {
          //this is a presenter for a listModel
          listModel = model;
        }
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
        //check if it's view
        else if (publisher.getLocalId() == here.viewMarkupId) {
          //this should be view after having set here.something
          
        } // end if it's view/html
        //let textarea grow to larger than text size (via jquery mobile)
        $('#Result_textarea').trigger('keyup')
      }//end presenterUpdateFrom
    });//end create presenter
    
    
    */
    
     //Create 3.1 User Guide
    base.createItem({
      localId: "Conclusion tool model",
      dataEtc: {
        data: {
        },
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
        data: {
        },
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
  console.log('global error: ' + errorMsg + " \n url: " + url + " \n line: " + lineNumber)
  if (gOldOnError)
    // Call previous handler.
    return gOldOnError(errorMsg, url, lineNumber);

  // Just let default handler run.
  return false;
}
 