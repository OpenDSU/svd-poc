
module.exports.applyMixin = function(host, mixin){
    if(typeof host  === "undefined"){
        throw "SVD typing of undefined is not possible!" ;
    }
    for(let fn in mixin){
        if(typeof host[fn] === "undefined"){
            host[fn] = mixin[fn].bind(host);
        } else {
            if( typeof host[fn] !== "function"){
                throw "Refusing to overwrite member " + fn + " as svdMixin. SVD type ducking failed!";
            }
        }
    }
}