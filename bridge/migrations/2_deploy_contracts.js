const Bridge = artifacts.require("Bridge");
const Manager = artifacts.require("Manager");
const Verifier = artifacts.require("Verifier");
const MMR = artifacts.require("MMR");
const MainToken = artifacts.require('MainToken');

const fs = require('fs');

const blocksBetweenCrossEvents = 0;
const minimumPedingTransfersCount = 0;

module.exports = function(deployer, network) {
    deployer.deploy(MMR)
    .then(() => MMR.deployed())
    .then(() => deployer.deploy(Verifier))
    .then(() => Verifier.deployed())
    .then(() => deployer.deploy(Manager, Verifier.address))
    .then(() => { 
        let symbol = 'e';
        if(network == 'regtest' || network.toLowerCase().indexOf('rsk') == 0)
            symbol = 'r';
        return deployer.deploy(Bridge, Manager.address, symbol.charCodeAt(), blocksBetweenCrossEvents, minimumPedingTransfersCount);
    })
    .then(() => Bridge.deployed())
    .then(() => Manager.deployed())
    .then((managerInstance) => {
        managerInstance.setTransferable(Bridge.address)
    })
    .then( () => {
        if(!network.toLowerCase().includes('mainnet')) {
            return deployer.deploy(MainToken, 'MAIN', 'MAIN', 18, web3.utils.toWei('1000'))
                .then(() => MainToken.deployed());
        }
    })
    .then(async () => {
        const blockNumber = await web3.eth.getBlockNumber();
        const currentProvider = deployer.networks[network];
        let host = currentProvider.host.indexOf('http') == 0 ? '': 'http://';
        host += currentProvider.host + ((currentProvider.port) ? `:${currentProvider.port}` : '');
        const config = {
            host: host,
            mmr: MMR.address,
            bridge: Bridge.address,
            manager: Manager.address,
            fromBlock: blockNumber,
            privateKey: "",
            testToken: MainToken.address,
        };
        fs.writeFileSync(`../submitter/${network}.json`, JSON.stringify(config, null, 4));
    });
    
};