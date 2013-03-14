//the following code expects base.js for var base, jquery[.min].js for var $, doT.js for var doT, 

window.simplifier = simplifier = (function createSimplifier() {
  "use strict";
  
  function go() {
    createItems();
    //act as presenter: pass message and cause model to update its presenter
    base.getItem("Steps tool model").setSomeDataEtc({distanceFromFocus: 1});
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
        data: '<form {{=it.newAttribute}}> <fieldset data-role="controlgroup" data-type="{{=it.orientation}}" id="{{=it.elementId}}"></fieldset></form>'
      }
    });
    
    //the view
    base.createItem({
      localId: "View utility",
      dataEtc: {
        dataType: "function",
        requirements: ["jQuery", "jQueryMobile", "doT.js"]
      },//end of dataEtc
      updateFrom: function updateFrom(publisher) {
        var presenter = publisher;
        //get view markup here as set by presenter
        var here = this.getDataEtc().data;
        var viewMarkup = base.getItem(here.viewMarkupId);
        //get html template from view markup
        var templateString = viewMarkup.getDataEtc().data;
        //use it to initialize a templating function
        var template = doT.template(templateString);
        //insert model data into viewMarkup template and display
        $('#' + here.parentId).append(template(here));
        $('#page').trigger('create');
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
          if (here.isDisplayed === false) {
            //set data and publish, allowing presentation function to display view
            var view = base.getItem(this.getDataEtc().viewId);
                this.setSomeDataEtc(pInfo, this.getLocalId());
            //this.setSomeDataEtc({text: pInfo.text, position: pInfo.position}, this.getLocalId());
            view.setSomeDataEtc({data: here}, this.getLocalId());
            view.getUpdateFromFunction().call(view, this);
            this.setSomeDataEtc({isDisplayed: true});
          }
          //is the following really needed? it seems to check list model
          if (listModel.getDataEtc().selectedItem && position !== listModel.getDataEtc().selectedItem) {
            this.setSomeDataEtc({isSelected: false}, this.getLocalId());
          }
        }
        else {
          //model is not displayable, so remove (is this overkill by making every item in list try to kill it's form when only one needs to?)
          $('#' + here.elementId).closest('form').remove()
          this.setSomeDataEtc({isDisplayed: false}, this.getLocalId());
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
        else if (here.title === true) {
      console.log(here.title)
          //it is telling us the title from field and text from textarea after change
          model.setSomeDataEtc({title: here.title, text: here.text});
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
        var d = this.getDataEtc()
        //console.log('view markup has: Step: ' + d.Step + ', Method: ' + d.Method)
        var self = this;
        //prepare to collect user events and pass them to presenter
        $('#page').on("click", 'input', function(e) {
          var selectedId = this.id;
          if (selectedId === 'title__Input_1') return;
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
          //try to recreate what presenter is based on convention (known bug)
          var presString = idArray[0] + ' ' + selectedInt + " presenter";
          var presenter = base.getItem(presString);
          presenter.setSomeDataEtc({isSelected: true}, self.getLocalId());
          presenter.getUpdateFromFunction().call(presenter, self);
        });
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
        modelId: "Steps tool model",
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
        data: '<div data-theme="b" style="border: 0;" data-shadow="false" {{=it.newAttribute}} id="{{=it.elementId}}"  ><br />Title:<br /><input type="text" placeholder="{{=it.placeholder}}" id="{{=it.titleFieldId}}" value="{{=it.title}}" /><br />Text:<br /><textarea placeholder="{{=it.placeholder}}"  id="{{=it.textareaId}}">{{=it.text}}</textarea></div>'
      },
      updateFrom: function(viewUtility) {
        //publisher is view utility
        var view = viewUtility.getDataEtc().data
        var id = view.elementId
        var self = this;
        //prepare to collect user events and pass them to presenter
        $('#page').on("change", '#' + id, function(e) {
          //prevent running this function twice (not sure why this is needed but it is)
          e.preventDefault();
          var titleAdded = $('#' + view.titleFieldId).val();
          var textAdded = $('#' + view.textareaId).val();
          var presenter = base.getItem(view.presenterId);
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
      localId: "List3 loader model",
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
          core.localId = parts[0];
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
          if (item.getLocalId() !== parts[0]) console.log('WARNING localId not right: ' + item.getLocalId() + ' !== ' + parts[0]);
        }
        this.setSomeDataEtc({isLoaded: true}, this.getLocalId());
        //console.log("ending: " + new Date());
        //console.log("lexemeCount: " + lexemeCount);
        //console.log("wordCount: " + wordCount);
      }
      
    });//end of List2 loader model
    
  }
  return {
    go: go
  }
  
})();
  

 