//the following code expects base.js for var base, jquery[.min].js for var $, doT.js for var doT, 

window.simplifier = simplifier = (function createSimplifier() {
  "use strict";
  
  function go() {
    createItems();
    //act as presenter: pass message and cause model to update its presenter
    base.getItem("Steps tool model").setSomeDataEtc({distanceFromFocus: 0});
  }


  function createItems() {
    //Req. 4.2: Steps on every virtual page
    //Create Steps tool model (at first with title and orientation), 
    base.createItem({
      localId: "Steps tool model",
      dataEtc: {
        data: {},
        selectedItem: 1,
        distanceFromFocus: 1
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
        var elId = "#" + here.elementId;
        var iconString = 'arrow-d';
        var themeChar = 'b'
        if (here.isSelected === false) {
          iconString = null;
          themeChar = 'c';
        }
        //check if input button; if so, apply markup. If list (i.e. fieldset), do nothing.
        if (elId.indexOf('_') !== -1 ) {
          $(elId).buttonMarkup({theme: themeChar, corners: false});
          if (elId === "#Input_1") {
            $(elId).removeClass('ui-btn').addClass('ui-controlgroup-last ui-corner-bottom');
          }
          if (elId === "#Input_0") {
            //not working
            var parent = $(elId).parents().removeClass('ui-corner-bottom ui-controlgroup-last');
            var child = parent.children().removeClass('ui-corner-bottom ui-controlgroup-last');
            console.log($(elId).parents()[0])
            console.log(parent[0])
            console.log(child[0])
          }
        }
        //record the highest position associated with this list, for use in on click below
        var permanent = this.getDataEtc();
        if (!permanent[here.parentId] || permanent[here.parentId] < here.position) {
          permanent[here.parentId] = here.position;
          this.setDataEtc(permanent, this.getLocalId());
        }
        var self = this;
        //prepare to collect user events and pass them to presenter
        if (here.parentId == 'page') return;
        $('#page').on("click", 'input', function() {
          var selectedId = this.id;
          var idArray = selectedId.split('_');
          var selectedInt = idArray[1];
          var idStarter = "#" + idArray[0];
          var unselected = [];
          permanent = self.getDataEtc();
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
          var presenter = base.getItem(idArray[0] + ' ' + selectedInt + " presenter");
          presenter.setSomeDataEtc({isSelected: true}, self.getLocalId());
          presenter.getUpdateFromFunction().call(presenter, self);
        });
      }//end of updateFrom
    });
    
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
  
    //Create Step1 model
    base.createItem({
      localId: "Step 1 model",
      dataEtc: {
        text: 'Step 1: Import Text',
        distanceFromFocus: 1,
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
      if (listInfo.selectedItem === thisInfo.position) {
        //this is in focus
        this.setSomeDataEtc({distanceFromFocus: 0}, this.getLocalId());
      }
      else {
        //this is not in focus
        this.setSomeDataEtc({distanceFromFocus: listInfo.distanceFromFocus + 1}, this.getLocalId());
      }
    }
  
    //the item view markup for most items
    base.createItem({
      localId: "Item view markup",
      dataEtc: {
        dataType: "html",
        requirements: ["doT.js"],
        data: '<input type="button" data-role="button" data-theme="a" {{=it.newAttribute}} id="{{=it.elementId}}" value="{{=it.text}}" />'
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
    
  function presenterUpdateFrom(publisher) {
    var pInfo = publisher.getDataEtc();
    var here = this.getDataEtc();
    var model = base.getItem(here.modelId);
    var position = model.getDataEtc().position;
    var listModel = base.getItem(model.getDataEtc().listModelId);
    //check if it's model
    if ("distanceFromFocus" in pInfo) {
      //this should be model; check distanceFromFocus
      if (pInfo.distanceFromFocus < 2) {
        if (here.isDisplayed === false) {
          //set data and publish, allowing presentation function to display view
          var view = base.getItem(this.getDataEtc().viewId);
              this.setSomeDataEtc(pInfo, this.getLocalId());
          //this.setSomeDataEtc({text: pInfo.text, position: pInfo.position}, this.getLocalId());
          view.setSomeDataEtc({data: here}, this.getLocalId());
          view.getUpdateFromFunction().call(view, this);
          this.setSomeDataEtc({isDisplayed: true});
        }
        if (listModel && position !== listModel.getDataEtc().selectedItem) {
          this.setSomeDataEtc({isSelected: false}, this.getLocalId());
        }
      }
    }    
    //check if it's view
    else if (publisher.getLocalId() == here.viewId) {
      //this should be view after having set here.isSelected
      if (here.isSelected === true) {
        listModel.setSomeDataEtc({selectedItem: position}, this.getLocalId());
      }
    } // end if it's view/html
  }//end itemUpdateFrom
    
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
        distanceFromFocus: 1,
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
        distanceFromFocus: 1
      },
      publisherIds: [
        "Steps tool model"
      ],
      updateFrom: function(publisher) {
        if (publisher.getDataEtc().selectedItem < 2) {
          this.setSomeDataEtc({distanceFromFocus: 0}, this.getLocalId());
        }
      }
      
    });
    
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
        distanceFromFocus: 1,
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
        distanceFromFocus: 1,
        listModelId: "Method tool model",
        position: 1
      },
      publisherIds: [
        "Method tool model"
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    base.createItem({
      localId: "Method 1 presenter",
      dataEtc: {
        elementId: "Method_1", 
        modelId: "Textarea Method model",
        viewId: "View utility",
        viewMarkupId: "Item view markup",
        newAttribute: "data-icon='arrow-r' data-iconpos='right'",
        parentId: "Method",
        isSelected: true,
        isDisplayed: false
      },
      publisherIds: [
        "Textarea Method model"
      ],
      updateFrom: presenterUpdateFrom
    });//end create presenter
    
    
    //Create File Method model
    base.createItem({
      localId: "File Method model",
      dataEtc: {
        text: 'Open a text file',
        distanceFromFocus: 1,
        listModelId: "Method tool model",
        position: 2
      },
      publisherIds: [
        "Method tool model"
      ],
      updateFrom: itemModelUpdateFrom
    });
    
    base.createItem({
      localId: "Method 2 presenter",
      dataEtc: {
        elementId: "Method_2", 
        modelId: "File Method model",
        viewId: "View utility",
        viewMarkupId: "Item view markup",
        newAttribute: "",//data-iconpos='right'
        parentId: "Method",
        isSelected: false,
        isDisplayed: false
      },
      publisherIds: [
        "File Method model"
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
        distanceFromFocus: 1
      },
      publisherIds: [
        "Method tool model"
      ],
      updateFrom: function(publisher) {
        if (publisher.getDataEtc().distanceFromFocus < 1) { //TODO need to check others like this
          this.setSomeDataEtc({distanceFromFocus: 0}, this.getLocalId());
        }
      }
      
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
        distanceFromFocus: 1,
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
        title: "Hi",
        text: "FAITH",
        distanceFromFocus: 1,
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
        data: '<div data-theme="b" style="border: 0;" data-shadow="false" {{=it.newAttribute}} id="{{=it.elementId}}"  ><br />Title:<br /><input type="text" placeholder="{{=it.placeholder}}" value="{{=it.title}}" /><br />Text:<br /><textarea placeholder="{{=it.placeholder}}">{{=it.text}}</textarea></div>'
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
        parentId: "Input",
        isSelected: true,
        isDisplayed: false
      },
      publisherIds: [
        "Input Area model"
      ],
      updateFrom: presenterUpdateFrom
    });//end create presenter
    
  }//end create items
  /*
       
  //Create textarea button model
  //Create textarea button view
  //Create textarea button presenter
  //Connect it with tool/title and Step1 to display (and ensure clicking other steps makes 1.1 disappear)
  //If time, try dev mode 0.1 by looping through allVertices and displaying a crud interface
  //Then move on to completing importer, analyzer (chunking), checker(comparison with simplicity standard), rechecker (manual), exporter
  */
  return {
    go: go
  }
  
})();
  

 