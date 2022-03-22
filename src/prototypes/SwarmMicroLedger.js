const UTILITY_FUNCTION_PREFIX = "$";

let parseSVDIdentifier = require("../util/SVDIdentifier").parseSVDIdentifier;

let JSMicroLedgerProtoCtor = require("./JSMicroLedger").JSMicroLedgerProtoCtor;

module.exports.SwarmMicroLedgerProtoCtor = function(name, description, swarmEngine){
    let ctor = new JSMicroLedgerProtoCtor(name, description, swarmEngine);
    return function(resolver, asDID, svdID, scVersion){
         let res = ctor(resolver, asDID, svdID, scVersion);

         delete res.save;

         return res;
    }
}
