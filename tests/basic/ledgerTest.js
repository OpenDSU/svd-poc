let svd = require("../../src/index.js");

svd.register('JSMicroLedger', 'OrderBPS', {
    ctor: function(creatorDID){
        this.state = 'created';
        this.customerDID = creatorDID
    },
    order: function(forDID){
        this.callSignedBy(this.customerDID);
        this.state = 'ordered';
        this.shopDID = forDID;
    },
    fulfill: function(){
        this.callSignedBy(this.shopDID);
        this.state = 'fulfilled';
    }
});

svd.setDIDResolver(function(did){
    return {
        sign: function(hashOfdataToBeSigned){
            return JSON.stringify({"signedBy":did, data:hashOfdataToBeSigned})
        },
        verify: function(hashOfdataToBeSigned, did, signature){
            let s = JSON.parse(signature)
            return s.signedBy == did && s.data == hashOfdataToBeSigned;
        },
        hash: function(data){
            return "DATAHASH";
        }
    }
})


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