let mixin = {
    hasSVD: function(){
        throw "not implemented";
    },
    save: function(){
        throw "not implemented";
    }
};

module.exports.applyMixin = function(host){
    let applyMixin = require("./Mixin.js").applyMixin;
    applyMixin(host, mixin)
}