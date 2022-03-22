
/*
    Observations:
     - onSwarmMessage should be initiated by the SVDContext
 */

let mixin = {
    allowExternalSwarm: function(swarmName){
        let whiteList = this.whiteList;
        if(whiteList == undefined){
            whiteList = this.whiteList = {};
        }
        whiteList[swarmName] = true;
    },
    disableExternalSwarm: function(swarmName){
        let whiteList = this.whiteList;
        if(whiteList == undefined){
            whiteList = this.whiteList = {};
        }
        whiteList[swarmName] = false;
    },
    onSwarmMessage: null,
    setSubscriber: function(subscriberFunction){
        let self = this;
        subscriberFunction( function(err, swarmMessage){
            let msg = JSON.parse(swarmMessage);
            let enabled = this.whiteList[msg.swarmID];
            if(enabled){
                self.onSwarmMessage(msg.history)
            } else {
                let err = new Error("Swarm " + msg.swarmID + " is not enabled to run in this context!");
                if(globalThis['$$'] !== undefined && $$.errorLogger != undefined){
                    $$.errorLogger.err(err);
                } else {
                    console.log(err);
                }
            }
        })
    },
    setPublisher: function(publisherFunction){
         this.publisherFunction = publisherFunction;
    },
    publishSwarm :function(swarmSVD){
        this.publisherFunction({
            swarmID:swarmSVD.getSVDID(),
            history:swarmSVD.history()
        })
    }
};

module.exports.applyMixin = function(host){
    let applyMixin = require("../util/Mixin.js").applyMixin;

}