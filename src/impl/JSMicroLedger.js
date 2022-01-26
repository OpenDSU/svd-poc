module.exports.JSMicroLedgerProtoCtor = function(name, description, persistence){
    return function(resolver, asDID, svdID){
        let currentIdentity = resolver(asDID);
        let currentBlock = [];
        let self = this;
        let __replayMode = "notInitialised";
        let __lastCmd = null;
        let __currentCmd = null;

        this.getReplayMode = function(){
            return __replayMode;
        }

        this.onNewSVD =  function(){
            __replayMode = false;
            this.ctor(asDID, svdID);
        }

        this.onLoadSVD =  function(){
            persistence.loadCommands(svdID, (err, cmnds) => {
                __replayMode = true;
                if(cmnds.length >0){
                    cmnds.forEach( c => {
                        self.__setCurrentCmd(c);
                        self[c.cmdType](...c.cmdArgs);
                        __lastCmd = c;
                    })
                }

                if(currentBlock.length >0) {
                    /* maybe new commands were issued before initialisation */
                    currentBlock.forEach( c => {
                        self.chainCommand(c);
                        self[c.cmdType](...c.cmdArgs);
                        __lastCmd = c;
                    })
                }
                __replayMode = false;
            });
        }


        this.save =  function(){
            persistence.addBlock(svdID, currentBlock, (err, res) => {
                if(err) {
                    throw err;
                }
                currentBlock = [];
            });
        }

        this.dump = function(){
            return JSON.stringify(self);
        }

        this.getID = function(){
            return svdID;
        }

        this.callSignedBy = function(did){
            let didDoc = resolver(did);
            let cloneCmd = JSON.parse(JSON.stringify(__currentCmd));
            let cmdSignature = cloneCmd.signature;
            delete cloneCmd.signature;
            if(!didDoc.verify(didDoc.hash(cloneCmd), cmdSignature)){
                console.log(">>>>", did, didDoc, cmdSignature);
                throw new Error("Signature verification failed checking signature of "  + did);
            };
        }

        /* add previous hash and sign. Add "#" property for debug and testing purposes */
        this.chainCommand = function(c){
            if(__lastCmd){
                c.hashPrevCmd = currentIdentity.hash(__lastCmd);
            } else {
                c.hashPrevCmd = "none";
            }

            c["#"] =  c.hashPrevCmd === "none"? 1 : __lastCmd["#"] + 1;
            let sign = currentIdentity.sign(currentIdentity.hash(c));
            c.signature  = sign;
        }


        this.__setCurrentCmd = function(c){
            __currentCmd = c;
        }

        this.pushCmd = function(cmd){
            currentBlock.push(cmd);
            __lastCmd = cmd;
        }

        let mixin = require("./MicroLedgerMixin.js");
        mixin.enhance(this, description);
        return this;
    }
}
