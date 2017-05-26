// Usage in Truffle:
/*
const data = require('/Users/chris/code/digix/etc-refund/scripts/data/balances-3765660-1495722676586.json');
const p = require('./scripts/populate.js');
p(FaucetRegistry, data);
*/

const a = require('awaiting');

const fundAmount = 2000000000000000;

module.exports = async (Contract, data) => {
  const contract = Contract.at(Contract.address);
  const { balances } = data;
  const keys = Object.keys(balances);
  const step = 9;
  console.log(`Populating ${keys.length} balances...`);
  let i = 0;
  const batches = new Array(Math.floor(keys.length / step)).fill().map((n, j) => keys.slice(j * step, (j * step) + step));
  await a.map(batches, 16, (batch) => {
    i += step;
    const j = i;
    return contract.setManyAllowances(fundAmount, ...batch).then(({ tx }) => {
      const string = batch.map(s => `${s.substring(2, 5)}.${s.substring(39, 42)}`).join(' ');
      console.log(`[${j}/${keys.length}] ${string} ${tx} -> ${fundAmount / 1e18} Ether`);
    });
  });
};
