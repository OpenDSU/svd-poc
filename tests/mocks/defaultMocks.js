function didResolver(did) {
    function hashFunction(obj) {
        if (obj["#"]) return "#" + obj["#"];
        else return obj.toString();
    }

    return {
        sign: async function (o, timeStamp) {
            let hashOfDataToBeSigned = hashFunction(o);
            let s = JSON.stringify({"signedBy": did, hash: hashOfDataToBeSigned});
            return s;
        },
        verify: async function (o, signature) {
            let hashOfDataToBeSigned = hashFunction(o);
            let s = JSON.parse(signature);
            if (s.signedBy !== did || s.hash !== hashOfDataToBeSigned) {
                return false;
            }
            return true;
        },
        hash: hashFunction
    }
}

let svdModule = require("../../src/index");

module.exports.createTestContext = function(did){
    let JSMicroLedgerProtoCtor = require("../../src/impl/JSMicroLedger").JSMicroLedgerProtoCtor;
    let persistenceMixin = require("../../src/interfaces/persistenceMixin").applyMixin;
    let memoryPersistence = {};
    persistenceMixin(memoryPersistence);

    let ctxt = svdModule.createSVDContext(did, didResolver);
    ctxt.registerPrototype("JSMicroLedger", JSMicroLedgerProtoCtor,memoryPersistence);
    return ctxt;
}



