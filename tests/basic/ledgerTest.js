
let mockEnvironment = require("../mocks/defaultMocks");

let currentDID   = "did:test:myDID";
let shopDID      = "did:test:shopDID";
let processID    = "process_id#12345";


let ctxt1 = mockEnvironment.createTestContext(currentDID);

let ctxt2 = mockEnvironment.createTestContext(shopDID);


/********************************* Actual code ***********************************/
let processDescription = {
    ctor: async function(creatorDID, vsdId){
        this.state = 'created';
        this.customerDID = creatorDID
    },
    order: async function(forDID){
        await this.validateCaller(this.customerDID);
        this.state = 'ordered';
        this.shopDID = forDID;
    },
    fulfill: async function(){
        await this.validateCaller(this.shopDID);
        this.state = 'fulfilled';
    }
};

ctxt1.registerType('OrderBPS',  processDescription, 'JSMicroLedger' , 1 );
ctxt2.registerType('OrderBPS',  processDescription, 'JSMicroLedger' );

async function runTest(){
    let p1 = await ctxt1.create(processID, 'OrderBPS');
    let SVDID = p1.getSVDID();
    await p1.order(shopDID);
    p1.save();
    console.log("First DUMP:", p1.getSVDID(), "  has state ", p1.dump());

    let p2 = await ctxt2.load(SVDID);
    await p2.fulfill();
    p2.save();

    console.log("Second DUMP:", p2.getSVDID(), " has state", p2.dump());
}

runTest()

