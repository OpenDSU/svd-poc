let svd = require("../../src/index.js");

/********************************* Example of environment preparations ***********************************/

let __memoryPersistence = {};

let mockPersistence = {
    loadCommands:function(svdID, callback){
        let blocks = __memoryPersistence[svdID];
        if(!blocks){
            blocks = [];
            __memoryPersistence[svdID] = blocks;
        }

        let cmnds = [];

        blocks.forEach( b => {
            let parsedBlock = JSON.parse(b);
            parsedBlock.forEach( c => {
                cmnds.push(c);
            })
        })

        callback(undefined, cmnds);
    },
    addBlock:function(svdID, block, callback){
        if(!__memoryPersistence[svdID]){
            __memoryPersistence[svdID] = [];
        }
        __memoryPersistence[svdID].push(JSON.stringify(block));

        if(callback) {
            callback(undefined, block);
        }
    }
}


/********************************* Actual code ***********************************/

svd.register('JSMicroLedger', 'OrderBPS', {
    ctor: function(creatorDID, vsdId){
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
}, mockPersistence);



let currentDID   = "did:test:myDID";
let shopDID      = "did:test:shopDID";
let processID    = "process_id#12345";

let p1 = svd.create('OrderBPS', currentDID, processID);
p1.order(shopDID);
p1.save();
console.log("First DUMP:", p1.getID(), "  has state ", p1.dump(), __memoryPersistence);

let p2 = svd.load('OrderBPS',  shopDID, processID);
p2.fulfill();
p2.save();

console.log("Second DUMP:", p2.getID(), " has state", p2.dump(), __memoryPersistence);