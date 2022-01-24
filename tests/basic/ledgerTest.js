let svd = require("../../src/index.js");

svd.register('JSMicroLedger', 'OrderBPS', {
    ctor: function(creatorDID){
        this.state = 'created';
        this.customerDID = creatorDID
    },
    order: function(forDID){
        this.callSignedBy(this.customerDID);
        this. state = 'ordered';  this.shopDID = forDID;
    },
    fulfill: function(){
        this.callSignedBy(this.shopDID);
        this.state = 'fulfilled';
    }
});

let myDID   ="did:test:myDID";
let shopDID ="did:test:shopDID";

let p1 = svd.create('OrderBPS', myDID);
p1.order(shopDID);
p1.save();
console.log(p1.svdID(), ":", p1.dump()); // prints the processID

let p2 = svd.load('OrderBPS',  myDID, p1.svdID);
p2.fulfill();
p2.save();

console.log(p2.svdID(), ":", p2.dump()); // prints the processID