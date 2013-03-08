describe("itemManager", function () {
  //see "the whenCreated value does not change" function
  //console.log('now:                 ' + new Date());
  var item = itemManager.createItem();
  var dataEtc = item.getDataEtc();
  //console.log('dataEtc.whenCreated: ' + dataEtc.whenCreated)
  
  describe("when the program begins", function () {
    it("exists", function() {
      assert(itemManager);
    });
  });
  describe("when the program begins", function () {
    it("has createItem", function() {
      assert(itemManager.createItem);
    });
  });
  describe("when the program begins", function () {
    it("has deleteItem", function() {
      assert(itemManager.deleteItem);
    });
  });
  describe("when the program begins", function () {
    it("has getItem", function() {
      assert(itemManager.getItem);
    });
  });
  describe("when the program begins", function () {
    it("has getNumItems", function() {
      assert(itemManager.getItem);
    });
  });
  describe("when the program begins", function () {
    it("has getItems", function() {
      assert(itemManager.getItem);
    });
  });
  describe("when the program begins", function () {
    it("does not have private items publically available", function() {
      assert(!itemManager.items);
    });
  });
  describe("when createItem is called", function () {
    it("returns an object", function() {
      var result = itemManager.createItem();
      assert(typeof result === 'object');
    });
  });
  describe("when createItem is called", function () {
    it("returned object has getLocalId", function() {
      var result = itemManager.createItem();
      assert(result.getLocalId);
    });
  });
  describe("when createItem is called", function () {
    it("returned object has getDataEtc", function() {
      var result = itemManager.createItem();
      assert(result.getDataEtc);
    });
  });
  describe("when createItem is called", function () {
    it("returned object has setDataEtc", function() {
      var result = itemManager.createItem();
      assert(result.setDataEtc);
    });
  });
  describe("when createItem is called", function () {
    it("returned object has setSomeDataEtc", function() {
      var result = itemManager.createItem();
      assert(result.setDataEtc);
    });
  });
  describe("when createItem is called", function () {
    it("returned object has checkSubscriberId", function() {
      var result = itemManager.createItem();
      assert(result.checkSubscriberId);
    });
  });
  describe("when createItem is called", function () {
    it("returned object has checkPublisherId", function() {
      var result = itemManager.createItem();
      assert(result.checkPublisherId);
    });
  });
  describe("when createItem is called", function () {
    it("returned object has addSubscriberId", function() {
      var result = itemManager.createItem();
      assert(result.addSubscriberId);
    });
  });
  describe("when createItem is called", function () {
    it("returned object has removeSubscriberId", function() {
      var result = itemManager.createItem();
      assert(result.removeSubscriberId);
    });
  });
  describe("when createItem is called", function () {
    it("returned object has addPublisherId", function() {
      var result = itemManager.createItem();
      assert(result.addPublisherId);
    });
  });
  describe("when createItem is called", function () {
    it("returned object has removePublisherId", function() {
      var result = itemManager.createItem();
      assert(result.removePublisherId);
    });
  });
  describe("when createItem is called", function () {
    it("returned object has update", function() {
      var result = itemManager.createItem();
      assert(result.update);
    });
  });
  describe("when createItem is called", function () {
    it("returned object has getUpdateFunction", function() {
      var result = itemManager.createItem();
      assert(result.getUpdateFunction);
    });
  });
  describe("when createItem is called", function () {
    it("returned object has setUpdateFunction", function() {
      var result = itemManager.createItem();
      assert(result.setUpdateFunction);
    });
  });
  describe("when createItem is passed no core (and then item.getLocalId() is called)", function () {
    it("returned item has localId", function() {
      var item = itemManager.createItem();
      var id = item.getLocalId();
      //console.log(">" + id + "<");
      assert(id);
    });
  });
  describe("when createItem is passed no core", function () {
    it("returned item has localId that is date with optional extra distinguishing chars", function() {
      var item = itemManager.createItem();
      var id = item.getLocalId();
      var date = (new Date()).toDateString();
      //console.log(">" + id + "<");
      assert(id.substr(0,15) === date);
    });
  });
  describe("when createItem is passed an empty string", function () {
    it("returned item has localId that is date with optional extra distinguishing chars", function() {
      var item = itemManager.createItem();
      var id = item.getLocalId();
      var date = (new Date()).toDateString();
      //console.log(">" + id + "<");
      assert(id.substr(0,15) === date);
    });
  });
  describe("when createItem is passed a core with only an empty dataEtc object", function () {
    it("returned item has localId that is date with optional extra distinguishing chars", function() {
      var item = itemManager.createItem({dataEtc: {}});
      var id = item.getLocalId();
      var date = (new Date()).toDateString();
      //console.log(">" + id + "<");
      assert(id.substr(0,15) === date);
    });
  });
  describe("when createItem is passed a core with only an empty dataEtc.data string", function () {
    it("returned item has localId that is date with optional extra distinguishing chars", function() {
      var item = itemManager.createItem({dataEtc: {data: ''}});
      var id = item.getLocalId();
      var date = (new Date()).toDateString();
      //console.log(">" + id + "<");
      assert(id.substr(0,15) === date);
    });
  });
  describe("when createItem is passed a core with an unused dataEtc.data string shorter than 15 chars", function () {
    it("returned item has localId that is a copy of that dataEtc.data string", function() {
      var item = itemManager.createItem({dataEtc: {data: 'Short string'}});
      var id = item.getLocalId();
      //console.log(">" + id + "<");
      assert (id === 'Short string');
    });
  });
  describe("when createItem is passed a core with a used dataEtc.data string shorter than 15 chars", function () {
    it("returned item has localId that is a copy of that dataEtc.data string plus optional distinguishing chars", function() {
      var item = itemManager.createItem({dataEtc: {data: 'Short string'}});
      var id = item.getLocalId();
      //console.log(">" + id + "<");
      assert (id.substr(0, id.length-2) === 'Short string');
    });
  });
  describe("when createItem is passed a core with an unused localId string of length < 64", function () {
    it("returned item retains that localId string", function() {
      var item = itemManager.createItem({localId: 'Reasonably short string'});
      var id = item.getLocalId();
      //console.log(">" + id + "<");
      assert (id === 'Reasonably short string');
    });
  });
  describe("when createItem is passed a core with a used localId string of length < 64", function () {
    it("returned item retains that localId string plus optional distinguishing chars", function() {
      var item = itemManager.createItem({localId: 'Reasonably short string'});
      var id = item.getLocalId();
      //console.log(">" + id + "<");
      assert (id.substr(0, id.length-2) === 'Reasonably short string');
    });
  });
  describe("when createItem is passed a core with an unused localId string of length > 64", function () {
    it("returned item retains the first 64 chars of that localId", function() {
      var item = itemManager.createItem({localId: '0123456789012345678901234567890123456789012345678901234567890123456789'});
      var id = item.getLocalId();
      //console.log(">" + id + "<");
      assert (id === '0123456789012345678901234567890123456789012345678901234567890123');
    });
  });
  describe("when createItem is passed a core with a used localId string of length > 64", function () {
    it("returned item will have a localId of length 64", function() {
      var item = itemManager.createItem({localId: '0123456789012345678901234567890123456789012345678901234567890123456789'});
      var id = item.getLocalId();
      //console.log(">" + id + "<");
      assert (id.length === 64);
    });
  });
  describe("when createItem is passed a core with a dataEtc object (and then item.getDataEtc() is called)", function () {
    it("returned item has access to the values that were in that dataEtc object", function() {
      var item = itemManager.createItem({dataEtc: {data: 'Random string'}});
      var dataEtc = item.getDataEtc();
      //console.log('dataEtc.data: ' + dataEtc.data)
      assert (dataEtc.data === 'Random string');
    });
  });
  describe("when createItem is passed a core", function () {
    it("createItem does not modify the original core, only a private copy", function() {
      var core = {dataEtc: {data: 'First string'}};
      var item = itemManager.createItem(core);
      //console.log('core.localId: ' + core.localId);
      assert(core.localId === undefined);
    });
  });
  describe("when createItem is passed no core(and then item.getDataEtc() is called)", function () {
    it("returned item has a dataEtc.data string that is a date", function() {
      var item = itemManager.createItem();
      var dataEtc = item.getDataEtc();
      //console.log('dataEtc.data: ' + dataEtc.data)
      var date = (new Date()).toDateString();
      assert(dataEtc.data.substr(0,15) === date);
    });
  });
  describe("when createItem is passed a core without a dataEtc object (and then item.getDataEtc() is called)", function () {
    it("returned item has a dataEtc.data string that is a date", function() {
      var item = itemManager.createItem({localId: 'peace'});
      var dataEtc = item.getDataEtc();
      //console.log('dataEtc.data: ' + dataEtc.data)
      var date = (new Date()).toDateString();
      assert(dataEtc.data.substr(0,15) === date);
    });
  });
  describe("when createItem is passed an empty core (and then item.getDataEtc() is called)", function () {
    it("returned item has a dataEtc.data string that is a date", function() {
      var item = itemManager.createItem({});
      var dataEtc = item.getDataEtc();
      //console.log('dataEtc.data: ' + dataEtc.data)
      var date = (new Date()).toDateString();
      assert(dataEtc.data.substr(0,15) === date);
    });
  });
  describe("when createItem is passed a string (and then item.getDataEtc() is called)", function () {
    it("returned item has a dataEtc.data string that is the same as the original argument", function() {
      var item = itemManager.createItem("peace");
      var dataEtc = item.getDataEtc();
      //console.log('dataEtc.data: ' + dataEtc.data)
      assert(dataEtc.data == 'peace');
    });
  });
  describe("when item.getDataEtc() is called and whenCreated is checked", function () {
    it("returned object has a whenCreated key with a value that is instanceof Date", function() {
      var item = itemManager.createItem("peace");
      var dataEtc = item.getDataEtc();
      //console.log('dataEtc.whenCreated: ' + dataEtc.whenCreated)
      assert(dataEtc.whenCreated instanceof Date);
    });
  });
  describe("when item.getDataEtc() is called twice and whenCreated is checked both times", function () {
    it("the whenCreated value does not change", function() {
      //see outer function top
      //console.log('now:                  ' + new Date());
      var dataEtc2 = item.getDataEtc();
      //console.log('dataEtc2.whenCreated: ' + dataEtc2.whenCreated)
      assert(dataEtc.whenCreated === dataEtc2.whenCreated);
    });
  });
  describe("when item.setDataEtc() is passed an object", function () {
    it("true is returned and item.getDataEtc() shows the changes", function() {
      var item = itemManager.createItem({dataEtc: {data: 'First string'}});
      var data1 = item.getDataEtc().data;
      var success = item.setDataEtc({data: 'Second string'});
      var data2 = item.getDataEtc().data;
      //console.log('data1: ' + data1 + ', success: ' + success + ', data2: ' + data2);
      assert(data1 !== data2);
      assert(success === true);
      assert("Second string" === data2);
    });
  });
  describe("when item.setDataEtc() is passed a string", function () {
    it("false is returned and item.getDataEtc() does not show changes", function() {
      var item = itemManager.createItem({dataEtc: {data: 'First string'}});
      var data1 = item.getDataEtc().data;
      var success = item.setDataEtc('Second string');
      var data2 = item.getDataEtc().data;
      //console.log('data1: ' + data1 + ', success: ' + success + ', data2: ' + data2);
      assert(data1 === data2);
      assert(success === false);
      assert("First string" === data2);
    });
  });
  describe("when itemManager.createItem is passed a core with valid subscriberIds", function () {
    it("item.checkSubscriberId returns something truthy", function() {
      var item = itemManager.createItem({localId: 'faith', subscriberIds: ['hope', 'love']});
      //console.log(item.checkSubscriberId('hope') + ' ' + item.checkSubscriberId('love'));
      assert(item.checkSubscriberId('hope'));
      assert(item.checkSubscriberId('love'));
    });
  });
  describe("when item.checkSubscriberId is called and that subscriberId is not there", function () {
    it("ensures item returns something falsy", function() {
      var item = itemManager.createItem({localId: 'faith', subscriberIds: ['hope', 'love']});
      //console.log(item.checkSubscriberId('hope') + ' ' + item.checkSubscriberId('love'));
      assert(!item.checkSubscriberId('faith'));
    });
  });
  describe("when itemManager.createItem is passed a core with valid subscriberIds", function () {
    it("item.checkSubscriberId returns their position starting with 1", function() {
      var item = itemManager.createItem({localId: 'faith', subscriberIds: ['hope', 'love']});
      //console.log(item.checkSubscriberId('hope') + ' ' + item.checkSubscriberId('love'));
      assert(item.checkSubscriberId('hope') === 1);
      assert(item.checkSubscriberId('love') === 2);
    });
  });
  describe("when item.removeSubscriberId is called with a valid id", function () {
    it("ensures item returns true and item.checkSubscriberId shows id removed and others reordered", function() {
      var item = itemManager.createItem({localId: 'faith', subscriberIds: ['hope', 'love']});
      var result = item.removeSubscriberId('hope');
      //console.log(item.checkSubscriberId('hope') + ' ' + item.checkSubscriberId('love'));
      assert(result === true);
      assert(item.checkSubscriberId('love') === 1);
      assert(item.checkSubscriberId('hope') === 0);
      assert(!item.checkSubscriberId('hope'));
    });
  });
  describe("when item.removeSubscriberId is called with an invalid id", function () {
    it("ensures item returns false", function() {
      var item = itemManager.createItem({localId: 'faith', publisherIds: ['hope', 'love']});
      var result = item.removeSubscriberId([]);
      //console.log(item.checkPublisherId('hope') + ' ' + item.checkPublisherId('love'));
      assert(result === false);
    });
  });
  describe("when item.addSubscriberId is called with a valid id and priority:1", function () {
    it("ensures item returns true, inserts id, others are renumbered", function() {
      var item = itemManager.createItem({localId: 'These 3 remain:', subscriberIds: ['hope', 'love']});
      var result = item.addSubscriberId('faith', 1);
      //console.log('should be 1 2: ' + item.checkSubscriberId('faith') + ' ' + item.checkSubscriberId('hope'));
      assert(result === true);
      assert(item.checkSubscriberId('faith') === 1);
      assert(item.checkSubscriberId('hope') === 2);
    });
  });
  describe("when item.addSubscriberId is called with a valid id and no priority", function () {
    it("ensures item returns true, inserts id at end", function() {
      var item = itemManager.createItem({localId: 'These 3 remain:', subscriberIds: ['hope', 'love']});
      var result = item.addSubscriberId('faith');
      item.addSubscriberId('These three remain, but the greatest of these is love');
      //console.log('should be 1 2 3: ' + item.checkSubscriberId('hope') + ' ' + item.checkSubscriberId('love') + ' ' + item.checkSubscriberId('faith'));
      assert(result === true);
      assert(item.checkSubscriberId('hope') === 1);
      assert(item.checkSubscriberId('love') === 2);
      assert(item.checkSubscriberId('faith') === 3);
      assert(item.checkSubscriberId('These three remain, but the greatest of these is love') === 4);
    });
  });
  describe("when item.addSubscriberId is called with an invalid id", function () {
    it("ensures item returns false", function() {
      var item = itemManager.createItem({localId: 'faith', publisherIds: ['hope', 'love']});
      var result = item.addSubscriberId([]);
      //console.log(item.checkPublisherId('hope') + ' ' + item.checkPublisherId('love'));
      assert(result === false);
    });
  });
  describe("when itemManager.createItem is passed a core with valid publisherIds", function () {
    it("item.checkPublisherId returns something truthy", function() {
      var item = itemManager.createItem({localId: 'faith', publisherIds: ['hope', 'love']});
      //console.log(item.checkPublisherId('hope') + ' ' + item.checkPublisherId('love'));
      assert(item.checkPublisherId('hope'));
      assert(item.checkPublisherId('love'));
    });
  });
  describe("when item.checkPublisherId is called and that publisherId is not there", function () {
    it("item.checkPublisherId returns something falsey", function() {
      var item = itemManager.createItem({localId: 'faith', publisherIds: ['hope', 'love']});
      //console.log(item.checkPublisherId('hope') + ' ' + item.checkPublisherId('love'));
      assert(!item.checkPublisherId('faith'));
    });
  });
  describe("when itemManager.createItem is passed a core with valid publisherIds", function () {
    it("item.checkPublisherId returns their position starting with 1", function() {
      var item = itemManager.createItem({localId: 'faith', publisherIds: ['hope', 'love']});
      //console.log(item.checkPublisherId('hope') + ' ' + item.checkPublisherId('love'));
      assert(item.checkPublisherId('hope') === 1);
      assert(item.checkPublisherId('love') === 2);
    });
  });
  describe("when item.removePublisherId is called with a valid id", function () {
    it("ensures item returns true and item.checkPublisherId shows id removed and others reordered", function() {
      var item = itemManager.createItem({localId: 'faith', publisherIds: ['hope', 'love']});
      var result = item.removePublisherId('hope');
      //console.log(item.checkPublisherId('hope') + ' ' + item.checkPublisherId('love'));
      assert(result === true);
      assert(item.checkPublisherId('love') === 1);
      assert(item.checkPublisherId('hope') === 0);
      assert(!item.checkPublisherId('hope'));
    });
  });
  describe("when item.removePublisherId is called with an invalid id", function () {
    it("ensures item returns false", function() {
      var item = itemManager.createItem({localId: 'faith', publisherIds: ['hope', 'love']});
      var result = item.removePublisherId([]);
      //console.log(item.checkPublisherId('hope') + ' ' + item.checkPublisherId('love'));
      assert(result === false);
    });
  });
  describe("when item.addPublisherId is called with a valid id and priority:1", function () {
    it("ensures item returns true, inserts id, others are renumbered", function() {
      var item = itemManager.createItem({localId: 'These 3 remain:', publisherIds: ['hope', 'love']});
      var result = item.addPublisherId('faith', 1);
      //console.log('should be 1 2: ' + item.checkPublisherId('faith') + ' ' + item.checkPublisherId('hope'));
      assert(result === true);
      assert(item.checkPublisherId('faith') === 1);
      assert(item.checkPublisherId('hope') === 2);
    });
  });
  describe("when item.addPublisherId is called with a valid id and no priority", function () {
    it("ensures item returns true, inserts id at end", function() {
      var item = itemManager.createItem({localId: 'These 3 remain:', publisherIds: ['hope', 'love']});
      var result = item.addPublisherId('faith');
      item.addPublisherId('These three remain, but the greatest of these is love');
      //console.log('should be 1 2 3: ' + item.checkPublisherId('hope') + ' ' + item.checkPublisherId('love') + ' ' + item.checkPublisherId('faith'));
      assert(result === true);
      assert(item.checkPublisherId('hope') === 1);
      assert(item.checkPublisherId('love') === 2);
      assert(item.checkPublisherId('faith') === 3);
      assert(item.checkPublisherId('These three remain, but the greatest of these is love') === 4);
    });
  });
  describe("when item.addPublisherId is called with an invalid id", function () {
    it("ensures item returns false", function() {
      var item = itemManager.createItem({localId: 'faith', publisherIds: ['hope', 'love']});
      var result = item.addPublisherId([]);
      assert(result === false);
    });
  });
  describe("when item.getUpdateFunction is called", function () {
    it("ensures item returns a function", function() {
      var item = itemManager.createItem();
      var result = item.getUpdateFunction();
      assert(typeof result === 'function');
    });
  });
  describe("when createItem is passed an update function and item.getUpdateFunction is called", function () {
    it("ensures item returns the original function", function() {
      var func = function() {console.log('hellloooo!');};
      var item = itemManager.createItem({update: func});
      var result = item.getUpdateFunction();
      //result();
      //console.log(result);
      assert(result === func);
    });
  });
  describe("when createItem is passed an update function and item.setUpdateFunction is called", function () {
    it("ensures item returns true and changes the function", function() {
      var func = function() {console.log('hellloooo!');};
      //func();
      var item = itemManager.createItem({update: func});
      var func2 = function() {console.log("I'm changed");};
      //func2();
      var success = item.setUpdateFunction(func2);
      var returnedFunc = item.getUpdateFunction();
      //returnedFunc();
      //console.log(success);
      assert(success === true);
      assert(returnedFunc === func2);
    });
  });
  describe("when createItem is passed an update function and item.setDataEtc is called", function () {
    it("ensures item sends update to subscribers who can then manipulate themselves and publisher", function() {
      var func = function() {console.log('Publisher update called because subscriber changed?');};
      var func2 = function(publisherId) {
        //console.log(this.getLocalId() + " got the message that publisher " + publisherId + " changed!");
        var publisher = itemManager.getItem(publisherId);
        this.setDataEtc({attribute1: publisher.getDataEtc().attribute1, attribute2: 'This was additional message from sub to itself'});
        var dataForPub = publisher.getDataEtc();
        //don't start infinite loop!
        if (dataForPub.attribute3) return;
        //console.log("   and " + this.getLocalId() + " changed " + publisherId + " again!");
        dataForPub.attribute3 = 'This is from your subscriber ' + this.getLocalId();
        publisher.setDataEtc(dataForPub);
      }
      var pub = itemManager.createItem({localId: "Publisher", subscriberIds: ["Sub1", "Sub2"], update: func});
      var sub1 = itemManager.createItem({localId: "Sub1", publisherIds: ["Publisher"], subscriberIds: ["Sub2"], update: func2});
      var sub2 = itemManager.createItem({localId: "Sub2", publisherIds: ["Publisher", "Sub1"], update: func2});
      //console.log(pub.checkSubscriberId("Sub1"));
      //console.log(sub1.checkPublisherId("Publisher"));
      var success = pub.setDataEtc({attribute1: "This was publisher's change to self, possibly copied by subscriber(s)"});
      //console.log('Pub:  1:' + pub.getDataEtc().attribute1 + "\n      2: " + pub.getDataEtc().attribute2 + "\n      3: " + pub.getDataEtc().attribute3);
      //console.log('Sub1: 1:' + sub1.getDataEtc().attribute1 + "\n      2: " + sub1.getDataEtc().attribute2 + "\n      3: " + sub1.getDataEtc().attribute3);
      //console.log('Sub2: 1:' + sub2.getDataEtc().attribute1 + "\n      2: " + sub2.getDataEtc().attribute2 + "\n      3: " + sub2.getDataEtc().attribute3);
      
      //console.log(success);
      assert(success === true);
      assert(pub.getDataEtc().attribute3 === "This is from your subscriber Sub1");
      assert(sub1.getDataEtc().attribute1 === "This was publisher's change to self, possibly copied by subscriber(s)");
      assert(sub1.getDataEtc().attribute3 === "This is from your subscriber Sub2");
    });
  });
  describe("when getNumItems is called", function () {
    it("returns number", function() {
      var num = itemManager.getNumItems();
      //console.log(num + " " + typeof num);
      assert(typeof num === 'number');
    });
  });
  describe("when getItems is called", function () {
    it("returns items", function() {
      var returned = itemManager.getItems();
      for (var i in returned) {
        //console.log("LocalId: " + i + ", data: " + returned[i].getDataEtc().data);
        assert(returned[i].getDataEtc);
      }
    });
  });
  describe("when deleteItem is called on an existing localId", function () {
    it("returns true, and getNumItems and getItem show it is deleted", function() {
      var successBefore = itemManager.getItem('faith');
      var numBefore = itemManager.getNumItems();
      var delSuccess = itemManager.deleteItem('faith');
      var successAfter = itemManager.getItem('faith');
      var numAfter = itemManager.getNumItems();
      //console.log("successBefore: " + successBefore)
      //console.log("numBefore: " + numBefore)
      //console.log("delSuccess: " + delSuccess)
      //console.log("successAfter: " + successAfter)
      //console.log("numAfter: " + numAfter)
      assert(delSuccess === true);
      assert(successBefore != successAfter);
      assert(numBefore === numAfter + 1);
    });
  });
  describe("when deleteItems is called", function () {
    it("returns true, and all items are deleted", function() {
      var success = itemManager.deleteItems();
      assert(success === true);
      assert(itemManager.getNumItems() === 0);
    });
  });
  describe("when getSubscriberIds is called", function () {
    it("returns an array", function() {
      var item = itemManager.createItem('pub');
      var returned = item.getSubscriberIds();
      assert(returned.splice);
    });
  });
  describe("when getPublisherIds is called", function () {
    it("returns an array", function() {
      var item = itemManager.createItem('sub');
      var returned = item.getPublisherIds();
      assert(returned.splice);
    });
  });
  describe("when setSomeDataEtc is called with a valid object", function () {
    it("ensures the dataEtc is set but non-conflicting properties remain and the item is published", function() {
      var item1 = itemManager.createItem("First");
      var item2 = itemManager.createItem({
        dataEtc: {attributeNotToBeTouched: "Second"},
        publisherIds: ["First"],
        update: function(publisherId) {
          var pub = itemManager.getItem(publisherId);
          this.setSomeDataEtc(pub.getDataEtc());
        }
      });
      item1.setSomeDataEtc({attributeToBeCopied: "First the sequel"});
      var shouldBeFirst = item2.getDataEtc().data;
      var shouldBeSecond = item2.getDataEtc().attributeNotToBeTouched;
      var shouldBeFirstTheSequel = item2.getDataEtc().attributeToBeCopied;
      //console.log("shouldBeFirst " + shouldBeFirst + ", shouldBeSecond " + shouldBeSecond + ", shouldBeFirstTheSequel " + shouldBeFirstTheSequel);
      assert(shouldBeFirst === "First");
      assert(shouldBeSecond === "Second");
      assert(shouldBeFirstTheSequel === "First the sequel");
    });
  });
});
describe("simplifier", function () {
});