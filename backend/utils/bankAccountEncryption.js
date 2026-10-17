'use strict';

const crypto = require('crypto');

function getEncryptionKey() {
  const value = process.env.BANK_ACCOUNT_ENCRYPTION_KEY || '';
  if (!/^[0-9a-f]{64}$/i.test(value)) {
    throw new Error('BANK_ACCOUNT_ENCRYPTION_KEY must be a 32-byte hex key');
  }
  return Buffer.from(value, 'hex');
}

function encryptBankDetails(details) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(details), 'utf8'),
    cipher.final()
  ]);
  return [
    'v1',
    iv.toString('base64'),
    cipher.getAuthTag().toString('base64'),
    ciphertext.toString('base64')
  ].join('.');
}

function decryptBankDetails(value) {
  const [version, encodedIv, encodedTag, encodedCiphertext] = String(value).split('.');
  if (version !== 'v1' || !encodedIv || !encodedTag || !encodedCiphertext) {
    throw new Error('Unsupported encrypted bank account data');
  }

  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    getEncryptionKey(),
    Buffer.from(encodedIv, 'base64')
  );
  decipher.setAuthTag(Buffer.from(encodedTag, 'base64'));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encodedCiphertext, 'base64')),
    decipher.final()
  ]);
  return JSON.parse(plaintext.toString('utf8'));
}

module.exports = { encryptBankDetails, decryptBankDetails };