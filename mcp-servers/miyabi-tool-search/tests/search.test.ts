/**
 * Tool Search Tests
 */

import { describe, it, expect, beforeAll } from "vitest";
import { HybridSearchEngine } from "../src/search/hybrid.js";
import { BM25SearchEngine } from "../src/search/bm25.js";
import { RegexSearchEngine } from "../src/search/regex.js";
import { ToolCatalog, ToolCatalogEntry } from "../src/catalog/types.js";

// Mock catalog for testing
function createMockCatalog(): ToolCatalog {
  const tools: ToolCatalogEntry[] = [
    {
      id: "mcp:miyabi-github:github_create_issue",
      name: "github_create_issue",
      displayName: "GitHub Create Issue",
      source: "mcp",
      server: "miyabi-github",
      category: "development",
      subcategory: "github",
      description: "Create a new issue on GitHub repository",
      keywords: ["github", "issue", "create", "bug", "feature"],
      aliases: ["create issue", "new issue"],
      priority: "always",
      deferLoading: false,
      inputSchema: { type: "object" },
    },
    {
      id: "mcp:miyabi-github:github_list_prs",
      name: "github_list_prs",
      displayName: "GitHub List PRs",
      source: "mcp",
      server: "miyabi-github",
      category: "development",
      subcategory: "github",
      description: "List pull requests from a repository",
      keywords: ["github", "pr", "pull request", "list"],
      aliases: ["list prs", "show pull requests"],
      priority: "high",
      deferLoading: true,
      inputSchema: { type: "object" },
    },
    {
      id: "mcp:miyabi-tmux:tmux_list_sessions",
      name: "tmux_list_sessions",
      displayName: "Tmux List Sessions",
      source: "mcp",
      server: "miyabi-tmux",
      category: "communication",
      subcategory: "tmux",
      description: "List all tmux sessions in the Miyabi environment",
      keywords: ["tmux", "session", "list", "terminal"],
      aliases: ["list sessions", "show tmux"],
      priority: "always",
      deferLoading: false,
      inputSchema: { type: "object" },
    },
    {
      id: "mcp:miyabi-resource-monitor:resource_cpu",
      name: "resource_cpu",
      displayName: "Resource CPU",
      source: "mcp",
      server: "miyabi-resource-monitor",
      category: "monitoring",
      subcategory: "resource",
      description: "Get current CPU usage overall and per-core",
      keywords: ["cpu", "resource", "monitor", "usage"],
      aliases: ["cpu usage", "check cpu"],
      priority: "medium",
      deferLoading: true,
      inputSchema: { type: "object" },
    },
    {
      id: "rust:miyabi-agent-codegen:generate_code",
      name: "a2a.codegen.generate_code",
      displayName: "Generate Code",
      source: "rust_crate",
      server: "miyabi-agent-codegen",
      category: "rust_agents",
      subcategory: "codegen",
      description: "Generate code from specifications using AI",
      keywords: ["code", "generate", "ai", "implement"],
      aliases: ["generate code", "write code"],
      priority: "medium",
      deferLoading: true,
      inputSchema: { type: "object" },
    },
  ];

  // Build indexes
  const byId: Record<string, ToolCatalogEntry> = {};
  const byCategory: Record<string, string[]> = {};
  const bySource: Record<string, string[]> = {};
  const byPriority: Record<string, string[]> = {};
  const byServer: Record<string, string[]> = {};

  for (const tool of tools) {
    byId[tool.id] = tool;

    if (!byCategory[tool.category]) byCategory[tool.category] = [];
    byCategory[tool.category].push(tool.id);

    if (!bySource[tool.source]) bySource[tool.source] = [];
    bySource[tool.source].push(tool.id);

    if (!byPriority[tool.priority]) byPriority[tool.priority] = [];
    byPriority[tool.priority].push(tool.id);

    if (!byServer[tool.server]) byServer[tool.server] = [];
    byServer[tool.server].push(tool.id);
  }

  return {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    tools,
    byId,
    byCategory,
    bySource: bySource as any,
    byPriority: byPriority as any,
    byServer,
  };
}

describe("BM25SearchEngine", () => {
  let engine: BM25SearchEngine;
  let catalog: ToolCatalog;

  beforeAll(() => {
    catalog = createMockCatalog();
    engine = new BM25SearchEngine(catalog);
  });

  it("should find tools by natural language query", () => {
    const results = engine.search("create github issue");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].tool.name).toBe("github_create_issue");
  });

  it("should find tools by description keywords", () => {
    const results = engine.search("pull request");
    expect(results.length).toBeGreaterThan(0);
    expect(results.some((r) => r.tool.name === "github_list_prs")).toBe(true);
  });

  it("should return empty results for unmatched query", () => {
    const results = engine.search("xyznonexistent");
    expect(results.length).toBe(0);
  });

  it("should respect limit parameter", () => {
    const results = engine.search("github", 1);
    expect(results.length).toBeLessThanOrEqual(1);
  });
});

describe("RegexSearchEngine", () => {
  let engine: RegexSearchEngine;
  let catalog: ToolCatalog;

  beforeAll(() => {
    catalog = createMockCatalog();
    engine = new RegexSearchEngine(catalog);
  });

  it("should find tools by regex pattern", () => {
    const results = engine.search("github_.*");
    expect(results.length).toBe(2);
  });

  it("should match tool names with pattern", () => {
    const results = engine.search(".*_list_.*");
    expect(results.length).toBe(2);
    expect(results.some((r) => r.tool.name === "github_list_prs")).toBe(true);
    expect(results.some((r) => r.tool.name === "tmux_list_sessions")).toBe(true);
  });

  it("should handle case-insensitive search", () => {
    const results = engine.search("GITHUB");
    expect(results.length).toBeGreaterThan(0);
  });

  it("should throw error for invalid regex", () => {
    expect(() => engine.search("[invalid")).toThrow();
  });

  it("should throw error for pattern exceeding 200 chars", () => {
    const longPattern = "a".repeat(201);
    expect(() => engine.search(longPattern)).toThrow();
  });
});

describe("HybridSearchEngine", () => {
  let engine: HybridSearchEngine;
  let catalog: ToolCatalog;

  beforeAll(() => {
    catalog = createMockCatalog();
    engine = new HybridSearchEngine(catalog);
  });

  it("should use BM25 for natural language queries", () => {
    const results = engine.search("create a new issue on github");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].tool.name).toBe("github_create_issue");
  });

  it("should use regex for pattern-like queries", () => {
    const results = engine.search("github_.*issue.*");
    expect(results.length).toBeGreaterThan(0);
  });

  it("should filter by category", () => {
    const results = engine.search("list", { category: "development" });
    expect(results.every((r) => r.tool.category === "development")).toBe(true);
  });

  it("should filter by source", () => {
    const results = engine.search("generate", { source: "rust_crate" });
    expect(results.every((r) => r.tool.source === "rust_crate")).toBe(true);
  });

  it("should return always-loaded tools", () => {
    const tools = engine.getAlwaysLoadedTools();
    expect(tools.length).toBe(2);
    expect(tools.every((t) => !t.deferLoading)).toBe(true);
  });

  it("should return deferred tools", () => {
    const tools = engine.getDeferredTools();
    expect(tools.length).toBe(3);
    expect(tools.every((t) => t.deferLoading)).toBe(true);
  });

  it("should get tools by server", () => {
    const tools = engine.getByServer("miyabi-github");
    expect(tools.length).toBe(2);
  });

  it("should get catalog statistics", () => {
    const stats = engine.getStats();
    expect(stats.totalTools).toBe(5);
    expect(stats.bySource.mcp).toBe(4);
    expect(stats.bySource.rust_crate).toBe(1);
    expect(stats.alwaysLoadedCount).toBe(2);
    expect(stats.deferredCount).toBe(3);
  });

  it("should provide suggestions for partial queries", () => {
    const suggestions = engine.suggest("git");
    expect(suggestions.length).toBeGreaterThan(0);
    expect(suggestions.some((s) => s.toLowerCase().includes("git"))).toBe(true);
  });
});

describe("Token Savings", () => {
  it("should calculate significant savings", () => {
    const catalog = createMockCatalog();
    const totalTools = catalog.tools.length;
    const alwaysLoaded = catalog.tools.filter((t) => !t.deferLoading).length;
    const deferred = catalog.tools.filter((t) => t.deferLoading).length;

    // Without defer_loading: all tools loaded
    const withoutDeferLoading = totalTools * 300; // ~300 tokens per tool

    // With defer_loading: only always-loaded + search tool
    const withDeferLoading = alwaysLoaded * 300 + 200; // search tool ~200

    const savings = withoutDeferLoading - withDeferLoading;
    const savingsPercent = (savings / withoutDeferLoading) * 100;

    expect(savingsPercent).toBeGreaterThan(50); // At least 50% savings
  });
});
