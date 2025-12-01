/**
 * Tool Catalog Type Definitions
 * Miyabi Tool Search System
 */
import { z } from "zod";
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
//# sourceMappingURL=types.js.map