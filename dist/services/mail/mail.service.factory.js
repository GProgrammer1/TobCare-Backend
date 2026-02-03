/**
 * Mail service factory – profile-based implementation selection.
 * Similar to Spring Boot @Profile: only the implementation matching
 * the current NODE_ENV (profile) is picked.
 */
import { mailServiceDev } from "./impl/mail.service.dev.js";
import { mailServiceNoop } from "./impl/mail.service.noop.js";
const profile = process.env.NODE_ENV ?? 'development';
function createMailService() {
    if (profile === 'development') {
        return mailServiceDev;
    }
    if (profile === 'production') {
        return mailServiceNoop;
    }
    return mailServiceDev;
}
let instance = null;
export function getMailService() {
    if (!instance) {
        instance = createMailService();
        console.log(`[MailService] Using implementation for profile: ${profile}`);
    }
    return instance;
}
