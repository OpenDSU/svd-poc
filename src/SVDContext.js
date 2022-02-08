function SVDContext(asDID ){
    let svdPrototypeRegistry = {};
    let svdTypesRegistry = {};
    let globalDIDResolver;

    this.registerPrototype = function(svdPrototypeName, protoCtor, persistenceImpl){
        svdPrototypeRegistry[svdPrototypeName] = { protoCtor, persistenceImpl};
    }

    this.register = function(svdTypeName, description, svdPrototypeName){
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
        let svd = new ctor( globalDIDResolver, asDID, svdID,scVersion, ...args);
        await svd._onNewSVD(...args);
        return svd;
    }

    this.setDIDResolver = function(resolver){
        globalDIDResolver = resolver;
    }

    this.load = async function(svdIdentity){
        let protoName;
        for(protoName in svdPrototypeRegistry){
            let p = svdPrototypeRegistry[protoName];
            if(p.hasSVD(svdIdentity)){
                return p.load(svdIdentity);
            }
        }
        return null;
        /*
        let ctor = svdRegistry[svdName];
        if(typeof ctor !== "function"){
            throw "Failed to create a new ctor with SVD type  " + svdName;
        }
        let svd = new ctor(globalDIDResolver, asDID, svdID);
        await svd._onLoadSVD(...args);
        return svd;
         */
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
    createSVDContext:function(did, persistenceImpl){
        return new SVDContext(did, persistenceImpl);
    }
}

