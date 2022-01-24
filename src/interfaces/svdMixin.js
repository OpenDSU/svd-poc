module.exports.svdMixin = function(host){

    let mixin = {
            onNewSVD: function(){
                throw "SVD.create not implemented";
            },
            onLoadSVD: function(){
                throw "SVD.load not implemented";
            },
            save: function(){
                throw "SVD.save not implemented";
            },
            dump: function(){
            throw "SVD.dump not implemented";
            },
            svdID: function(){
            throw "SVD.svdID not implemented";
        }
    };

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