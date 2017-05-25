// Usage in Truffle:
/*
const data = require('/Users/chris/code/digix/etc-refund/scripts/data/balances-3765660-1495722676586.json');
const p = require('./scripts/populate.js');
p(web3, FaucetRegistry, data);
*/

const a = require('awaiting');

const fundAmount = 2000000000000000;

module.exports = async (Contract, data) => {
  const contract = Contract.at(Contract.address);
  const { balances } = data;
  const keys = Object.keys(balances);
  console.log(`Populating ${keys.length} balances...`);
  let i = 0;
  await a.map(keys, 10, (key) => {
    i += 1;
    const j = i;
    return contract.setAllowance(key, fundAmount).then(({ tx }) => {
      console.log(`[${j}/${keys.length}] ${key} ${tx} -> ${fundAmount / 1e18} Ether`);
    });
  });
};
