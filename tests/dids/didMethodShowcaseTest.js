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
    return {
        sign: function(hashOfdataToBeSigned){
            return JSON.stringify({"signedBy":did, hash:hashOfdataToBeSigned});
        },
        verify: function(hashOfdataToBeSigned,signature){
            //console.log("!!!!!", did, hashOfdataToBeSigned,signature)
            let s = JSON.parse(signature);
            if(s.signedBy != did || s.hash != hashOfdataToBeSigned){
                return false;
            };
            return true;
        },
        hash: function(data){
            return "#"+data["#"];
        }
    }
})


/********************************* Actual code ***********************************/
const DID_CREATED       = 'created';
const DID_READY         = 'ready';
const DID_REVOKED       = 'revoked';


svd.register('JSMicroLedger', 'DIDMethodDemo', {
    ctor: function(ownerDID, vsdID){
        this.controlDID = ownerDID
        this.state = DID_CREATED;
    },
    setRecoveryDID: function(newRecoveryDID){
        if(this.recoveryDID){
            this.callSignedBy(this.recoveryDID);
        } else {
            this.callSignedBy(this.controlDID);
        }
        this.recoveryDID = newRecoveryDID;
        this.state = DID_READY;
    },
    revoke: function(){
        this.callSignedBy(this.recoveryDID);
        this.recoveryDID = null;
        this.controlDID = null;
        this.state = DID_REVOKED;
    },
    rotate: function(newKeyDID){
        this.callSignedByAny([this.recoveryDID,this.controlDID]);
        this.controlDID = newKeyDID;
    },
    sign: function(value){
        if(this.state != DID_READY){
            throw new Error("Sorry! DID was revoked and can't be used for signing!");
        }
        return this.resolveDID(this.controlDID).sign(value);
    },
    verify: function(data, signature){
        if(this.state != DID_READY){
            return false;
        }
        return this.resolveDID(this.controlDID).verify(data, signature);
    },
}, mockPersistence);

let keyDID1             = "did:key:key1";
let recoveryKeyDID1     = "did:key:rkey1";
let recoveryKeyDID2     = "did:key:rkey2";
let keyDID2             = "did:key:key2";

let did_v1 = svd.create('DIDMethodDemo', keyDID1, keyDID1);
did_v1.setRecoveryDID(recoveryKeyDID1);
console.log("DID used for verifing a singature:", did_v1.verify("testData", did_v1.sign("testData")));
did_v1.save();
console.log("First DUMP:", did_v1.getID(), "  has state ", did_v1.dump(), __memoryPersistence);

let did_v2 = svd.load('DIDMethodDemo',  recoveryKeyDID1, keyDID1);
did_v2.rotate(recoveryKeyDID2);
did_v2.setRecoveryDID(recoveryKeyDID2);
did_v2.save();
console.log("Second DUMP:", did_v2.getID(), " has state", did_v2.dump(), __memoryPersistence);


let did_v3 = svd.load('DIDMethodDemo',  recoveryKeyDID2, keyDID1);
did_v3.revoke();
did_v3.save();
console.log("Third DUMP:", did_v3.getID(), " has state", did_v3.dump(), __memoryPersistence);

//console.log(did_v3.__verify("testData", did_v3.__sign("testData")));