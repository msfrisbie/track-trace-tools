const fs = require('fs');
const utils = require('./utils')

const scriptFiles = fs.readdirSync('dist/css');

const contentScriptCss = scriptFiles.find(x => x.startsWith('content-script'));

if (!contentScriptCss) {
    throw new Error('\n\n\n\nERROR: CONTENT SCRIPT NOT FOUND. Do not continue.\n\n\n\n')
}

const contentScriptCssPath = `css/${contentScriptCss}`;


const manifestData = JSON.parse(utils.getManifestBody());


for (const contentScript of manifestData['content_scripts']) {
    if (contentScript['run_at'] === 'document_end') {
        contentScript['css'] = [contentScriptCssPath];
        break;
    }
}

utils.writeManifest(JSON.stringify(manifestData))

// Read the file out again and make sure the replacement worked
const redundantReadManifestJson = utils.getManifestBody();

if (!redundantReadManifestJson.includes(contentScriptCssPath)) {
    console.error('\n\n\n\nERROR: CONTENT SCRIPT CSS ADDITION FAILED. Do not continue.\n\n\n\n');
    process.exit(1);
}

console.log('\n\nSuccessfully added content script.\n\n');