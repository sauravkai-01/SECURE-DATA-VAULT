const crypto = require('crypto');
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEY_LEN = 32;
const DIGEST = 'sha256';
const password = "demo";
const saltHex = crypto.randomBytes(16).toString('hex');
const salt = Buffer.from(saltHex, 'hex');
const key = crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LEN, DIGEST);
console.log(key.length);
const iv = crypto.randomBytes(12);
crypto.createCipheriv('aes-256-gcm', key, iv); // wait, signature is algorithm, key, iv!
console.log("Success");
