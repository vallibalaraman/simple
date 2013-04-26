//the following code expects base.js for var base, jquery[.min].js for var $, doT.js for var doT, 

window.simplifier = simplifier = (function createSimplifier() {
  "use strict";
  var counter = 0;
  var currentStep = 1;
  //itemEventHandler etc. allows program to prevent duplicate event handlers
  var itemEventHandler = false;
  var inputEventHandler = false;
  // template variables allows program to prevent duplicate templates.
  var itemTemplate = '';
  var listTemplate = '';
  function go() {
    createItems();
    //act as presenter: pass message and cause model to update its presenter
    base.getItem("Steps tool model").setSomeDataEtc({distanceFromFocus: 1});
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
        if (here.elementId == "Step") { 
          $('#page').append('<br>');
        } 
        var id = here.elementId
        var elId = "#" + id;
        var iconString = 'arrow-d';
        var themeChar = 'b'
        if (here.isSelected === false) {
          iconString = null;
          themeChar = 'c';
        }
        var idParts = id.split('_');
        //check if list item; if so, apply markup. If list holder (i.e. fieldset), do nothing.
        if (elId.indexOf('_') !== -1 ) {
          //for non-titles:
          if (idParts[1] > 0) {
            //apply theme color without rounding corners too much
            $(elId).buttonMarkup({theme: themeChar, corners: false});
          }
          
          if (elId === "#Input_0") {
            //not working, but idea is to make 1.2 title stop rounding its bottom corners and rather join to #Input_1
            var parent = $(elId).parents().removeClass('ui-corner-bottom ui-controlgroup-last');
            var child = parent.children().removeClass('ui-corner-bottom ui-controlgroup-last');
            //console.log($(elId).parents()[0])
            //console.log(parent[0])
            //console.log(child[0])
          }
          //round bottom but not top corners on the item that holds textarea, and make it unselectable
          if (elId === "#Input_1") {
            $(elId).removeClass('ui-btn').addClass('ui-controlgroup-last ui-corner-bottom');
          }
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
          if (!$('#' + here.elementId).length) {
          //if (here.isDisplayed === false) {
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
        //If a replacement suggestion is selected, display it in field
        if (this.getLocalId() == "Replacement Input Presenter") {
          $('#' + here.elementId).text(listModel.getDataEtc().selectedWord);
        }
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
              $('#Level').closest('form').hide();
              $('#Hard').closest('form').hide();
              $('#Instance').closest('form').hide();
              $('#Replacement').closest('form').hide();
              $('#Method').closest('form').show();
              $('#Input').closest('form').show();
            }
          }
          //Req. 4.2.4.2 If user clicks Step 2 and is not already there, hide Step 1 and Step 3 tools and show Step 2 tools.
          if (selectedId === 'Step_2') {
            if (currentStep != 2) {
              currentStep = 2;
              $('#Method').closest('form').hide();
              $('#Input').closest('form').hide();
              $('#Level').closest('form').show();
              $('#Hard').closest('form').show();
              $('#Instance').closest('form').show();
              $('#Replacement').closest('form').show();
            }
          }
          //Req. 4.2.4.3 If user clicks Step 3 and is not already there, hide Step 2 and Step 1 tools and show Step 3 tools.
          if (selectedId === 'Step_3') {
            if (currentStep != 3) {
              currentStep = 3;
              $('#Level').closest('form').hide();
              $('#Hard').closest('form').hide();
              $('#Instance').closest('form').hide();
              $('#Replacement').closest('form').hide();
              $('#Method').closest('form').hide();
              $('#Input').closest('form').hide();
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
          if (idStarter == "#Hard") {
            presenter = base.getItem('Hard Words presenter');
            presenter.setSomeDataEtc({selectedIndex: selectedInt}, self.getLocalId());
            presenter.getUpdateFromFunction().call(presenter, self); 
            $('#page').trigger('create');
            return;
          }
          //try to recreate what presenter is based on convention
          var presString = idArray[0] + ' ' + selectedInt + " presenter";
          if (idArray[0] == "Instance" || idArray[0] == "Replacement") {
            presString = idArray[0] + ' presenter';
          }
          presenter = base.getItem(presString);
          presenter.setSomeDataEtc({isSelected: true}, self.getLocalId());
          presenter.getUpdateFromFunction().call(presenter, self);
          
          
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
    //Moving onto Req. 1.1 Import Method tool
    
    //Create 1.1 Import Method tool model
    base.createItem({
      localId: "Method tool model",
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
      var inFocus = (pInfo.distanceFromFocus > -1 && pInfo.distanceFromFocus < 2);
      if (pInfo.selectedItem === here.parentSelectionRequired && inFocus) {
        //parent has the right thing selected and is itself displayable, so make this displayable
        this.setSomeDataEtc({distanceFromFocus: 1}, this.getLocalId());
      }
      else {
        //the right thing is not selected or parent is not displayable, so focus is off of this (most views will not want to display this)
        var parentDistance = publisher.getDataEtc().distanceFromFocus;
        //add 2 because if parent is 0 i.e. selected, we want 2 i.e. not displayable, 
        //and if parent is 1 i.e. displayable, we want 3, 
        //and if parent is 5 we want 7 because this extended difference determines preloading
        this.setSomeDataEtc({distanceFromFocus: parentDistance + 2}, this.getLocalId());
      }
    }
    
    //Create 1.1 Import Method tool presenter  
    base.createItem({
      localId: "Method tool presenter",
      dataEtc: {
        elementId: "Method", 
        orientation: "vertical", 
        newAttribute: "style='display: inline-block;'",
        modelId: "Method tool model",
        viewId: "View utility",
        viewMarkupId: "List view markup",
        parentId: "page",
        selectedItem: 1,
        isDisplayed: false
      },
      publisherIds: [
        "Method tool model"
      ],
      updateFrom: presenterUpdateFrom
    });
    
    //Create 1.1 Import Method title model
    base.createItem({
      localId: "Method title model",
      dataEtc: {
        text: '1.1 Import Method',
        distanceFromFocus: 2,
        listModelId: "Method tool model",
        position: 0
      },
      publisherIds: [
        "Method tool model"
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    base.createItem({
      localId: "Method title presenter",
      dataEtc: {
        elementId: "Method_0", 
        modelId: "Method title model",
        viewId: "View utility",
        viewMarkupId: "Item view markup",
        newAttribute: "disabled='disabled'",
        parentId: "Method",
        isSelected: false,
        isDisplayed: false
      },
      publisherIds: [
        "Method title model"
      ],
      updateFrom: presenterUpdateFrom
    });//end create presenter
    
    //Create Textarea Method model
    base.createItem({
      localId: "Textarea Method model",
      dataEtc: {
        text: 'Type or paste text into textarea',
        distanceFromFocus: 2, // not displayable but selected and preloaded
        listModelId: "Method tool model",
        position: 1
      },
      publisherIds: [
        "Method tool model"
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    base.createItem({
      localId: "Method 1 presenter",//use parentId and model position and "presenter"
      dataEtc: {
        elementId: "Method_1", //use parentId and model position
        modelId: "Textarea Method model",
        viewId: "View utility",
        viewMarkupId: "Item view markup",
        newAttribute: "data-icon='arrow-r' data-iconpos='right'",
        parentId: "Method",
        isSelected: true,
        isDisplayed: false //i.e. not yet
      },
      publisherIds: [
        "Textarea Method model"
      ],
      updateFrom: presenterUpdateFrom
    });//end create presenter
    
    //Req. 1.1.2
    //Create File Method model
    base.createItem({
      localId: "File Method model",
      dataEtc: {
        text: 'Open a text file',
        distanceFromFocus: 3, // neither displayable nor selected, but preloaded
        listModelId: "Method tool model",
        position: 2
      },
      publisherIds: [
        "Method tool model"
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    base.createItem({
      localId: "Method 2 presenter",//use parentId and model position and "presenter"
      dataEtc: {
        elementId: "Method_2", //use parentId and model position
        modelId: "File Method model",
        viewId: "View utility",
        viewMarkupId: "Item view markup",
        newAttribute: "disabled='disabled'",//data-iconpos='right'
        parentId: "Method",
        isSelected: false,
        isDisplayed: false //i.e. not yet
      },
      publisherIds: [
        "File Method model"
      ],
      updateFrom: presenterUpdateFrom
    });//end create presenter
    
    //Req. 1.1.3
    //Create Resume Method model
    base.createItem({
      localId: "Resume Method model",
      dataEtc: {
        text: 'Resume a previous project',
        distanceFromFocus: 3, // neither displayable nor selected, but preloaded
        listModelId: "Method tool model", //if this is a title or list item, use list-holding model here and below in publisherIds
        position: 3
      },
      publisherIds: [
        "Method tool model" //if this is a title or list item, use list-holding model here and above by listModelId
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    //Create Resume method presenter
    base.createItem({
      localId: "Method 3 presenter", //use parentId and model position and "presenter"
      dataEtc: {
        elementId: "Method_3", //use parentId and model position
        modelId: "Resume Method model", //if changing, also change this in publisherIds below
        viewId: "View utility",
        viewMarkupId: "Item view markup",
        newAttribute: "disabled='disabled'",//data-iconpos='right'
        parentId: "Method",
        isSelected: false,
        isDisplayed: false //i.e. not yet
      },
      publisherIds: [
        "Resume Method model" //if changing this, also change this in modelId above
      ],
      updateFrom: presenterUpdateFrom
    });//end create presenter
    
    
    //now Req. 1.2
    
    
    
    
    //Create 1.2 Input tool model
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
        "Method tool model"
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
        text: '1.2 The text to simplify',
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
          //prevent running this function twice (not sure why this is needed but it is)
          e.preventDefault();
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
    
    
    
    //now Req. 2.1.1
    //Creat3 List3 loader model
    base.createItem({
      localId: "List3 Loader model",
      dataEtc: {
        data: {
        },
        selectedItem: undefined,
        distanceFromFocus: 2,
        isLoaded: false
      },
      publisherIds: [
        "Input Area model"
      ],
      updateFrom: function(publisher) {
        //check if List3 (Specialized English) is loaded yet. If not, continue to load it.
        if (this.getDataEtc().isLoaded) return;
        if (publisher.getDataEtc().distanceFromFocus === 0) { //TODO need to check others like this
          this.setSomeDataEtc({distanceFromFocus: 0}, this.getLocalId());
        }
        //var start = new Date();
        //console.log('start: ' + start.toTimeString())
        //open list from index.html
        var specializedEnglish = $('#specializedEnglish').text();
        //split by new lines
        var lines = specializedEnglish.split('\n');
        //console.log('lines: ' + lines.length)
        var lexemeCount = 0;
        var wordCount = 0;
        for (var i in lines) {
          var line = lines[i];
          //if empty or one character, ignore
          if (line.length < 5) continue;
          if (line.length < 10) console.log('WARNING less than 7 in a line: *' + line + '*');
          wordCount++;
          //split by separator to isolate the word itself
          var parts = line.split(' - ');
          //  convert first part into id in core
          var core = {}
          core.localId = parts[0] + '-EN';
          //console.log(core.localId);
          core.dataEtc = {};
          //  stem? or do that lazily?
          //split further
          for (var i in parts) {
            //don't include the word itself
            if (i != 0) {
              lexemeCount++;
              //isolate the part of speech
              var keyVal = parts[i].split('. ~ ')
              if (keyVal.length > 2) console.log('WARNING keyVal > 2');
              var p = keyVal[0]
              if (p !== 'n' && p !== 'v' && p !== 'ad' && p !== 'conj' && p !== 'prep' && p !== 'pro' && p !== 'int' && p !== 'unknown') {
                // not really a part of speech?
                console.log('unidentified part of speech: ' + p);
              }
              //  use p.o.s. as key for new object
              //  in new object, state level as 3
              //  remainder of line are "extra" synonyms--for use when this turns up as a synonym
              core.dataEtc[p] = {level: 3, meanings: keyVal[1]};
            }
          }
          //  createItem
          var item = base.createItem(core);
          if (item.getLocalId() !== parts[0] + '-EN') console.log('WARNING localId not right: ' + item.getLocalId() + ' !== ' + parts[0]);
        }
        this.setSomeDataEtc({isLoaded: true}, this.getLocalId());
        //console.log("ending: " + new Date());
        //console.log("lexemeCount: " + lexemeCount);
        //console.log("wordCount: " + wordCount);
      }
    });//end of List3 loader model
    
    
    //Req. 2.1
    //Create Vocab Level tool model
    base.createItem({
      localId: "Vocab Level tool model",
      dataEtc: {
        selectedItem: 3,
        distanceFromFocus: 2,
        parentSelectionRequired: 2,
        standardsReady: false
      },
      publisherIds: [
        "Steps tool model"
      ],
      updateFrom: focusOnSelect
    });//end create Vocab Level tool model
    
    
    //Create 2.1 Vocab Level tool presenter  
    base.createItem({
      localId: "Vocab Level tool presenter",
      dataEtc: {
        elementId: "Level", 
        orientation: "vertical", 
        newAttribute: "style='display: inline-block;'",
        modelId: "Vocab Level tool model",
        viewId: "View utility",
        viewMarkupId: "List view markup",
        parentId: "page",
        selectedItem: 3,
        isDisplayed: false
      },
      publisherIds: [
        "Vocab Level tool model"
      ],
      updateFrom: presenterUpdateFrom
    });
    
    //Create 1.1 Vocab Level title model
    base.createItem({
      localId: "Vocab Level title model",
      dataEtc: {
        text: '2.1 Vocab Level',
        distanceFromFocus: 2,
        listModelId: "Vocab Level tool model",
        position: 0
      },
      publisherIds: [
        "Vocab Level tool model"
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    base.createItem({
      localId: "Vocab Level title presenter",
      dataEtc: {
        elementId: "Level_0", 
        modelId: "Vocab Level title model",
        viewId: "View utility",
        viewMarkupId: "Item view markup",
        newAttribute: "disabled='disabled'",
        parentId: "Level",
        isSelected: false,
        isDisplayed: false
      },
      publisherIds: [
        "Vocab Level title model"
      ],
      updateFrom: presenterUpdateFrom
    });//end create presenter
        
    //Req. 2.1.2
    //Create Level 1 model
    base.createItem({
      localId: "Level 1 model",
      dataEtc: {
        text: '1: ~300 words',
        distanceFromFocus: 3, // neither displayable nor selected, but preloaded
        listModelId: "Vocab Level tool model", //if localId is a title or list item, use list-holding model here and below in publisherIds
        position: 1
      },
      publisherIds: [
        "Vocab Level tool model" //if localId is a title or list item, use list-holding model here and above by listModelId
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    //Create Level 1 presenter
    base.createItem({
      localId: "Level 1 presenter", //use parentId and model position and "presenter"
      dataEtc: {
        elementId: "Level_1", //use parentId and model position
        modelId: "Level 1 model", //if changing, also change this in publisherIds below
        viewId: "View utility",
        viewMarkupId: "Item view markup",
        newAttribute: "disabled='disabled'",
        parentId: "Level",
        isSelected: false,
        isDisplayed: false //i.e. not yet
      },
      publisherIds: [
        "Level 1 model" //if changing this, also change this in modelId above
      ],
      updateFrom: presenterUpdateFrom
    });//end create presenter
    
    
    //Req. 2.1.2
    //Create Level 2 model
    base.createItem({
      localId: "Level 2 model",
      dataEtc: {
        text: '2: ~800 words',
        distanceFromFocus: 3, // neither displayable nor selected, but preloaded
        listModelId: "Vocab Level tool model", //if localId is a title or list item, use list-holding model here and below in publisherIds
        position: 2
      },
      publisherIds: [
        "Vocab Level tool model" //if localId is a title or list item, use list-holding model here and above by listModelId
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    //Create Level 2 presenter
    base.createItem({
      localId: "Level 2 presenter", //use parentId and model position and "presenter"
      dataEtc: {
        elementId: "Level_2", //use parentId and model position
        modelId: "Level 2 model", //if changing, also change this in publisherIds below
        viewId: "View utility",
        viewMarkupId: "Item view markup",
        newAttribute: "disabled='disabled'",
        parentId: "Level",
        isSelected: false,
        isDisplayed: false //i.e. not yet
      },
      publisherIds: [
        "Level 2 model" //if changing this, also change this in modelId above
      ],
      updateFrom: presenterUpdateFrom
    });//end create presenter
    
    //Req. 2.1.2
    //Create Level 3 model
    base.createItem({
      localId: "Level 3 model",
      dataEtc: {
        text: '3: ~1600 words',
        distanceFromFocus: 2, // not displayable bit selected
        listModelId: "Vocab Level tool model", //if localId is a title or list item, use list-holding model here and below in publisherIds
        position: 3
      },
      publisherIds: [
        "Vocab Level tool model" //if localId is a title or list item, use list-holding model here and above by listModelId
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    //Create Level 3 presenter
    base.createItem({
      localId: "Level 3 presenter", //use parentId and model position and "presenter"
      dataEtc: {
        elementId: "Level_3", //use parentId and model position
        modelId: "Level 3 model", //if changing, also change this in publisherIds below
        viewId: "View utility",
        viewMarkupId: "Item view markup",
        newAttribute: "data-icon='arrow-r' data-iconpos='right'",
        parentId: "Level",
        isSelected: true,
        isDisplayed: false //i.e. not yet
      },
      publisherIds: [
        "Level 3 model" //if changing this, also change this in modelId above
      ],
      updateFrom: presenterUpdateFrom
    });//end create presenter
    
    //Req. 2.1.2
    //Create Level 4 model
    base.createItem({
      localId: "Level 4 model",
      dataEtc: {
        text: '4: ~3000 words',
        distanceFromFocus: 3, // neither displayable nor selected, but preloaded
        listModelId: "Vocab Level tool model", //if localId is a title or list item, use list-holding model here and below in publisherIds
        position: 4
      },
      publisherIds: [
        "Vocab Level tool model" //if localId is a title or list item, use list-holding model here and above by listModelId
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    //Create Level 4 presenter
    base.createItem({
      localId: "Level 4 presenter", //use parentId and model position and "presenter"
      dataEtc: {
        elementId: "Level_4", //use parentId and model position
        modelId: "Level 4 model", //if changing, also change this in publisherIds below
        viewId: "View utility",
        viewMarkupId: "Item view markup",
        newAttribute: "disabled='disabled'",
        parentId: "Level",
        isSelected: false,
        isDisplayed: false //i.e. not yet
      },
      publisherIds: [
        "Level 4 model" //if changing this, also change this in modelId above
      ],
      updateFrom: presenterUpdateFrom
    });//end create presenter
    
    //Req. 2.1.2
    //Create Level 5 model
    base.createItem({
      localId: "Level 5 model",
      dataEtc: {
        text: '5: ~5000 words',
        distanceFromFocus: 3, // neither displayable nor selected, but preloaded
        listModelId: "Vocab Level tool model", //if localId is a title or list item, use list-holding model here and below in publisherIds
        position: 5
      },
      publisherIds: [
        "Vocab Level tool model" //if localId is a title or list item, use list-holding model here and above by listModelId
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    //Create Level 5 presenter
    base.createItem({
      localId: "Level 5 presenter", //use parentId and model position and "presenter"
      dataEtc: {
        elementId: "Level_5", //use parentId and model position
        modelId: "Level 5 model", //if changing, also change this in publisherIds below
        viewId: "View utility",
        viewMarkupId: "Item view markup",
        newAttribute: "disabled='disabled'",
        parentId: "Level",
        isSelected: false,
        isDisplayed: false //i.e. not yet
      },
      publisherIds: [
        "Level 5 model" //if changing this, also change this in modelId above
      ],
      updateFrom: presenterUpdateFrom
    });//end create presenter
    
        //Req. 2.2
    //Create Type tool model
    base.createItem({
      localId: "Type tool model",
      dataEtc: {
        distanceFromFocus: 4,
        //Req. 2.1, Req. 2.2 the collection of four containers referenced in Type will be only one of the fours/levels/collections referenced in Level
        selectedLevel: {},
        //Req. 2.2, Req. 2.3 the container of hard words referenced in hard words tool will be only one of the containers referenced in Type
        types: ["Unchecked", "Preapproved", "Exceptions", "Simplified"],
        selectedType: "Unchecked"
      },
      publisherIds: [
        "Vocab Level tool model"
      ],
      updateFrom: function(publisher) {
        var pub = publisher.getDataEtc();
        if (this.getDataEtc().distanceFromFocus != pub.distanceFromFocus && pub.distanceFromFocus) {
          this.setSomeDataEtc({distanceFromFocus: pub.distanceFromFocus, selectedLevel: pub.selectedLevel}, this.getLocalId());
        }
        //TODO add something to change selected level
      }
    });//end create Vocab Level tool model
    
    
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
        text: '2.2 Result Type',
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
        selectedIndex: 0,
        isDisplayed: false
      },
      publisherIds: [
        "Type tool model"
      ],
      updateFrom: function(publisher) {
        var pub = publisher.getDataEtc();
        var type = pub.selectedType; 
        var types = pub.types;   
        for (var i in types) {
          //set data and publish to view
          var view = base.getItem(this.getDataEtc().viewId);
          var selection = false;
          var newAttr = "data-iconpos='right'";
          if (type === types[i]) {
            selection = true;
            newAttr = "data-iconpos='right' data-icon='arrow-r'";
          }
          var elementId = 'Type_' + (i+1);
          var thisData = {text: types[i], position: i+1, isSelected: selection, parentId: 'Type', elementId: elementId, 
            viewMarkupId: "Item view markup", newAttribute: newAttr}; 
          view.setSomeDataEtc({data: thisData}, this.getLocalId());
          view.getUpdateFromFunction().call(view, this);
        }
        this.setSomeDataEtc({isDisplayed: true}, this.getLocalId());
      }//end updateFrom
    });//end create presenter
    
    //Req. 2.3
    //Create Hard Word tool model with analyzer (chunker and checker)
    base.createItem({
      localId: "Hard Words tool model",
      dataEtc: {
        selectedWord: '', //nothing selected yet, because contents to be generated dynamically
        selectedItem: 0,//index? because presenterupdatefrom has position already? what does instance need?
        distanceFromFocus: 2,
        //parentSelectionRequired: 2,
        standardsReady: false,
        lastChange: 0,
        text: '',
        idStarter: 'input_', //localId starter for sentences
        hardWords: {}
      },
      publisherIds: [
        "List3 Loader model",
        "Input Area model",
        "Vocab Level tool model"
      ],
      updateFrom: function(publisher) {
        var pub = publisher.getDataEtc();
        var here = this.getDataEtc();
        if (pub.isLoaded) {
          //Simple word list(s) complete
          //if that's already recorded, nothing more to do
          if (here.standardsReady) return;
          //otherwise, record it
          this.setSomeDataEtc({standardsReady: true}, this.getLocalId());
          //check if text changed (TODO not tested adequately yet)
          if (here.lastChange > 0) {
            analyze(here.text, this);
          }
        }
        else if (pub.timesChanged) {
          //Text has been added by user  
          if (pub.timesChanged == here.timesChanged) {
            //console.log('quitting');// (TODO not tested adequately yet)
            return;
          }
          if (pub.text == here.text) {
            //console.log('quitting again')
            return;
          }
          this.setSomeDataEtc({lastChange: pub.timesChanged, text: pub.text}, this.getLocalId());
          if (here.standardsReady) {
            analyze(pub.text, this);
          }
        }
        //if publisher is Vocab Level or Section tool model
        else if (pub.selectedItem) {
          if (pub.distanceFromFocus < 2 && pub.distanceFromFocus > -1) {
            //user has selected Step 2 and older siblings are in focus so time to be in focus too
            this.setSomeDataEtc({distanceFromFocus: 1}, this.getLocalId());
          }
          else {
            //user has moved to a different focus
            this.setSomeDataEtc({distanceFromFocus: pub.distanceFromFocus + 1}, this.getLocalId());
          }
        }
        function analyze(text, self) {
          //break up user text
          //First, break at line breaks
          var paragraphs = text.split('\n');
          var pText = '', div = [], sentenceLength = 0, currentSentence = [], isFinalizer = false, isFinalDot = false;
          var isBeforeWord = true, isCap = false, prevCap = false, isEasy = false, idCount = 0, sentenceId, obj = {};
          var hardWords = {}, inputId = '', selWord = '';
          for (var i in paragraphs) {
            pText = paragraphs[i];
            //find first alphabetical characters, case insensitive
            //split and take first as non-word
            //for every non-word, keep track of first char, last (and length?)
            div = pText.split(/([a-zA-Z].*)/);
            //keep track of sentence length
            sentenceLength = div[0].length
            //for every non-word, add to current sentence
            currentSentence = [div[0]];
            //deal with the remainder of the pText
              if (div[1]) {
                pText = div[1];
              } else pText = '';
            while (pText) {
              //get an alphabetical word, isolating it from ' if not followed by alph or any non-alph and all that follows.
              div = pText.split(/(\'(?![a-zA-Z])(.|\n)*|[^a-zA-Z\'](.|\n)*)/);
              //keep track of sentence length
              sentenceLength += div[0].length;
              //if the first letter of the last word was capitalized, the final period and following cap may not mean anything
              //e.g. Mr. Doe
              prevCap = isCap;
              //if the first letter is capitalized, it may be the beginning of a sentence
              isCap = /^[A-Z]/.test(div[0]);
              //check to see if it is in the easy-list
              isEasy = (base.getItem(div[0] + '-EN') || base.getItem(div[0].toLowerCase() + '-EN')) ? true: false;
              //TODO add stemming here, trying again to make it easy if it presently fails the isEasy test (e.g. 'Did')
              //TODO add affixes here, trying again to make it easy if it presently fails the isEasy test (e.g. 'undo', because do is in list and un- is easy)
              if (!isEasy) {
                //anticipate sentenceId but don't increment yet
                sentenceId = 'input_' + idCount;
                //if hard word not encountered yet, make a location for it
                if (!hardWords[div[0]]) {
                  //select the first hard word
                  if (!Object.keys(hardWords).length) {
                    selWord = div[0];
                  }
                  hardWords[div[0]] = {};
                  hardWords[div[0]].sentences = {}
                }
                //add this sentence as one instance of this hard word
                hardWords[div[0]].sentences[sentenceId] = {};
              }
            //console.log('length: ' + div.length + ', div[0]: *' + div[0] + '*, isFin: ' + isFinalizer + ', isSp: ' + isBeforeWord + ', div[1]: *' + div[1] + '*, isCap: ' + isCap + ', isEasy: ' + isEasy + ', div[2]: *' + div[2] + '*, div[3]: *' + div[3] + '*');
              //check if paragraph is over or sentence is long enough and there's still a ways to go; if so, save and start new sentence
              if (!pText || (sentenceLength > 70 && pText.length > sentenceLength && (isFinalizer || (isFinalDot && !prevCap)) && isBeforeWord && isCap)) {
                //check if id is already there; if so, delete, then recreate
                inputId = 'input_' + idCount++;
                if (base.getItem(inputId)) base.deleteItem(inputId);
                base.createItem({localId: inputId, dataEtc: {textArray: currentSentence}});
            //console.log('sentence length: ' + sentenceLength);
                currentSentence = [];
                sentenceLength = 0;
              }
              //for every word, add to current sentence
              currentSentence.push(div[0]);
              //deal with the remainder of the pText
              if (div[1]) {
                pText = div[1];
              } else pText = '';
              //get non-alphabetic characters after each word
              div = pText.split(/([a-zA-Z].*)/);
              //if it includes a final punctuation not followed by a digit, it may be the end of a sentence
              isFinalizer = /[!?]/.test(div[0]);
              //if it includes a dot not followed by a digit, it may be the end of a sentence.
              isFinalDot = /\.(?!\d)/.test(div[0]);
              //if it ends with a space, it is end of word and may be the end of a sentence
              isBeforeWord = (!div[0] || /\s$/.test(div[0]));
              //for every non-word, add to current sentence
              currentSentence.push(div[0]);
              //keep track of sentence length
              sentenceLength += div[0].length;
            //console.log('length: ' + div.length + ', div[0]: *' + div[0] + '*, isFin: ' + isFinalizer + ', isSp: ' + isBeforeWord + ', div[1]: *' + div[1] + '*, div[2]: *' + div[2] + '*');
              //deal with the remainder of the pText
              if (div[1]) {
                pText = div[1];
              } else pText = '';
            }//end while pText
            //paragraph text is over, so take current sentence and add a line break, then save
            currentSentence.push('\n');
            //check if id is already there; if so, delete, then recreate
            inputId = 'input_' + idCount++;
            if (base.getItem(inputId)) base.deleteItem(inputId);
            base.createItem({localId: inputId, dataEtc: {textArray: currentSentence}});
          }//end for each paragraph 
          self.setSomeDataEtc({hardWords: hardWords, selectedWord: selWord});
          /*AN EXAMPLE OF HOW LATER TO OUTPUT FINAL TEXT
          var nextInt = 0;
          var nextItem = base.getItem('input_' + nextInt);
          while (nextItem) {
            console.log(nextItem.getDataEtc().textArray.join(''))
            nextItem = base.getItem('input_' + nextInt++)
            if (nextInt > 1000) {
              console.log('>1000')
              break;
            }
          }
          */
        }//end analyzer function
      }//end updateFor
    });//end create analyzer model item
    
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
        text: '2.3 Hard Word',
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
      localId: "Hard Words presenter",
      dataEtc: {
        viewId: "View utility",
        modelId: "Hard Words tool model",
        selectedIndex: 0,
        hardWordsArray: [],
        lastChange: 0,
        isDisplayed: false
        //elementId will be added here, but often changed, so don't depend on it's value
      },
      publisherIds: [
        "Hard Words tool model"
      ],
      updateFrom: function(publisher) {
        var pub = publisher.getDataEtc(); 
        var here = this.getDataEtc();
        //if publisher is Hard Words tool model, get hard words and turn them into an array for displaying
          //(before they were in object for lookup by the word itself when encountered in the text, but present view prefers numbers)
        if (pub.hardWords) {
          var num = pub.lastChange;
          //it is the Hard Words tool model and it has processed the text (or some of it)
          //if not isDisplayed, give them to view utility one by one and set isDisplayed to true
          if (pub.distanceFromFocus > -1 && pub.distanceFromFocus < 2) {
            if (!here.isDisplayed) {
            this.setSomeDataEtc({lastChange: num}, this.getLocalId());
            //this.setSomeDataEtc({lastChange: pub.lastChange}, this.getLocalId());
            display(this); //sets isDisplayed to true
            }
            else if (pub.lastChange > here.lastChange) {
              //already displayed but must undisplay and redisplay
              for (var i in here.hardWordsArray) {
                $('#Hard_' + (i)).closest('div').remove();
              }
             this.setSomeDataEtc({lastChange: num, isDisplayed: true}, this.getLocalId());
              display(this);
            }
          }
        }//if it's the Hard Words tool model but no hardWords, do nothing until it announces its hardWords are ready.
        //if update is run by view markup, it has set selectedIndex here, so fetch and set selectedWord in model for future observers
        else if (pub.dataType == "html") {
          var model = base.getItem("Hard Words tool model");
          var hard = here.hardWordsArray[here.selectedIndex];
          model.setSomeDataEtc({selectedWord: hard}, this.getLocalId());
          model.getUpdateFromFunction().call(model, this);
        }
        var self = this;
        
        function display(self) {
          var view = base.getItem(self.getDataEtc().viewId);
          var hardArray = [undefined];
          for (var word in pub.hardWords) {
            var num = hardArray.length;
            var elementId = 'Hard_' + num;
            hardArray.push(word);
            //set data and publish to view
            var selection = false;
            if (num === 1) {
              selection = true;
              //var model = base.getItem(self.getDataEtc().modelId);
              //model.setSomeDataEtc({selectedWord: word});
            }
            var thisData = {text: word, position: num, isSelected: selection, parentId: 'Hard', elementId: elementId, 
              viewMarkupId: "Item view markup", newAttribute: "data-icon='arrow-r' data-iconpos='right'"}; 
            view.setSomeDataEtc({data: thisData}, self.getLocalId());
            view.getUpdateFromFunction().call(view, self);
          }
          self.setSomeDataEtc({isDisplayed: true, hardWordsArray: hardArray}, self.getLocalId());
        }//end display()
        
      }//end updateFrom
    });//end create presenter
    
    //Req. 2.4
    //Create Instance tool model
    base.createItem({
      localId: "Instance tool model",
      dataEtc: {
        distanceFromFocus: 4,
        selectedItem: 0
      },
      publisherIds: [
        "Hard Words tool model"
      ],
      updateFrom: function(publisher) {
        var pub = publisher.getDataEtc();
        if (this.getDataEtc().distanceFromFocus != pub.distanceFromFocus && pub.selectedWord) {
          this.setSomeDataEtc({distanceFromFocus: pub.distanceFromFocus});
        }
      }
    });//end create Vocab Level tool model
    
    
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
        isDisplayed: false
      },
      publisherIds: [
        "Hard Words tool model",
        "Instance tool model"
      ],
      updateFrom: function(publisher) {
        var pub = publisher.getDataEtc(); 
        var here = this.getDataEtc();
        //if publisher is Hard Words tool model, get hard word and look it up in hard words to find sentences; put them in array
        if (pub.hardWords && pub.distanceFromFocus < 2) {
          var word = pub.selectedWord; 
          /* if (!word) {
          console.log('we still need this')
            for (var w in pub.hardWords) {
              word = w;
              //cut loop short after first iteration; like finding [0]--almost
              break; 
            }
          } */
          //if the selectedWord has not changed in Hard Words tool model, no need to update instances
          if (word == here.hardWord) {
            return;
          }
          //else if the selectedWord has changed and instances are displayed for a previous selected word, erase all and start over
          if (here.hardWord) {
            this.setSomeDataEtc({hardWord: '', isDisplayed: false}, this.getLocalId());
            $('#Instance_0').closest('form').remove();
            var model = base.getItem("Instance tool model");
            model.setSomeDataEtc({selectedItem: 0}, this.getLocalId());
            return;
          }
          //else there are no instances displayed yet, so go ahead and display them.
          var sentences;
          if (pub.hardWords[word]) {
            sentences = pub.hardWords[word].sentences;
          }
          var sArray = [];
          for (var id in sentences) { 
            sArray.push(id);
          }
          this.setSomeDataEtc({sentenceArray: sArray, hardWord: word}, this.getLocalId());
          if (!here.isDisplayed && here.selectedIndex) {
            display(this);
          }
        }
        else if (pub.dataType == "html") {
        //TODO update for observers
        }
        else if (publisher.getLocalId() === 'Instance tool model') { 
          if (pub.distanceFromFocus < 2) {
            this.setSomeDataEtc({selectedIndex: 1}, this.getLocalId());
          }
          else {
            //title will remove all?
          }
        }
        var self = this;
        
        function display(self) { 
          var num = 1; 
          var sArr = self.getDataEtc().sentenceArray;   
          for (var i in sArr) {
            var sentenceItem = base.getItem(sArr[i]);
            var textArray = sentenceItem.getDataEtc().textArray;
            var sentence = textArray.join('');
            //set data and publish to view
            var view = base.getItem(self.getDataEtc().viewId);
            var selection = (num === 1) ? true : false;
            var elementId = 'Instance_' + num;
            var thisData = {text: sentence, position: num, isSelected: selection, parentId: 'Instance', elementId: elementId, 
              viewMarkupId: "Item view markup", newAttribute: "data-icon='arrow-r' data-iconpos='right'"}; 
            view.setSomeDataEtc({data: thisData}, self.getLocalId());
            view.getUpdateFromFunction().call(view, self);
            num++;
          }
          self.setSomeDataEtc({isDisplayed: true});
        }//end display()
        
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
          this.setSomeDataEtc({distanceFromFocus: pub.distanceFromFocus, selectedLevel: pub.selectedLevel}, this.getLocalId());
        }
        //TODO add something to change selected level
      }
    });//end create Vocab Level tool model
    
    
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
          var elementId = 'PoS_' + (i+1);
          var thisData = {text: partsOfSpeech[i], position: i+1, isSelected: selection, parentId: 'PoS', elementId: elementId, 
            viewMarkupId: "Item view markup", newAttribute: newAttr}; 
          view.setSomeDataEtc({data: thisData}, this.getLocalId());
          view.getUpdateFromFunction().call(view, this);
        }
        this.setSomeDataEtc({isDisplayed: true}, this.getLocalId());
      }//end updateFrom
    });//end create presenter
    
    //Req. 2.6
    //Create Replacement tool model
    base.createItem({
      localId: "Replacement tool model",
      dataEtc: {
        suggestions: [],
        selectedWord: "",
        hardWord: "",
        distanceFromFocus: 4,
        selectedItem: 0
      },
      publisherIds: [
        "Hard Words tool model"
      ],
      updateFrom: function(publisher) {
        var pub = publisher.getDataEtc();
        if (this.getDataEtc().distanceFromFocus != pub.distanceFromFocus && pub.selectedWord) {
          //ajax for suggestionArray
          //sort suggestionArray
          //store suggestionArray
          //but temporarily there is no such thing, so create an imitation
          var r1 = {};
          r1.suggestion = pub.selectedWord + ' first';
          r1.pos = 'n';
          r1.level = '3';
          var r2 = {};
          r2.suggestion = pub.selectedWord + ' second';
          r2.pos = 'v';
          r2.level = '6';
          var rArray = [r1, r2];
          this.setSomeDataEtc({suggestions: rArray, hardWord: pub.selectedWord, selectedWord: r1.suggestion, distanceFromFocus: pub.distanceFromFocus}, this.getLocalId());
        }
      }
    });//end create tool model
    
    
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
        text: '2.6 Replacement',
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
        data: '<div data-theme="b" style="border: 0;" data-shadow="false" {{=it.newAttribute}} id="{{=it.elementId}}"  ><input type="text" id="replacement_input" value="{{=it.text}}" /></div>' 
      },
      updateFrom: function(viewUtility) {
        //publisher is view utility
        //var d = this.getDataEtc(); 
        //console.log('itemview: ' + viewUtility.getLocalId() + ' ' + counter++)
        //console.log('view markup has: Step: ' + d.Step + ', Method: ' + d.Method)
        var self = this;
        //prepare to collect user events and pass them to presenter
        if (inputEventHandler) return;
        $('#replacement_input').closest('span').attr('id', 'replacer_span');
        $('#replacer_span').keypress(function (evt) {
          //Deterime where our character code is coming from within the event
          var charCode = evt.charCode || evt.keyCode;
          if (charCode  == 13) { //Enter key's keycode
          //without this, cpu crashes, at least in chrome 26
          evt.preventDefault()
          $('#replacement_input').trigger('change');
          }
        });
        $('#replacement_input').on("change", function(e) {
          e.preventDefault();
          //console.log('changed to: ' + $('#replacement_input').val());
          
          
        });//END .ON?
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
        hardWord: '',
        suggestionArray: [],
        selectedIndex: 0,
        lastAjax: 0,
        isDisplayed: false
      },
      publisherIds: [
        "Hard Words tool model",
        "Replacement tool model"
      ],
      updateFrom: function(publisher) {
        var pub = publisher.getDataEtc(); 
        var here = this.getDataEtc();
        //if pub.lastChange is not momentarily undefined and it's different, do another ajax and sync the number
        if (pub.lastChange && pub.lastChange != here.lastAjax) {
          this.setSomeDataEtc({lastAjax: pub.lastChange}, this.getLocalId());
          $.ajax({
            url: "http://mc.superstring.org:8805/2/getsyns.php?q=word",
            type: 'GET',
            format: "json",
            jsonp: false,
            jsonpCallback: "callback",
            dataType: 'jsonp',
            cache: true
          }).done(function( response ) {
            console.log(response[1]);
          });
        } 
        //if publisher is Hard Words tool model, get hard word and look it up in hard words to find replacements
        if (pub.hardWords && pub.distanceFromFocus < 2) {
          var word = pub.selectedWord; 
          if (word == here.hardWord) {
            return;
          }
          //else if the selectedWord has changed and replacements are displayed for a previous selected word, erase all and start over
          if (here.hardWord) {
            this.setSomeDataEtc({hardWord: '', isDisplayed: false}, this.getLocalId());
            $('#Replacement_0').closest('form').remove();
            var model = base.getItem("Replacement tool model");
            model.setSomeDataEtc({selectedItem: 0}, this.getLocalId());
            return;
          }
          //else there are no suggested replacements displayed yet, so go ahead and display them.
          //find the stored hard word, find its suggested replacements (suggestions), and refer to that as suggestionArray
          
          if (!here.isDisplayed && here.selectedIndex) {
            display(this);
          }
        }
        else if (pub.dataType == "html") {
        //TODO update for observers
        }
        else if (publisher.getLocalId() === 'Replacement tool model') { 
          if (pub.distanceFromFocus < 2) {
            this.setSomeDataEtc({selectedIndex: 1}, this.getLocalId());
          }
          else {
            //title will remove all?
          }
        }
        
        function display(self) { 
          var num = 2; 
          var rArr = self.getDataEtc().suggestionArray; 
          for (var i in rArr) {
            var suggestion = rArr[i].suggestion;
            var pos = rArr[i].pos;
            var level = rArr[i].level;
            var whole = suggestion + ' (' + level + ', ' + pos + ')';
            //set data and publish to view
            var view = base.getItem(self.getDataEtc().viewId);
            var selection = false;
            if (num === 2) {
              selection = true;
            }
            var selection = (num === 2) ? true : false;
            var elementId = 'Replacement_' + num;
            var thisData = {text: whole, position: num, isSelected: selection, parentId: 'Replacement', elementId: elementId, 
              viewMarkupId: "Item view markup", newAttribute: "data-icon='arrow-r' data-iconpos='right'"}; 
            view.setSomeDataEtc({data: thisData}, self.getLocalId());
            view.getUpdateFromFunction().call(view, self);
            num++;
          }
          self.setSomeDataEtc({isDisplayed: true}, self.getLocalId());
        }//end display()
        
      }//end updateFrom
    });//end create presenter
    
  }
  return {
    go: go
  }
  //TODO: reactivate the logging in Hard Words tool model on 1048 and 1068 to debug why it runs so many times on changing step
  //Oh I know why: I shouldn't keep adding the same event handler to all inputs every time something displays!!!
  
})();
  

 