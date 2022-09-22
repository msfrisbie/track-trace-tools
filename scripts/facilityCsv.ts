const fs = require('fs');
var jsonexport = require('jsonexport');

const raw = fs.readFileSync('reference/data/extractedFacilityList.json');
const parsed = JSON.parse(raw);

console.log(Object.keys(parsed.Facilities).length);

jsonexport([...Object.values(parsed.Facilities)], function (err, csv) {
    if (err) return console.log(err);
    fs.writeFile('reference/data/facilities.csv', csv, function () { });
});