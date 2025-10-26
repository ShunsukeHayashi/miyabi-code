/**
 * Session Manager for Multi-Step Workflows
 *
 * Maintains conversation history across decision points (D3-D7)
 * to preserve context in autonomous task processing.
 *
 * Features:
 * - File-based persistence (survives crashes)
 * - In-memory cache (fast access)
 * - Automatic cleanup
 * - Session resumption
 */

import * as fs from 'fs';
import * as path from 'path';
import { randomBytes } from 'crypto';

export interface SessionState {
  id: string;
  issueNumber: number;
  complexity?: 'Low' | 'Medium' | 'High';
  worktree?: string;
  createdAt: string;
  lastAccessedAt: string;
  conversationHistory: ConversationTurn[];
  metadata: Record<string, any>;
  status: 'active' | 'completed' | 'failed';
}

export interface ConversationTurn {
  step: string; // e.g., "D3-TaskDecomposition", "D5-CodeGeneration"
  prompt: string;
  response: string;
  timestamp: string;
  duration?: number;
  tokenUsage?: {
    input: number;
    output: number;
  };
}

export class Session {
  private state: SessionState;
  private sessionDir: string;
  private manager: SessionManager;

  constructor(state: SessionState, sessionDir: string, manager: SessionManager) {
    this.state = state;
    this.sessionDir = sessionDir;
    this.manager = manager;
  }

  /**
   * Get session ID
   */
  get id(): string {
    return this.state.id;
  }

  /**
   * Get issue number
   */
  get issueNumber(): number {
    return this.state.issueNumber;
  }

  /**
   * Get conversation history
   */
  get history(): ConversationTurn[] {
    return this.state.conversationHistory;
  }

  /**
   * Get session status
   */
  get status(): string {
    return this.state.status;
  }

  /**
   * Add a conversation turn
   */
  addTurn(turn: ConversationTurn): void {
    this.state.conversationHistory.push(turn);
    this.state.lastAccessedAt = new Date().toISOString();
    this.save();
  }

  /**
   * Update session metadata
   */
  setMetadata(key: string, value: any): void {
    this.state.metadata[key] = value;
    this.state.lastAccessedAt = new Date().toISOString();
    this.save();
  }

  /**
   * Get metadata value
   */
  getMetadata(key: string): any {
    return this.state.metadata[key];
  }

  /**
   * Mark session as completed
   */
  complete(): void {
    this.state.status = 'completed';
    this.state.lastAccessedAt = new Date().toISOString();
    this.save();
  }

  /**
   * Mark session as failed
   */
  fail(reason?: string): void {
    this.state.status = 'failed';
    if (reason) {
      this.state.metadata.failureReason = reason;
    }
    this.state.lastAccessedAt = new Date().toISOString();
    this.save();
  }

  /**
   * Get full context summary for LLM
   */
  getContextSummary(): string {
    const lines: string[] = [];

    lines.push(`Session ID: ${this.state.id}`);
    lines.push(`Issue: #${this.state.issueNumber}`);

    if (this.state.complexity) {
      lines.push(`Complexity: ${this.state.complexity}`);
    }

    if (this.state.worktree) {
      lines.push(`Worktree: ${this.state.worktree}`);
    }

    lines.push('');
    lines.push('Previous Steps:');

    for (const turn of this.state.conversationHistory) {
      lines.push('');
      lines.push(`[${turn.step}] ${turn.timestamp}`);
      lines.push(`Prompt: ${turn.prompt.substring(0, 100)}...`);
      lines.push(`Response: ${turn.response.substring(0, 200)}...`);
    }

    return lines.join('\n');
  }

  /**
   * Save session state to disk
   */
  private save(): void {
    const filePath = path.join(this.sessionDir, `${this.state.id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(this.state, null, 2));
  }

  /**
   * Destroy session (cleanup)
   */
  destroy(): void {
    this.manager.destroy(this.state.id);
  }
}

export class SessionManager {
  private sessionDir: string;
  private cache: Map<string, Session>;
  private maxCacheSize: number;

  constructor(sessionDir: string = '/tmp/miyabi-sessions', maxCacheSize: number = 100) {
    this.sessionDir = sessionDir;
    this.cache = new Map();
    this.maxCacheSize = maxCacheSize;

    // Ensure session directory exists
    if (!fs.existsSync(this.sessionDir)) {
      fs.mkdirSync(this.sessionDir, { recursive: true });
    }

    // Load existing sessions into cache (up to maxCacheSize)
    this.loadExistingSessions();
  }

  /**
   * Load existing sessions from disk
   */
  private loadExistingSessions(): void {
    try {
      const files = fs.readdirSync(this.sessionDir);
      const sessionFiles = files
        .filter(f => f.endsWith('.json'))
        .sort((a, b) => {
          const statA = fs.statSync(path.join(this.sessionDir, a));
          const statB = fs.statSync(path.join(this.sessionDir, b));
          return statB.mtimeMs - statA.mtimeMs; // Most recent first
        })
        .slice(0, this.maxCacheSize);

      for (const file of sessionFiles) {
        const filePath = path.join(this.sessionDir, file);
        const state = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as SessionState;
        const session = new Session(state, this.sessionDir, this);
        this.cache.set(state.id, session);
      }
    } catch (error) {
      console.warn('Failed to load existing sessions:', error);
    }
  }

  /**
   * Create a new session
   */
  create(options: {
    issueNumber: number;
    complexity?: 'Low' | 'Medium' | 'High';
    worktree?: string;
    metadata?: Record<string, any>;
  }): Session {
    const id = this.generateSessionId();
    const now = new Date().toISOString();

    const state: SessionState = {
      id,
      issueNumber: options.issueNumber,
      complexity: options.complexity,
      worktree: options.worktree,
      createdAt: now,
      lastAccessedAt: now,
      conversationHistory: [],
      metadata: options.metadata || {},
      status: 'active'
    };

    const session = new Session(state, this.sessionDir, this);

    // Save to disk
    const filePath = path.join(this.sessionDir, `${id}.json`);
    fs.writeFileSync(filePath, JSON.stringify(state, null, 2));

    // Add to cache
    this.cache.set(id, session);

    // Evict old sessions if cache is full
    this.evictOldSessions();

    return session;
  }

  /**
   * Resume existing session
   */
  resume(sessionId: string): Session | null {
    // Check cache first
    if (this.cache.has(sessionId)) {
      return this.cache.get(sessionId)!;
    }

    // Load from disk
    const filePath = path.join(this.sessionDir, `${sessionId}.json`);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const state = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as SessionState;
      const session = new Session(state, this.sessionDir, this);
      this.cache.set(sessionId, session);
      return session;
    } catch (error) {
      console.error('Failed to resume session:', error);
      return null;
    }
  }

  /**
   * Find session by issue number
   */
  findByIssue(issueNumber: number): Session[] {
    const sessions: Session[] = [];

    // Check cache
    for (const session of this.cache.values()) {
      if (session.issueNumber === issueNumber) {
        sessions.push(session);
      }
    }

    // Check disk (if not in cache)
    try {
      const files = fs.readdirSync(this.sessionDir);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(this.sessionDir, file);
        const state = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as SessionState;

        if (state.issueNumber === issueNumber && !this.cache.has(state.id)) {
          const session = new Session(state, this.sessionDir, this);
          sessions.push(session);
        }
      }
    } catch (error) {
      console.warn('Failed to search sessions:', error);
    }

    return sessions;
  }

  /**
   * Get most recent session for issue
   */
  getLatestForIssue(issueNumber: number): Session | null {
    const sessions = this.findByIssue(issueNumber);

    if (sessions.length === 0) {
      return null;
    }

    // Sort by lastAccessedAt descending
    sessions.sort((a, b) => {
      const timeA = new Date(a.history[a.history.length - 1]?.timestamp || a.id).getTime();
      const timeB = new Date(b.history[b.history.length - 1]?.timestamp || b.id).getTime();
      return timeB - timeA;
    });

    return sessions[0];
  }

  /**
   * List all active sessions
   */
  listActive(): Session[] {
    const sessions: Session[] = [];

    try {
      const files = fs.readdirSync(this.sessionDir);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(this.sessionDir, file);
        const state = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as SessionState;

        if (state.status === 'active') {
          const session = this.cache.get(state.id) || new Session(state, this.sessionDir, this);
          sessions.push(session);
        }
      }
    } catch (error) {
      console.error('Failed to list sessions:', error);
    }

    return sessions;
  }

  /**
   * Destroy session (delete from cache and disk)
   */
  destroy(sessionId: string): void {
    // Remove from cache
    this.cache.delete(sessionId);

    // Delete file
    const filePath = path.join(this.sessionDir, `${sessionId}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /**
   * Cleanup old sessions
   */
  cleanup(olderThanDays: number = 7): number {
    let deletedCount = 0;
    const cutoffTime = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;

    try {
      const files = fs.readdirSync(this.sessionDir);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = path.join(this.sessionDir, file);
        const stats = fs.statSync(filePath);

        if (stats.mtimeMs < cutoffTime) {
          const state = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as SessionState;

          // Only delete completed or failed sessions
          if (state.status !== 'active') {
            this.destroy(state.id);
            deletedCount++;
          }
        }
      }
    } catch (error) {
      console.error('Failed to cleanup sessions:', error);
    }

    return deletedCount;
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = randomBytes(8).toString('hex');
    return `sess_${timestamp}_${random}`;
  }

  /**
   * Evict old sessions from cache
   */
  private evictOldSessions(): void {
    if (this.cache.size <= this.maxCacheSize) {
      return;
    }

    // Convert to array and sort by lastAccessedAt
    const sessions = Array.from(this.cache.entries()).map(([id, session]) => ({
      id,
      session,
      lastAccessed: new Date(session.history[session.history.length - 1]?.timestamp || session.id).getTime()
    }));

    sessions.sort((a, b) => a.lastAccessed - b.lastAccessed);

    // Remove oldest sessions
    const toRemove = sessions.slice(0, sessions.length - this.maxCacheSize);
    for (const { id } of toRemove) {
      this.cache.delete(id);
    }
  }

  /**
   * Get session statistics
   */
  getStats(): {
    total: number;
    active: number;
    completed: number;
    failed: number;
    cached: number;
  } {
    let total = 0;
    let active = 0;
    let completed = 0;
    let failed = 0;

    try {
      const files = fs.readdirSync(this.sessionDir);
      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        total++;
        const filePath = path.join(this.sessionDir, file);
        const state = JSON.parse(fs.readFileSync(filePath, 'utf-8')) as SessionState;

        if (state.status === 'active') active++;
        else if (state.status === 'completed') completed++;
        else if (state.status === 'failed') failed++;
      }
    } catch (error) {
      console.error('Failed to get stats:', error);
    }

    return {
      total,
      active,
      completed,
      failed,
      cached: this.cache.size
    };
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();
