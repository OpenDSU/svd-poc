
let utilIdentifier = require("../util/SVDIdentifier");

function SVDContext(asDID, resolverFunction ){
    let svdPrototypeRegistry = {};
    let svdCustomTypesRegistry = {};

    this.registerPrototype = function(svdPrototypeName, protoCtor, persistenceImpl, contextType){
        svdPrototypeRegistry[svdPrototypeName] = { protoCtor, persistenceImpl, contextType};
    }

    this.registerType = function(svdCustomTypeName, description, svdPrototypeName, version){
        let protoInfo = svdPrototypeRegistry[svdPrototypeName];
        if(version === undefined){
            version = 1;
        }
        if(!protoInfo || typeof protoInfo.protoCtor !== "function"){
            throw "Failed to lookup for  svd prototype " + svdPrototypeName + " while creating SVD type " +  svdCustomTypeName;
        }
        svdCustomTypesRegistry[svdCustomTypeName] = {
            ctor:protoInfo.protoCtor(svdCustomTypeName, description, protoInfo.persistenceImpl),
            protoType: svdPrototypeName,
            version
        };
    }


    this.create = async function(svdCustomID, svdCustomTypeName,  ...args){
        let b64CustomID = svdCustomID.replaceAll(":","/");
        let protoTypeName = svdCustomTypesRegistry[svdCustomTypeName].protoType;
        let ctxtTypeName = svdPrototypeRegistry[protoTypeName].contextType;
        let version = svdCustomTypesRegistry[svdCustomTypeName].version;
        let svdId = utilIdentifier.createSVDIdentifier(ctxtTypeName,protoTypeName,svdCustomTypeName, version, b64CustomID);

        let ctor = svdCustomTypesRegistry[svdCustomTypeName].ctor;

        if(typeof ctor !== "function"){
            throw new Error("Failed to create a new ctor with SVD type " + svdCustomTypeName);
        }
        let svd = new ctor( resolverFunction, asDID, svdId, ...args);
        await svd._onNewSVD(...args);
        return svd;
    }

    this.setDIDResolver = function(resolver){
        resolverFunction = resolver;
    }

    this.load = async function(svdIdentity){
        let protoName;
        for(protoName in svdPrototypeRegistry){
            let p = svdPrototypeRegistry[protoName].persistenceImpl;
            if(p.hasSVD(svdIdentity)){
                let typeName = p.detectTypeName(svdIdentity)
                let ctor = svdCustomTypesRegistry[typeName].ctor;
                if(typeof ctor !== "function"){
                    throw new Error("Failed to create a new ctor with SVD type  " + typeName);
                }
                let svd = new ctor(resolverFunction, asDID, svdIdentity);
                await svd._onLoadSVD(undefined);
                return svd;
            }
        }
        throw new Error("Failed to load SVD with identity " + svdIdentity + " and type " + svdIdentity);
        return null;
    }

    this.onSwarmMessage = function(arr){

    }


    let swarmEngine;

    this.registerSwarmEngine = function(_swarmEngine){
        swarmEngine = _swarmEngine;
        swarmEngine.onSwarmMessage = this.onSwarmMessage;
    }



    this.registerSwarm = function( svdSwarmTypeName, description, listenForSwarmsStartedByOthers){
        this.registerType(svdSwarmTypeName, description, "swarm", description.version);
        if(listenForSwarmsStartedByOthers){
            swarmEngine.allowExternalSwarm(svdSwarmTypeName);
        }
    }

    this.registerDSUPersistence = function(dsuSVDEngine){

    }
}


module.exports = {
    createSVDContext:function(did, resolverFunction){
        return new SVDContext(did, resolverFunction);
    }
}

