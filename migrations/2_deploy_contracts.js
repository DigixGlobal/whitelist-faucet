const FaucetRegistry = artifacts.require('./FaucetRegistry.sol');

module.exports = (deployer) => {
  // 24 hour delay
  deployer.deploy(FaucetRegistry, 60 * 60 * 24, false);
  // TODO then mint balances a.map()
};
