function SVDContext(asDID, resolverFunction ){
    let svdPrototypeRegistry = {};
    let svdTypesRegistry = {};

    this.registerPrototype = function(svdPrototypeName, protoCtor, persistenceImpl){
        svdPrototypeRegistry[svdPrototypeName] = { protoCtor, persistenceImpl};
    }

    this.registerType = function(svdTypeName, description, svdPrototypeName){
        let protoInfo = svdPrototypeRegistry[svdPrototypeName];
        if(!protoInfo || typeof protoInfo.protoCtor !== "function"){
            throw "Failed to lookup for  svd prototype " + svdPrototypeName + " while creating SVD type " +  svdTypeName;
        }
        svdTypesRegistry[svdTypeName] = protoInfo.protoCtor(svdTypeName, description, protoInfo.persistenceImpl);
    }


    this.create = async function(svdTypeName,svdID, scVersion, ...args){
        let ctor = svdTypesRegistry[svdTypeName];
        if(typeof ctor !== "function"){
            throw "Failed to create a new ctor with SVD type " + svdTypeName;
        }
        let svd = new ctor( resolverFunction, asDID, svdID,scVersion, ...args);
        await svd._onNewSVD(...args);
        return svd;
    }

    this.setDIDResolver = function(resolver){
        resolverFunction = resolver;
    }

    this.load = async function(svdIdentity, ...args){
        let protoName;
        for(protoName in svdPrototypeRegistry){
            let p = svdPrototypeRegistry[protoName];
            let typeName = p.detectTypeName(svdIdentity)
            if(p){
                let ctor = svdTypesRegistry[typeName];
                if(typeof ctor !== "function"){
                    throw "Failed to create a new ctor with SVD type  " + typeName;
                }
                let svd = new ctor(resolverFunction, asDID, svdIdentity);
                await svd._onLoadSVD(...args);
                return svd;
            }
        }
        return null;
    },

    this.registerSwarmEngine = function(swarmEngine){

    }

    this.registerDSUPersistence = function(dsuSVDEngine){

    }

    this.registerSwarm = function(description, svdSwarmTypeName, firewallFunction){

    },

    this.createSwarm = function(description, svdSwarmTypeName){

    }
}


module.exports = {
    createSVDContext:function(did, resolverFunction){
        return new SVDContext(did, resolverFunction);
    }
}

