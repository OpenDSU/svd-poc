/* This "interface" demonstrates and documents the expected behaviour, offers also a mock implementation for testing */
let __memoryPersistence = {};
let parseSVDIdentifier = require("../util/SVDIdentifier").parseSVDIdentifier;

let mixin = {
    detectTypeName: function(svdIdentity, callback){
        let svdid = parseSVDIdentifier(svdIdentity);
        return svdid.getTypeName();
    },
    hasSVD:function(svdIdentity){
        return true;
    },
    loadCommands: function(svdId, callback) {
        let blocks = __memoryPersistence[svdId];
        if(!blocks){
            blocks = [];
            __memoryPersistence[svdId] = blocks;
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
    let applyMixin = require("../util/Mixin.js").applyMixin;
    applyMixin(host, mixin)
}