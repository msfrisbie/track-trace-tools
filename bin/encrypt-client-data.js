const fs = require("fs");
const CryptoJS = require("crypto-js");

for (let i = 1; ; ++i) {
  const id = i.toString().padStart(3, "0");

  let data, name, licenseKey;

  try {
    const rawData = require(`../src/client/decrypted-data/data-${id}.json`);
    const clientInfo = require(`../src/client/secrets/client-keys/client-${id}.json`);

    data = rawData;
    name = clientInfo.name;
    licenseKey = clientInfo.licenseKey;
  } catch (e) {
    break;
  }

  console.log("Encrypting", name);

  const encryptedData = CryptoJS.AES.encrypt(JSON.stringify(data), licenseKey).toString();

  fs.writeFileSync(
    `src/client/data/data-${id}.ts`,
    `export const encryptedData: string = "${encryptedData}" }`
  );

  console.log("Successfully encrypted", name);
}
