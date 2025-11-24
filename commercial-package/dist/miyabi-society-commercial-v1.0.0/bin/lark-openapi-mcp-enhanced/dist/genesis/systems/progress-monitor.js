"use strict";
/**
 * Real-time Progress Monitoring System
 * 構築進捗のリアルタイム表示機能
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProgressMonitor = void 0;
const events_1 = require("events");
/**
 * Real-time Progress Monitor
 * リアルタイム進捗監視システム
 */
class ProgressMonitor extends events_1.EventEmitter {
    constructor() {
        super();
        this.sessions = new Map();
        this.progressListeners = new Map();
        this.activeSessions = new Set();
        this.setupEventHandlers();
    }
    /**
     * イベントハンドラーの設定
     */
    setupEventHandlers() {
        this.on('progress_update', (event) => {
            this.notifyListeners(event);
        });
        this.on('session_complete', (session) => {
            this.activeSessions.delete(session.id);
            this.notifySessionComplete(session);
        });
        this.on('error', (error, sessionId) => {
            this.notifyError(error, sessionId);
        });
    }
    /**
     * 新しい進捗セッションの作成
     */
    createSession(config) {
        const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const session = {
            id: sessionId,
            projectName: config.projectName,
            description: config.description,
            status: 'initializing',
            overallProgress: 0,
            startTime: new Date(),
            steps: config.steps.map((step) => ({
                ...step,
                status: 'pending',
                progress: 0,
            })),
            metadata: {
                sessionType: 'custom',
                priority: 'medium',
                ...config.metadata,
            },
            errors: [],
            warnings: [],
        };
        this.sessions.set(sessionId, session);
        this.activeSessions.add(sessionId);
        return session;
    }
    /**
     * セッションの開始
     */
    startSession(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        session.status = 'running';
        this.emit('progress_update', {
            type: 'step_start',
            sessionId,
            data: { session },
            timestamp: new Date(),
        });
    }
    /**
     * ステップの開始
     */
    startStep(sessionId, stepId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        const step = this.findStep(session.steps, stepId);
        if (!step) {
            throw new Error(`Step not found: ${stepId}`);
        }
        step.status = 'running';
        step.startTime = new Date();
        step.progress = 0;
        this.emit('progress_update', {
            type: 'step_start',
            sessionId,
            stepId,
            data: { step },
            timestamp: new Date(),
        });
        this.updateOverallProgress(session);
    }
    /**
     * ステップの進捗更新
     */
    updateStepProgress(sessionId, stepId, progress, details) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        const step = this.findStep(session.steps, stepId);
        if (!step) {
            throw new Error(`Step not found: ${stepId}`);
        }
        step.progress = Math.min(100, Math.max(0, progress));
        if (details) {
            step.details = details;
        }
        this.emit('progress_update', {
            type: 'step_progress',
            sessionId,
            stepId,
            data: { step, progress: step.progress },
            timestamp: new Date(),
        });
        this.updateOverallProgress(session);
    }
    /**
     * ステップの完了
     */
    completeStep(sessionId, stepId, details) {
        var _a;
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        const step = this.findStep(session.steps, stepId);
        if (!step) {
            throw new Error(`Step not found: ${stepId}`);
        }
        step.status = 'completed';
        step.progress = 100;
        step.endTime = new Date();
        step.duration = step.endTime.getTime() - (((_a = step.startTime) === null || _a === void 0 ? void 0 : _a.getTime()) || 0);
        if (details) {
            step.details = details;
        }
        this.emit('progress_update', {
            type: 'step_complete',
            sessionId,
            stepId,
            data: { step },
            timestamp: new Date(),
        });
        this.updateOverallProgress(session);
    }
    /**
     * ステップの失敗
     */
    failStep(sessionId, stepId, error, details) {
        var _a;
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        const step = this.findStep(session.steps, stepId);
        if (!step) {
            throw new Error(`Step not found: ${stepId}`);
        }
        step.status = 'failed';
        step.endTime = new Date();
        step.duration = step.endTime.getTime() - (((_a = step.startTime) === null || _a === void 0 ? void 0 : _a.getTime()) || 0);
        step.error = error;
        if (details) {
            step.details = details;
        }
        session.errors.push(`Step "${step.name}": ${error}`);
        this.emit('progress_update', {
            type: 'step_error',
            sessionId,
            stepId,
            data: { step, error },
            timestamp: new Date(),
        });
        this.updateOverallProgress(session);
    }
    /**
     * ステップのスキップ
     */
    skipStep(sessionId, stepId, reason) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        const step = this.findStep(session.steps, stepId);
        if (!step) {
            throw new Error(`Step not found: ${stepId}`);
        }
        step.status = 'skipped';
        step.progress = 100;
        step.endTime = new Date();
        if (reason) {
            step.details = { reason };
        }
        if (reason) {
            session.warnings.push(`Step "${step.name}" skipped: ${reason}`);
        }
        this.emit('progress_update', {
            type: 'step_complete',
            sessionId,
            stepId,
            data: { step, skipped: true },
            timestamp: new Date(),
        });
        this.updateOverallProgress(session);
    }
    /**
     * セッションの完了
     */
    completeSession(sessionId, result) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        session.status = 'completed';
        session.overallProgress = 100;
        session.endTime = new Date();
        session.duration = session.endTime.getTime() - session.startTime.getTime();
        if (result) {
            session.metadata.result = result;
        }
        this.emit('progress_update', {
            type: 'session_complete',
            sessionId,
            data: { session, result },
            timestamp: new Date(),
        });
        this.emit('session_complete', session);
    }
    /**
     * セッションの失敗
     */
    failSession(sessionId, error) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        session.status = 'failed';
        session.endTime = new Date();
        session.duration = session.endTime.getTime() - session.startTime.getTime();
        session.errors.push(error);
        this.emit('progress_update', {
            type: 'session_error',
            sessionId,
            data: { session, error },
            timestamp: new Date(),
        });
        this.emit('error', error, sessionId);
    }
    /**
     * セッションのキャンセル
     */
    cancelSession(sessionId, reason) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error(`Session not found: ${sessionId}`);
        }
        session.status = 'cancelled';
        session.endTime = new Date();
        session.duration = session.endTime.getTime() - session.startTime.getTime();
        if (reason) {
            session.warnings.push(`Session cancelled: ${reason}`);
        }
        this.emit('progress_update', {
            type: 'session_error',
            sessionId,
            data: { session, cancelled: true, reason },
            timestamp: new Date(),
        });
        this.activeSessions.delete(sessionId);
    }
    /**
     * セッションの取得
     */
    getSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    /**
     * アクティブセッションの取得
     */
    getActiveSessions() {
        return Array.from(this.activeSessions).map((id) => this.sessions.get(id));
    }
    /**
     * 全セッションの取得
     */
    getAllSessions() {
        return Array.from(this.sessions.values());
    }
    /**
     * セッションの削除
     */
    deleteSession(sessionId) {
        this.sessions.delete(sessionId);
        this.activeSessions.delete(sessionId);
        this.progressListeners.delete(sessionId);
    }
    /**
     * リスナーの登録
     */
    addProgressListener(sessionId, listener) {
        if (!this.progressListeners.has(sessionId)) {
            this.progressListeners.set(sessionId, []);
        }
        this.progressListeners.get(sessionId).push(listener);
    }
    /**
     * リスナーの削除
     */
    removeProgressListener(sessionId, listener) {
        const listeners = this.progressListeners.get(sessionId);
        if (listeners) {
            const index = listeners.indexOf(listener);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    /**
     * リスナーへの通知
     */
    notifyListeners(event) {
        const listeners = this.progressListeners.get(event.sessionId);
        if (listeners) {
            listeners.forEach((listener) => {
                if (listener.onProgressUpdate) {
                    try {
                        listener.onProgressUpdate(event);
                    }
                    catch (error) {
                        console.error('Error in progress listener:', error);
                    }
                }
            });
        }
    }
    /**
     * セッション完了の通知
     */
    notifySessionComplete(session) {
        const listeners = this.progressListeners.get(session.id);
        if (listeners) {
            listeners.forEach((listener) => {
                if (listener.onSessionComplete) {
                    try {
                        listener.onSessionComplete(session);
                    }
                    catch (error) {
                        console.error('Error in session complete listener:', error);
                    }
                }
            });
        }
    }
    /**
     * エラーの通知
     */
    notifyError(error, sessionId) {
        const listeners = this.progressListeners.get(sessionId);
        if (listeners) {
            listeners.forEach((listener) => {
                if (listener.onError) {
                    try {
                        listener.onError(error, sessionId);
                    }
                    catch (error) {
                        console.error('Error in error listener:', error);
                    }
                }
            });
        }
    }
    /**
     * ステップの検索（再帰的）
     */
    findStep(steps, stepId) {
        for (const step of steps) {
            if (step.id === stepId) {
                return step;
            }
            if (step.subSteps) {
                const found = this.findStep(step.subSteps, stepId);
                if (found) {
                    return found;
                }
            }
        }
        return null;
    }
    /**
     * 全体進捗の更新
     */
    updateOverallProgress(session) {
        const totalSteps = this.countTotalSteps(session.steps);
        const completedSteps = this.countCompletedSteps(session.steps);
        session.overallProgress = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0;
    }
    /**
     * 全ステップ数のカウント
     */
    countTotalSteps(steps) {
        let count = steps.length;
        for (const step of steps) {
            if (step.subSteps) {
                count += this.countTotalSteps(step.subSteps);
            }
        }
        return count;
    }
    /**
     * 完了ステップ数のカウント
     */
    countCompletedSteps(steps) {
        let count = 0;
        for (const step of steps) {
            if (step.status === 'completed' || step.status === 'skipped') {
                count++;
            }
            if (step.subSteps) {
                count += this.countCompletedSteps(step.subSteps);
            }
        }
        return count;
    }
    /**
     * 統計情報の取得
     */
    getStatistics() {
        const sessions = Array.from(this.sessions.values());
        const completed = sessions.filter((s) => s.status === 'completed');
        const failed = sessions.filter((s) => s.status === 'failed');
        const totalDuration = completed.reduce((sum, session) => {
            return sum + (session.duration || 0);
        }, 0);
        return {
            totalSessions: sessions.length,
            activeSessions: this.activeSessions.size,
            completedSessions: completed.length,
            failedSessions: failed.length,
            averageDuration: completed.length > 0 ? totalDuration / completed.length : 0,
            successRate: sessions.length > 0 ? (completed.length / sessions.length) * 100 : 0,
        };
    }
    /**
     * セッションのクリーンアップ（古いセッションの削除）
     */
    cleanupOldSessions(maxAge = 24 * 60 * 60 * 1000) {
        // デフォルト24時間
        const cutoff = Date.now() - maxAge;
        const sessionsToDelete = [];
        for (const [sessionId, session] of this.sessions.entries()) {
            if (session.endTime && session.endTime.getTime() < cutoff) {
                sessionsToDelete.push(sessionId);
            }
        }
        sessionsToDelete.forEach((sessionId) => {
            this.deleteSession(sessionId);
        });
    }
}
exports.ProgressMonitor = ProgressMonitor;
