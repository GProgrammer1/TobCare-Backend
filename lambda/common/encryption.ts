
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-cbc';
 
const getKey = () => {
    const key = process.env.ENCRYPTION_KEY;
    if (!key) {
        throw new Error("ENCRYPTION_KEY not set");
    }
    
    const crypto = require('crypto');
    return crypto.createHash('sha256').update(String(key)).digest();
};

export const encrypt = (text: string): string => {
    const iv = randomBytes(16);
    const cipher = createCipheriv(ALGORITHM, getKey(), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
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
