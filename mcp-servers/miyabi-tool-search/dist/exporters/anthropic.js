/**
 * Anthropic API Exporter
 * Generates tool definitions compatible with Anthropic's Tool Search API
 */
/**
 * Export catalog for Anthropic API with defer_loading support
 */
export function exportForAnthropicAPI(catalog, options = {}) {
    const { includeSearchTool = true, searchToolType = "bm25" } = options;
    const tools = [];
    // 1. Add Tool Search Tool (always first, not deferred)
    if (includeSearchTool) {
        tools.push({
            type: searchToolType === "bm25"
                ? "tool_search_tool_bm25_20251119"
                : "tool_search_tool_regex_20251119",
            name: "tool_search",
        });
    }
    // 2. Add Always Loaded Tools (defer_loading: false)
    const alwaysLoadedIds = catalog.byPriority["always"] || [];
    for (const id of alwaysLoadedIds) {
        const tool = catalog.byId[id];
        if (tool) {
            tools.push(convertToAnthropicTool(tool, false));
        }
    }
    // 3. Add Deferred Tools (defer_loading: true)
    for (const tool of catalog.tools) {
        if (tool.priority !== "always") {
            tools.push(convertToAnthropicTool(tool, true));
        }
    }
    return tools;
}
/**
 * Convert a catalog entry to Anthropic tool definition
 */
function convertToAnthropicTool(tool, deferLoading) {
    return {
        name: tool.name,
        description: tool.description,
        input_schema: tool.inputSchema,
        defer_loading: deferLoading,
    };
}
/**
 * Export for MCP toolset configuration
 */
export function exportForMCPToolset(catalog) {
    const toolsets = {};
    // Group tools by server
    for (const [server, toolIds] of Object.entries(catalog.byServer)) {
        const tools = toolIds.map((id) => catalog.byId[id]).filter(Boolean);
        // Find always-loaded tools for this server
        const alwaysLoaded = tools.filter((t) => t.priority === "always");
        const deferred = tools.filter((t) => t.priority !== "always");
        toolsets[server] = {
            type: "mcp_toolset",
            mcp_server_name: server,
            default_config: { defer_loading: true },
            configs: Object.fromEntries([
                // Always loaded tools
                ...alwaysLoaded.map((t) => [t.name, { defer_loading: false }]),
            ]),
        };
    }
    return toolsets;
}
/**
 * Generate API request body with tool search
 */
export function generateAPIRequest(catalog, options) {
    const { model = "claude-sonnet-4-5-20250929", maxTokens = 4096, messages, } = options;
    return {
        model,
        max_tokens: maxTokens,
        betas: ["advanced-tool-use-2025-11-20"],
        tools: exportForAnthropicAPI(catalog),
        messages,
    };
}
/**
 * Calculate token savings from defer_loading
 */
export function calculateTokenSavings(catalog) {
    // Estimate tokens per tool definition
    const TOKENS_PER_TOOL = 300; // Average estimate
    const TOKENS_FOR_SEARCH_TOOL = 200;
    const totalTools = catalog.tools.length;
    const alwaysLoadedCount = (catalog.byPriority["always"] || []).length;
    const withoutDeferLoading = totalTools * TOKENS_PER_TOOL;
    const withDeferLoading = alwaysLoadedCount * TOKENS_PER_TOOL + TOKENS_FOR_SEARCH_TOOL;
    const savings = withoutDeferLoading - withDeferLoading;
    const savingsPercent = Math.round((savings / withoutDeferLoading) * 100);
    return {
        withoutDeferLoading,
        withDeferLoading,
        savings,
        savingsPercent,
    };
}
/**
 * Generate Python SDK code example
 */
export function generatePythonExample(catalog) {
    const tools = exportForAnthropicAPI(catalog);
    const toolsJson = JSON.stringify(tools.slice(0, 5), null, 2); // Show first 5 as example
    return `
import anthropic

client = anthropic.Anthropic()

# Tool definitions with defer_loading
tools = ${toolsJson}
# ... plus ${tools.length - 5} more tools

response = client.beta.messages.create(
    model="claude-sonnet-4-5-20250929",
    betas=["advanced-tool-use-2025-11-20"],
    max_tokens=4096,
    tools=tools,
    messages=[
        {"role": "user", "content": "Create a GitHub issue for the bug fix"}
    ]
)

# Handle tool search results
for block in response.content:
    if block.type == "server_tool_use" and block.name == "tool_search":
        print(f"Searched for: {block.input}")
    elif block.type == "tool_use":
        print(f"Using tool: {block.name}")
        print(f"Input: {block.input}")
`.trim();
}
/**
 * Generate TypeScript SDK code example
 */
export function generateTypeScriptExample(catalog) {
    const savings = calculateTokenSavings(catalog);
    return `
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

// Token savings: ${savings.savingsPercent}% (${savings.savings.toLocaleString()} tokens)

const response = await client.beta.messages.create({
  model: "claude-sonnet-4-5-20250929",
  betas: ["advanced-tool-use-2025-11-20"],
  max_tokens: 4096,
  tools: [
    // Tool Search Tool (always loaded)
    {
      type: "tool_search_tool_bm25_20251119",
      name: "tool_search",
    },
    // High priority tools (always loaded)
    ...alwaysLoadedTools.map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema,
      defer_loading: false,
    })),
    // Deferred tools (loaded on demand)
    ...deferredTools.map(t => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema,
      defer_loading: true,
    })),
  ],
  messages: [
    { role: "user", content: "Create a GitHub issue for the bug fix" },
  ],
});
`.trim();
}
//# sourceMappingURL=anthropic.js.map