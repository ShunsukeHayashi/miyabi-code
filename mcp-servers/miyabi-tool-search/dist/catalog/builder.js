/**
 * Tool Catalog Builder
 * Collects tools from MCP servers, Rust crates, and subagents
 */
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Load categories configuration
const categoriesPath = path.join(__dirname, "../../data/categories.json");
export class CatalogBuilder {
    categoriesConfig;
    tools = [];
    constructor() {
        this.categoriesConfig = JSON.parse(fs.readFileSync(categoriesPath, "utf-8"));
    }
    /**
     * Build complete tool catalog
     */
    async build() {
        console.log("Building tool catalog...");
        // 1. Collect from MCP servers
        await this.collectMCPTools();
        // 2. Collect from Rust crates
        await this.collectRustAgentTools();
        // 3. Collect from subagents
        await this.collectSubagentTools();
        // 4. Build indexes
        return this.createCatalog();
    }
    /**
     * Collect tools from MCP servers
     */
    async collectMCPTools() {
        const mcpConfigPath = path.join(__dirname, "../../../../.mcp.json");
        if (!fs.existsSync(mcpConfigPath)) {
            console.warn("MCP config not found at", mcpConfigPath);
            return;
        }
        const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, "utf-8"));
        const servers = Object.entries(mcpConfig.mcpServers || {});
        for (const [serverName, config] of servers) {
            console.log(`  Collecting from ${serverName}...`);
            try {
                const tools = await this.getMCPServerTools(serverName, config);
                for (const tool of tools) {
                    const entry = this.createToolEntry({
                        name: tool.name,
                        description: tool.description || "",
                        inputSchema: tool.inputSchema,
                        source: "mcp",
                        server: serverName,
                    });
                    this.tools.push(entry);
                }
                console.log(`    Found ${tools.length} tools`);
            }
            catch (error) {
                console.warn(`    Failed to collect from ${serverName}:`, error);
            }
        }
    }
    /**
     * Get tools from a single MCP server
     */
    async getMCPServerTools(serverName, config) {
        // For now, use predefined tool definitions
        // In production, this would actually connect to the MCP server
        return this.getPredefinedTools(serverName);
    }
    /**
     * Predefined tools for each server (used when server not running)
     */
    getPredefinedTools(serverName) {
        const predefinedTools = {
            "miyabi-github": [
                { name: "github_list_issues", description: "List issues from a GitHub repository", inputSchema: { type: "object" } },
                { name: "github_get_issue", description: "Get detailed information about a specific issue", inputSchema: { type: "object" } },
                { name: "github_create_issue", description: "Create a new issue", inputSchema: { type: "object" } },
                { name: "github_update_issue", description: "Update an existing issue", inputSchema: { type: "object" } },
                { name: "github_add_comment", description: "Add a comment to an issue or PR", inputSchema: { type: "object" } },
                { name: "github_list_prs", description: "List pull requests from a repository", inputSchema: { type: "object" } },
                { name: "github_get_pr", description: "Get detailed information about a specific PR", inputSchema: { type: "object" } },
                { name: "github_create_pr", description: "Create a new pull request", inputSchema: { type: "object" } },
                { name: "github_merge_pr", description: "Merge a pull request", inputSchema: { type: "object" } },
                { name: "github_list_labels", description: "List labels in a repository", inputSchema: { type: "object" } },
                { name: "github_add_labels", description: "Add labels to an issue or PR", inputSchema: { type: "object" } },
                { name: "github_list_milestones", description: "List milestones in a repository", inputSchema: { type: "object" } },
            ],
            "miyabi-tmux": [
                { name: "tmux_list_sessions", description: "List all tmux sessions", inputSchema: { type: "object" } },
                { name: "tmux_list_panes", description: "List all panes across tmux sessions", inputSchema: { type: "object" } },
                { name: "tmux_send_message", description: "Send a message to a specific tmux pane", inputSchema: { type: "object" } },
                { name: "tmux_join_commhub", description: "Join the Miyabi CommHub session", inputSchema: { type: "object" } },
                { name: "tmux_get_commhub_status", description: "Get current status of the CommHub", inputSchema: { type: "object" } },
                { name: "tmux_broadcast", description: "Broadcast a message to all Miyabi tmux sessions", inputSchema: { type: "object" } },
                { name: "tmux_pane_capture", description: "Capture and return the content of a tmux pane", inputSchema: { type: "object" } },
                { name: "tmux_pane_search", description: "Search for a pattern in pane content", inputSchema: { type: "object" } },
                { name: "tmux_pane_tail", description: "Get the last N lines from a pane", inputSchema: { type: "object" } },
                { name: "tmux_pane_is_busy", description: "Check if a pane is busy", inputSchema: { type: "object" } },
                { name: "tmux_pane_current_command", description: "Get the current command running in a pane", inputSchema: { type: "object" } },
            ],
            "miyabi-obsidian": [
                { name: "obsidian_list_documents", description: "List all documents in Miyabi Obsidian vault", inputSchema: { type: "object" } },
                { name: "obsidian_read_document", description: "Read a document from Miyabi Obsidian vault", inputSchema: { type: "object" } },
                { name: "obsidian_create_document", description: "Create a new document in Miyabi Obsidian vault", inputSchema: { type: "object" } },
                { name: "obsidian_update_document", description: "Update an existing document", inputSchema: { type: "object" } },
                { name: "obsidian_search", description: "Search documents by content", inputSchema: { type: "object" } },
                { name: "obsidian_get_tags", description: "Get all unique tags used in vault", inputSchema: { type: "object" } },
                { name: "obsidian_get_categories", description: "Get all unique categories", inputSchema: { type: "object" } },
                { name: "obsidian_get_directory_tree", description: "Get directory structure of vault", inputSchema: { type: "object" } },
                { name: "obsidian_get_backlinks", description: "Find all documents that link to a specific document", inputSchema: { type: "object" } },
            ],
            "gemini3-adaptive-runtime": [
                { name: "generate_dynamic_ui", description: "Generate a dynamic React TypeScript UI component", inputSchema: { type: "object" } },
                { name: "iterate_ui", description: "Improve an existing UI component based on feedback", inputSchema: { type: "object" } },
                { name: "deep_reasoning", description: "Perform deep reasoning on complex questions", inputSchema: { type: "object" } },
                { name: "compare_options", description: "Compare multiple options and provide recommendation", inputSchema: { type: "object" } },
                { name: "analyze_decision", description: "Analyze a decision with potential consequences", inputSchema: { type: "object" } },
                { name: "execute_code", description: "Generate and execute code to solve tasks", inputSchema: { type: "object" } },
                { name: "analyze_code", description: "Analyze existing code for issues", inputSchema: { type: "object" } },
                { name: "generate_tests", description: "Generate comprehensive test cases", inputSchema: { type: "object" } },
                { name: "solve_algorithm", description: "Solve algorithmic problems", inputSchema: { type: "object" } },
            ],
            "gemini3-uiux-designer": [
                { name: "review_design", description: "Review UI/UX design using Jonathan Ive principles", inputSchema: { type: "object" } },
                { name: "generate_design_system", description: "Generate a complete design system", inputSchema: { type: "object" } },
                { name: "create_wireframe", description: "Create minimalist wireframes", inputSchema: { type: "object" } },
                { name: "generate_high_fidelity_mockup", description: "Generate high-fidelity React mockup", inputSchema: { type: "object" } },
                { name: "check_accessibility", description: "Comprehensive WCAG accessibility audit", inputSchema: { type: "object" } },
                { name: "analyze_usability", description: "Usability analysis using Nielsen heuristics", inputSchema: { type: "object" } },
                { name: "optimize_ux_writing", description: "Optimize microcopy and UI text", inputSchema: { type: "object" } },
                { name: "design_interaction_flow", description: "Design interaction flows with state transitions", inputSchema: { type: "object" } },
                { name: "create_animation_specs", description: "Create subtle animation specifications", inputSchema: { type: "object" } },
            ],
            "miyabi-resource-monitor": [
                { name: "resource_cpu", description: "Get current CPU usage", inputSchema: { type: "object" } },
                { name: "resource_memory", description: "Get current memory usage", inputSchema: { type: "object" } },
                { name: "resource_disk", description: "Get disk usage for filesystems", inputSchema: { type: "object" } },
                { name: "resource_load", description: "Get system load average", inputSchema: { type: "object" } },
                { name: "resource_overview", description: "Get comprehensive overview of all system resources", inputSchema: { type: "object" } },
                { name: "resource_processes", description: "Get process information", inputSchema: { type: "object" } },
                { name: "resource_uptime", description: "Get system uptime", inputSchema: { type: "object" } },
                { name: "resource_network_stats", description: "Get network interface statistics", inputSchema: { type: "object" } },
            ],
            "miyabi-log-aggregator": [
                { name: "log_sources", description: "List all available log sources", inputSchema: { type: "object" } },
                { name: "log_get_recent", description: "Get recent log entries", inputSchema: { type: "object" } },
                { name: "log_search", description: "Search logs for a specific query", inputSchema: { type: "object" } },
                { name: "log_get_errors", description: "Get all error-level log entries", inputSchema: { type: "object" } },
                { name: "log_get_warnings", description: "Get all warning-level log entries", inputSchema: { type: "object" } },
                { name: "log_tail", description: "Get the last N lines from a log file", inputSchema: { type: "object" } },
            ],
            "miyabi-file-access": [
                { name: "read_file", description: "Read content from a file", inputSchema: { type: "object" } },
                { name: "write_file", description: "Write content to a file", inputSchema: { type: "object" } },
                { name: "list_files", description: "List files and directories", inputSchema: { type: "object" } },
                { name: "get_file_info", description: "Get detailed information about a file", inputSchema: { type: "object" } },
                { name: "delete_file", description: "Delete a file or directory", inputSchema: { type: "object" } },
                { name: "create_directory", description: "Create a new directory", inputSchema: { type: "object" } },
                { name: "copy_file", description: "Copy a file to a new location", inputSchema: { type: "object" } },
                { name: "move_file", description: "Move or rename a file", inputSchema: { type: "object" } },
                { name: "search_files", description: "Search for files by name or content", inputSchema: { type: "object" } },
            ],
            "miyabi-rules": [
                { name: "miyabi_rules_list", description: "List all available Miyabi rules", inputSchema: { type: "object" } },
                { name: "miyabi_rules_validate", description: "Validate a task against Miyabi rules", inputSchema: { type: "object" } },
                { name: "miyabi_rules_execute", description: "Execute a specific rule enforcement action", inputSchema: { type: "object" } },
                { name: "miyabi_rules_sync", description: "Synchronize local rules to cloud API", inputSchema: { type: "object" } },
                { name: "miyabi_rules_get_context", description: "Get specific context module content", inputSchema: { type: "object" } },
            ],
            "gemini3-general": [
                { name: "generate_code", description: "Generate code in any programming language", inputSchema: { type: "object" } },
                { name: "analyze_code", description: "Analyze code for bugs and issues", inputSchema: { type: "object" } },
                { name: "explain_concept", description: "Explain programming concepts", inputSchema: { type: "object" } },
                { name: "solve_problem", description: "Solve programming problems", inputSchema: { type: "object" } },
                { name: "generate_text", description: "Generate documentation and text content", inputSchema: { type: "object" } },
                { name: "ask_gemini", description: "Ask Gemini any question", inputSchema: { type: "object" } },
            ],
        };
        return predefinedTools[serverName] || [];
    }
    /**
     * Collect tools from Rust agent crates
     */
    async collectRustAgentTools() {
        const cratesDir = path.join(__dirname, "../../../../crates");
        if (!fs.existsSync(cratesDir)) {
            console.warn("Crates directory not found");
            return;
        }
        const agentCrates = fs.readdirSync(cratesDir)
            .filter(d => d.startsWith("miyabi-agent-") &&
            fs.statSync(path.join(cratesDir, d)).isDirectory());
        console.log(`  Found ${agentCrates.length} Rust agent crates`);
        // Add predefined Rust agent tools
        const rustAgentTools = [
            { name: "orchestrate_agents", description: "Coordinate multiple agents for complex tasks", crate: "miyabi-agent-coordinator" },
            { name: "execute_dag", description: "Execute a DAG-based workflow", crate: "miyabi-agent-coordinator" },
            { name: "generate_code", description: "Generate code from specifications", crate: "miyabi-agent-codegen" },
            { name: "implement_feature", description: "Implement a new feature based on requirements", crate: "miyabi-agent-codegen" },
            { name: "review_code", description: "Review code for quality and issues", crate: "miyabi-agent-review" },
            { name: "analyze_security", description: "Analyze code for security vulnerabilities", crate: "miyabi-agent-review" },
            { name: "analyze_issue", description: "Analyze and label GitHub issues", crate: "miyabi-agent-issue" },
            { name: "triage_issues", description: "Triage and prioritize issues", crate: "miyabi-agent-issue" },
            { name: "create_pull_request", description: "Create a pull request with changes", crate: "miyabi-agent-pr" },
            { name: "auto_merge", description: "Automatically merge approved PRs", crate: "miyabi-agent-pr" },
        ];
        for (const tool of rustAgentTools) {
            const entry = this.createToolEntry({
                name: `a2a.${tool.crate.replace("miyabi-agent-", "")}.${tool.name}`,
                description: tool.description,
                inputSchema: { type: "object" },
                source: "rust_crate",
                server: tool.crate,
            });
            this.tools.push(entry);
        }
    }
    /**
     * Collect tools from subagent definitions
     */
    async collectSubagentTools() {
        const agentsDir = path.join(__dirname, "../../../../.claude/agents/specs");
        if (!fs.existsSync(agentsDir)) {
            console.warn("Agents specs directory not found");
            return;
        }
        // Read agent specs and create tool entries
        const subagentTools = [
            { name: "CoordinatorAgent", description: "Task coordination and parallel execution agent" },
            { name: "CodeGenAgent", description: "AI-driven code generation agent" },
            { name: "ReviewAgent", description: "Code quality and security review agent" },
            { name: "IssueAgent", description: "Issue analysis and labeling agent" },
            { name: "PRAgent", description: "Pull request creation and management agent" },
            { name: "DeploymentAgent", description: "CI/CD deployment automation agent" },
            { name: "RefresherAgent", description: "Issue status monitoring and update agent" },
            { name: "AWSAgent", description: "AWS cloud infrastructure management agent" },
            { name: "ImageGenAgent", description: "Image generation for business materials" },
            { name: "YouTubeAgent", description: "YouTube channel optimization agent" },
            { name: "NoteAgent", description: "note.com article writing agent" },
        ];
        for (const agent of subagentTools) {
            const entry = this.createToolEntry({
                name: agent.name,
                description: agent.description,
                inputSchema: { type: "object" },
                source: "subagent",
                server: "task-subagent",
            });
            this.tools.push(entry);
        }
        console.log(`  Added ${subagentTools.length} subagent tools`);
    }
    /**
     * Create a tool catalog entry
     */
    createToolEntry(params) {
        const { name, description, inputSchema, source, server } = params;
        const category = this.inferCategory(name, description);
        const priority = this.determinePriority(server, name);
        const keywords = this.extractKeywords(name, description);
        const aliases = this.generateAliases(name, description);
        return {
            id: `${source}:${server}:${name}`,
            name,
            displayName: this.formatDisplayName(name),
            source,
            server,
            category: category.category,
            subcategory: category.subcategory,
            description,
            keywords,
            aliases,
            priority,
            deferLoading: priority !== "always",
            inputSchema,
        };
    }
    /**
     * Infer category from tool name and description
     */
    inferCategory(name, description) {
        const text = `${name} ${description}`.toLowerCase();
        for (const [category, def] of Object.entries(this.categoriesConfig.categories)) {
            for (const [subcategory, subDef] of Object.entries(def.subcategories)) {
                // Check patterns
                for (const pattern of subDef.patterns) {
                    const regex = new RegExp(pattern.replace("*", ".*"), "i");
                    if (regex.test(name)) {
                        return { category, subcategory };
                    }
                }
                // Check keywords
                for (const keyword of subDef.keywords) {
                    if (text.includes(keyword.toLowerCase())) {
                        return { category, subcategory };
                    }
                }
            }
        }
        return { category: "other" };
    }
    /**
     * Determine tool priority
     */
    determinePriority(server, name) {
        // Always loaded tools
        if (this.categoriesConfig.alwaysLoadedTools.includes(name)) {
            return "always";
        }
        // High priority servers
        if (this.categoriesConfig.highPriorityServers.includes(server)) {
            return "high";
        }
        // Low priority servers
        if (this.categoriesConfig.lowPriorityServers.includes(server)) {
            return "low";
        }
        return "medium";
    }
    /**
     * Extract keywords from tool name and description
     */
    extractKeywords(name, description) {
        const text = `${name} ${description}`;
        const words = text
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .split(/\s+/)
            .filter(w => w.length > 2);
        // Remove duplicates and common words
        const stopWords = new Set(["the", "and", "for", "with", "from", "this", "that"]);
        return [...new Set(words)].filter(w => !stopWords.has(w)).slice(0, 10);
    }
    /**
     * Generate aliases for tool
     */
    generateAliases(name, description) {
        const aliases = [];
        // Convert snake_case to space-separated
        aliases.push(name.replace(/_/g, " "));
        // Add first few words of description
        const descWords = description.split(" ").slice(0, 3).join(" ");
        if (descWords.length > 5) {
            aliases.push(descWords.toLowerCase());
        }
        return aliases;
    }
    /**
     * Format display name
     */
    formatDisplayName(name) {
        return name
            .replace(/_/g, " ")
            .replace(/([a-z])([A-Z])/g, "$1 $2")
            .split(" ")
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
    }
    /**
     * Create the final catalog with indexes
     */
    createCatalog() {
        const byId = {};
        const byCategory = {};
        const bySource = {};
        const byPriority = {};
        const byServer = {};
        for (const tool of this.tools) {
            byId[tool.id] = tool;
            if (!byCategory[tool.category])
                byCategory[tool.category] = [];
            byCategory[tool.category].push(tool.id);
            if (!bySource[tool.source])
                bySource[tool.source] = [];
            bySource[tool.source].push(tool.id);
            if (!byPriority[tool.priority])
                byPriority[tool.priority] = [];
            byPriority[tool.priority].push(tool.id);
            if (!byServer[tool.server])
                byServer[tool.server] = [];
            byServer[tool.server].push(tool.id);
        }
        return {
            version: "1.0.0",
            generatedAt: new Date().toISOString(),
            tools: this.tools,
            byId,
            byCategory,
            bySource: bySource,
            byPriority: byPriority,
            byServer,
        };
    }
}
/**
 * Build and save catalog
 */
export async function buildAndSaveCatalog(outputPath) {
    const builder = new CatalogBuilder();
    const catalog = await builder.build();
    fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2));
    console.log(`\nCatalog saved to ${outputPath}`);
    console.log(`Total tools: ${catalog.tools.length}`);
    return catalog;
}
//# sourceMappingURL=builder.js.map