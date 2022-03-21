module.exports.enhance = function(host, description){

    function createDirectCommandFunction(fn, f) {
        async function pushCmd(args) {
            let t = new Date()
            let utc = (t.getTime() + t.getTimezoneOffset() * 60 * 1000);
            let cmd = {cmdType: fn, cmdArgs: args, UTCTimestamp: utc};
            if(host.__pushCmd(cmd) && host.__getReplayMode() === "normalExecution"){
                await host.__chainCommand(cmd);
            };
            return cmd;
        }

        return async function (...args) {
            let result, cmd;
            if (host.__getReplayMode() === "notInitialised") {
                await pushCmd(args);
            } else { // "normalExecution";  "replay" mode is not allowed here
                cmd = await pushCmd(args);
                host.__setCurrentCmd(cmd);
                result = await f(...args);
                host.__setCurrentCmd(null, cmd);
            }
            return result;
        }
    }

    function createReplayCommandFunction(fn, f) {
        return async function(...args){
          //  console.log("Replaying... ", fn, new Error("execution"));
            let result = await f(...args);
            return result;
        }
    }

     host.__svdReplayFunctions = {};
    for(let fn in description){
        if(typeof host[fn] === "undefined"){
            host.__svdReplayFunctions[fn] =  createReplayCommandFunction(fn, description[fn].bind(host));
        } else {
            throw "Refusing to overwrite member " + fn + " from description. SVD type ducking failed!";
        }
    }

    for(let fn in description){
        if(typeof host[fn] === "undefined"){
            host[fn] =  createDirectCommandFunction(fn, description[fn].bind(host));
        } else {
            throw "Refusing to overwrite member " + fn + " from description. SVD type ducking failed!";
        }
    }

    let mixin = require("../interfaces/svdMixin");
    mixin.svdMixin(this);
}