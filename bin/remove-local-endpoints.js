const utils = require("./utils");

const manifestData = JSON.parse(utils.getManifestBody());

manifestData["permissions"] = utils.removeLocalRefs(manifestData["permissions"]);
manifestData["optional_permissions"] = utils.removeLocalRefs(manifestData["optional_permissions"]);

for (const contentScript of manifestData["content_scripts"]) {
  contentScript["matches"] = utils.removeLocalRefs(contentScript["matches"]);
}

utils.writeManifest(JSON.stringify(manifestData));

// Read the file out again and make sure the replacement worked
const redundantReadManifestJson = utils.getManifestBody();

const BLACKLIST = ["localhost"];

for (const blacklistEntry of BLACKLIST) {
  if (redundantReadManifestJson.includes(blacklistEntry)) {
    console.error(blacklistEntry);
    console.error("\n\n\n\nERROR: LOCAL REF REMOVAL FAILED. Do not continue.\n\n\n\n");
    process.exit(1);
  }
}

console.log("\n\nSuccessfully removed local endpoints\n\n");
