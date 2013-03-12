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
    
    //the view markup
    base.createItem({
      localId: "List view markup",
      dataEtc: {
        dataType: "html",
        requirements: ["doT.js"],
        data: '<form style="text-align: center; margin: 5px 5px 5px 5px; vertical-align: top;"> <fieldset data-role="controlgroup" data-type="{{=it.orientation}}" data-iconpos="right" {{=it.newAttribute}} id="{{=it.elementId}}"></fieldset></form>'
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
        console.log('parentId: ' + here.parentId + ', data: ' + template(here))
        $('#' + here.parentId).append(template(here));
        $('#page').trigger('create');
        var elId = "#" + here.elementId;
        var iconString = 'arrow-d';
        var themeChar = 'b'
        if (here.isSelected === false) {
          iconString = null;
          themeChar = 'c';
        }
        console.log('elId: ' + elId + ', iconString: ' + iconString + ", themeChar: " + themeChar)
        if (elId.indexOf('_') !== -1) {
          $(elId).buttonMarkup({theme: themeChar, corners: false, icon: iconString, shadow: false});
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
            $(idStarter + '_' + unselected[i]).buttonMarkup({theme: 'c', corners: false, icon: null});
          }
          $('#' + selectedId).buttonMarkup({theme: 'b', corners: false, icon: 'arrow-d'});
          //if clicked, update presenter, which will allow it to update model
          var presenter = base.getItem(idArray[0] + ' ' + selectedInt + " presenter");
          presenter.setSomeDataEtc({isSelected: true}, self.getLocalId());
          presenter.getUpdateFromFunction().call(presenter, self);
        });
      }//end of updateFrom
    });
    
    base.createItem({
      localId: "Steps tool presenter",
      dataEtc: {
        elementId: "Step", 
        orientation: "horizontal", 
        newAttribute: "style=' background: white; border: 0;'", //style='display: block;'
        modelId: "Steps tool model",
        viewId: "View utility",
        viewMarkupId: "List view markup",
        parentId: "page",
        selectedItem: 1
      },
      publisherIds: [
        "Steps tool model"
      ],
      updateFrom: function(publisher) {
        var pInfo = publisher.getDataEtc();
        var here = this.getDataEtc();
        //check if it's model
        if ("distanceFromFocus" in pInfo) {
          //this should be model; check distanceFromFocus
          if (pInfo.distanceFromFocus === 0) {
            //set data and publish, allowing presentation function to display view
            var view = base.getItem(this.getDataEtc().viewId);
            view.setSomeDataEtc({data: here, viewMarkupId: here.viewMarkupId, parentId: here.parentId}, this.getLocalId());
            view.getUpdateFromFunction().call(view, this);
          }
        }//end check if it's model
        //check if it's view
        else if (publisher.getLocalId() == here.viewId) {
          //this should be view after having set here.isSelected
          if (here.isSelected === true) {
            var model = base.getItem(here.modelId);
            model.setSomeDataEtc({distanceFromFocus: 0}, this.getLocalId());
          }
        } // end if it's view/html
      }//end updateFrom
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
      updateFrom: function(publisher) {
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
    });
   
  
    //the item view markup for most items
    base.createItem({
      localId: "Item view markup",
      dataEtc: {
        dataType: "html",
        requirements: ["doT.js"],
        data: '<input type="button" data-iconpos="bottom" data-role="button" data-theme="a" id="{{=it.elementId}}" value="{{=it.text}}" />'
      }
    });
    
    base.createItem({
      localId: "Step 1 presenter",
      dataEtc: {
        elementId: "Step_1", 
        modelId: "Step 1 model",
        viewId: "View utility",
        viewMarkupId: "Item view markup",
        parentId: "Step",
        isSelected: true,
        isDisplayed: false
      },
      publisherIds: [
        "Step 1 model"
      ],
      updateFrom: itemPresenterUpdateFrom
    });//end create presenter
    
  function itemPresenterUpdateFrom(publisher) {
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
          var view = base.getItem(this.getDataEtc().viewId); console.log('pos: ' + pInfo.position);
          this.setSomeDataEtc({text: pInfo.text, position: pInfo.position}, this.getLocalId());
          view.setSomeDataEtc({data: here}, this.getLocalId());
          view.getUpdateFromFunction().call(view, this);
          this.setSomeDataEtc({isDisplayed: true});
        }
        if (position !== listModel.getDataEtc().selectedItem) {
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
        text: 'Step 2: Import Text',
        listModelId: "Steps tool model",
        distanceFromFocus: 2,
        position: 2
      },
      publisherIds: [
        "Steps tool model"
      ],
      updateFrom: function(publisher) {
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
      updateFrom: itemPresenterUpdateFrom
    });//end create presenter
    
    //Create Step3 model
    base.createItem({
      localId: "Step 3 model",
      dataEtc: {
        text: 'Step 3: Import Text',
        distanceFromFocus: 1,
        listModelId: "Steps tool model",
        position: 3
      },
      publisherIds: [
        "Steps tool model"
      ],
      updateFrom: function(publisher) {
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
      updateFrom: itemPresenterUpdateFrom
    });//end create presenter
    
  }//end create items
  /*
        //the model
    base.createItem({
      localId: "Easy model",
      dataEtc: {
        dataType: "model object",
        data: {
          text: "My Text"
        },
        distanceFromFocus: 1
      },
    });
    
    //the view markup
    base.createItem({
      localId: "Easy view markup",
      dataEtc: {
        dataType: "html",
        requirements: ["doT.js"],
        data: '<a href="#"><h1>{{=it.text}}</h1></a>'
      }
    });
    
    //the view
    base.createItem({
      localId: "Easy view",
      dataEtc: {
        dataType: "function",
        requirements: ["jQuery", "jQueryMobile", "doT.js"]
      },//end of dataEtc
      updateFrom: function updateFrom(publisher) {
        var presenter = publisher;
        //get view markup here as set by presenter
        var here = this.getDataEtc();
        var viewMarkup = base.getItem(here.viewMarkupId);
        //get html template from view markup
        var templateString = viewMarkup.getDataEtc().data;
        //use it to initialize a templating function
        var template = doT.template(templateString);
        //insert model data into viewMarkup template and display
        $(here.domElement).append(template(here.data));
        var self = this;
        //prepare to collect user events and pass them to presenter
        $(here.domElement).on("click", "a", function() {
          //if clicked, update presenter, which will allow it to update model
          presenter.setSomeDataEtc({selected: true}, self.getLocalId());
          presenter.getUpdateFromFunction().call(presenter, self);
        });
      }//end of updateFrom
    });
    
    //the presenter that binds it all together
    base.createItem({
      localId: "Easy presenter",
      dataEtc: {
        status: "readyToDisplay",
        distanceFromFocus: 2,
        modelId: "Easy model",
        viewId: "Easy view",
        viewMarkupId: "Easy view markup",
        domElement: "#page",
        //data will be inserted here
        //then outputPresenterFunction will be notified
      },
      publisherIds: [
        "Easy model"
      ],
      //TODO make the following default updateFrom method? or a common option to be called on?
      updateFrom: function(publisher) {
        var pInfo = publisher.getDataEtc();
        var here = this.getDataEtc();
        //check if it's model
        if ("distanceFromFocus" in pInfo) {
          //this should be model; check distanceFromFocus
          if (pInfo.distanceFromFocus === 1) {
            //set data and publish, allowing presentation function to display view
            var view = base.getItem(this.getDataEtc().viewId);
            view.setSomeDataEtc({data: pInfo.data, viewMarkupId: here.viewMarkupId, domElement: here.domElement}, this.getLocalId());
            view.getUpdateFromFunction().call(view, this);
          }
        }//end check if it's model
        //check if it's view
        else if (publisher.getLocalId() == here.viewId) {
          //this should be view after having set here.status
          if (here.status == "selected") {
            var model = base.getItem(here.modelId);
            model.setSomeDataEtc({distanceFromFocus: 0}, this.getLocalId());
          }
        } // end if it's view/html
      }//end updateFrom
    });
  }
  
  
  //Req. 4.2: Steps on every virtual page
  //Create Steps tool model (at first with title and orientation), 
  base.createItem({
    localId: "Steps tool",
    dataEtc: {status: "inactive"}
  });
  //Create Steps tool views (one for invisible tool container, one for title to be used if title data exists)
  base.createItem({
    localId: "Form outer view",
    dataEtc: {
      dataType: "html template for DoT.js",
      data: '<form style="margin: 5px 5px 25px 5px;"> <fieldset data-role="controlgroup" data-type="{{=it.orientation}}" style="text-align: center;" id="outer">      </fieldset></form>'
    }
  });
  //Create Steps tool presenter
  base.createItem({
    localId: "Options presenter utility",
    data: ""
  });
  //Connect them via subscription
  base.createItem({
    localId: "Steps tool presenter",
    dataType: "properties",
    data: {
      model: "Steps tool",
      view: "Form outer view",
      presenterFunction: "Options presenter utility",
      orientation: "horizontal"
    },
    subscriberIds: [
      "Steps tool",
      "Form outer view",
      "Options presenter utility"
    ]
  });
  */
  //Changing model data to active to display (with first but finally without title)
  //Create Step1 view, if not reusing
  //Create Step1 presenter, try to reuse functions
  //Connect them together to display
  //Create Step2 model
  //Create Step2 view, if not reusing
  //Create Step2 presenter, try to reuse functions
  //Connect them together to display (and ensure switching steps changes state via console.log)
  //Create Step3 model
  //Create Step3 view, if not reusing
  //Create Step3 presenter, try to reuse functions
  //Connect them together to display
  //Create 1.1 Import Method tool model
  //Create 1.1 Import Method view, if not reusing
  //Create 1.1 Import Method presenter, try to reuse functions
  //Connect them together to display
  //Create textarea button model
  //Create textarea button view
  //Create textarea button presenter
  //Connect it with tool/title and Step1 to display (and ensure clicking other steps makes 1.1 disappear)
  //If time, try dev mode 0.1 by looping through allVertices and displaying a crud interface
  //Then move on to completing importer, analyzer (chunking), checker(comparison with simplicity standard), rechecker (manual), exporter
  
  return {
    go: go
  }
  
})();
  

 