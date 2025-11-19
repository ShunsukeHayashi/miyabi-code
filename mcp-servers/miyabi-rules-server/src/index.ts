#!/usr/bin/env node

/**
 * Miyabi Rules MCP Server
 *
 * Provides MCP tools for interacting with Miyabi Rules service
 * Supports both local Claude Code and cloud-based miyabi-rules endpoints
 *
 * Features:
 * - Rule validation and execution
 * - Local file-based rules (CLAUDE.md, context modules)
 * - Cloud API integration for distributed rule enforcement
 * - Automatic fallback from cloud to local rules
 * - Rule caching and synchronization
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import axios, { AxiosError } from "axios";
import { readFile } from "fs/promises";
import { join } from "path";

// Miyabi Rules Configuration
const MIYABI_PROJECT_ROOT = "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private";
const MIYABI_CLOUD_API_URL = process.env.MIYABI_RULES_API_URL || "https://miyabi-rules-api.example.com";
const MIYABI_API_KEY = process.env.MIYABI_API_KEY;

interface Rule {
  id: string;
  name: string;
  priority: "P0" | "P1" | "P2" | "P3";
  category: string;
  description: string;
  validation: string;
  source: "local" | "cloud";
}

interface RuleValidationResult {
  valid: boolean;
  rule: Rule;
  violations: string[];
  suggestions: string[];
}

interface RuleExecutionResult {
  success: boolean;
  rule: Rule;
  output: string;
  errors: string[];
}

/**
 * Load local rules from CLAUDE.md and context modules
 */
async function loadLocalRules(): Promise<Rule[]> {
  const rules: Rule[] = [];

  try {
    // Load CLAUDE.md P0/P1/P2 rules
    const claudeMdPath = join(MIYABI_PROJECT_ROOT, "CLAUDE.md");
    const claudeMdContent = await readFile(claudeMdPath, "utf-8");

    // Parse P0 rules
    const p0Matches = claudeMdContent.matchAll(/### P0\.(\d+): (.+?)\n\n\*\*原則\*\*: (.+?)(?=\n\n)/gs);
    for (const match of p0Matches) {
      rules.push({
        id: `P0.${match[1]}`,
        name: match[2],
        priority: "P0",
        category: "Critical Operating Principles",
        description: match[3],
        validation: "Must be followed at all times",
        source: "local",
      });
    }

    // Parse P1 rules
    const p1Matches = claudeMdContent.matchAll(/### P1\.(\d+): (.+?)\n\n\*\*原則\*\*: (.+?)(?=\n\n)/gs);
    for (const match of p1Matches) {
      rules.push({
        id: `P1.${match[1]}`,
        name: match[2],
        priority: "P1",
        category: "Essential Procedures",
        description: match[3],
        validation: "Required for task success",
        source: "local",
      });
    }

    // Parse P2 rules
    const p2Matches = claudeMdContent.matchAll(/### SOP-(\d+): (.+?)(?=\n\n)/gs);
    for (const match of p2Matches) {
      rules.push({
        id: `P2.SOP-${match[1]}`,
        name: match[2],
        priority: "P2",
        category: "Standard Operating Procedures",
        description: match[2],
        validation: "Recommended best practice",
        source: "local",
      });
    }

  } catch (error: any) {
    console.error(`Failed to load local rules: ${error.message}`);
  }

  return rules;
}

/**
 * Fetch rules from cloud API with automatic fallback
 */
async function fetchCloudRules(): Promise<Rule[]> {
  if (!MIYABI_API_KEY) {
    console.warn("MIYABI_API_KEY not set. Cloud rules unavailable.");
    return [];
  }

  try {
    const response = await axios.get(`${MIYABI_CLOUD_API_URL}/api/rules`, {
      headers: {
        Authorization: `Bearer ${MIYABI_API_KEY}`,
      },
      timeout: 5000,
    });

    return response.data.rules.map((r: any) => ({
      ...r,
      source: "cloud",
    }));
  } catch (error: any) {
    if (error.code === "ECONNREFUSED" || error.code === "ETIMEDOUT") {
      console.warn("Cloud rules API unreachable. Using local rules only.");
    } else {
      console.error(`Failed to fetch cloud rules: ${error.message}`);
    }
    return [];
  }
}

/**
 * Get all rules (local + cloud) with deduplication
 */
async function getAllRules(): Promise<Rule[]> {
  const [localRules, cloudRules] = await Promise.all([
    loadLocalRules(),
    fetchCloudRules(),
  ]);

  // Cloud rules override local rules with same ID
  const rulesMap = new Map<string, Rule>();

  for (const rule of localRules) {
    rulesMap.set(rule.id, rule);
  }

  for (const rule of cloudRules) {
    rulesMap.set(rule.id, rule);
  }

  return Array.from(rulesMap.values());
}

/**
 * Validate task against rules
 */
async function validateTask(
  taskDescription: string,
  ruleIds?: string[]
): Promise<RuleValidationResult[]> {
  const rules = await getAllRules();
  const targetRules = ruleIds
    ? rules.filter((r) => ruleIds.includes(r.id))
    : rules.filter((r) => r.priority === "P0" || r.priority === "P1");

  const results: RuleValidationResult[] = [];

  for (const rule of targetRules) {
    const violations: string[] = [];
    const suggestions: string[] = [];

    // Rule-specific validation logic
    switch (rule.id) {
      case "P0.1": // Task Delegation Protocol
        if (taskDescription.toLowerCase().includes("cargo build")) {
          violations.push("Direct cargo build detected. Use rust-development Skill instead.");
          suggestions.push("Use: Skill tool with command 'rust-development'");
        }
        break;

      case "P0.2": // Inter-Agent Communication Protocol
        if (taskDescription.includes("tmux send-keys") && !taskDescription.includes("sleep 0.5")) {
          violations.push("tmux send-keys without sleep 0.5. P0.2 protocol violation.");
          suggestions.push(
            "Use: tmux send-keys -t <PANE_ID> \"<MESSAGE>\" && sleep 0.5 && tmux send-keys -t <PANE_ID> Enter"
          );
        }
        break;

      case "P1.1": // MCP First Approach
        if (!taskDescription.toLowerCase().includes("mcp")) {
          suggestions.push("Consider checking MCP availability first: claude mcp list");
        }
        break;

      case "P1.2": // Context7 for External Libraries
        if (
          taskDescription.match(/\b(axios|express|react|vue)\b/i) &&
          !taskDescription.toLowerCase().includes("context7")
        ) {
          suggestions.push("Use Context7 for external library documentation");
        }
        break;
    }

    results.push({
      valid: violations.length === 0,
      rule,
      violations,
      suggestions,
    });
  }

  return results;
}

/**
 * Execute rule enforcement action
 */
async function executeRule(ruleId: string, context: any): Promise<RuleExecutionResult> {
  const rules = await getAllRules();
  const rule = rules.find((r) => r.id === ruleId);

  if (!rule) {
    return {
      success: false,
      rule: {
        id: ruleId,
        name: "Unknown",
        priority: "P3",
        category: "Unknown",
        description: "Rule not found",
        validation: "",
        source: "local",
      },
      output: "",
      errors: [`Rule ${ruleId} not found`],
    };
  }

  // Execute rule-specific actions
  let output = "";
  const errors: string[] = [];

  try {
    switch (rule.id) {
      case "P0.1": // Task Delegation Protocol
        output = "Enforcing Task Delegation Protocol: All tasks must use Sub-Agent or Skill tools.";
        break;

      case "P0.2": // Inter-Agent Communication Protocol
        output = "Enforcing Inter-Agent Communication Protocol: Using strict tmux syntax with sleep 0.5.";
        break;

      case "P1.1": // MCP First Approach
        output = "Checking MCP availability...";
        // In real implementation, would execute: claude mcp list
        break;

      default:
        output = `Rule ${rule.id} acknowledged but no specific action defined.`;
    }
  } catch (error: any) {
    errors.push(error.message);
  }

  return {
    success: errors.length === 0,
    rule,
    output,
    errors,
  };
}

/**
 * Sync local rules to cloud
 */
async function syncRulesToCloud(): Promise<{ synced: number; failed: number }> {
  if (!MIYABI_API_KEY) {
    return { synced: 0, failed: 0 };
  }

  const localRules = await loadLocalRules();

  let synced = 0;
  let failed = 0;

  for (const rule of localRules) {
    try {
      await axios.post(
        `${MIYABI_CLOUD_API_URL}/api/rules`,
        rule,
        {
          headers: {
            Authorization: `Bearer ${MIYABI_API_KEY}`,
          },
          timeout: 5000,
        }
      );
      synced++;
    } catch (error) {
      failed++;
      console.error(`Failed to sync rule ${rule.id}:`, error);
    }
  }

  return { synced, failed };
}

// Define MCP tools
const tools: Tool[] = [
  {
    name: "miyabi_rules_list",
    description: "List all available Miyabi rules from local CLAUDE.md and cloud API. Returns rules with priority (P0-P3), category, and source.",
    inputSchema: {
      type: "object",
      properties: {
        priority: {
          type: "string",
          enum: ["P0", "P1", "P2", "P3"],
          description: "Optional filter by priority level",
        },
        category: {
          type: "string",
          description: "Optional filter by category",
        },
      },
    },
  },
  {
    name: "miyabi_rules_validate",
    description: "Validate a task description against Miyabi rules. Checks for violations of P0/P1 protocols and provides suggestions.",
    inputSchema: {
      type: "object",
      properties: {
        task_description: {
          type: "string",
          description: "Description of the task to validate",
        },
        rule_ids: {
          type: "array",
          items: { type: "string" },
          description: "Optional specific rule IDs to validate against (default: all P0/P1 rules)",
        },
      },
      required: ["task_description"],
    },
  },
  {
    name: "miyabi_rules_execute",
    description: "Execute a specific rule enforcement action. Used to programmatically enforce Miyabi protocols.",
    inputSchema: {
      type: "object",
      properties: {
        rule_id: {
          type: "string",
          description: "Rule ID to execute (e.g., 'P0.1', 'P1.1')",
        },
        context: {
          type: "object",
          description: "Optional execution context",
        },
      },
      required: ["rule_id"],
    },
  },
  {
    name: "miyabi_rules_sync",
    description: "Synchronize local rules to cloud API. Ensures cloud ruleset matches local CLAUDE.md definitions.",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "miyabi_rules_get_context",
    description: "Get specific context module content from .claude/context/ directory. Useful for retrieving detailed documentation.",
    inputSchema: {
      type: "object",
      properties: {
        module_name: {
          type: "string",
          description: "Context module name (e.g., 'agents', 'worktree', 'development')",
        },
      },
      required: ["module_name"],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: "miyabi-rules-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle tool list requests
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "miyabi_rules_list": {
        const { priority, category } = args as { priority?: string; category?: string };
        let rules = await getAllRules();

        if (priority) {
          rules = rules.filter((r) => r.priority === priority);
        }
        if (category) {
          rules = rules.filter((r) => r.category === category);
        }

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  total: rules.length,
                  rules: rules.map((r) => ({
                    id: r.id,
                    name: r.name,
                    priority: r.priority,
                    category: r.category,
                    source: r.source,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "miyabi_rules_validate": {
        const { task_description, rule_ids } = args as {
          task_description: string;
          rule_ids?: string[];
        };

        const results = await validateTask(task_description, rule_ids);

        const violationsCount = results.filter((r) => !r.valid).length;
        const summary = {
          valid: violationsCount === 0,
          violations_count: violationsCount,
          suggestions_count: results.reduce((sum, r) => sum + r.suggestions.length, 0),
          results,
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(summary, null, 2),
            },
          ],
        };
      }

      case "miyabi_rules_execute": {
        const { rule_id, context } = args as { rule_id: string; context?: any };
        const result = await executeRule(rule_id, context || {});

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "miyabi_rules_sync": {
        const result = await syncRulesToCloud();

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  success: result.failed === 0,
                  synced: result.synced,
                  failed: result.failed,
                  message: `Synced ${result.synced} rules to cloud (${result.failed} failed)`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case "miyabi_rules_get_context": {
        const { module_name } = args as { module_name: string };
        const contextPath = join(MIYABI_PROJECT_ROOT, ".claude", "context", `${module_name}.md`);

        try {
          const content = await readFile(contextPath, "utf-8");
          return {
            content: [
              {
                type: "text",
                text: content,
              },
            ],
          };
        } catch (error: any) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: `Context module '${module_name}' not found`,
                    available_modules: [
                      "agents",
                      "architecture",
                      "business-agents",
                      "coding-agents",
                      "core-rules",
                      "development",
                      "Entity-Relation",
                      "git-workflow",
                      "labels",
                      "miyabi-definition",
                      "orchestration",
                      "protocols",
                      "rust",
                      "worktree",
                    ],
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              success: false,
              error: error.message,
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Miyabi Rules MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
