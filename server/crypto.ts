import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const PBKDF2_ITERATIONS = 100000;
const PBKDF2_KEY_LEN = 32; // 256 bits
const DIGEST = 'sha256';

export function deriveKey(password: string, saltHex: string): Buffer {
  const salt = Buffer.from(saltHex, 'hex');
  return crypto.pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LEN, DIGEST);
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}

export function generateAccessCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

export function encryptData(data: Buffer, key: Buffer): { encrypted: Buffer, iv: string, authTag: Buffer } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag
  };
}

export function decryptData(encrypted: Buffer, key: Buffer, ivHex: string, authTagHex: string): Buffer {
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted;
}

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.pbkdf2Sync(password, Buffer.from(salt, 'hex'), PBKDF2_ITERATIONS, PBKDF2_KEY_LEN, DIGEST);
  return `${salt}:${derivedKey.toString('hex')}`;
}

export function verifyPassword(password: string, hashStr: string): boolean {
  const [salt, key] = hashStr.split(':');
  const derivedKey = crypto.pbkdf2Sync(password, Buffer.from(salt, 'hex'), PBKDF2_ITERATIONS, PBKDF2_KEY_LEN, DIGEST);
  return derivedKey.toString('hex') === key;
}

export function computeHash(data: Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function computeHmac(data: Buffer, key: Buffer): string {
  return crypto.createHmac('sha256', key).update(data).digest('hex');
}
