//the following code expects base.js for var base, jquery[.min].js for var $, doT.js for var doT, 

window.simplifier = simplifier = (function createSimplifier() {
  "use strict";
  
  function go() {
    createItems();
    //act as presenter: pass message and cause model to update its presenter
    base.getItem("Easy model").setSomeDataEtc({domElement: "#page"});
  }
  //TODO: I've copied this into commented section below, so go ahead and modify this for the real thing
  
  function createItems() {
    //the model
    base.createItem({
      localId: "Easy model",
      dataEtc: {
        data: {
          text: "My Text"
        }
        //domElement and/or distanceFromFocus will be inserted here by go() initializer as a temporary message for presenter
      },
    });
    
    //the view
    base.createItem({
      localId: "Easy view",
      dataEtc: {
        dataType: "html",
        requirements: ["doT.js"],
        data: '<a href="#"><h1>{{=it.text}}</h1></a>'
      }
    });
    
    //the presenter utility
    base.createItem({
      localId: "Easy presenter utility",
      dataEtc: {
        dataType: "function",
        requirements: ["jQuery", "jQueryMobile", "doT.js"]
      },//end of dataEtc
      updateFrom: function(publisherId) {
        //get presenter from publisher
        var props = base.getItem(publisherId).getDataEtc();
        //get html template from view
        var templateString = base.getItem(props.viewId).getDataEtc().data;
        //use it to initialize a templating function
        var template = doT.template(templateString);
        //insert model data into view template and display
        $(props.domElement).append(template(props.data));
        //console.log("properties notified presfunc, which passed the data to view");
      }//end of data: function
    });
    
    //the presenter that binds it all together
    base.createItem({
      localId: "Easy presenter",
      dataEtc: {
        viewId: "Easy view"
        //data will be inserted here
        //domElement will be inserted here
        //then outputPresenterFunction will be notified
      },
      publisherIds: [
        "Easy model"
      ],
      subscriberIds: [
        "Easy presenter utility"
      ], //TODO make the following default updateFrom method? or a common option to be called on?
      updateFrom: function(publisherId) {
        var pub = base.getItem(publisherId);
        if (!pub.getDataEtc().domElement) {
          //this is not related to presentation
          return;
        }
        //console.log("model updated presenter, which is setting its own data accordingly");
        
        //set data and publish, allowing presentation function to display view
        this.setSomeDataEtc(pub.getDataEtc());
        //prepare to collect further information from view
        $(pub.getDataEtc().domElement).on("click", "a", function() {
          //if clicked, update model, allowing other models/presenters to observe
          pub.setSomeDataEtc({status: "selected"});
          //console.log("model knows it is selected, and others can observe");
        });
        //remove domElement until next time
        delete pub.getDataEtc().domElement;
      }
    });
  }
  
  /*
   //the model
    base.createItem({
      localId: "Easy model",
      dataEtc: {
        data: {
          text: "My Text"
        }
        //domElement will be inserted here as a temporary message from inputPresenter/inputController to be picked up by outputPresenterProperties
      },
    });
    
    //the view
    base.createItem({
      localId: "Easy view",
      dataEtc: {
        dataType: "html",
        requirements: ["doT.js"],
        data: '<a href="#"><h1>{{=it.text}}</h1></a>'
      }
    });
    
    //the adapter
    base.createItem({
      localId: "Easy presenter utility",
      dataEtc: {
        dataType: "function",
        requirements: ["jQuery", "jQueryMobile", "doT.js"]
      },//end of dataEtc
      updateFrom: function(publisherId) {
        //get presenter from publisher
        var props = base.getItem(publisherId).getDataEtc();
        //get html template from view
        var templateString = base.getItem(props.viewId).getDataEtc().data;
        //use it to initialize a templating function
        var template = doT.template(templateString);
        //insert model data into view template and display
        $(props.domElement).append(template(props.data));
        //console.log("properties notified presfunc, which passed the data to view");
      }//end of data: function
    });
    
    //the presenter that binds it all together
    base.createItem({
      localId: "Easy presenter",
      dataEtc: {
        viewId: "Easy view"
        //data will be inserted here
        //domElement will be inserted here
        //then outputPresenterFunction will be notified
      },
      publisherIds: [
        "Easy model"
      ],
      subscriberIds: [
        "Easy presenter utility"
      ], //TODO make the following default updateFrom method? or a common option to be called on?
      updateFrom: function(publisherId) {
        var pub = base.getItem(publisherId);
        if (!pub.getDataEtc().domElement) {
          //this is not related to presentation
          return;
        }
        //console.log("model updated presenter, which is setting its own data accordingly");
        
        //set data and publish, allowing presentation function to display view
        this.setSomeDataEtc(pub.getDataEtc());
        //prepare to collect further information from view
        $(pub.getDataEtc().domElement).on("click", "a", function() {
          //if clicked, update model, allowing other models/presenters to observe
          pub.setSomeDataEtc({status: "selected"});
          console.log("model knows it is selected, and others can observe");
        });
        //remove domElement until next time
        delete pub.getDataEtc().domElement;
      }
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
  //Try separating presenter from its functions, for reuse
  //Create Step1 model
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
  

 