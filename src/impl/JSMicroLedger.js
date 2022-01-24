module.exports.JSMicroLedgerProtoCtor = function(name, description){
    return function(resolver, asDID){
        let currentIdentity = resolver(asDID);
        let currentBlock = [];

        this.onNewSVD =  function(){

        }

        this.onLoadSVD =  function(){

        }


        this.save =  function(){

        }

        this.dump = function(){

        }

        this.svdID = function(){

        }

        this.callSignedBy = function(){

        }

        this.pushCmd = function(cmd){
            currentBlock.push(cmd);
        }

        let mixin = require("./MicroLedgerMixin.js");
        mixin.enhance(currentIdentity, this, description);
        return this;
    }
}
