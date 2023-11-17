import { encryptedData } from '@/client/data/encrypted-data';
import { IClientConfig } from '@/interfaces';
import CryptoJS from 'crypto-js';

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

export function getMatchingDecryptedDataOrNull(secretKey: string): IClientConfig | null {
  if (!secretKey) {
    console.log('No secret key provided');
    return null;
  }

  for (const data of encryptedData) {
    const { ciphertext } = data;
    try {
      return decrypt({ ciphertext, secretKey }) as IClientConfig;
    } catch (e) {
      continue;
    }
  }

  console.error('No match for provided secret key');

  return null;
}
