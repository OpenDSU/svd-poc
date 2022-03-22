let mockEnvironment = require("../mocks/defaultMocks");

/********************************* Example of environment preparations ***********************************/
let openDSUDid          = "did:ssi:opendsudidexample";

let keyDID1             = "did:key:key1";
let keyDID2             = "did:key:key2";
let recoveryKeyDID1     = "did:key:rkey1";
let recoveryKeyDID2     = "did:key:rkey2";

let ctxt1 = mockEnvironment.createTestContext(keyDID1);

let ctxt2 = mockEnvironment.createTestContext(keyDID2);

let ctxt3 = mockEnvironment.createTestContext(recoveryKeyDID1);

let ctxt4 = mockEnvironment.createTestContext(recoveryKeyDID2);

const DID_CREATED       = 'created';
const DID_READY         = 'ready';
const DID_REVOKED       = 'revoked';

let didMethodDescription =  {
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
};

ctxt1.registerType('DIDMethodDemo',  didMethodDescription, 'JSMicroLedger' );
ctxt2.registerType('DIDMethodDemo',  didMethodDescription, 'JSMicroLedger' );
ctxt3.registerType('DIDMethodDemo',  didMethodDescription, 'JSMicroLedger' );
ctxt4.registerType('DIDMethodDemo',  didMethodDescription, 'JSMicroLedger' );

/********************************* Actual code ***********************************/


async function runTest(){
    let did_v1 = await ctxt1.create(openDSUDid, 'DIDMethodDemo', 1);  //#1
    let svdId = did_v1.getSVDID();
    await did_v1.setRecoveryDID(recoveryKeyDID1);    //#2
    console.log("DID used for verifying a good signature should return true and returns:", await did_v1.$verify("testData", await did_v1.$sign("testData")));
    console.log("DID used for verifying a wrong signature should return false and returns:", await did_v1.$verify("testData", await did_v1.$sign("testData1")));
    did_v1.save();

    console.log("First DUMP:", did_v1.getSVDID(), "  has state ", did_v1.dump()," and ", did_v1.history(true));

    let did_v2 = await ctxt3.load(svdId, openDSUDid);
    await did_v2.rotate(keyDID2); //#3
    await did_v2.setRecoveryDID(recoveryKeyDID2);  //#4
    did_v2.save();
    console.log("Second DUMP:", did_v2.getSVDID(), " has state", did_v2.dump(), " and ", did_v2.history(true));


    let did_v3 = await ctxt4.load(svdId,  openDSUDid);
    await did_v3.revoke();   //#5
    did_v3.save();
    console.log("Third DUMP:", did_v3.getSVDID(), " has state", did_v3.dump(), " and ", did_v3.history(true));

    try{
        console.log(await did_v3.$verify("testData", await did_v3.$sign("testData")));
    } catch(err){
        console.log("Throws as expected");
    }
}

runTest();

