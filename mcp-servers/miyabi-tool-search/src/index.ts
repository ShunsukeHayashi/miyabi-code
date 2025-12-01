#!/usr/bin/env node
/**
 * Miyabi Tool Search MCP Server
 *
 * Provides intelligent tool discovery and defer_loading support
 * for the Miyabi ecosystem.
 *
 * Features:
 * - BM25 natural language search
 * - Regex pattern matching
 * - Hybrid search combining both approaches
 * - Tool catalog management
 * - Anthropic API defer_loading support
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

import { HybridSearchEngine } from "./search/hybrid.js";
import { ToolCatalog, SearchOptions, ToolSource } from "./catalog/types.js";
import { buildAndSaveCatalog } from "./catalog/builder.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Catalog path
const CATALOG_PATH = path.join(__dirname, "../data/tool-catalog.json");

// Search engine instance
let searchEngine: HybridSearchEngine | null = null;

/**
 * Load or build the tool catalog
 */
async function loadCatalog(): Promise<ToolCatalog> {
  // Check if catalog exists
  if (fs.existsSync(CATALOG_PATH)) {
    const catalogData = fs.readFileSync(CATALOG_PATH, "utf-8");
    return JSON.parse(catalogData) as ToolCatalog;
  }

  // Build catalog if not exists
  console.error("Catalog not found, building...");
  return await buildAndSaveCatalog(CATALOG_PATH);
}

/**
 * Initialize the search engine
 */
async function initializeSearchEngine(): Promise<void> {
  const catalog = await loadCatalog();
  searchEngine = new HybridSearchEngine(catalog);
  console.error(`Tool Search initialized with ${catalog.tools.length} tools`);
}

/**
 * Create the MCP server
 */
function createServer(): Server {
  const server = new Server(
    {
      name: "miyabi-tool-search",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools: Tool[] = [
      {
        name: "search_tools",
        description:
          "Search for available tools by natural language query or regex pattern. " +
          "Returns matching tools that can be loaded on demand. " +
          "Use this to find tools for specific tasks.",
        inputSchema: {
          type: "object" as const,
          properties: {
            query: {
              type: "string",
              description:
                "Search query - natural language (e.g., 'create github issue') or " +
                "regex pattern (e.g., 'github_.*issue.*')",
            },
            type: {
              type: "string",
              enum: ["bm25", "regex", "hybrid"],
              default: "hybrid",
              description:
                "Search type: 'bm25' for natural language, 'regex' for patterns, " +
                "'hybrid' for combined (default)",
            },
            category: {
              type: "string",
              description:
                "Filter by category (e.g., 'development', 'monitoring', 'knowledge')",
            },
            source: {
              type: "string",
              enum: ["mcp", "rust_crate", "subagent", "builtin"],
              description: "Filter by tool source",
            },
            limit: {
              type: "number",
              default: 5,
              maximum: 10,
              description: "Maximum number of results (default: 5, max: 10)",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "get_catalog_stats",
        description:
          "Get statistics about the tool catalog including total tools, " +
          "breakdown by source/category/priority, and defer_loading counts.",
        inputSchema: {
          type: "object" as const,
          properties: {},
        },
      },
      {
        name: "get_tools_by_category",
        description:
          "Get all tools in a specific category. " +
          "Categories: development, monitoring, knowledge, ai_design, business, communication, rust_agents, file_operations",
        inputSchema: {
          type: "object" as const,
          properties: {
            category: {
              type: "string",
              description: "Category name",
            },
          },
          required: ["category"],
        },
      },
      {
        name: "get_tools_by_server",
        description:
          "Get all tools from a specific MCP server.",
        inputSchema: {
          type: "object" as const,
          properties: {
            server: {
              type: "string",
              description: "Server name (e.g., 'miyabi-github', 'miyabi-tmux')",
            },
          },
          required: ["server"],
        },
      },
      {
        name: "get_always_loaded_tools",
        description:
          "Get the list of tools that are always loaded (not deferred). " +
          "These are high-priority tools available immediately.",
        inputSchema: {
          type: "object" as const,
          properties: {},
        },
      },
      {
        name: "suggest_tools",
        description:
          "Get tool suggestions for autocomplete based on partial query.",
        inputSchema: {
          type: "object" as const,
          properties: {
            partial_query: {
              type: "string",
              description: "Partial query for autocomplete",
            },
            limit: {
              type: "number",
              default: 5,
              description: "Maximum number of suggestions",
            },
          },
          required: ["partial_query"],
        },
      },
      {
        name: "rebuild_catalog",
        description:
          "Rebuild the tool catalog from scratch. " +
          "Use this when new tools have been added or removed.",
        inputSchema: {
          type: "object" as const,
          properties: {},
        },
      },
    ];

    return { tools };
  });

  // Handle tool calls
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (!searchEngine) {
      await initializeSearchEngine();
    }

    try {
      switch (name) {
        case "search_tools": {
          const query = args?.query as string;
          const options: SearchOptions = {
            type: (args?.type as "bm25" | "regex" | "hybrid") || "hybrid",
            category: args?.category as string | undefined,
            source: args?.source as ToolSource | undefined,
            limit: Math.min((args?.limit as number) || 5, 10),
          };

          const results = searchEngine!.search(query, options);

          // Format as tool_reference blocks for Anthropic API
          const toolReferences = results.map((r) => ({
            type: "tool_reference",
            tool_name: r.tool.name,
            tool_server: r.tool.server,
            description: r.tool.description,
            score: r.score,
            matched_fields: r.matchedFields,
            category: r.tool.category,
            defer_loading: r.tool.deferLoading,
          }));

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    query,
                    results_count: results.length,
                    tools: toolReferences,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case "get_catalog_stats": {
          const stats = searchEngine!.getStats();
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(stats, null, 2),
              },
            ],
          };
        }

        case "get_tools_by_category": {
          const category = args?.category as string;
          const tools = searchEngine!.getByCategory(category);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    category,
                    count: tools.length,
                    tools: tools.map((t) => ({
                      name: t.name,
                      description: t.description,
                      server: t.server,
                      defer_loading: t.deferLoading,
                    })),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case "get_tools_by_server": {
          const server = args?.server as string;
          const tools = searchEngine!.getByServer(server);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    server,
                    count: tools.length,
                    tools: tools.map((t) => ({
                      name: t.name,
                      description: t.description,
                      category: t.category,
                      defer_loading: t.deferLoading,
                    })),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case "get_always_loaded_tools": {
          const tools = searchEngine!.getAlwaysLoadedTools();

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    count: tools.length,
                    tools: tools.map((t) => ({
                      name: t.name,
                      description: t.description,
                      server: t.server,
                      category: t.category,
                    })),
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        case "suggest_tools": {
          const partialQuery = args?.partial_query as string;
          const limit = (args?.limit as number) || 5;
          const suggestions = searchEngine!.suggest(partialQuery, limit);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ suggestions }, null, 2),
              },
            ],
          };
        }

        case "rebuild_catalog": {
          const catalog = await buildAndSaveCatalog(CATALOG_PATH);
          searchEngine = new HybridSearchEngine(catalog);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    status: "success",
                    message: "Catalog rebuilt successfully",
                    total_tools: catalog.tools.length,
                  },
                  null,
                  2
                ),
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                error: true,
                message: (error as Error).message,
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

  return server;
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  try {
    // Initialize search engine
    await initializeSearchEngine();

    // Create and start server
    const server = createServer();
    const transport = new StdioServerTransport();

    await server.connect(transport);
    console.error("Miyabi Tool Search MCP Server started");
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

main();
