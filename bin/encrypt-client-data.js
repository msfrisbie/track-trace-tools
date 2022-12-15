const fs = require("fs");
const CryptoJS = require("crypto-js");

const encryptedDataList = [];

for (let i = 1; ; ++i) {
  const id = i.toString().padStart(3, "0");

  let data, clientName, licenseKey;

  try {
    const rawData = require(`../src/client/decrypted-data/data-${id}.json`);
    const clientInfo = require(`../src/client/secrets/client-keys/client-${id}.json`);

    data = rawData;
    clientName = clientInfo.clientName.trim();
    licenseKey = clientInfo.licenseKey.trim();
  } catch (e) {
    break;
  }

  if (!data) {
    throw new Error("Missing data");
  }
  if (!clientName) {
    throw new Error("Missing clientName");
  }
  if (!licenseKey) {
    throw new Error("Missing licenseKey");
  }

  console.log("Encrypting", clientName);

  encryptedDataList.push({
    id,
    ciphertext: CryptoJS.AES.encrypt(JSON.stringify(data), licenseKey).toString(),
  });
}

fs.writeFileSync(
  `src/client/data/encrypted-data.ts`,
  `export const encryptedData: {id: string, ciphertext: string}[] = ${JSON.stringify(
    encryptedDataList,
    null,
    2
  )};`
);

console.log(`Successfully encrypted ${encryptedDataList.length} payloads`);
