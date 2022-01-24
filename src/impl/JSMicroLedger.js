module.exports.JSMicroLedgerProtoCtor = function(name, description){
    return function(){
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

        for(let fn in description){
            if(typeof this[fn] === "undefined"){
                this[fn] = description[fn].bind(this);
            } else {
                    throw "Refusing to overwrite member " + fn + " from description. SVD type ducking failed!";
            }
        }

        let mixin = require("../interfaces/svdMixin");;
        mixin.svdMixin(this);
        return this;
    }
}
