"use strict";
/**
 * Webhook API Server
 *
 * Receives StopDetected events from VS Code extension,
 * verifies signature, checks idempotency, and enqueues tasks.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrchestratorAPI = void 0;
const express_1 = __importDefault(require("express"));
const bullmq_1 = require("bullmq");
const crypto = __importStar(require("crypto"));
const logger_1 = require("./logger");
class OrchestratorAPI {
    constructor(config, workflowEngine) {
        this.app = (0, express_1.default)();
        this.secret = config.secret;
        this.seen = new Set();
        this.workflowEngine = workflowEngine;
        // Initialize task queue
        this.queue = new bullmq_1.Queue("miyabi-tasks", {
            connection: {
                host: config.redis.host,
                port: config.redis.port,
            },
        });
        this.setupMiddleware();
        this.setupRoutes();
    }
    setupMiddleware() {
        this.app.use(express_1.default.json());
        // Request logging
        this.app.use((req, res, next) => {
            logger_1.Logger.request(req.method, req.path);
            next();
        });
    }
    setupRoutes() {
        // Health check
        this.app.get("/health", (req, res) => {
            res.json({ status: "ok", timestamp: Date.now() });
        });
        // Main webhook endpoint
        this.app.post("/events", this.handleWebhook.bind(this));
        // Queue stats endpoint
        this.app.get("/stats", async (req, res) => {
            const counts = await this.queue.getJobCounts();
            res.json({
                queue: "miyabi-tasks",
                counts,
                seenEventsCount: this.seen.size,
            });
        });
    }
    async handleWebhook(req, res) {
        try {
            // 1. Verify signature
            const signature = req.header("X-Signature");
            if (!signature) {
                return res.status(401).send({ error: "Missing signature" });
            }
            const body = req.body;
            const bodyStr = JSON.stringify(body);
            if (!this.verifySignature(bodyStr, signature)) {
                return res.status(401).send({ error: "Invalid signature" });
            }
            // 2. Validate event type
            if (body.type !== "StopDetected") {
                return res.status(202).send({ status: "ignored", reason: "unknown event type" });
            }
            // 3. Check idempotency
            const key = body.idempotencyKey || `${body.workflowId}:${body.stepId}`;
            if (this.seen.has(key)) {
                return res.status(200).send({ status: "duplicate", key });
            }
            this.seen.add(key);
            // 4. Decide next task
            const nextTask = this.workflowEngine.decideNextTask(body);
            if (!nextTask) {
                return res.status(200).send({ status: "no_next_task" });
            }
            // 5. Enqueue task
            const jobId = `${body.workflowId}:${nextTask.type}:${Date.now()}`;
            await this.queue.add(nextTask.type, nextTask.payload, {
                jobId,
                removeOnComplete: 100,
                removeOnFail: 500,
            });
            logger_1.Logger.success(`Task enqueued: ${nextTask.type}`, `Job ID: ${jobId}`);
            return res.status(200).send({
                status: "enqueued",
                jobId,
                taskType: nextTask.type,
            });
        }
        catch (error) {
            logger_1.Logger.error("Error handling webhook", error);
            return res.status(500).send({ error: "Internal server error" });
        }
    }
    verifySignature(body, signature) {
        try {
            const hmac = crypto.createHmac("sha256", this.secret);
            hmac.update(body);
            const expected = hmac.digest("hex");
            return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
        }
        catch (error) {
            logger_1.Logger.error("Signature verification error", error);
            return false;
        }
    }
    start(port) {
        return new Promise((resolve) => {
            this.app.listen(port, () => {
                logger_1.Logger.success(`Orchestrator API started`, `Listening on http://localhost:${port}`);
                resolve();
            });
        });
    }
    async close() {
        await this.queue.close();
    }
}
exports.OrchestratorAPI = OrchestratorAPI;
//# sourceMappingURL=api.js.map