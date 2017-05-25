// script to be used with `truffle console` using `require()`

const http = require('http');
const a = require('awaiting');

const url = 'http://localhost:3000/';

module.exports = async (Contract, address, allowance) => {
  try {
    const contract = Contract.at(Contract.address);
    await contract.setAllowance(address, allowance);
    const result = await a.callback((cb) => {
      http.get(`${url}${address}`, (r) => {
        r.setEncoding('utf8');
        let rawData = '';
        r.on('data', (chunk) => { rawData += chunk; });
        r.on('end', () => {
          try {
            // const parsedData = JSON.parse(rawData);
            cb(null, rawData);
          } catch (e) {
            cb(e);
          }
        });
      });
    });
    console.log(result);
  } catch (e) {
    throw e;
  }
};
