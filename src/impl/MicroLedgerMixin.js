module.exports.enhance = function(currentIdentity, host, description){

    function createCommandFUnction(fn, f){
        return function(...args){
            let cmd = {type:fn, arguments:args};
            let sign = currentIdentity.sign(currentIdentity.hash(cmd));
            cmd.signature  = sign;
            host.pushCmd(cmd);
            f(...args);
        }
    }

    for(let fn in description){
        if(typeof host[fn] === "undefined"){
            host[fn] = createCommandFUnction(fn, description[fn].bind(host));
        } else {
            throw "Refusing to overwrite member " + fn + " from description. SVD type ducking failed!";
        }
    }

    let mixin = require("../interfaces/svdMixin");;
    mixin.svdMixin(this);

}