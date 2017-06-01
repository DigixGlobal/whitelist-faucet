const Web3 = require('web3');
const Koa = require('koa');
const Router = require('koa-router');
const a = require('awaiting');
const contract = require('truffle-contract');
const config = require('../truffle.js');

const data = require('./balances-3800000.json');

const dbChain = 'kovan';
const targetChain = process.argv[2] || 'kovan';

const balance = 0.006e18;

const web3 = {
  db: new Web3(config.networks[dbChain].provider),
  target: new Web3(config.networks[targetChain].provider),
};

const registryInfo = require('../build/contracts/FaucetRegistry.json');

let FaucetRegistry;

try {
  FaucetRegistry = contract(registryInfo);
  FaucetRegistry.setProvider(config.networks[dbChain].provider);
  FaucetRegistry.setNetwork(config.networks[dbChain].network_id);
} catch (e) {
  throw new Error('Could not Set the network network');
}

// gset the default addres

// let faucetRegistry;
let from;
web3.db.eth.getAccounts((e, r) => {
  from = r[0];
});

// FaucetRegistry.deployed().then((f) => {
//   // faucetRegistry = f;
// });

const app = new Koa();
const router = new Router();

const redeemed = {};

router.get('/faucet/:address', async (ctx, next) => {
  const { address } = ctx.params;
  console.log('get', address);
  // validate
  if (!web3.db.isAddress(address)) {
    ctx.body = 'Not a valid address';
    return next();
  }
  // check the smart contract
  // const [balance] = await faucetRegistry.allowances.call(address);
  // const canRedeem = balance && balance.toNumber() > 0 && !redeemed[address];
  const canRedeem = data.balances[address.toLowerCase()] && !redeemed[address];
  // let canRedeem = await faucetRegistry.canRedeem.call(address);
  // const cooldown = await faucetRegistry.cooldown.call();
  // const owner = await faucetRegistry.owner.call();

  ctx.body = `
Ether Faucet
============

Provided by DigixGlobal https://digix.io

Target Network: ${targetChain}

`;

  if (canRedeem) {
    redeemed[address] = true;
    // try to redeem! update the registry, will throw if there's any issues
    // try {
    //   ctx.body += `Processing redemption for ${address}...\n\n`;
    //   // await faucetRegistry.redeem(address, { from, gas: 4000000 });
    //   // update the info
    //   [balance, lastUsed] = await faucetRegistry.allowances.call(address);
    //   canRedeem = await faucetRegistry.canRedeem.call(address);
    // } catch (e) {
    //   ctx.body += 'Error updating registry!';
    //   return next();
    // }
    // then send the tx on mainnet to the user
    const tx = await a.callback(web3.target.eth.sendTransaction, { to: address, value: balance, from });
    ctx.body += `✅ Redemption of ${web3.target.toBigNumber(balance).shift(-18).toFormat()} Ether Processed!\n\nTX: ${tx}\n`;
  } else {
    // const timeSinceUsed = ((new Date() / 1000) - lastUsed);
    // const diff = cooldown - timeSinceUsed;
    // const minutes = diff <= 0 ? 0 : Math.ceil(diff / 60);
    ctx.body += `❌ Could not redeem` //` - cooldown runs out in ${minutes} minutes\n`;
  }
  return next();
});

app
.use(router.routes())
.use(router.allowedMethods())
.listen(3000);
