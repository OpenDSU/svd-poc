module.exports.enhance = function(host, description){

    function createCommandFunction(fn, f){
        function pushCmd(args){
            let t = new Date()
            let utc = (t.getTime() + t.getTimezoneOffset()*60*1000);
            let cmd = {cmdType:fn, cmdArgs:args, UTCTimestamp:utc};
            host.__chainCommand(cmd);
            host.__pushCmd(cmd);
            return cmd;
        }

        return function(...args){
            let result;
            if(host.__getReplayMode() === "notInitialised"){
                pushCmd(args);
            }
            else {
                if(host.__getReplayMode()){
                    f(...args);
                } else {
                    host.__setCurrentCmd(pushCmd(args))
                    try{
                        result=  f(...args);
                    } catch(err){
                        console.log("Unexpected error", err);
                    }
                    host.__setCurrentCmd(undefined);
                }
            }
            return result;
        }
    }

    for(let fn in description){
        if(typeof host[fn] === "undefined"){
            host[fn] = createCommandFunction(fn, description[fn].bind(host));
        } else {
            throw "Refusing to overwrite member " + fn + " from description. SVD type ducking failed!";
        }
    }

    let mixin = require("../interfaces/svdMixin");
    mixin.svdMixin(this);
}