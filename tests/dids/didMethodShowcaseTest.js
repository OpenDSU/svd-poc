let svd = require("../../src");

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

svd.setDIDResolver(function(did){
    function hashFunction(obj){
        if(obj["#"])  return "#"+obj["#"];
        else return obj.toString();
    }

    return {
        sign: async function(o, timeStamp){
            let hashOfDataToBeSigned = hashFunction(o);
            let s = JSON.stringify({"signedBy":did, hash:hashOfDataToBeSigned});
            return s;
        },
        verify: async function(o,signature){
            console.log("\t\t\t" + did + " verifying " + o["#"]  + "  and commandType " + o.cmdType);
            let hashOfDataToBeSigned = hashFunction(o);
            let s = JSON.parse(signature);
            if(s.signedBy !== did || s.hash !== hashOfDataToBeSigned){
                return false;
            }
            return true;
        },
        hash: hashFunction
    }
})


/********************************* Actual code ***********************************/
const DID_CREATED       = 'created';
const DID_READY         = 'ready';
const DID_REVOKED       = 'revoked';


svd.register('JSMicroLedger', 'DIDMethodDemo', {
    ctor: async function(ownerDID, vsdID){
        this.controlDID = ownerDID
        this.state = DID_CREATED;
        this.recoveryDID = null;
    },
    setRecoveryDID: async function(newRecoveryDID){
        if(this.recoveryDID){
            await this.callSignedBy(this.recoveryDID);
        } else {
            await this.callSignedBy(this.controlDID);
        }
        this.recoveryDID = newRecoveryDID;
        this.state = DID_READY;
    },
    revoke: async function(){
        await this.callSignedBy(this.recoveryDID);
        this.recoveryDID = null;
        this.controlDID = null;
        this.state = DID_REVOKED;
    },
    rotate: async function(newKeyDID){
        await this.callSignedByAny([this.recoveryDID,this.controlDID]);
        this.controlDID = newKeyDID;
    },
    $sign: async function(value){  /* do not add commands in history (prefixed with $) */
        if(this.state !== DID_READY){
            throw new Error("Sorry! DID was revoked and can't be used for signing!");
        }
        return await this.resolveDID(this.controlDID).sign(value);
    },
    $verify: async function(data, signature){  /* do not add commands in history (prefixed with $) */
        if(this.state !== DID_READY){
            return false;
        }
        let controlDidDoc = this.resolveDID(this.controlDID);
        return await controlDidDoc.verify(data, signature);
    },
}, mockPersistence);


let openDSUDid          = "did:ssi:opendsudidexample";

let keyDID1             = "did:key:key1";
let keyDID2             = "did:key:key2";
let recoveryKeyDID1     = "did:key:rkey1";
let recoveryKeyDID2     = "did:key:rkey2";

async function runTest(){

    console.log(">>>>>>>>>>>>>>>>>> 1");
    let did_v1 = await svd.create('DIDMethodDemo', keyDID1, openDSUDid,"scv.0.1");  //#1
    await did_v1.setRecoveryDID(recoveryKeyDID1);    //#2
    console.log("DID used for verifying a good signature should return true and returns:", await did_v1.$verify("testData", await did_v1.$sign("testData")));
    console.log("DID used for verifying a wrong signature should return false and returns:", await did_v1.$verify("testData", await did_v1.$sign("testData1")));
    did_v1.save();

    console.log("First DUMP:", did_v1.getID(), "  has state ", did_v1.dump()," and ", did_v1.history(true));
    console.log(">>>>>>>>>>>>>>>>>> 2");
    let did_v2 = await svd.load('DIDMethodDemo',  recoveryKeyDID1, openDSUDid);
    await did_v2.rotate(keyDID2); //#3
    await did_v2.setRecoveryDID(recoveryKeyDID2);  //#4
    did_v2.save();
    console.log("Second DUMP:", did_v2.getID(), " has state", did_v2.dump(), " and ", did_v2.history(true));

   console.log(">>>>>>>>>>>>>>>>>> 3");
    let did_v3 = await svd.load('DIDMethodDemo',  recoveryKeyDID2, openDSUDid);
    await did_v3.revoke();   //#4
    did_v3.save();
    //console.log("Third DUMP:", did_v3.getID(), " has state", did_v3.dump(), " and ", did_v3.history(true));

//console.log(did_v3.$verify("testData", did_v3.$sign("testData")));
}

runTest();

