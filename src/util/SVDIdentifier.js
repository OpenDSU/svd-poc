/*
    svd:contextType:prototype:type:version:instanceIdentifier

    contextType can be: json|dsu|swarm|did
    Prototype:  can be ml (or microledger). Other SVD prototypes are theoretically possible (for example direct graphs)
    Type: custom type
    Version: reflects the actual version of the type description
    InstanceIdentifier: could be a random number or a keySSI in case that the contextType is "dsu".

     Example: svd:swarm:ml:test:v5:ABCDEF
 */

function SVDIdentifier(str){
    let contextType,protoType, customType, version, uniqID;

    if(str !== undefined && str !== ""){
        const fields = str.split(":");
        if(fields.length != 6){
            throw new Error("Invalid SVD identifier, it should be in this form 'svd:contextType:prototype:type:version:instanceIdentifier', received: " + str);
        }

        contextType = fields[1];
        protoType = fields[2];
        customType = fields[3];
        version = fields[4];
        uniqID = fields[5];
    }

    this.setFields = function(contextType,protoType, customType, version, uniqID ){
        str = `svd:${contextType}:${protoType}:${customType}:${version}:${uniqID}`;
        console.log("Seting SVDIdentity ", str)
    }

    this.getFields = function( ){
        return {
            contextType,protoType, customType, version, uniqID
            }
    }

    this.getTypeName = function(){
        return customType;
    }

    this.getIdentifier = function(){
        return str;
    }
}

function parseSVDIdentifier(str){
    return new SVDIdentifier(str);
}

function createSVDIdentifier(contextType,protoType, customType, version, uniqID ){
    let ret = new SVDIdentifier();
    ret.setFields(contextType,protoType, customType, version, uniqID)
    return ret;
}


module.exports = {
    createSVDIdentifier: createSVDIdentifier,
    parseSVDIdentifier: parseSVDIdentifier
}