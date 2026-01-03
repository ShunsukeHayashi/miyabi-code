/**
 * Security Configuration for AI Course Platform
 * Centralized security settings and policies
 */

export const SECURITY_CONFIG = {
  // JWT Configuration
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: '1h',
    issuer: 'ai-course-platform',
    audience: 'course-users',
    algorithm: 'HS256' as const
  },

  // Password Policy
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days in milliseconds
    historySize: 5, // Remember last 5 passwords
    lockoutAttempts: 5,
    lockoutDuration: 15 * 60 * 1000 // 15 minutes
  },

  // Rate Limiting
  rateLimiting: {
    auth: {
      window: 15 * 60 * 1000, // 15 minutes
      max: 5, // 5 attempts per window
      skipSuccessfulRequests: true
    },
    api: {
      window: 60 * 1000, // 1 minute
      max: 100, // 100 requests per minute
      standardHeaders: true
    },
    ai: {
      window: 60 * 1000, // 1 minute
      max: 10, // 10 AI requests per minute
      skipSuccessfulRequests: false
    },
    upload: {
      window: 60 * 1000, // 1 minute
      max: 5, // 5 uploads per minute
      skipFailedRequests: true
    }
  },

  // Session Management
  session: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    updateAge: 60 * 60 * 1000, // 1 hour
    rolling: true,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const
  },

  // CORS Settings
  cors: {
    origin: process.env.NODE_ENV === 'production'
      ? process.env.ALLOWED_ORIGINS?.split(',') || []
      : ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
    optionsSuccessStatus: 200,
    maxAge: 86400 // 24 hours
  },

  // Content Security Policy
  csp: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: [
        "'self'",
        "'unsafe-eval'", // Required for Next.js dev
        "'unsafe-inline'", // Required for some components
        'https://apis.google.com',
        'https://accounts.google.com'
      ],
      styleSrc: [
        "'self'",
        "'unsafe-inline'",
        'https://fonts.googleapis.com'
      ],
      fontSrc: [
        "'self'",
        'https://fonts.gstatic.com'
      ],
      imgSrc: [
        "'self'",
        'data:',
        'https:',
        'blob:'
      ],
      mediaSrc: [
        "'self'",
        'blob:',
        'https:'
      ],
      connectSrc: [
        "'self'",
        'https://api.anthropic.com',
        'https://generativelanguage.googleapis.com',
        'wss://localhost:*',
        'ws://localhost:*'
      ],
      frameSrc: [
        "'self'",
        'https://www.youtube.com'
      ],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production'
    }
  },

  // File Upload Security
  upload: {
    maxFileSize: {
      image: 5 * 1024 * 1024, // 5MB
      video: 500 * 1024 * 1024, // 500MB
      document: 10 * 1024 * 1024, // 10MB
      default: 1 * 1024 * 1024 // 1MB
    },
    allowedMimeTypes: {
      image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
      video: ['video/mp4', 'video/webm', 'video/quicktime', 'video/avi'],
      document: ['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
      audio: ['audio/mpeg', 'audio/wav', 'audio/webm']
    },
    quarantineTime: 60 * 60 * 1000, // 1 hour before virus scan
    virusScanEnabled: process.env.VIRUS_SCAN_ENABLED === 'true'
  },

  // Data Protection
  dataProtection: {
    encryption: {
      algorithm: 'aes-256-gcm',
      keyDerivationIterations: 100000,
      saltLength: 32,
      ivLength: 16
    },
    hashing: {
      algorithm: 'bcrypt',
      saltRounds: 12
    },
    anonymization: {
      retentionPeriod: 365 * 24 * 60 * 60 * 1000, // 1 year
      deletionBatchSize: 1000
    }
  },

  // Monitoring and Alerting
  monitoring: {
    failedLoginThreshold: 10,
    suspiciousActivityThreshold: 50,
    errorRateThreshold: 0.05, // 5% error rate
    responseTimeThreshold: 5000, // 5 seconds
    alertCooldown: 5 * 60 * 1000, // 5 minutes
    logLevel: process.env.LOG_LEVEL || 'info'
  },

  // API Security
  api: {
    maxRequestSize: 10 * 1024 * 1024, // 10MB
    timeoutMs: 30000, // 30 seconds
    compressionEnabled: true,
    etagEnabled: true,
    trustProxy: process.env.NODE_ENV === 'production'
  },

  // AI Security
  ai: {
    maxPromptLength: 10000,
    maxResponseLength: 50000,
    contentFiltering: true,
    promptInjectionDetection: true,
    rateLimit: {
      requestsPerMinute: 10,
      tokensPerMinute: 100000
    },
    allowedModels: [
      'gemini-2.0-flash-thinking-exp',
      'gemini-2.0-flash-exp',
      'gemini-1.5-flash'
    ]
  }
};

/**
 * Environment-specific overrides
 */
export const getSecurityConfig = () => {
  const config = { ...SECURITY_CONFIG };

  if (process.env.NODE_ENV === 'development') {
    // Relax some restrictions for development
    config.cors.origin = ['http://localhost:3000', 'http://localhost:3001'];
    config.csp.directives.connectSrc.push('http://localhost:*');
    config.rateLimiting.api.max = 1000; // Higher limits for development
  }

  if (process.env.NODE_ENV === 'test') {
    // More permissive for testing
    config.rateLimiting.api.max = 10000;
    config.rateLimiting.ai.max = 1000;
    config.password.minLength = 4; // Simpler passwords for tests
  }

  return config;
};

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  // Content Security Policy
  'Content-Security-Policy': Object.entries(SECURITY_CONFIG.csp.directives)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; '),

  // Security headers
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': [
    'camera=()',
    'microphone=()',
    'geolocation=()',
    'payment=()',
    'usb=()',
    'accelerometer=()',
    'gyroscope=()',
    'magnetometer=()'
  ].join(', '),

  // Additional headers
  'X-DNS-Prefetch-Control': 'off',
  'X-Download-Options': 'noopen',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Resource-Policy': 'same-site'
};

/**
 * Validate security configuration on startup
 */
export function validateSecurityConfig(): void {
  const requiredEnvVars = [
    'JWT_SECRET',
    'NEXTAUTH_SECRET'
  ];

  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  // Validate JWT secret strength
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }

  // Validate CORS origins in production
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOWED_ORIGINS) {
    console.warn('WARNING: ALLOWED_ORIGINS not set in production. CORS will use default origins.');
  }

  console.log('✅ Security configuration validated successfully');
}

/**
 * Security event types for monitoring
 */
export const SECURITY_EVENTS = {
  AUTHENTICATION_FAILED: 'auth.failed',
  AUTHENTICATION_SUCCESS: 'auth.success',
  AUTHORIZATION_FAILED: 'authz.failed',
  RATE_LIMIT_EXCEEDED: 'rate_limit.exceeded',
  SUSPICIOUS_ACTIVITY: 'suspicious.activity',
  FILE_UPLOAD_REJECTED: 'upload.rejected',
  CORS_VIOLATION: 'cors.violation',
  CSP_VIOLATION: 'csp.violation',
  XSS_ATTEMPT: 'xss.attempt',
  SQL_INJECTION_ATTEMPT: 'sqli.attempt',
  PROMPT_INJECTION_ATTEMPT: 'prompt_injection.attempt'
} as const;

export type SecurityEvent = typeof SECURITY_EVENTS[keyof typeof SECURITY_EVENTS];