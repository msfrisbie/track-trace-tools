const fs = require('fs');



const MANIFEST_PATH = 'dist/manifest.json';

exports.removeLocalRefs = function (urlList) {
    return urlList.filter(x => !x.includes('local'))
}

exports.getManifestBody = function () {
    return fs.readFileSync(MANIFEST_PATH);
}

exports.writeManifest = function (manifestBody) {
    fs.writeFileSync(MANIFEST_PATH, manifestBody);
}