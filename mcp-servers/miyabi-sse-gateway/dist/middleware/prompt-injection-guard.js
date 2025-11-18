import winston from 'winston';
const logger = winston.createLogger({
    level: 'warn',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    transports: [
        new winston.transports.File({ filename: 'logs/security.log' })
    ]
});
// Dangerous patterns that indicate potential prompt injection
const DANGEROUS_PATTERNS = [
    // Direct instruction overrides
    /ignore\s+(all\s+)?(previous|prior|above)\s+instructions?/i,
    /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions?|commands?)/i,
    /forget\s+(all\s+)?(previous|prior|above)\s+instructions?/i,
    // System prompt manipulation
    /system\s*:\s*(you\s+are|act\s+as|behave\s+as)/i,
    /you\s+are\s+now\s+(a|an)\s+/i,
    /new\s+instructions?\s*:/i,
    /override\s+(system|default)\s+(prompt|instructions?)/i,
    // Code injection attempts
    /<\s*script\s*>/i,
    /eval\s*\(/i,
    /exec\s*\(/i,
    /system\s*\(/i,
    /spawn\s*\(/i,
    // File system manipulation
    /rm\s+-rf/i,
    /del\s+\/[fs]/i,
    /\.\.\/\.\.\//, // Path traversal
    // Privilege escalation
    /sudo\s+/i,
    /su\s+-/i,
    /chmod\s+777/i,
    // Data exfiltration attempts
    /send\s+(all\s+)?(data|information|credentials|passwords?)\s+to/i,
    /forward\s+(all\s+)?(data|information)\s+to/i,
    /leak\s+(all\s+)?/i,
    // Role manipulation
    /you\s+are\s+not\s+(an\s+)?AI/i,
    /pretend\s+(you\s+are|to\s+be)/i,
    /roleplay\s+as/i
];
// Keywords that warrant additional scrutiny
const SUSPICIOUS_KEYWORDS = [
    'jailbreak',
    'DAN mode',
    'developer mode',
    'god mode',
    'unrestricted',
    'uncensored',
    'override safety'
];
export function checkPromptInjection(text) {
    if (!text || typeof text !== 'string') {
        return { isSafe: true, threat: null, pattern: null, severity: 'low' };
    }
    // Check for dangerous patterns
    for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(text)) {
            return {
                isSafe: false,
                threat: 'Potential prompt injection detected',
                pattern: pattern.toString(),
                severity: 'critical'
            };
        }
    }
    // Check for suspicious keywords
    const lowerText = text.toLowerCase();
    for (const keyword of SUSPICIOUS_KEYWORDS) {
        if (lowerText.includes(keyword)) {
            return {
                isSafe: false,
                threat: 'Suspicious keyword detected',
                pattern: keyword,
                severity: 'medium'
            };
        }
    }
    return { isSafe: true, threat: null, pattern: null, severity: 'low' };
}
export const promptInjectionGuard = (req, res, next) => {
    try {
        // Check request body
        const bodyText = JSON.stringify(req.body);
        const bodyCheck = checkPromptInjection(bodyText);
        if (!bodyCheck.isSafe) {
            logger.warn('Prompt injection attempt blocked', {
                ip: req.ip,
                path: req.path,
                method: req.method,
                threat: bodyCheck.threat,
                pattern: bodyCheck.pattern,
                severity: bodyCheck.severity,
                userAgent: req.headers['user-agent'],
                timestamp: new Date().toISOString()
            });
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Potentially malicious content detected',
                code: 'PROMPT_INJECTION_DETECTED'
            });
        }
        // Check query parameters
        const queryText = JSON.stringify(req.query);
        const queryCheck = checkPromptInjection(queryText);
        if (!queryCheck.isSafe) {
            logger.warn('Prompt injection attempt in query parameters', {
                ip: req.ip,
                path: req.path,
                threat: queryCheck.threat,
                pattern: queryCheck.pattern,
                severity: queryCheck.severity,
                timestamp: new Date().toISOString()
            });
            return res.status(400).json({
                error: 'Bad Request',
                message: 'Potentially malicious query parameters detected',
                code: 'PROMPT_INJECTION_DETECTED'
            });
        }
        next();
    }
    catch (error) {
        logger.error('Error in prompt injection guard', {
            error: error instanceof Error ? error.message : String(error),
            ip: req.ip,
            path: req.path
        });
        // Fail closed - reject request on error
        return res.status(500).json({
            error: 'Internal Server Error',
            message: 'Security check failed'
        });
    }
};
