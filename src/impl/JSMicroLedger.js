const UTILITY_FUNCTION_PREFIX = "$";

module.exports.JSMicroLedgerProtoCtor = function(name, description, persistence){
    return function(resolver, asDID, svdID, scVersion){
        let currentIdentity = resolver(asDID);
        let currentBlock = [];
        let self = this;
        let __replayMode = "notInitialised";
        let __lastCmd = null;
        let __currentCmd = null;
        let __cmndsHistory = [];

        /* -------------------------------------------- Public methods that have to be documented --------------------------------------------*/
        this.save = function(){
            currentBlock.forEach( c => {
                __cmndsHistory.push(c);
            })

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

        this.history = function(asString){  /*if !asString than return a JSON*/
            let blockNumber = 1;
            if(asString){
                let res = "Commands History:\n";
                __cmndsHistory.forEach(block => {
                    res += "\tCommand#" + blockNumber ;
                    res +=  JSON.stringify(block, null, " \t");
                    res +="\n"
                    blockNumber++;
                })
                res +="\n";
                return res;
            }
            return JSON.stringify(__cmndsHistory);
        }

        this.getID = function(){
            return svdID;
        }

        this.getCurrentControllerDID = function(){
            return asDID;
        }

        async function verifyForDID(did, cmd, cmdSignature){
            let didDoc = resolver(did);
            return await didDoc.verify(cmd, cmdSignature);
        }

        this.callSignedBy = async function(did){
             //console.log("XXX>>", did, __currentCmd);
            let cloneCmd = JSON.parse(JSON.stringify(__currentCmd));
            let cmdSignature = cloneCmd.signature;
            delete cloneCmd.signature;
            let isVerified = await verifyForDID(did, cloneCmd, cmdSignature);
            if(!isVerified){
                throw new Error("Signature verification failed checking signature of "  + did + " and signature " + cmdSignature);
            };
        }

        this.callSignedByAny = function(arr){
            let cloneCmd = JSON.parse(JSON.stringify(__currentCmd));
            let cmdSignature = cloneCmd.signature;
            delete cloneCmd.signature;
            let anyVerified = false;
            for(let i = 0; i < arr.length; i++){
                anyVerified = verifyForDID(arr[i], cloneCmd, cmdSignature);
                if(anyVerified) return true;
            }

            if(!anyVerified){
                throw new Error("Signature verification failed checking signature of any did in the list: "  + arr);
            };
        }

        this.resolveDID = function(did){
            return resolver(did);
        }

        /* --------------------------------------------  Internal methods  ------------------------------------- */
        this.__getReplayMode = function(){
            return __replayMode;
        }

        this._onNewSVD =  async function(...args){
            __replayMode = "normalExecution";
            await this.ctor(asDID, svdID,scVersion, ...args);
        }

        this._onLoadSVD =  async function(){
            let endWaiting;
            let pendingCounter = 0;

            async function doExecution(cmd){
                let vsdPhaseCommand = self.__setCurrentCmd(cmd);
                if(vsdPhaseCommand) console.log("\t\tBegin:", cmd.cmdType);
                try{
                    await self.__svdDescription[cmd.cmdType](...cmd.cmdArgs);
                } catch(err){
                    console.log("UNEXPECTED  ERROR  (SVD phase code got IGNORED after error):", err);
                }
                self.__setCurrentCmd(null);
                __lastCmd = cmd;
                if(vsdPhaseCommand) console.log("\t\tEnd:", cmd.cmdType);
            }

            let ret = new Promise((resolve, reject) => {
                endWaiting = resolve;
            });

            persistence.loadCommands(svdID, async (err, cmnds) => {
                __cmndsHistory = cmnds;
                __replayMode = "replay";

                if(cmnds.length >0){
                    for(let cn in cmnds) {
                        console.log("\tReplay command:", cmnds[cn].cmdType);
                        await doExecution(cmnds[cn]);
                    }
                }

                if(currentBlock.length >0) {
                    /* maybe new commands were issued before initialisation */
                    for(let c in currentBlock){
                        self.__chainCommand(c);
                        await doExecution(c);
                    }
                }
                endWaiting(true);
                __replayMode = "normalExecution";
                console.log("END Replay ");
            });
            return await ret;
        }

        /* add previous hash and sign. Add "#" property for debug and testing purposes */
        this.__chainCommand = async function(c){
            if(__lastCmd){
                c.hashPrevCmd = currentIdentity.hash(__lastCmd);
            } else {
                c.hashPrevCmd = "none";
            }

            c["#"] =  c.hashPrevCmd === "none"? 1 : __lastCmd["#"] + 1;

            if(typeof c.signature !== "undefined"){
                throw new Error("Can't sign an already signed command!");
            }
            let sign = await currentIdentity.sign(c, c.UTCTimestamp);
            c.signature  = sign;
        }

        this.__setCurrentCmd = function(c){
            if(c !== null) {
                if(__currentCmd != null) {
                    throw  new Error("Reentrant execution of the VSD methods is not allowed. Executing " +  __currentCmd.cmdType + " while " + c.cmdType + " started");
                }
            }
            __currentCmd = c;
            return true;
        }

        this.__pushCmd = function(cmd){
            if(cmd && !cmd.cmdType.startsWith(UTILITY_FUNCTION_PREFIX)){
                currentBlock.push(cmd);
                return true;
            }
            return false;
        }

        let mixin = require("./MicroLedgerMixin.js");
        mixin.enhance(this, description);
        return this;
    }
}
