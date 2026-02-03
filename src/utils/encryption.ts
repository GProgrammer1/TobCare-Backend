import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const KEY = process.env.ENCRYPTION_KEY!

export function encrypt(text: string): string {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(KEY, 'hex'), iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const tag = cipher.getAuthTag();

    // Format: iv:encrypted:tag
    return `${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}`;
}

export function decrypt(encryptedData: string): string {
    const [ivHex, encryptedText, tagHex] = encryptedData.split(':');

    if (!ivHex || !encryptedText || !tagHex) {
        throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(KEY, 'hex'), iv);
    decipher.setAuthTag(tag);

    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/**
 * Deterministic encryption for fields that need @unique constraints or searching.
 * Uses AES-256-CBC with a fixed IV derived from the key.
 */
export function encryptDeterministic(text: string): string {
    const iv = crypto.createHash('sha256').update(KEY).digest().subarray(0, 16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(KEY, 'hex'), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}

export function decryptDeterministic(encrypted: string): string {
    const iv = crypto.createHash('sha256').update(KEY).digest().subarray(0, 16);
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(KEY, 'hex'), iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}

/**
 * Creates a one-way SHA-256 hash of a token.
 * Used for storing reset tokens in the database.
 */
export function hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
}
