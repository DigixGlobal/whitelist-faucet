const FaucetRegistry = artifacts.require('./FaucetRegistry.sol');

module.exports = (deployer) => {
  deployer.deploy(FaucetRegistry);
};
