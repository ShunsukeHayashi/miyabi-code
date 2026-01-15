/**
 * Security Features for AI Course Platform
 * Issue #1300: Rate limiting, audit logging, and anti-cheating measures
 */

import type { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

/**
 * Anti-cheating and content protection measures
 */
export class ContentProtection {
  private static readonly WATERMARK_SALT = process.env.CONTENT_WATERMARK_SALT || 'miyabi-course-salt';

  /**
   * Generate content watermark for user-specific content access
   */
  static generateContentWatermark(userId: string, courseId: string, timestamp: number): string {
    const data = `${userId}:${courseId}:${timestamp}`;
    return crypto
      .createHmac('sha256', this.WATERMARK_SALT)
      .update(data)
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Verify content watermark
   */
  static verifyContentWatermark(
    watermark: string,
    userId: string,
    courseId: string,
    timestamp: number,
    maxAge: number = 3600000, // 1 hour in milliseconds
  ): boolean {
    const now = Date.now();
    if (now - timestamp > maxAge) {
      return false; // Expired
    }

    const expectedWatermark = this.generateContentWatermark(userId, courseId, timestamp);
    return watermark === expectedWatermark;
  }

  /**
   * Generate secure video/content URLs with time-based access
   */
  static generateSecureContentUrl(
    baseUrl: string,
    userId: string,
    courseId: string,
    expiresIn: number = 3600,
  ): string {
    const timestamp = Date.now();
    const expiresAt = timestamp + (expiresIn * 1000);
    const watermark = this.generateContentWatermark(userId, courseId, timestamp);

    const params = new URLSearchParams({
      t: timestamp.toString(),
      e: expiresAt.toString(),
      w: watermark,
      u: userId,
      c: courseId,
    });

    return `${baseUrl}?${params.toString()}`;
  }
}

/**
 * Assessment security measures
 */
export class AssessmentSecurity {
  /**
   * Track assessment attempt patterns to detect cheating
   */
  static async trackAssessmentAttempt(
    userId: string,
    assessmentId: string,
    details: {
      startTime: Date;
      endTime?: Date;
      userAgent: string;
      ip: string;
      windowFocusLoss?: number;
      copyPasteAttempts?: number;
      tabSwitches?: number;
      screenshotAttempts?: number;
    },
  ): Promise<void> {
    // Store in database for analysis
    try {
      await prisma.$executeRaw`
        INSERT INTO assessment_security_logs
        (user_id, assessment_id, start_time, end_time, user_agent, ip_address,
         focus_loss_count, copy_paste_attempts, tab_switches, screenshot_attempts, created_at)
        VALUES (${userId}, ${assessmentId}, ${details.startTime}, ${details.endTime},
                ${details.userAgent}, ${details.ip}, ${details.windowFocusLoss || 0},
                ${details.copyPasteAttempts || 0}, ${details.tabSwitches || 0},
                ${details.screenshotAttempts || 0}, NOW())
        ON CONFLICT (user_id, assessment_id, start_time) DO UPDATE SET
          end_time = EXCLUDED.end_time,
          focus_loss_count = EXCLUDED.focus_loss_count,
          copy_paste_attempts = EXCLUDED.copy_paste_attempts,
          tab_switches = EXCLUDED.tab_switches,
          screenshot_attempts = EXCLUDED.screenshot_attempts
      `;
    } catch (error) {
      console.error('Failed to track assessment attempt:', error);
    }
  }

  /**
   * Analyze assessment attempts for suspicious patterns
   */
  static async analyzeAttemptSecurity(
    userId: string,
    assessmentId: string,
  ): Promise<{
    riskScore: number;
    warnings: string[];
    recommendations: string[];
  }> {
    let riskScore = 0;
    const warnings: string[] = [];
    const recommendations: string[] = [];

    try {
      // Get recent attempts for this assessment
      const attempts = await prisma.$queryRaw<any[]>`
        SELECT * FROM assessment_security_logs
        WHERE user_id = ${userId} AND assessment_id = ${assessmentId}
        ORDER BY start_time DESC
        LIMIT 10
      `;

      if (attempts.length === 0) {
        return { riskScore: 0, warnings: [], recommendations: [] };
      }

      const latestAttempt = attempts[0];

      // Check for excessive tab switches
      if (latestAttempt.tab_switches > 10) {
        riskScore += 25;
        warnings.push('High number of tab switches detected');
        recommendations.push('Review assessment for potential external assistance');
      }

      // Check for copy-paste attempts
      if (latestAttempt.copy_paste_attempts > 5) {
        riskScore += 30;
        warnings.push('Multiple copy-paste attempts detected');
        recommendations.push('Consider oral examination or different assessment format');
      }

      // Check for focus loss
      if (latestAttempt.focus_loss_count > 15) {
        riskScore += 20;
        warnings.push('Frequent window focus loss detected');
        recommendations.push('Verify student attention during assessment');
      }

      // Check for screenshot attempts
      if (latestAttempt.screenshot_attempts > 0) {
        riskScore += 40;
        warnings.push('Screenshot attempts detected');
        recommendations.push('High priority review - potential content theft');
      }

      // Check completion time patterns
      if (latestAttempt.end_time && latestAttempt.start_time) {
        const duration = latestAttempt.end_time.getTime() - latestAttempt.start_time.getTime();
        const durationMinutes = duration / (1000 * 60);

        // Suspiciously fast completion
        if (durationMinutes < 2) {
          riskScore += 35;
          warnings.push('Unusually fast completion time');
          recommendations.push('Verify answer authenticity - possible pre-knowledge');
        }

        // Suspiciously slow completion
        if (durationMinutes > 180) { // 3 hours
          riskScore += 15;
          warnings.push('Unusually slow completion time');
          recommendations.push('Check for external assistance during assessment');
        }
      }

      // Check for multiple IP addresses
      const uniqueIPs = new Set(attempts.map(a => a.ip_address));
      if (uniqueIPs.size > 1) {
        riskScore += 20;
        warnings.push('Multiple IP addresses detected across attempts');
        recommendations.push('Verify user identity and location consistency');
      }

      // Cap risk score at 100
      riskScore = Math.min(riskScore, 100);

      return { riskScore, warnings, recommendations };

    } catch (error) {
      console.error('Failed to analyze attempt security:', error);
      return {
        riskScore: 0,
        warnings: ['Security analysis failed'],
        recommendations: ['Manual review recommended'],
      };
    }
  }
}

/**
 * Advanced rate limiting with adaptive thresholds
 */
export class AdaptiveRateLimit {
  private static readonly rateLimits = new Map<string, RateLimitInfo>();

  /**
   * Check rate limit with adaptive thresholds based on user behavior
   */
  static checkRateLimit(
    identifier: string,
    action: string,
    baseLimit: number = 100,
    windowMs: number = 3600000, // 1 hour
  ): RateLimitResult {
    const key = `${identifier}:${action}`;
    const now = Date.now();

    let info = this.rateLimits.get(key);
    if (!info || now > info.resetTime) {
      info = {
        count: 0,
        resetTime: now + windowMs,
        violations: 0,
        adaptiveLimit: baseLimit,
      };
    }

    // Adaptive limit based on violation history
    if (info.violations > 5) {
      info.adaptiveLimit = Math.floor(baseLimit * 0.5); // Reduce by 50%
    } else if (info.violations > 2) {
      info.adaptiveLimit = Math.floor(baseLimit * 0.75); // Reduce by 25%
    } else {
      info.adaptiveLimit = baseLimit;
    }

    info.count++;
    const allowed = info.count <= info.adaptiveLimit;

    if (!allowed) {
      info.violations++;
    }

    this.rateLimits.set(key, info);

    return {
      allowed,
      remaining: Math.max(0, info.adaptiveLimit - info.count),
      resetTime: info.resetTime,
      violations: info.violations,
    };
  }
}

interface RateLimitInfo {
  count: number;
  resetTime: number;
  violations: number;
  adaptiveLimit: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  violations: number;
}

/**
 * Comprehensive audit logging system
 */
export class AuditLogger {
  /**
   * Log security-related events
   */
  static async logSecurityEvent(
    userId: string | null,
    eventType: SecurityEventType,
    details: SecurityEventDetails,
    request?: NextRequest,
  ): Promise<void> {
    try {
      const logEntry = {
        userId,
        eventType,
        timestamp: new Date(),
        ip: request ? this.extractIP(request) : null,
        userAgent: request?.headers.get('user-agent') || null,
        details: JSON.stringify(details),
      };

      // Store in database
      await prisma.$executeRaw`
        INSERT INTO security_audit_logs
        (user_id, event_type, timestamp, ip_address, user_agent, details)
        VALUES (${logEntry.userId}, ${logEntry.eventType}, ${logEntry.timestamp},
                ${logEntry.ip}, ${logEntry.userAgent}, ${logEntry.details})
      `;

      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('Security Event:', logEntry);
      }

      // Check for alert conditions
      await this.checkAlertConditions(eventType, details, userId);

    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  private static extractIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    return request.ip || 'unknown';
  }

  /**
   * Check if security event should trigger alerts
   */
  private static async checkAlertConditions(
    eventType: SecurityEventType,
    details: SecurityEventDetails,
    userId: string | null,
  ): Promise<void> {
    // High-priority events that require immediate attention
    const highPriorityEvents: SecurityEventType[] = [
      'POTENTIAL_CONTENT_THEFT',
      'MULTIPLE_LOGIN_ATTEMPTS',
      'SUSPICIOUS_ASSESSMENT_BEHAVIOR',
      'UNAUTHORIZED_ACCESS_ATTEMPT',
    ];

    if (highPriorityEvents.includes(eventType)) {
      // In production, this would send alerts to administrators
      console.warn(`HIGH PRIORITY SECURITY EVENT: ${eventType}`, { userId, details });

      // Store alert for admin dashboard
      try {
        await prisma.$executeRaw`
          INSERT INTO security_alerts (event_type, user_id, details, status, created_at)
          VALUES (${eventType}, ${userId}, ${JSON.stringify(details)}, 'ACTIVE', NOW())
        `;
      } catch (error) {
        console.error('Failed to create security alert:', error);
      }
    }
  }
}

export type SecurityEventType =
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILURE'
  | 'LOGOUT'
  | 'PASSWORD_CHANGE'
  | 'PERMISSION_DENIED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'SUSPICIOUS_ASSESSMENT_BEHAVIOR'
  | 'POTENTIAL_CONTENT_THEFT'
  | 'MULTIPLE_LOGIN_ATTEMPTS'
  | 'UNAUTHORIZED_ACCESS_ATTEMPT'
  | 'CONTENT_ACCESS'
  | 'ASSESSMENT_STARTED'
  | 'ASSESSMENT_COMPLETED'
  | 'ENROLLMENT_CREATED'
  | 'ENROLLMENT_MODIFIED';

export interface SecurityEventDetails {
  action?: string;
  resource?: string;
  success?: boolean;
  errorMessage?: string;
  metadata?: Record<string, any>;
}

/**
 * Time-based access control
 */
export class TimeBasedAccess {
  /**
   * Check if access is allowed based on time constraints
   */
  static isAccessAllowed(
    schedule: AccessSchedule,
    timezone: string = 'UTC',
  ): { allowed: boolean; reason?: string; nextAllowedTime?: Date } {
    const now = new Date();

    // Check date range
    if (schedule.startDate && now < schedule.startDate) {
      return {
        allowed: false,
        reason: 'Access not yet available',
        nextAllowedTime: schedule.startDate,
      };
    }

    if (schedule.endDate && now > schedule.endDate) {
      return {
        allowed: false,
        reason: 'Access period has ended',
      };
    }

    // Check time of day restrictions
    if (schedule.allowedHours) {
      const currentHour = now.getUTCHours(); // Simplified - in production, handle timezone properly
      if (!schedule.allowedHours.includes(currentHour)) {
        const nextAllowed = schedule.allowedHours.find(hour => hour > currentHour);
        const nextTime = new Date(now);
        nextTime.setUTCHours(nextAllowed || schedule.allowedHours[0], 0, 0, 0);

        if (!nextAllowed) {
          nextTime.setUTCDate(nextTime.getUTCDate() + 1);
        }

        return {
          allowed: false,
          reason: 'Outside allowed access hours',
          nextAllowedTime: nextTime,
        };
      }
    }

    // Check day of week restrictions
    if (schedule.allowedDays) {
      const currentDay = now.getUTCDay(); // 0 = Sunday, 6 = Saturday
      if (!schedule.allowedDays.includes(currentDay)) {
        return {
          allowed: false,
          reason: 'Access not allowed on this day',
        };
      }
    }

    return { allowed: true };
  }
}

export interface AccessSchedule {
  startDate?: Date;
  endDate?: Date;
  allowedHours?: number[]; // Array of hours (0-23)
  allowedDays?: number[]; // Array of days (0-6, where 0 = Sunday)
  timezone?: string;
}

/**
 * Content integrity verification
 */
export class ContentIntegrity {
  /**
   * Generate content hash for integrity checking
   */
  static generateContentHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /**
   * Verify content hasn't been tampered with
   */
  static verifyContentIntegrity(content: string, expectedHash: string): boolean {
    const actualHash = this.generateContentHash(content);
    return actualHash === expectedHash;
  }

  /**
   * Generate content signature for anti-tampering
   */
  static signContent(content: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(content).digest('hex');
  }

  /**
   * Verify content signature
   */
  static verifyContentSignature(content: string, signature: string, secret: string): boolean {
    const expectedSignature = this.signContent(content, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex'),
    );
  }
}
