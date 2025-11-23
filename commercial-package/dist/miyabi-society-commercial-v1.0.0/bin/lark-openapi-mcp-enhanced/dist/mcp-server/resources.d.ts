/**
 * MCP Resources - Provide access to templates, examples, and documentation
 */
export declare const mcpResources: {
    name: string;
    description: string;
    mimeType: string;
    content: string;
}[];
/**
 * Register resources with MCP server
 */
export declare function registerResources(server: any): void;
