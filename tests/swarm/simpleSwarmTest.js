let mockEnvironment = require("../mocks/defaultMocks");

let firstDID   = "did:test:firstDID";
let secondDID  = "did:test:secondDID";


let ctxt1 = mockEnvironment.createTestContext(firstDID);
let ctxt2 = mockEnvironment.createTestContext(secondDID);


/********************************* Actual code ***********************************/
let swarmDescription = {
    version:1,
    ctor: async function(creatorDID, swarmId, param){
        this.creatorDID = creatorDID;
        this.hello = param;
    },
    send: async function(){
        await this.validateCaller(firstDID);
        let remoteSwarmContext = this.getContext(secondDID);
        remoteSwarmContext.doSomething(this.hello);
    },
    doSomething: async function(msg){
        await this.validateCaller(secondDID);
        this.result = msg + " World!";
        this.return(firstDID, this.result);
    }
};

ctxt1.registerSwarm('firstSwarm',  swarmDescription);
ctxt2.registerSwarm('firstSwarm',  swarmDescription,true);

async function runTest(){
    let swarm = await ctxt1.startSwarm('firstSwarm', "Hello");

    swarm.onReturn(function(err, result, validatedStatus){
        if(err){
            console.log(err);
            return ;
        }
        let isValid = validatedStatus.result == resut && result == "Hello World!";
        console.log("Swarm DUMP:", validatedStatus.getSVDID(), "  has state ", validatedStatus.dump(), isValid);
    }, 1000);
}

runTest()

