
let utilIdentifier = require("../util/SVDIdentifier");

function SVDContext(asDID, resolverFunction ){
    let svdPrototypeRegistry = {};
    let svdCustomTypesRegistry = {};

    this.registerPrototype = function(svdPrototypeName, protoCtor, persistenceImpl, contextType){
        svdPrototypeRegistry[svdPrototypeName] = { protoCtor, persistenceImpl, contextType};
    }

    this.registerType = function(svdCustomTypeName, description, svdPrototypeName){
        let protoInfo = svdPrototypeRegistry[svdPrototypeName];
        if(!protoInfo || typeof protoInfo.protoCtor !== "function"){
            throw "Failed to lookup for  svd prototype " + svdPrototypeName + " while creating SVD type " +  svdCustomTypeName;
        }
        svdCustomTypesRegistry[svdCustomTypeName] = {
            ctor:protoInfo.protoCtor(svdCustomTypeName, description, protoInfo.persistenceImpl),
            protoType: svdPrototypeName
        };
    }


    this.create = async function(svdCustomID, svdCustomTypeName, version, ...args){
        let b64CustomID = btoa(svdCustomID);
        let protoTypeName = svdCustomTypesRegistry[svdCustomTypeName].protoType;
        let ctxtTypeName = svdPrototypeRegistry[protoTypeName].contextType;

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

    this.load = async function(svdIdentity, ...args){
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
                await svd._onLoadSVD(...args);
                return svd;
            }
        }
        throw new Error("Failed to load SVD with identity " + svdIdentity + " and type " + svdIdentity);
        return null;
    }

    this.registerSwarmEngine = function(swarmEngine){

    }

    this.registerDSUPersistence = function(dsuSVDEngine){

    }

    this.registerSwarm = function(description, svdSwarmTypeName, firewallFunction){

    }

    this.createSwarm = function(description, svdSwarmTypeName){

    }
}


module.exports = {
    createSVDContext:function(did, resolverFunction){
        return new SVDContext(did, resolverFunction);
    }
}

