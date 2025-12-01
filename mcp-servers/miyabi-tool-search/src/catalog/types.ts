/**
 * Tool Catalog Type Definitions
 * Miyabi Tool Search System
 */

import { z } from "zod";

// Tool Priority Levels
export type ToolPriority = "always" | "high" | "medium" | "low";

// Tool Source Types
export type ToolSource = "mcp" | "rust_crate" | "subagent" | "builtin";

// JSON Schema type (simplified)
export interface JSONSchema {
  type: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  description?: string;
  items?: JSONSchema;
  enum?: string[];
  default?: unknown;
  [key: string]: unknown;
}

// Tool Catalog Entry
export interface ToolCatalogEntry {
  // Identification
  id: string;                    // "mcp:miyabi-github:create_issue"
  name: string;                  // "github_create_issue"
  displayName: string;           // "GitHub Issue作成"

  // Classification
  source: ToolSource;
  server: string;                // "miyabi-github"
  category: string;              // "development"
  subcategory?: string;          // "issue-tracking"

  // Search Metadata
  description: string;
  keywords: string[];            // ["github", "issue", "create", "bug"]
  aliases: string[];             // ["create issue", "new issue", "issue作成"]

  // Loading Configuration
  priority: ToolPriority;
  deferLoading: boolean;

  // Schema
  inputSchema: JSONSchema;

  // Usage Statistics (future use)
  usageCount?: number;
  lastUsed?: string;
}

// Tool Catalog
export interface ToolCatalog {
  version: string;
  generatedAt: string;
  tools: ToolCatalogEntry[];

  // Indexes for fast lookup
  byId: Record<string, ToolCatalogEntry>;
  byCategory: Record<string, string[]>;
  bySource: Record<ToolSource, string[]>;
  byPriority: Record<ToolPriority, string[]>;
  byServer: Record<string, string[]>;
}

// Catalog Statistics
export interface CatalogStats {
  totalTools: number;
  bySource: Record<ToolSource, number>;
  byPriority: Record<ToolPriority, number>;
  byCategory: Record<string, number>;
  alwaysLoadedCount: number;
  deferredCount: number;
}

// Search Result
export interface SearchResult {
  tool: ToolCatalogEntry;
  score: number;
  matchedFields: string[];
}

// Search Options
export interface SearchOptions {
  type?: "bm25" | "regex" | "hybrid";
  limit?: number;
  category?: string;
  source?: ToolSource;
  minScore?: number;
}

// MCP Tool Definition (from MCP server)
export interface MCPToolDefinition {
  name: string;
  description?: string;
  inputSchema: JSONSchema;
}

// MCP Server Configuration
export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
}

// Anthropic API Tool Definition
export interface AnthropicToolDefinition {
  type?: string;
  name: string;
  description?: string;
  input_schema?: JSONSchema;
  defer_loading?: boolean;
}

// Zod Schemas for validation
export const ToolCatalogEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  displayName: z.string(),
  source: z.enum(["mcp", "rust_crate", "subagent", "builtin"]),
  server: z.string(),
  category: z.string(),
  subcategory: z.string().optional(),
  description: z.string(),
  keywords: z.array(z.string()),
  aliases: z.array(z.string()),
  priority: z.enum(["always", "high", "medium", "low"]),
  deferLoading: z.boolean(),
  inputSchema: z.record(z.unknown()),
  usageCount: z.number().optional(),
  lastUsed: z.string().optional(),
});

export const ToolCatalogSchema = z.object({
  version: z.string(),
  generatedAt: z.string(),
  tools: z.array(ToolCatalogEntrySchema),
  byId: z.record(ToolCatalogEntrySchema),
  byCategory: z.record(z.array(z.string())),
  bySource: z.record(z.array(z.string())),
  byPriority: z.record(z.array(z.string())),
  byServer: z.record(z.array(z.string())),
});
