/*

ITEM INTERFACE
+getLocalId():String
+getDataEtc():Object
+setDataEtc(dataEtc:Object):Boolean
+addToDataEtc(nestable:Object):Boolean
+checkSubscriberId(subscriberId:String):Booleanish Number
+checkPublisherId(publisherId:String):Booleanish Number
+getSubscriberIds():Array
+getPublisherIds():Array
+addSubscriberId(subscriberId:String, priority:Number):Boolean
+removeSubscriberId(subscriberId:String):Boolean
+addPublisherId(publisherId:String):Boolean
+removePublisherId(publisherId:String):Boolean
+updateFrom(publisherId:String):Boolean
+getUpdateFromFunction():Function
+setUpdateFromFunction(updateFrom:Function):Boolean
BASE INTERFACE
+createItem(core:Object):Item
+deleteItem(localId:String):Boolean
+getItem(localId):Item
+getNumItems():Number
+getItems():Array
+deleteItems():Boolean
ITEM CORE INTERFACE
localId:String
DataEtc:Object
DataEtc.data
DataEtc.dataType:String
SubscriberIds:Array<String>
PublisherIds:Array<String>
UpdateFrom:Function(publisherId:String):Boolean
ACCEPTED DATE: 8 MARCH 2013

*/
//single instance of container and factory for local vertices/items
window.base = base = (function createBase() {
  "use strict";
  //private inner container
  var items = {};
  
  //used in createItem multiple times and also in deleteItem
  function verifyLocalId(localId) {
    var id = localId;
    if (id.getLocalId) {
      //someone passed an item object instead of its id
      id = id.getLocalId();
    }
    //check that typeof === string
    if (typeof id !== 'string' ) {
      id = false;
    }
    return id;
  }
  
  //+createItem(core:Object):Item
  function createItem(givenCore) {
    var core;
    if (givenCore === undefined) {
      givenCore = '';
    }
    if (typeof givenCore === 'object') {
      //we don't want given core to be modified, so we turn it into string, copy it, and restore it
      try {
        //but the updateFrom function doesn't survive this process, so it is the exception
        var updateFromFunction;
        if (givenCore.updateFrom) {
          updateFromFunction = givenCore.updateFrom;
        }
        core = JSON.parse(JSON.stringify(givenCore));
        //even if updateFromFunction is still undefined, the program below can deal with it.
        core.updateFrom = updateFromFunction;
      } catch (e) {
        console.log('JSON (json2) did not like createItem argument: ' + e.message);
        core = "Input could not be read by base.createItem().";
      }
    }
    else {
      core = givenCore.toString();
    }
    
    //unverifiedSubscribers keeps track of subscribers that don't (yet) exist and need to be checked later, 
      //in case this is part of a batch operation and they are coming soon
    var unverifiedSubscribers = [];
    //unverifiedPublishers keeps track of publishers that don't (yet) exist and need to be checked later, 
      //in case this is part of a batch operation and they are coming soon
    var unverifiedPublishers = [];
    
    //check given core for localId
    if (core && core.localId) {
      //create core.dataEtc. if not there
      if (!core.dataEtc) {
        core.dataEtc = {};
      }
      //check that it is valid
      //if not string, to string
      if (typeof core.localId !== 'string') {
        console.log("base.createItem given core.localId that is not string" + core.localId);
        core.dataEtc.originalLocalIdNonString = core.localId;
        core.localId = core.localId.toString();
      }
      //if > 64, chop it off there
      if (core.localId.length > 64) {
        console.log("base.createItem given core.localId that is > 64: " + core.localId);
        core.dataEtc.originalLocalIdBigString = core.localId;
        core.localId = core.localId.substr(0,64);
      }
      //check if localId is used
      //if used, modify, saving originalLocalId in dataEtc.
      if (items[core.localId]) {
        console.log("base.createItem tried id but it was already in use: " + core.localId);
        core.dataEtc.originalLocalIdUsedAlready = core.localId;
        //chop make max 62 to allow for underscore and number
        var max = 62;
        var idCopy = core.localId.substr(0, max);
        core.localId = idCopy + "_0";
        //add underscore and increasing numbers until unused id is found
        var count = 1;
        while (items[core.localId]) {
        //every time mod10 is 0, chop off a letter to keep it max 64
          if (count%10 == 0) {
            idCopy = core.localId.substr(0, --max);
          }
          core.localId = idCopy + "_" + count++;
        }
      }
    }//end if(core.localId)
    else {
      //if no core.localId, check for dataEtc.data
      //if none, not a true core, but this should handle strings too
      if (!core || typeof core !== 'object') {
        core = {dataEtc: {}};
      }
      if (!core.dataEtc) {
        core.dataEtc = {};
      }
      if (!core.dataEtc.data) {
        //convert to string if not already
        var dataString = givenCore.toString();
        //if no/empty string or '[object Object]', create date+time string
        if (!dataString || dataString === '[object Object]') {
          dataString = (new Date()).toString();
        }
        //put string in dataEtc.data
        core.dataEtc.data = dataString;
      }//end if(!core.dataEtc.data)
      //use dataEtc.data to create localId
      //accept first 15 letters (enough for date string)
      var newId = core.dataEtc.data.toString().substr(0,15);
      //then, if word break (space), see if used
      var count = 15;
      var nextChar = core.dataEtc.data.charAt(count);
      while (nextChar !== ' ') {
        newId += nextChar;
        nextChar = core.dataEtc.data.charAt(++count);
        if (count > 30) break;
      }
      while (items[newId]) {
        //if so, add more letters (not ending with space) until unused id is found
        if (nextChar === ' ') {
          nextChar += core.dataEtc.data.charAt(++count);
        }
        newId += nextChar;
        nextChar = core.dataEtc.data.charAt(++count);
      //if up to 33(enough for time string), add underscore and number
        if (count > 32)  {
          newId += "_";
          count = 1;
          idCopy = newId;
          newId += "0";
          break;
        }
      }
      while (items[newId]) {
        newId = idCopy + count++;
        if (count>9999999999) {//~10 billion
          console.log("Too many identical ids in base.createItem . . . it's about to throw exception!");
        }
        if (count>9999999999999) {//~10 trillion
          throw "Could not find an unused item id in base.createItem";
          break; //don't know why this would be needed
        }
      }
      core.localId = newId;
      idCopy = null;
    }//end of if no core.localId
    
    //+getLocalId():String
    //failure should return undefined, but should never fail
    function getLocalId() {
      return core.localId;
    }
    
    if (!core.dataEtc.data) {
      core.dataEtc.data = (new Date()).toString();
    }
    core.dataEtc.whenCreated = new Date();
    
    //+getDataEtc():Object
    //failure should return undefined, but should never fail
    function getDataEtc() {
      return core.dataEtc;
    }
    //+setDataEtc(dataEtc:Object):Boolean
    function setDataEtc(givenDataEtc) {
      if (typeof givenDataEtc === 'object') {
        core.dataEtc = givenDataEtc;
        publish();
        return true;
      }
      else return false;
    }
    
    //+addToDataEtc(enumerables:Object):Boolean
    //will overwrite if key already exists in dataEtc!
    function setSomeDataEtc(enumerables) {
      if (typeof enumerables !== 'object') return false;
      for (var i in enumerables) {
        //overwrite any property of the same name
        core.dataEtc[i] = enumerables[i];
      }
      publish();
      return true;
    }
    
    //create private subscriberIds and publisherIds arrays if not already in core as arrays
    if (!core.subscriberIds || !core.subscriberIds.splice) {
      core.subscriberIds = [];
    }
    if (!core.publisherIds || !core.subscriberIds.splice) {
      core.publisherIds = [];
    }
    //check subscriberIds and publisherIds for validity and fix if necessary
    //but first start an array with undefined to remove index0, useful to return falsey/truthy number in checkPublisher and checkSubscriber
    var tempArray = [undefined];
    for (var i in core.subscriberIds) {
      var trueSubscriberId = verifyLocalId(core.subscriberIds[i]);
      if (trueSubscriberId) {
        //check that this is listed as publisher in subscriber
        confirmSubscriber(trueSubscriberId);
        tempArray.push(trueSubscriberId);
      }
    }
    core.subscriberIds = tempArray;
    tempArray = [undefined];
    for (var i in core.publisherIds) {
      var truePublisherId = verifyLocalId(core.publisherIds[i]);
      if (truePublisherId) {
        //check that this is subscribed to publisher
        confirmPublisher(truePublisherId);
        tempArray.push(truePublisherId);
      }
    }
    core.publisherIds = tempArray;
    tempArray = null;
    
    //called above during item creation and below for addSubscriber
    function confirmSubscriber(subscriberId) {
      var sub = subscriberId;
      //if subscriber does not exist, keep in a list of unchecked subscriberIds
      if (!items[sub]) {
        unverifiedSubscribers.push(sub);
      }
      //check if subscriber has this listed as publisher
        //if not, console.log warning and add publisher
      else if (!items[sub].checkPublisherId(core.localId)) {
        //don't give warning because this is an acceptable way of reciprocating
        //console.log(core.localId + " claimed " + sub + " as subscriber, but no reciprocation! Adding publisher...");
        items[sub].addPublisherId(core.localId);
      }
    }
    
    //called above during item creation and below for addPublisher
    function confirmPublisher(publisherId) {
      var pub = publisherId;
      //if publisher does not exist, keep in a list of unchecked publisherIds
      if (!items[pub]) {
        unverifiedPublishers.push(pub);
      }
      //check if publisher has this listed as subscriber
        //if not, subscribe
      else if (!items[pub].checkSubscriberId(core.localId)) {
        //don't give warning because this is an acceptable way of reciprocating
        //console.log(core.localId + " claimed " + pub + " as publisher, but no reciprocation! Subscribing...");
        items[pub].addSubscriberId(core.localId);
      }
      return pub;
    }
    
    // create indices for easy lookup
    var subscriberIdsIndex = {};
    var publisherIdsIndex = {};
    for (var i in core.subscriberIds) {
      subscriberIdsIndex[core.subscriberIds[i]] = i;
    }
    for (var i in core.publisherIds) {
      publisherIdsIndex[core.publisherIds[i]] = i;
    }
    
    //+checkSubscriberId(subscriberId:String):Booleanish Number
    function checkSubscriberId(localId) {
      if (!subscriberIdsIndex[localId]) return 0;
      //specialy internal call from addSub/Pub methods
      if (subscriberIdsIndex[localId] === 'temp') return 1;
      return parseInt((subscriberIdsIndex[localId]));
    }
    //+checkPublisherId(publisherId:String):Booleanish Number
    function checkPublisherId(localId) {
      if (!publisherIdsIndex[localId]) return 0;
      //specialy internal call from addSub/Pub methods
      if (publisherIdsIndex[localId] === 'temp') return 1;
      return parseInt((publisherIdsIndex[localId]));
    }
    
    //send this id to the updateFrom functions of subscribers
    function publish() {
      console.log("something updated *" + core.localId + "*");
      var sub;
      for (var i in core.subscriberIds) {
        sub = core.subscriberIds[i];
        //if subscriber does not exist, console.log warning but don't remove lest it show up later and wonder why
        if (!items[sub]) {
          //leave out the first, which is undefined, as it should be for checkSub/Pub methods above
          if (i != 0) {
            console.log(core.localId + " tried to publish to subscriber " + sub + ", which doesn't exist in items.");
          }
        }
        else {
          items[sub].updateFrom(core.localId);
        }
      }
     finalizeReciprocationCheck();
    }
    
    function finalizeReciprocationCheck() {
      var id;
      
      for (var i in unverifiedPublishers) {
        id = unverifiedPublishers[i]; 
        //if unchecked publisherIds still do not exist, console.log warning
        if (!items[id]) {
          console.log(core.localId + " is giving/receiving updateFroms but no sign of its publisher " + id);
        }
        //if unchecked publisherIds now exist but do not have this listed as subscriber, console.log warning and subscribe
        else if (!items[id].checkSubscriberId(core.localId)) {
          console.log(core.localId + " claimed " + id + " as publisher, but no reciprocation! Subscribing...");
          items[id].addSubscriberId(core.localId);
        }
      }
      //empty unchecked publisherIds list
      unverifiedPublishers = [];
      
      
      for (var i in unverifiedSubscribers) {
        id = unverifiedSubscribers[i]; 
        //if unchecked subscriberIds still do not exist, console.log warning
        if (!items[id]) {
          console.log(core.localId + " is giving/receiving updateFroms but no sign of its subscriber " + id);
        }
        //if unchecked subscriberIds now exist but do not have this listed as publisher, console.log warning and add publisher
        else if (!items[id].checkPublisherId(core.localId)) {
          console.log(core.localId + " claimed " + id + " as subscriber, but no reciprocation! Adding publisher...");
          items[id].addPublisherId(core.localId);
        }
      }
      //empty unchecked subscriberIds list
      unverifiedSubscribers = [];
    }//end finalizeReciprocationCheck
  
    //+addSubscriberId(subscriberId:String, priority:Number):Boolean
    //calling it 'priority' not 'position' because visible position may be different if some subscribers are not displayed
    //priority is the order in which they are updated.
    function addSubscriberId(subscriberId, priority) {
      var trueSubscriberId = verifyLocalId(subscriberId)
      if (!trueSubscriberId) return false;
      //add temporarily to stop infinite reciprocating
      if (!subscriberIdsIndex[trueSubscriberId]) {
        subscriberIdsIndex[trueSubscriberId] = 'temp';
      }
      //reciprocate
      confirmSubscriber(trueSubscriberId);
      //check if already subscriber
      if (subscriberIdsIndex[trueSubscriberId] && subscriberIdsIndex[trueSubscriberId] !== 'temp') {
        if (priority) {
          priority = parseInt(priority);
          if (isNaN(priority)) return false;
          if (priority == 0) {
            priority == 1;
          }
          if (subscriberIdsIndex[trueSubscriberId] == priority) {
            return true;
          }
          else {
            //it exists but is requesting new priority, so remove before re-adding
            var position = subscriberIdsIndex[trueSubscriberId];
            core.subscriberIds.splice(position, 1);
          }
        }
      }
      if (priority) {
        priority = parseInt(priority);
        if (isNaN(priority)) return false;
        //there is no zero; cf checkSubscriber
        if (priority == 0) {
          priority == 1;
        }
        core.subscriberIds.splice(priority, 0, trueSubscriberId);
        //redo index
        for (var i in core.subscriberIds) {
          subscriberIdsIndex[core.subscriberIds[i]] = i;
        }
        return true;
      }
      else {
        core.subscriberIds.push(trueSubscriberId);
        subscriberIdsIndex[trueSubscriberId] = core.subscriberIds.length-1;
          
        return true;
      }
      //no immediate updateFrom because may cause unwanted behavior
    }
  
    //+removeSubscriberId(subscriberId:String):Boolean
    function removeSubscriberId(subscriberId) {
      var trueSubscriberId = verifyLocalId(subscriberId);
      if (!trueSubscriberId) return false;
      //reciprocate
      if (items[trueSubscriberId]) {
        items[trueSubscriberId].removePublisher(core.localId);
      }
      //check if already removed
      if (!subscriberIdsIndex[trueSubscriberId]) return true;
      //remove from array
      var position = subscriberIdsIndex[trueSubscriberId];
      core.subscriberIds.splice(position, 1);
      //clear index
      subscriberIdsIndex = {};
      //redo index
      for (var i in core.subscriberIds) {
        subscriberIdsIndex[core.subscriberIds[i]] = i;
      }
      return true;
    }
    
    //+addPublisherId(publisherId:String, priority:Number):Boolean
    function addPublisherId(publisherId, priority) {
      var truePublisherId = verifyLocalId(publisherId);
      if (!truePublisherId) return false;
      //add temporarily to stop infinite reciprocating
      if (!publisherIdsIndex[truePublisherId]) {
        publisherIdsIndex[truePublisherId] = 'temp';
      }
      //reciprocate
      confirmPublisher(truePublisherId);
      //check if already publisher
      if (publisherIdsIndex[truePublisherId] && publisherIdsIndex[truePublisherId] !== 'temp') {
        if (priority) {
          priority = parseInt(priority);
          if (isNaN(priority)) return false;
          if (priority == 0) {
            priority == 1;
          }
          if (publisherIdsIndex[truePublisherId] == priority) {
            return true;
          }
          else {
            //it exists but is requesting new priority, so remove before readding
            var position = publisherIdsIndex[truePublisherId];
            core.publisherIds.splice(position, 1);
          }
        }
      }
      if (priority) {
        priority = parseInt(priority);
        if (isNaN(priority)) return false;
        //there is no zero; cf checkSubscriber
        if (priority == 0) {
          priority == 1;
        }
        core.publisherIds.splice(priority, 0, truePublisherId);
        //redo index
        for (var i in core.publisherIds) {
          publisherIdsIndex[core.publisherIds[i]] = i;
        }
        return true;
      }
      else {
        core.publisherIds.push(truePublisherId);
        publisherIdsIndex[truePublisherId] = core.publisherIds.length-1;
        return true;
      }
      //no immediate updateFrom because may cause unwanted behavior
    
    }
//+removePublisherId(publisherId:String):Boolean
    function removePublisherId(publisherId) {
      var truePublisherId = verifyLocalId(publisherId);
      if (!truePublisherId) return false;
      //reciprocate
      if (items[truePublisherId]) {
        items[truePublisherId].removeSubscriber(core.localId);
      }
      //check if already removed
      if (!publisherIdsIndex[truePublisherId]) return true;
      //remove from array
      var position = publisherIdsIndex[truePublisherId];
      core.publisherIds.splice(position, 1);
      //clear index
      publisherIdsIndex = {};
      //redo index
      for (var i in core.publisherIds) {
        publisherIdsIndex[core.publisherIds[i]] = i;
      }
      return true;
    }
    //inner updateFrom function should be in core
    //check if it's already there
      //if so, ensure typeof === function or some such check, otherwise throw exception
    if (core.updateFrom) {
    
      if (typeof core.updateFrom !== 'function') {
        //try parse
        try {
          core.updateFrom = parse(core.updateFrom);
        } catch (e) {
          core.updateFrom = function() {};
        }
        if (typeof core.updateFrom !== 'function') {
          core.updateFrom = function() {};
        }
      }
      //if core.updateFrom is there and a function, keep it
    }
    else {
      core.updateFrom = function() {};
    }
    
    //+getSubscriberIds():Array
    function getSubscriberIds() {
      return core.subscriberIds;
    }
    
    //+getPublisherIds():Array
    function getPublisherIds() {
      return core.publisherIds;
    }
    
    //+updateFrom(publisherId:Item):Boolean (this is where others update this; for this updating others, see publish() (called by setDataEtc).)
    function updateFrom(publisherId) {
      finalizeReciprocationCheck();
      var pub = verifyLocalId(publisherId);
      if (!pub) return;
      //confirm publisher is listed
      if (!publisherIdsIndex[pub]) {
        console.log(core.localId + " got an update from an unknown publisher " + pub);
        addPublisher(pub);
      }
      //run supplied core updateFrom function
      console.log("*" + pub + "* updated *" + core.localId + "*");
      core.updateFrom.call(items[core.localId], pub);
    }
  
    //+getUpdateFromFunction():Function
    //failure would return undefined, but should never fail because default is empty function
    function getUpdateFromFunction() {
      return core.updateFrom;
    }
    
    //+setUpdateFromFunction(updateFrom:Function):Boolean
    function setUpdateFromFunction(updateFrom) {
      //ensure typeof === function
      if (typeof core.updateFrom !== 'function') {
        //try parse
        try {
          core.updateFrom = parse(core.updateFrom);
        } catch (e) {
          return false;
        }
        if (typeof core.updateFrom !== 'function') {
          return false;
        }
      }
      core.updateFrom = updateFrom;
      return true;
    }
      
    var newItem = { 
      getLocalId: getLocalId,
      getDataEtc: getDataEtc,
      setDataEtc: setDataEtc,
      setSomeDataEtc: setSomeDataEtc,
      checkSubscriberId: checkSubscriberId,
      checkPublisherId: checkPublisherId,
      addSubscriberId: addSubscriberId,
      removeSubscriberId: removeSubscriberId,
      addPublisherId: addPublisherId,
      removePublisherId: removePublisherId,
      getSubscriberIds: getSubscriberIds,
      getPublisherIds: getPublisherIds,
      updateFrom: updateFrom,
      getUpdateFromFunction: getUpdateFromFunction,
      setUpdateFromFunction: setUpdateFromFunction 
    }
    items[core.localId] = newItem;
    return newItem;
  }//end of createItem
  
  //+deleteItem(localId:String):Boolean
  function deleteItem(localId) {
    var id = verifyLocalId(localId);
    if (!id) return false;
    var doomed = items[id];
    //remove this id from related items
    for (var i in doomed.subscriberIds) {
      var subId = dooomed.subscriberIds[i];
      items[subId].removePublisherId(id);
    }
    for (var i in doomed.publisherIds) {
      var pubId = dooomed.publisherIds[i];
      items[subId].removeSubscriberId(id);
    }
    delete items[id];
    return true;
  }
  //+getItem(localId):Item (
  //if not there, should return undefined
  function getItem(localId) {
    var id = localId.toString();
    return items[id];
  }
  
  //+getNumItems():Number
  function getNumItems() {
    var count = 0;
    for (var i in items) {
      count++;
    }
    return count;
  }
  
  //+getItems():Array
  function getItems() {
    return items;
  }
  
  //+deleteItems():Boolean
  function deleteItems() {
    items = {};
    return true;
  }

  return {
    createItem: createItem,
    deleteItem: deleteItem,
    getItem: getItem,
    getNumItems: getNumItems,
    getItems: getItems,
    deleteItems: deleteItems
  }
})();
