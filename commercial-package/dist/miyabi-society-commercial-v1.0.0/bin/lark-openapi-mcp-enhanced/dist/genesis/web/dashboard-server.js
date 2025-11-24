"use strict";
/**
 * Web Dashboard Interface
 * ブラウザベースの管理画面開発
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardServer = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
/**
 * Genesis Dashboard Server
 * リアルタイム監視とセッション管理のWebインターフェース
 */
class DashboardServer {
    constructor(config) {
        this.sessions = new Map();
        this.clients = new Set();
        this.config = config;
        this.app = (0, express_1.default)();
        this.server = (0, http_1.createServer)(this.app);
        this.io = new socket_io_1.Server(this.server, {
            cors: {
                origin: config.corsOrigins,
                methods: ['GET', 'POST'],
            },
        });
        this.setupMiddleware();
        this.setupRoutes();
        this.setupWebSocket();
    }
    /**
     * ミドルウェアの設定
     */
    setupMiddleware() {
        // CORS設定
        this.app.use((0, cors_1.default)({
            origin: this.config.corsOrigins,
            credentials: true,
        }));
        // JSON パーサー
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true }));
        // 静的ファイル配信
        if (this.config.staticPath) {
            this.app.use('/static', express_1.default.static(this.config.staticPath));
        }
        // ルート配信
        this.app.use('/', express_1.default.static(path_1.default.join(__dirname, 'public')));
        // ログ設定
        this.app.use((req, res, next) => {
            console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
            next();
        });
    }
    /**
     * APIルートの設定
     */
    setupRoutes() {
        const apiRouter = express_1.default.Router();
        // ダッシュボード統計
        apiRouter.get('/stats', this.handleGetStats.bind(this));
        // セッション管理
        apiRouter.get('/sessions', this.handleGetSessions.bind(this));
        apiRouter.get('/sessions/:id', this.handleGetSession.bind(this));
        apiRouter.post('/sessions', this.handleCreateSession.bind(this));
        apiRouter.put('/sessions/:id', this.handleUpdateSession.bind(this));
        apiRouter.delete('/sessions/:id', this.handleDeleteSession.bind(this));
        // セッション操作
        apiRouter.post('/sessions/:id/start', this.handleStartSession.bind(this));
        apiRouter.post('/sessions/:id/pause', this.handlePauseSession.bind(this));
        apiRouter.post('/sessions/:id/resume', this.handleResumeSession.bind(this));
        apiRouter.post('/sessions/:id/cancel', this.handleCancelSession.bind(this));
        // ステップ実行
        apiRouter.post('/sessions/:id/steps/:stepId/execute', this.handleExecuteStep.bind(this));
        apiRouter.post('/sessions/:id/steps/:stepId/feedback', this.handleSubmitFeedback.bind(this));
        // エラーと復旧
        apiRouter.get('/sessions/:id/errors', this.handleGetErrors.bind(this));
        apiRouter.post('/sessions/:id/rollback', this.handleRollback.bind(this));
        apiRouter.post('/sessions/:id/recovery', this.handleRecovery.bind(this));
        // 設定とテンプレート
        apiRouter.get('/templates', this.handleGetTemplates.bind(this));
        apiRouter.post('/templates', this.handleCreateTemplate.bind(this));
        // システム情報
        apiRouter.get('/health', this.handleHealthCheck.bind(this));
        apiRouter.get('/version', this.handleGetVersion.bind(this));
        this.app.use(this.config.apiPrefix, apiRouter);
        // SPA fallback
        this.app.get('*', (req, res) => {
            res.sendFile(path_1.default.join(__dirname, 'public', 'index.html'));
        });
    }
    /**
     * WebSocketの設定
     */
    setupWebSocket() {
        this.io.on('connection', (socket) => {
            console.log(`Client connected: ${socket.id}`);
            this.clients.add(socket.id);
            // セッション監視の開始
            socket.on('subscribe_session', (sessionId) => {
                socket.join(`session_${sessionId}`);
                console.log(`Client ${socket.id} subscribed to session ${sessionId}`);
            });
            // セッション監視の停止
            socket.on('unsubscribe_session', (sessionId) => {
                socket.leave(`session_${sessionId}`);
                console.log(`Client ${socket.id} unsubscribed from session ${sessionId}`);
            });
            // 全体統計の購読
            socket.on('subscribe_stats', () => {
                socket.join('stats');
                this.sendStatsUpdate(socket);
            });
            // 切断処理
            socket.on('disconnect', () => {
                console.log(`Client disconnected: ${socket.id}`);
                this.clients.delete(socket.id);
            });
        });
        // 定期的な統計更新
        setInterval(() => {
            this.broadcastStatsUpdate();
        }, 5000);
    }
    /**
     * API ハンドラー
     */
    async handleGetStats(req, res) {
        try {
            const stats = await this.calculateStats();
            res.json(stats);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to get stats' });
        }
    }
    async handleGetSessions(req, res) {
        try {
            const sessions = Array.from(this.sessions.values());
            res.json(sessions);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to get sessions' });
        }
    }
    async handleGetSession(req, res) {
        try {
            const session = this.sessions.get(req.params.id);
            if (!session) {
                res.status(404).json({ error: 'Session not found' });
                return;
            }
            res.json(session);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to get session' });
        }
    }
    async handleCreateSession(req, res) {
        try {
            const { name, requirements, userId } = req.body;
            const session = {
                id: `session_${Date.now()}`,
                name: name || 'Unnamed Session',
                status: 'active',
                progress: 0,
                currentStep: 'Requirements Analysis',
                startTime: Date.now(),
                lastActivity: Date.now(),
                userId: userId || 'anonymous',
                errors: [],
            };
            this.sessions.set(session.id, session);
            // WebSocket通知
            this.io.emit('session_created', session);
            res.status(201).json(session);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to create session' });
        }
    }
    async handleUpdateSession(req, res) {
        try {
            const session = this.sessions.get(req.params.id);
            if (!session) {
                res.status(404).json({ error: 'Session not found' });
                return;
            }
            // セッション更新
            Object.assign(session, req.body, { lastActivity: Date.now() });
            // WebSocket通知
            this.io.to(`session_${session.id}`).emit('session_updated', session);
            res.json(session);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to update session' });
        }
    }
    async handleDeleteSession(req, res) {
        try {
            const session = this.sessions.get(req.params.id);
            if (!session) {
                res.status(404).json({ error: 'Session not found' });
                return;
            }
            this.sessions.delete(req.params.id);
            // WebSocket通知
            this.io.emit('session_deleted', { id: req.params.id });
            res.json({ success: true });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to delete session' });
        }
    }
    async handleStartSession(req, res) {
        try {
            const session = this.sessions.get(req.params.id);
            if (!session) {
                res.status(404).json({ error: 'Session not found' });
                return;
            }
            session.status = 'active';
            session.lastActivity = Date.now();
            // WebSocket通知
            this.io.to(`session_${session.id}`).emit('session_started', session);
            res.json(session);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to start session' });
        }
    }
    async handlePauseSession(req, res) {
        try {
            const session = this.sessions.get(req.params.id);
            if (!session) {
                res.status(404).json({ error: 'Session not found' });
                return;
            }
            session.status = 'paused';
            session.lastActivity = Date.now();
            // WebSocket通知
            this.io.to(`session_${session.id}`).emit('session_paused', session);
            res.json(session);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to pause session' });
        }
    }
    async handleResumeSession(req, res) {
        try {
            const session = this.sessions.get(req.params.id);
            if (!session) {
                res.status(404).json({ error: 'Session not found' });
                return;
            }
            session.status = 'active';
            session.lastActivity = Date.now();
            // WebSocket通知
            this.io.to(`session_${session.id}`).emit('session_resumed', session);
            res.json(session);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to resume session' });
        }
    }
    async handleCancelSession(req, res) {
        try {
            const session = this.sessions.get(req.params.id);
            if (!session) {
                res.status(404).json({ error: 'Session not found' });
                return;
            }
            session.status = 'failed';
            session.lastActivity = Date.now();
            // WebSocket通知
            this.io.to(`session_${session.id}`).emit('session_cancelled', session);
            res.json(session);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to cancel session' });
        }
    }
    async handleExecuteStep(req, res) {
        try {
            const { id, stepId } = req.params;
            const session = this.sessions.get(id);
            if (!session) {
                res.status(404).json({ error: 'Session not found' });
                return;
            }
            // ステップ実行のシミュレーション
            session.currentStep = stepId;
            session.progress = Math.min(100, session.progress + 15);
            session.lastActivity = Date.now();
            // WebSocket通知
            this.io.to(`session_${id}`).emit('step_executed', {
                sessionId: id,
                stepId,
                progress: session.progress,
            });
            res.json({
                success: true,
                sessionId: id,
                stepId,
                progress: session.progress,
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to execute step' });
        }
    }
    async handleSubmitFeedback(req, res) {
        try {
            const { id, stepId } = req.params;
            const feedback = req.body;
            // フィードバック処理のシミュレーション
            // WebSocket通知
            this.io.to(`session_${id}`).emit('feedback_received', {
                sessionId: id,
                stepId,
                feedback,
            });
            res.json({
                success: true,
                message: 'Feedback received',
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to submit feedback' });
        }
    }
    async handleGetErrors(req, res) {
        try {
            const session = this.sessions.get(req.params.id);
            if (!session) {
                res.status(404).json({ error: 'Session not found' });
                return;
            }
            res.json({
                sessionId: req.params.id,
                errors: session.errors,
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to get errors' });
        }
    }
    async handleRollback(req, res) {
        try {
            const { checkpointId } = req.body;
            // ロールバック処理のシミュレーション
            res.json({
                success: true,
                message: 'Rollback initiated',
                checkpointId,
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to initiate rollback' });
        }
    }
    async handleRecovery(req, res) {
        try {
            const { strategy } = req.body;
            // 復旧処理のシミュレーション
            res.json({
                success: true,
                message: 'Recovery initiated',
                strategy,
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to initiate recovery' });
        }
    }
    async handleGetTemplates(req, res) {
        try {
            // テンプレート一覧の取得
            const templates = [
                {
                    id: 'crm_template',
                    name: 'CRM System',
                    description: 'Customer Relationship Management system template',
                    category: 'business',
                },
                {
                    id: 'project_template',
                    name: 'Project Management',
                    description: 'Project management system template',
                    category: 'productivity',
                },
            ];
            res.json(templates);
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to get templates' });
        }
    }
    async handleCreateTemplate(req, res) {
        try {
            const template = req.body;
            // テンプレート作成処理
            res.status(201).json({
                success: true,
                templateId: `template_${Date.now()}`,
                message: 'Template created',
            });
        }
        catch (error) {
            res.status(500).json({ error: 'Failed to create template' });
        }
    }
    async handleHealthCheck(req, res) {
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            connections: this.clients.size,
        });
    }
    async handleGetVersion(req, res) {
        res.json({
            version: '1.0.0',
            buildDate: '2024-01-15',
            nodeVersion: process.version,
            platform: process.platform,
        });
    }
    /**
     * ユーティリティメソッド
     */
    async calculateStats() {
        const sessions = Array.from(this.sessions.values());
        const activeSessions = sessions.filter((s) => s.status === 'active').length;
        const completedSessions = sessions.filter((s) => s.status === 'completed').length;
        const failedSessions = sessions.filter((s) => s.status === 'failed').length;
        // 平均完了時間の計算
        const completedSessionsWithTime = sessions.filter((s) => s.status === 'completed' && s.lastActivity && s.startTime);
        const averageCompletionTime = completedSessionsWithTime.length > 0
            ? completedSessionsWithTime.reduce((sum, s) => sum + (s.lastActivity - s.startTime), 0) /
                completedSessionsWithTime.length
            : 0;
        // エラー統計
        const errorCounts = new Map();
        sessions.forEach((session) => {
            session.errors.forEach((error) => {
                errorCounts.set(error, (errorCounts.get(error) || 0) + 1);
            });
        });
        const topErrors = Array.from(errorCounts.entries())
            .map(([error, count]) => ({ error, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);
        return {
            totalSessions: sessions.length,
            activeSessions,
            completedSessions,
            failedSessions,
            averageCompletionTime,
            topErrors,
            resourceUtilization: {
                cpu: Math.round(Math.random() * 100), // モック値
                memory: Math.round((process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) * 100),
                storage: Math.round(Math.random() * 100), // モック値
            },
        };
    }
    async sendStatsUpdate(socket) {
        try {
            const stats = await this.calculateStats();
            socket.emit('stats_update', stats);
        }
        catch (error) {
            console.error('Failed to send stats update:', error);
        }
    }
    async broadcastStatsUpdate() {
        try {
            const stats = await this.calculateStats();
            this.io.to('stats').emit('stats_update', stats);
        }
        catch (error) {
            console.error('Failed to broadcast stats update:', error);
        }
    }
    /**
     * セッション進捗の更新
     */
    updateSessionProgress(sessionId, progress, currentStep) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.progress = progress;
            session.currentStep = currentStep;
            session.lastActivity = Date.now();
            // WebSocket通知
            this.io.to(`session_${sessionId}`).emit('progress_update', {
                sessionId,
                progress,
                currentStep,
            });
        }
    }
    /**
     * セッションエラーの追加
     */
    addSessionError(sessionId, error) {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.errors.push(error);
            session.lastActivity = Date.now();
            // WebSocket通知
            this.io.to(`session_${sessionId}`).emit('error_occurred', {
                sessionId,
                error,
                timestamp: Date.now(),
            });
        }
    }
    /**
     * サーバーの開始
     */
    start() {
        return new Promise((resolve) => {
            this.server.listen(this.config.port, this.config.host, () => {
                console.log(`Genesis Dashboard Server running on http://${this.config.host}:${this.config.port}`);
                resolve();
            });
        });
    }
    /**
     * サーバーの停止
     */
    stop() {
        return new Promise((resolve) => {
            this.server.close(() => {
                console.log('Genesis Dashboard Server stopped');
                resolve();
            });
        });
    }
    /**
     * 接続中のクライアント数取得
     */
    getConnectedClients() {
        return this.clients.size;
    }
    /**
     * セッション数取得
     */
    getSessionCount() {
        return this.sessions.size;
    }
}
exports.DashboardServer = DashboardServer;
