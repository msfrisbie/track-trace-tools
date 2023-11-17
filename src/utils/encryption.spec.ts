import { decrypt, encrypt } from './encryption';

describe('encryption.ts', () => {
  it('encrypts and decrypts successfully', () => {
    const secretKey = 'abcdefg';
    const data = [{ id: 123 }, { id: 456 }];

    const ciphertext = encrypt({ data, secretKey });

    const result = decrypt({ ciphertext, secretKey });

    expect(result).toEqual(data);
  });

  it('fails to decrypt with bad key', () => {
    const secretKey = 'abcdefg';
    const data = [{ id: 123 }, { id: 456 }];

    const ciphertext = encrypt({ data, secretKey });

    expect(() => decrypt({ ciphertext, secretKey: 'badkey' })).toThrowError();
  });
});
