"use strict";
/**
 * Miyabi Orchestrator - Main Entry Point
 *
 * Starts both API server and worker process.
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
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
const api_1 = require("./api");
const worker_1 = require("./worker");
const workflow_1 = require("./workflow");
const logger_1 = require("./logger");
// Load environment variables
dotenv.config();
// Default configuration
const config = {
    port: parseInt(process.env.PORT || "8787"),
    secret: process.env.STOPSEQ_SECRET || "dev-secret",
    redis: {
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: parseInt(process.env.REDIS_PORT || "6379"),
    },
    workflows: [],
};
async function main() {
    // Display startup banner
    logger_1.Logger.banner("Miyabi Orchestrator", "0.1.0", config.port);
    // Show configuration
    logger_1.Logger.section("Configuration");
    logger_1.Logger.keyValue("Port", config.port, 2);
    logger_1.Logger.keyValue("Redis Host", config.redis.host, 2);
    logger_1.Logger.keyValue("Redis Port", config.redis.port, 2);
    logger_1.Logger.keyValue("Secret", config.secret === "dev-secret" ? "⚠️  dev-secret (CHANGE IN PRODUCTION)" : "✓ Custom secret", 2);
    // Load workflow definition
    const workflowPath = process.env.WORKFLOW_PATH || path.join(__dirname, "../config/default.yaml");
    logger_1.Logger.keyValue("Workflow Path", workflowPath, 2);
    console.log(); // Blank line
    let workflowEngine;
    try {
        workflowEngine = workflow_1.WorkflowEngine.loadFromYaml(workflowPath);
        logger_1.Logger.success("Workflow loaded successfully");
    }
    catch (error) {
        logger_1.Logger.warn("Failed to load workflow, using default");
        // Fallback to simple default workflow
        workflowEngine = new workflow_1.WorkflowEngine([
            {
                id: "default",
                name: "Default Workflow",
                steps: [
                    {
                        id: "ai_output_complete",
                        next: "run_tests",
                    },
                    {
                        id: "run_tests",
                        task: "shell",
                        command: "echo 'Tests would run here'",
                        next: "done",
                    },
                    {
                        id: "done",
                    },
                ],
            },
        ]);
    }
    // Start components
    logger_1.Logger.section("Starting Components");
    // Start worker
    const worker = new worker_1.TaskWorker(config);
    logger_1.Logger.success("Task worker started", "Concurrency: 3");
    // Start API server
    const api = new api_1.OrchestratorAPI(config, workflowEngine);
    await api.start(config.port);
    logger_1.Logger.separator();
    logger_1.Logger.box("Orchestrator Ready", `API: http://localhost:${config.port}\nHealth: http://localhost:${config.port}/health\nStats: http://localhost:${config.port}/stats\n\nPress Ctrl+C to stop`, "success");
    // Graceful shutdown
    const shutdown = async () => {
        logger_1.Logger.separator();
        logger_1.Logger.warn("Shutting down gracefully...");
        await worker.close();
        await api.close();
        logger_1.Logger.success("Shutdown complete");
        process.exit(0);
    };
    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
}
// Run
main().catch((error) => {
    logger_1.Logger.box("Fatal Error", error.message, "error");
    logger_1.Logger.error("Orchestrator failed to start", error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map