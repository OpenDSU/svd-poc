let mixin = {
    loadDSU: function(){
        throw "not implemented";
    },
    createDSU: function(){
        throw "not implemented";
    }
};

module.exports.applyMixin = function(host){
    let applyMixin = require("../util/Mixin.js").applyMixin;
    applyMixin(host, mixin);
}