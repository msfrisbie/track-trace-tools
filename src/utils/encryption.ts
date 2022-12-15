import CryptoJS from "crypto-js";

export function encrypt({
  data,
  secretKey,
}: {
  data: Object | Array<any>;
  secretKey: string;
}): string {
  return CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
}

export function decrypt({
  ciphertext,
  secretKey,
}: {
  ciphertext: string;
  secretKey: string;
}): Object | Array<any> {
  const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}
