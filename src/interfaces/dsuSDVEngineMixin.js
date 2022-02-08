let mixin = {
    loadDSU: function(){
        throw "not implemented";
    },
    createDSU: function(){
        throw "not implemented";
    }
};

module.exports.applyMixin = function(host){
    let applyMixin = require("./Mixin.js").applyMixin;
    applyMixin(host, mixin);
}