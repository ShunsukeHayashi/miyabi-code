/**
 * Tool Catalog Type Definitions
 * Miyabi Tool Search System
 */
import { z } from "zod";
export type ToolPriority = "always" | "high" | "medium" | "low";
export type ToolSource = "mcp" | "rust_crate" | "subagent" | "builtin";
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
export interface ToolCatalogEntry {
    id: string;
    name: string;
    displayName: string;
    source: ToolSource;
    server: string;
    category: string;
    subcategory?: string;
    description: string;
    keywords: string[];
    aliases: string[];
    priority: ToolPriority;
    deferLoading: boolean;
    inputSchema: JSONSchema;
    usageCount?: number;
    lastUsed?: string;
}
export interface ToolCatalog {
    version: string;
    generatedAt: string;
    tools: ToolCatalogEntry[];
    byId: Record<string, ToolCatalogEntry>;
    byCategory: Record<string, string[]>;
    bySource: Record<ToolSource, string[]>;
    byPriority: Record<ToolPriority, string[]>;
    byServer: Record<string, string[]>;
}
export interface CatalogStats {
    totalTools: number;
    bySource: Record<ToolSource, number>;
    byPriority: Record<ToolPriority, number>;
    byCategory: Record<string, number>;
    alwaysLoadedCount: number;
    deferredCount: number;
}
export interface SearchResult {
    tool: ToolCatalogEntry;
    score: number;
    matchedFields: string[];
}
export interface SearchOptions {
    type?: "bm25" | "regex" | "hybrid";
    limit?: number;
    category?: string;
    source?: ToolSource;
    minScore?: number;
}
export interface MCPToolDefinition {
    name: string;
    description?: string;
    inputSchema: JSONSchema;
}
export interface MCPServerConfig {
    name: string;
    command: string;
    args: string[];
    env?: Record<string, string>;
}
export interface AnthropicToolDefinition {
    type?: string;
    name: string;
    description?: string;
    input_schema?: JSONSchema;
    defer_loading?: boolean;
}
export declare const ToolCatalogEntrySchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    displayName: z.ZodString;
    source: z.ZodEnum<["mcp", "rust_crate", "subagent", "builtin"]>;
    server: z.ZodString;
    category: z.ZodString;
    subcategory: z.ZodOptional<z.ZodString>;
    description: z.ZodString;
    keywords: z.ZodArray<z.ZodString, "many">;
    aliases: z.ZodArray<z.ZodString, "many">;
    priority: z.ZodEnum<["always", "high", "medium", "low"]>;
    deferLoading: z.ZodBoolean;
    inputSchema: z.ZodRecord<z.ZodString, z.ZodUnknown>;
    usageCount: z.ZodOptional<z.ZodNumber>;
    lastUsed: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    description: string;
    id: string;
    name: string;
    displayName: string;
    source: "mcp" | "rust_crate" | "subagent" | "builtin";
    server: string;
    category: string;
    keywords: string[];
    aliases: string[];
    priority: "always" | "high" | "medium" | "low";
    deferLoading: boolean;
    inputSchema: Record<string, unknown>;
    subcategory?: string | undefined;
    usageCount?: number | undefined;
    lastUsed?: string | undefined;
}, {
    description: string;
    id: string;
    name: string;
    displayName: string;
    source: "mcp" | "rust_crate" | "subagent" | "builtin";
    server: string;
    category: string;
    keywords: string[];
    aliases: string[];
    priority: "always" | "high" | "medium" | "low";
    deferLoading: boolean;
    inputSchema: Record<string, unknown>;
    subcategory?: string | undefined;
    usageCount?: number | undefined;
    lastUsed?: string | undefined;
}>;
export declare const ToolCatalogSchema: z.ZodObject<{
    version: z.ZodString;
    generatedAt: z.ZodString;
    tools: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        displayName: z.ZodString;
        source: z.ZodEnum<["mcp", "rust_crate", "subagent", "builtin"]>;
        server: z.ZodString;
        category: z.ZodString;
        subcategory: z.ZodOptional<z.ZodString>;
        description: z.ZodString;
        keywords: z.ZodArray<z.ZodString, "many">;
        aliases: z.ZodArray<z.ZodString, "many">;
        priority: z.ZodEnum<["always", "high", "medium", "low"]>;
        deferLoading: z.ZodBoolean;
        inputSchema: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        usageCount: z.ZodOptional<z.ZodNumber>;
        lastUsed: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        id: string;
        name: string;
        displayName: string;
        source: "mcp" | "rust_crate" | "subagent" | "builtin";
        server: string;
        category: string;
        keywords: string[];
        aliases: string[];
        priority: "always" | "high" | "medium" | "low";
        deferLoading: boolean;
        inputSchema: Record<string, unknown>;
        subcategory?: string | undefined;
        usageCount?: number | undefined;
        lastUsed?: string | undefined;
    }, {
        description: string;
        id: string;
        name: string;
        displayName: string;
        source: "mcp" | "rust_crate" | "subagent" | "builtin";
        server: string;
        category: string;
        keywords: string[];
        aliases: string[];
        priority: "always" | "high" | "medium" | "low";
        deferLoading: boolean;
        inputSchema: Record<string, unknown>;
        subcategory?: string | undefined;
        usageCount?: number | undefined;
        lastUsed?: string | undefined;
    }>, "many">;
    byId: z.ZodRecord<z.ZodString, z.ZodObject<{
        id: z.ZodString;
        name: z.ZodString;
        displayName: z.ZodString;
        source: z.ZodEnum<["mcp", "rust_crate", "subagent", "builtin"]>;
        server: z.ZodString;
        category: z.ZodString;
        subcategory: z.ZodOptional<z.ZodString>;
        description: z.ZodString;
        keywords: z.ZodArray<z.ZodString, "many">;
        aliases: z.ZodArray<z.ZodString, "many">;
        priority: z.ZodEnum<["always", "high", "medium", "low"]>;
        deferLoading: z.ZodBoolean;
        inputSchema: z.ZodRecord<z.ZodString, z.ZodUnknown>;
        usageCount: z.ZodOptional<z.ZodNumber>;
        lastUsed: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        id: string;
        name: string;
        displayName: string;
        source: "mcp" | "rust_crate" | "subagent" | "builtin";
        server: string;
        category: string;
        keywords: string[];
        aliases: string[];
        priority: "always" | "high" | "medium" | "low";
        deferLoading: boolean;
        inputSchema: Record<string, unknown>;
        subcategory?: string | undefined;
        usageCount?: number | undefined;
        lastUsed?: string | undefined;
    }, {
        description: string;
        id: string;
        name: string;
        displayName: string;
        source: "mcp" | "rust_crate" | "subagent" | "builtin";
        server: string;
        category: string;
        keywords: string[];
        aliases: string[];
        priority: "always" | "high" | "medium" | "low";
        deferLoading: boolean;
        inputSchema: Record<string, unknown>;
        subcategory?: string | undefined;
        usageCount?: number | undefined;
        lastUsed?: string | undefined;
    }>>;
    byCategory: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>;
    bySource: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>;
    byPriority: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>;
    byServer: z.ZodRecord<z.ZodString, z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    version: string;
    generatedAt: string;
    tools: {
        description: string;
        id: string;
        name: string;
        displayName: string;
        source: "mcp" | "rust_crate" | "subagent" | "builtin";
        server: string;
        category: string;
        keywords: string[];
        aliases: string[];
        priority: "always" | "high" | "medium" | "low";
        deferLoading: boolean;
        inputSchema: Record<string, unknown>;
        subcategory?: string | undefined;
        usageCount?: number | undefined;
        lastUsed?: string | undefined;
    }[];
    byId: Record<string, {
        description: string;
        id: string;
        name: string;
        displayName: string;
        source: "mcp" | "rust_crate" | "subagent" | "builtin";
        server: string;
        category: string;
        keywords: string[];
        aliases: string[];
        priority: "always" | "high" | "medium" | "low";
        deferLoading: boolean;
        inputSchema: Record<string, unknown>;
        subcategory?: string | undefined;
        usageCount?: number | undefined;
        lastUsed?: string | undefined;
    }>;
    byCategory: Record<string, string[]>;
    bySource: Record<string, string[]>;
    byPriority: Record<string, string[]>;
    byServer: Record<string, string[]>;
}, {
    version: string;
    generatedAt: string;
    tools: {
        description: string;
        id: string;
        name: string;
        displayName: string;
        source: "mcp" | "rust_crate" | "subagent" | "builtin";
        server: string;
        category: string;
        keywords: string[];
        aliases: string[];
        priority: "always" | "high" | "medium" | "low";
        deferLoading: boolean;
        inputSchema: Record<string, unknown>;
        subcategory?: string | undefined;
        usageCount?: number | undefined;
        lastUsed?: string | undefined;
    }[];
    byId: Record<string, {
        description: string;
        id: string;
        name: string;
        displayName: string;
        source: "mcp" | "rust_crate" | "subagent" | "builtin";
        server: string;
        category: string;
        keywords: string[];
        aliases: string[];
        priority: "always" | "high" | "medium" | "low";
        deferLoading: boolean;
        inputSchema: Record<string, unknown>;
        subcategory?: string | undefined;
        usageCount?: number | undefined;
        lastUsed?: string | undefined;
    }>;
    byCategory: Record<string, string[]>;
    bySource: Record<string, string[]>;
    byPriority: Record<string, string[]>;
    byServer: Record<string, string[]>;
}>;
//# sourceMappingURL=types.d.ts.map