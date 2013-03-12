//the following code expects base.js for var base, jquery[.min].js for var $, doT.js for var doT, index.html (pasted below)
/*
At this time, 12 March 2013, 69 tests are passing for base.js.

No tests were done for this demo, but when index.html is first opened, console should say:
'undefined' set 'Easy model'; base.js:319
'Easy model' sent update to 'Easy presenter'; base.js:564
'Easy presenter' set 'Easy view'; base.js:319

Then, when "My Text" is clicked, console should say:
'Easy view' set 'Easy presenter'; base.js:319
'Easy presenter' set 'Easy model'; base.js:319
*/

window.simplifier = simplifier = (function createSimplifier() {
  "use strict";
  
  function go() {
    createItems();
    //act as presenter: pass message and cause model to update its presenter
    base.getItem("Easy model").setSomeDataEtc({distanceFromFocus: 1});
  }
  //TODO: I've copied this into commented section below, so go ahead and modify this for the real thing
  
  function createItems() {
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
          presenter.setSomeDataEtc({status: "selected"}, self.getLocalId());
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
  return {
    go: go
  }
  
})();
/*
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml"  xml:lang="en" lang="en">
  <head>
    <!--
    by the way I saved this as...
      index2013Mar5a
    -->
    
    <!--meta http-equiv="Content-Type" content="text/html; charset=utf-8" / -->
	<title>My Page</title> 
	<meta name="viewport" content="width=device-width, initial-scale=1"> 
	<script src="js/jquery.min.js"></script>
	<script src="js/jquery.mobile-1.2.0.min.js"></script>
	<link rel="stylesheet" href="css/jquery.mobile-1.2.0.min.css" />
  <script src="js/doT.min.js" type="text/javascript"></script>
  <script src="js/json2.js" type="text/javascript"></script>
    <script src="js/base.js" type="text/javascript"></script>
    <script src="js/simplify.js" type="text/javascript"></script>
    <script type="text/javascript">
      $(document).ready(function() {
        simplifier.go();
      });
    </script>
    <style>
    </style>
  </head>
  <body>
    <div data-role="page" id="page" ></div>
  </body>
</html>
*/