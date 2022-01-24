
let svdRegistry = {};
let svdPrototypeRegistry = {};

 let thisModule = {
    registerPrototype: function(svdPrototype, ctor){
        svdPrototypeRegistry[svdPrototype] = ctor;
    },
    register: function(svdPrototype, newName, description){
        let protoCtor = svdPrototypeRegistry[svdPrototype];
        if(typeof protoCtor !== "function"){
            throw "Failed to lookup for  svd prototype " + svdPrototype + " while creating SVD type " +  newName;
        }
        svdRegistry[newName] = protoCtor(newName, description);
    },
    load: function(svdName, ...args){
        let ctor = svdRegistry[svdName];
        if(typeof ctor !== "function"){
            throw "Failed to create a new ctor with SVD type  " + svdName;
        }
        let svd = new ctor();
        svd.onLoadSVD(...args);
        return svd;
    },
    create: function(svdName, ...args){
        let ctor = svdRegistry[svdName];
        if(typeof ctor !== "function"){
            throw "Failed to create a new ctor with SVD type " + svdName;
        }
         let svd = new ctor( );
         svd.onNewSVD(...args);
         return svd;
     }
}

module.exports = thisModule;

let JSMicroLedgerProtoCtor = require("./impl/JSMicroLedger").JSMicroLedgerProtoCtor;
thisModule.registerPrototype("JSMicroLedger", JSMicroLedgerProtoCtor);
