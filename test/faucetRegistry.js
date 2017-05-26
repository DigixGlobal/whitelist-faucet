const crypto = require('crypto');
const { wait } = require('@digix/tempo')(web3);
const a = require('awaiting');

const FaucetRegistry = artifacts.require('FaucetRegistry.sol');

const bn = web3.toBigNumber;

contract('FaucetRegistry', function (accounts) {
  let faucetRegistry;
  beforeEach(async function () {
    faucetRegistry = await FaucetRegistry.new(10, false);
  });
  describe('initialization', function () {
    it('should initialize with correct values', async function () {
      assert.equal(await faucetRegistry.owner.call(), accounts[0]);
      assert.deepEqual(await faucetRegistry.cooldown.call(), bn(10));
      assert.equal(await faucetRegistry.allowUserRedemptions.call(), false);
    });
  });
  describe('setAllowance', function () {
    it('should allow setting the balance', async function () {
      await faucetRegistry.setAllowance(accounts[0], 100);
      assert.deepEqual(await faucetRegistry.allowances.call(accounts[0]), [bn(100), bn(0)]);
    });
  });
  describe('setOwner', function () {
    it('should allow setting the owner', async function () {
      await faucetRegistry.setOwner(accounts[1]);
      assert.equal(await faucetRegistry.owner.call(), accounts[1]);
    });
  });
  describe('setCooldown', function () {
    it('should allow setting the cooldown', async function () {
      await faucetRegistry.setCooldown(20);
      assert.equal(await faucetRegistry.cooldown.call(), 20);
    });
  });
  describe('fund', function () {
    it('allows admins to fund', async function () {
      const before = await a.callback(web3.eth.getBalance, faucetRegistry.address);
      await faucetRegistry.fund({ value: 100 });
      const after = await a.callback(web3.eth.getBalance, faucetRegistry.address);
      assert.deepEqual(after, before.plus(100));
    });
  });
  describe('redeem', function () {
    it('sets redemption date correctly', async function () {
      await faucetRegistry.setAllowance(accounts[0], 10);
      assert.deepEqual((await faucetRegistry.allowances.call(accounts[0]))[1], bn(0));
      await faucetRegistry.redeem(accounts[0]);
      const { timestamp } = await a.callback(web3.eth.getBlock, 'latest');
      assert.deepEqual((await faucetRegistry.allowances.call(accounts[0]))[1], bn(timestamp));
    });
    it('returns the correct amount if deployed with value', async function () {
      faucetRegistry = await FaucetRegistry.new(10, true);
      await faucetRegistry.fund({ value: 100 });
      await faucetRegistry.setAllowance(accounts[1], 10);
      const userBalance = await a.callback(web3.eth.getBalance, accounts[1]);
      const faucetBalance = await a.callback(web3.eth.getBalance, faucetRegistry.address);
      await faucetRegistry.redeem(accounts[1]);
      assert.deepEqual(await a.callback(web3.eth.getBalance, accounts[1]), userBalance.plus(10));
      assert.deepEqual(await a.callback(web3.eth.getBalance, faucetRegistry.address), faucetBalance.minus(10));
    });
  });
  describe('canRedeem', function () {
    it('should return true or false correctly', async function () {
      // time = 0, lastUsed = 0, balance = 0
      assert.equal(await faucetRegistry.canRedeem.call(accounts[0]), false);
      // time = 0, lastUsed = 0, balacne = 10
      await faucetRegistry.setAllowance(accounts[0], 10);
      assert.equal(await faucetRegistry.canRedeem.call(accounts[0]), true);
      await wait(20);
      // time = 20, lastUsed = 0, balance = 10
      assert.equal(await faucetRegistry.canRedeem.call(accounts[0]), true);
      await faucetRegistry.redeem(accounts[0]);
      // time = 20, lastUsed = 20, balance = 10
      assert.equal(await faucetRegistry.canRedeem.call(accounts[0]), false);
      // time = 20, lastUsed = 20, balance = 10
      await wait(20);
      // time = 40, lastUsed = 20, balance = 10
      assert.equal(await faucetRegistry.canRedeem.call(accounts[0]), true);
      await faucetRegistry.setAllowance(accounts[0], 0);
      // time = 40, lastUsed = 20, balance = 0
      assert.equal(await faucetRegistry.canRedeem.call(accounts[0]), false);
    });
  });
  describe('()', function () {
    it('is a proxy for redeem', async function () {
      await faucetRegistry.setAllowance(accounts[0], 10);
      const before = (await faucetRegistry.allowances.call(accounts[0]))[1];
      await a.callback(web3.eth.sendTransaction, { from: accounts[0], to: faucetRegistry.address });
      assert.ok((await faucetRegistry.allowances.call(accounts[0]))[1].greaterThan(before));
    });
  });
  describe('setManyAllowances', function () {
    it('sets many allowances', async function () {
      const allowances = new Array(9).fill().map(() => `0x${crypto.randomBytes(20).toString('hex')}`);
      await faucetRegistry.setManyAllowances(2, ...allowances);
      const mapped = await a.map(allowances, 10, account => faucetRegistry.allowances.call(account).then(r => r[0]));
      assert.deepEqual(mapped, new Array(9).fill(bn(2)));
    });
  });
});
