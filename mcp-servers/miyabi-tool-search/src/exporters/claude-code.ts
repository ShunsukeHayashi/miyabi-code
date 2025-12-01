/**
 * Claude Code Configuration Exporter
 * Generates configuration files for Claude Code integration
 */

import * as fs from "fs";
import * as path from "path";
import { ToolCatalog, ToolCatalogEntry } from "../catalog/types.js";

/**
 * Claude Code settings.json configuration
 */
export interface ClaudeCodeSettings {
  toolSearch: {
    enabled: boolean;
    searchType: "bm25" | "regex" | "hybrid";
    maxResults: number;
    catalogPath: string;
  };
  alwaysLoadedTools: string[];
  deferredCategories: string[];
  toolPriorities: Record<string, "always" | "high" | "medium" | "low">;
}

/**
 * Generate Claude Code settings configuration
 */
export function generateClaudeCodeSettings(
  catalog: ToolCatalog
): ClaudeCodeSettings {
  const alwaysLoadedTools = (catalog.byPriority["always"] || [])
    .map((id) => catalog.byId[id]?.name)
    .filter(Boolean);

  // Categories with mostly low-priority tools
  const deferredCategories = Object.entries(catalog.byCategory)
    .filter(([category, toolIds]) => {
      const tools = toolIds.map((id) => catalog.byId[id]).filter(Boolean);
      const lowPriorityCount = tools.filter(
        (t) => t.priority === "low" || t.priority === "medium"
      ).length;
      return lowPriorityCount / tools.length > 0.7;
    })
    .map(([category]) => category);

  // Tool priority overrides
  const toolPriorities: Record<string, "always" | "high" | "medium" | "low"> =
    {};
  for (const tool of catalog.tools) {
    if (tool.priority !== "medium") {
      toolPriorities[tool.name] = tool.priority;
    }
  }

  return {
    toolSearch: {
      enabled: true,
      searchType: "hybrid",
      maxResults: 5,
      catalogPath: "./data/tool-catalog.json",
    },
    alwaysLoadedTools,
    deferredCategories,
    toolPriorities,
  };
}

/**
 * Generate .mcp.json with defer_loading configuration
 */
export function generateMCPConfig(
  catalog: ToolCatalog,
  existingConfig?: object
): object {
  const mcpServers: Record<string, object> = {};

  // Get unique servers
  const servers = [...new Set(catalog.tools.map((t) => t.server))];

  for (const server of servers) {
    const serverTools = catalog.tools.filter((t) => t.server === server);

    // Skip non-MCP sources
    if (!serverTools.some((t) => t.source === "mcp")) {
      continue;
    }

    // Find existing config for this server
    const existing = (existingConfig as any)?.mcpServers?.[server] || {};

    // Generate tool configs
    const toolConfig: Record<string, { deferLoading: boolean }> = {};
    for (const tool of serverTools) {
      toolConfig[tool.name] = { deferLoading: tool.deferLoading };
    }

    mcpServers[server] = {
      ...existing,
      toolConfig: {
        default: { deferLoading: true },
        overrides: Object.fromEntries(
          serverTools
            .filter((t) => !t.deferLoading)
            .map((t) => [t.name, { deferLoading: false }])
        ),
      },
    };
  }

  // Add tool-search server first
  const result = {
    mcpServers: {
      "miyabi-tool-search": {
        type: "stdio",
        command: "node",
        args: ["./mcp-servers/miyabi-tool-search/dist/index.js"],
        priority: 0,
        alwaysEnabled: true,
      },
      ...mcpServers,
    },
  };

  return result;
}

/**
 * Generate CLAUDE.md section for tool search documentation
 */
export function generateClaudeMDSection(catalog: ToolCatalog): string {
  const stats = {
    total: catalog.tools.length,
    alwaysLoaded: (catalog.byPriority["always"] || []).length,
    deferred: catalog.tools.filter((t) => t.deferLoading).length,
    bySource: {
      mcp: (catalog.bySource["mcp"] || []).length,
      rust: (catalog.bySource["rust_crate"] || []).length,
      subagent: (catalog.bySource["subagent"] || []).length,
    },
  };

  const categories = Object.keys(catalog.byCategory).sort();

  return `
## Tool Search System

Miyabi uses an intelligent tool search system to manage ${stats.total}+ tools efficiently.

### Statistics
- **Total Tools**: ${stats.total}
- **Always Loaded**: ${stats.alwaysLoaded} (immediate access)
- **Deferred**: ${stats.deferred} (loaded on demand)
- **Sources**: MCP (${stats.bySource.mcp}), Rust (${stats.bySource.rust}), Subagent (${stats.bySource.subagent})

### Categories
${categories.map((c) => `- \`${c}\`: ${(catalog.byCategory[c] || []).length} tools`).join("\n")}

### Usage

Search for tools using natural language:
\`\`\`
search_tools("create github issue")
search_tools("monitor system resources")
search_tools("generate code from spec")
\`\`\`

Or use regex patterns:
\`\`\`
search_tools("github_.*", type="regex")
search_tools("resource_.*|process_.*", type="regex")
\`\`\`

### Always Loaded Tools

These tools are immediately available without search:
${(catalog.byPriority["always"] || [])
  .slice(0, 10)
  .map((id) => `- \`${catalog.byId[id]?.name}\``)
  .join("\n")}
${stats.alwaysLoaded > 10 ? `\n... and ${stats.alwaysLoaded - 10} more` : ""}

### Token Savings

Without Tool Search: ~${(stats.total * 300).toLocaleString()} tokens
With Tool Search: ~${(stats.alwaysLoaded * 300 + 200).toLocaleString()} tokens
**Savings**: ${Math.round(((stats.deferred * 300) / (stats.total * 300)) * 100)}%
`.trim();
}

/**
 * Write all configuration files
 */
export async function writeAllConfigs(
  catalog: ToolCatalog,
  outputDir: string
): Promise<void> {
  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Write settings.json
  const settings = generateClaudeCodeSettings(catalog);
  fs.writeFileSync(
    path.join(outputDir, "tool-search-settings.json"),
    JSON.stringify(settings, null, 2)
  );

  // Write MCP config
  const mcpConfig = generateMCPConfig(catalog);
  fs.writeFileSync(
    path.join(outputDir, "tool-search-mcp.json"),
    JSON.stringify(mcpConfig, null, 2)
  );

  // Write CLAUDE.md section
  const claudeMD = generateClaudeMDSection(catalog);
  fs.writeFileSync(path.join(outputDir, "TOOL_SEARCH.md"), claudeMD);

  console.log(`Configuration files written to ${outputDir}`);
}

/**
 * Merge tool search config into existing settings
 */
export function mergeIntoExistingSettings(
  existingPath: string,
  catalog: ToolCatalog
): object {
  let existing: object = {};

  if (fs.existsSync(existingPath)) {
    existing = JSON.parse(fs.readFileSync(existingPath, "utf-8"));
  }

  const toolSearchSettings = generateClaudeCodeSettings(catalog);

  return {
    ...existing,
    toolSearch: toolSearchSettings.toolSearch,
    // Merge arrays without duplicates
    alwaysLoadedTools: [
      ...new Set([
        ...((existing as any).alwaysLoadedTools || []),
        ...toolSearchSettings.alwaysLoadedTools,
      ]),
    ],
  };
}
