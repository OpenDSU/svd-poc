
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

module.exports.svdMixin = function(host){
    let applyMixin = require("../util/Mixin.js").applyMixin;
    applyMixin(host, mixin);
}