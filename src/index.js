
let svdRegistry = {};
let svdPrototypeRegistry = {};
let globalDIDResolver;

 let thisModule = {
    registerPrototype: function(svdPrototype, ctor){
        svdPrototypeRegistry[svdPrototype] = ctor;
    },
    register: function(svdPrototype, newName, description, persistence){
        let protoCtor = svdPrototypeRegistry[svdPrototype];
        if(typeof protoCtor !== "function"){
            throw "Failed to lookup for  svd prototype " + svdPrototype + " while creating SVD type " +  newName;
        }
        svdRegistry[newName] = protoCtor(newName, description, persistence);
    },
    load: async function(svdName, asDID, svdID, ...args){
        let ctor = svdRegistry[svdName];
        if(typeof ctor !== "function"){
            throw "Failed to create a new ctor with SVD type  " + svdName;
        }
        let svd = new ctor(globalDIDResolver, asDID, svdID);
        await svd._onLoadSVD(...args);
        return svd;
    },
    create: async function(svdName, asDID, svdID, scVersion, ...args){
        let ctor = svdRegistry[svdName];
        if(typeof ctor !== "function"){
            throw "Failed to create a new ctor with SVD type " + svdName;
        }
         let svd = new ctor( globalDIDResolver, asDID, svdID,scVersion, ...args);
         await svd._onNewSVD(...args);
         return svd;
     },
     setDIDResolver: function(resolver){
         globalDIDResolver = resolver;
     }
}

module.exports = thisModule;

let JSMicroLedgerProtoCtor = require("./impl/JSMicroLedger").JSMicroLedgerProtoCtor;
thisModule.registerPrototype("JSMicroLedger", JSMicroLedgerProtoCtor);
