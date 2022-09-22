const fs = require('fs');

// let rawdata = fs.readFileSync('package.json');
// let data = JSON.parse(rawdata);
// console.log(data.version);

const { version } = require('../package.json');
fs.writeFileSync('src/version.json', `{ "version": "${version}" }`);
console.log(version);