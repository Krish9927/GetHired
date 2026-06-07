// Personal email domains that are NOT allowed for company verification
const PERSONAL_EMAIL_DOMAINS = [
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "rediffmail.com",
    "ymail.com", "aol.com", "icloud.com", "protonmail.com", "live.com",
    "msn.com", "me.com", "inbox.com", "mail.com", "zoho.com",
];

// Scam/fake job indicator phrases
const SCAM_PHRASES = [
    "registration fee", "pay first", "security deposit", "processing fee",
    "training fee", "joining fee", "refundable deposit", "advance payment",
    "send money", "wire transfer", "western union", "money gram",
    "work from home earn", "earn per day", "no experience required earn",
    "guaranteed income", "100% placement", "immediate joining bonus",
    "part time earn lakhs", "data entry earn", "typing work earn",
];

/**
 * Check if an email is a personal/free email (not allowed for company)
 */
export const isPersonalEmail = (email) => {
    if (!email) return true;
    const domain = email.split("@")[1]?.toLowerCase();
    return PERSONAL_EMAIL_DOMAINS.includes(domain);
};

/**
 * Extract domain from email
 */
export const getDomainFromEmail = (email) => {
    if (!email) return null;
    return email.split("@")[1]?.toLowerCase() || null;
};

/**
 * Extract domain from URL
 */
export const getDomainFromUrl = (url) => {
    if (!url) return null;
    try {
        const cleaned = url.startsWith("http") ? url : `https://${url}`;
        const parsed = new URL(cleaned);
        return parsed.hostname.replace(/^www\./, "").toLowerCase();
    } catch {
        return null;
    }
};

/**
 * Check if website uses HTTPS
 */
export const isHttpsWebsite = (url) => {
    if (!url) return false;
    return url.trim().toLowerCase().startsWith("https://");
};

/**
 * Check if email domain matches website domain
 */
export const doDomainsMatch = (emailDomain, websiteDomain) => {
    if (!emailDomain || !websiteDomain) return false;
    return emailDomain === websiteDomain || websiteDomain.endsWith(`.${emailDomain}`);
};

/**
 * Detect scam/fake phrases in job posting
 * Returns array of matched phrases
 */
export const detectScamPhrases = (text) => {
    if (!text) return [];
    const lower = text.toLowerCase();
    return SCAM_PHRASES.filter((phrase) => lower.includes(phrase));
};

/**
 * Calculate company trust score (0-100)
 *
 * Weights:
 *  Email verified (non-personal)  → 25 pts
 *  Website uses HTTPS             → 20 pts
 *  Email domain matches website   → 20 pts
 *  LinkedIn page added            → 15 pts
 *  GST/CIN number provided        → 20 pts
 */
export const calculateCompanyTrustScore = (company) => {
    let score = 0;

    if (company.isEmailVerified && !isPersonalEmail(company.companyEmail)) score += 25;
    if (company.isWebsiteHttps) score += 20;
    if (company.isDomainMatched) score += 20;
    if (company.linkedinUrl) score += 15;
    if (company.gstNumber || company.cinNumber) score += 20;

    return Math.min(100, score);
};
