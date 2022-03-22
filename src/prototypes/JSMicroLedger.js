const UTILITY_FUNCTION_PREFIX = "$";

let parseSVDIdentifier = require("../util/SVDIdentifier").parseSVDIdentifier;

module.exports.JSMicroLedgerProtoCtor = function(name, description, persistence){
    return function(resolver, asDID, svdID, scVersion){
        let currentIdentity = resolver(asDID);
        let currentBlock = [];
        let self = this;
        let __replayMode = "notInitialised";
        let __lastCmd = null;
        let __currentCmd = null;
        let __cmndsHistory = [];

        if(typeof svdID == "string"){
            svdID = parseSVDIdentifier(svdID);
        }
        /* -------------------------------------------- Public methods that have to be documented --------------------------------------------*/
        this.save = function(){
            currentBlock.forEach( c => {
                __cmndsHistory.push(c);
            })

            persistence.addBlock(svdID.getIdentifier(), currentBlock, (err, res) => {
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
                    res += "\tCommand #" + blockNumber ;
                    res +=  JSON.stringify(block, null, " \t");
                    res +="\n"
                    blockNumber++;
                })
                res +="\n";
                return res;
            }
            return JSON.stringify(__cmndsHistory);
        }

        this.getSVDID = function(){
            return svdID.getIdentifier();
        }

        this.getCurrentControllerDID = function(){
            return asDID;
        }

        async function verifyForDID(did, cmd, cmdSignature){
            let didDoc = resolver(did);
            return await didDoc.verify(cmd, cmdSignature);
        }

        this.callSignedBy = async function(did){
            if(__currentCmd === null){
                throw new Error("THis function can be called only from SVD phases ");
            }
            let cloneCmd = JSON.parse(JSON.stringify(__currentCmd));
            let cmdSignature = cloneCmd.signature;
            delete cloneCmd.signature;
            let isVerified = await verifyForDID(did, cloneCmd, cmdSignature);
            if(!isVerified){
                throw new Error("Signature verification failed checking signature of "  + did + " and signature " + cmdSignature);
            }
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
            }
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
            await self.ctor(asDID, svdID,scVersion, ...args);
        }

        this._onLoadSVD =  async function(){
            let endWaiting;
            let pendingCounter = 0;

            async function doReplayExecution(cmd){
                let vsdPhaseCommand = self.__setCurrentCmd(cmd);

                try{
                    await self.__svdReplayFunctions[cmd.cmdType](...cmd.cmdArgs);
                } catch(err){
                    console.log("UNEXPECTED  ERROR executing phase" + cmd.cmdType + " SVD phase code got IGNORED after error:", err);
                }

                self.__setCurrentCmd(null, cmd);

            }
            let ret = new Promise((resolve, reject) => {
                endWaiting = resolve;
            })

            persistence.loadCommands(svdID.getIdentifier(), async (err, cmnds) => {
                __cmndsHistory = cmnds;
                __replayMode = "replay";

                if(cmnds.length >0){
                    for(let cn in cmnds) {
                        await doReplayExecution(cmnds[cn]);
                    }
                }

                if(currentBlock.length >0) {
                    /* maybe new commands were issued before initialisation */
                    for(let c in currentBlock){
                        console.log(">>> Replaying pending commands....");
                        await self.__chainCommand(c);
                        await doReplayExecution(c);
                    }
                }
                endWaiting(true);
                __replayMode = "normalExecution";
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

        /**
         * @param {null} cmd
         * @param {null} lastCmd
         */
        this.__setCurrentCmd = function(cmd, lastCmd){
            if(cmd !== null) {
                if(__currentCmd != null) {
                    throw  new Error("Reentrant execution of the VSD methods is not allowed. Executing " +  __currentCmd.cmdType + " while " + cmd.cmdType + " started");
                }
            }
            __currentCmd = cmd;
            if(lastCmd !== undefined ){
                __lastCmd = lastCmd;
            }
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
