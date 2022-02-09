/* This "interface" demonstrates and documents the expected behaviour, offers also a mock implementation for testing */
let __memoryPersistence = {};

let mixin = {
    detectTypeName: function(svdIdentity){
        return null;
    },
    loadCommands: function(svdIdentity, callback) {
        let blocks = __memoryPersistence[svdIdentity];
        if(!blocks){
            blocks = [];
            __memoryPersistence[svdIdentity] = blocks;
        }

        let cmnds = [];

        blocks.forEach( b => {
            let parsedBlock = JSON.parse(b);
            parsedBlock.forEach( c => {
                cmnds.push(c);
            })
        })

        callback(undefined, cmnds);
    },
    addBlock:function(svdID, block, callback){
        if(!__memoryPersistence[svdID]){
            __memoryPersistence[svdID] = [];
        }
        __memoryPersistence[svdID].push(JSON.stringify(block));

        if(callback) {
            callback(undefined, block);
        }
    }
};

module.exports.applyMixin = function(host){
    let applyMixin = require("./Mixin.js").applyMixin;
    applyMixin(host, mixin)
}