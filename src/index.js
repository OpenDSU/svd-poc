


let globalDIDResolver;

 let thisModule = {

     createSVDContext:require("./SVDContext").createSVDContext
}

module.exports = thisModule;

let JSMicroLedgerProtoCtor = require("./impl/JSMicroLedger").JSMicroLedgerProtoCtor;
thisModule.registerPrototype("JSMicroLedger", JSMicroLedgerProtoCtor);
