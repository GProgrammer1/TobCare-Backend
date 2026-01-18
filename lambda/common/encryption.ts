
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-cbc';
// In a real scenario, this key should be loaded from a secure secret store (e.g. AWS Secrets Manager)
// For this implementation, we rely on the environment variable 'ENCRYPTION_KEY'.
// The key must be 32 bytes (256 bits). If the provided key is shorter/longer, we might need to hash it.
const getKey = () => {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error("ENCRYPTION_KEY not set");
    }
    // Ensure key is 32 bytes. If string, we can hash it to get 32 bytes or require hex.
    // Simplifying: User should provide a 32-char string or we create a buffer.
    // Let's use a hash of the key to ensure 32 bytes.
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(String(key)).digest();
};

export const encrypt = (text: string): string => {
    const iv = randomBytes(16);
    const cipher = createCipheriv(ALGORITHM, getKey(), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    // Return IV:Ciphertext
    return iv.toString('hex') + ':' + encrypted.toString('hex');
};

export const decrypt = (text: string): string => {
    const textParts = text.split(':');
    if (textParts.length !== 2) throw new Error("Invalid encrypted text format");

    const iv = Buffer.from(textParts[0], 'hex');
    const encryptedText = Buffer.from(textParts[1], 'hex');
    const decipher = createDecipheriv(ALGORITHM, getKey(), iv);

    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
};
