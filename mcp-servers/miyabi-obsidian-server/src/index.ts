#!/usr/bin/env node

/**
 * Miyabi Obsidian MCP Server
 *
 * Provides MCP tools for accessing Miyabi Documentation Knowledge System
 * Connects Obsidian vault to Claude Code for seamless documentation access
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { readFile, readdir, writeFile, stat } from "fs/promises";
import { join, relative } from "path";
import matter from "gray-matter";

// Obsidian vault path
const VAULT_PATH = "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/docs/obsidian-vault";

interface Document {
  path: string;
  title: string;
  category?: string;
  tags?: string[];
  created?: string;
  updated?: string;
  author?: string;
  status?: string;
}

interface Frontmatter {
  title: string;
  created: string;
  updated: string;
  author: string;
  category: string;
  tags: string[];
  status: string;
  [key: string]: any;
}

/**
 * Recursively get all markdown files in a directory
 */
async function getMarkdownFiles(dir: string, baseDir: string = dir): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        return getMarkdownFiles(fullPath, baseDir);
      } else if (entry.name.endsWith(".md")) {
        return [relative(baseDir, fullPath)];
      }
      return [];
    })
  );
  return files.flat();
}

/**
 * Parse markdown file with frontmatter
 */
async function parseDocument(filePath: string): Promise<{ frontmatter: Frontmatter; content: string; raw: string }> {
  const fullPath = join(VAULT_PATH, filePath);
  const raw = await readFile(fullPath, "utf-8");
  const { data, content } = matter(raw);

  return {
    frontmatter: data as Frontmatter,
    content: content.trim(),
    raw,
  };
}

/**
 * List all documents with optional filters
 */
async function listDocuments(filters?: {
  category?: string;
  tags?: string[];
  path?: string;
}): Promise<Document[]> {
  const searchPath = filters?.path ? join(VAULT_PATH, filters.path) : VAULT_PATH;
  const files = await getMarkdownFiles(searchPath);

  const documents: Document[] = [];

  for (const file of files) {
    try {
      const { frontmatter } = await parseDocument(file);

      // Apply filters
      if (filters?.category && frontmatter.category !== filters.category) {
        continue;
      }

      if (filters?.tags && filters.tags.length > 0) {
        const docTags = frontmatter.tags || [];
        const hasAllTags = filters.tags.every(tag => docTags.includes(tag));
        if (!hasAllTags) {
          continue;
        }
      }

      documents.push({
        path: file,
        title: frontmatter.title || file,
        category: frontmatter.category,
        tags: frontmatter.tags,
        created: frontmatter.created,
        updated: frontmatter.updated,
        author: frontmatter.author,
        status: frontmatter.status,
      });
    } catch (error) {
      // Skip files that can't be parsed
      console.error(`Error parsing ${file}:`, error);
    }
  }

  return documents;
}

/**
 * Read document content
 */
async function readDocument(filePath: string): Promise<{
  frontmatter: Frontmatter;
  content: string;
  fullPath: string;
}> {
  const { frontmatter, content } = await parseDocument(filePath);
  return {
    frontmatter,
    content,
    fullPath: join(VAULT_PATH, filePath),
  };
}

/**
 * Create new document with frontmatter
 */
async function createDocument(
  filePath: string,
  content: string,
  frontmatter: Partial<Frontmatter>
): Promise<{ success: boolean; path: string }> {
  const now = new Date().toISOString().split("T")[0];

  const defaultFrontmatter: Frontmatter = {
    title: frontmatter.title || "Untitled",
    created: now,
    updated: now,
    author: frontmatter.author || "Claude Code",
    category: frontmatter.category || "uncategorized",
    tags: frontmatter.tags || [],
    status: frontmatter.status || "draft",
    ...frontmatter,
  };

  const doc = matter.stringify(content, defaultFrontmatter);
  const fullPath = join(VAULT_PATH, filePath);

  await writeFile(fullPath, doc, "utf-8");

  return {
    success: true,
    path: fullPath,
  };
}

/**
 * Update existing document
 */
async function updateDocument(
  filePath: string,
  content?: string,
  frontmatterUpdates?: Partial<Frontmatter>
): Promise<{ success: boolean; path: string }> {
  const { frontmatter: existingFrontmatter, content: existingContent } = await parseDocument(filePath);

  const updatedFrontmatter = {
    ...existingFrontmatter,
    ...frontmatterUpdates,
    updated: new Date().toISOString().split("T")[0],
  };

  const updatedContent = content !== undefined ? content : existingContent;
  const doc = matter.stringify(updatedContent, updatedFrontmatter);

  const fullPath = join(VAULT_PATH, filePath);
  await writeFile(fullPath, doc, "utf-8");

  return {
    success: true,
    path: fullPath,
  };
}

/**
 * Search documents by content
 */
async function searchDocuments(query: string, options?: {
  caseSensitive?: boolean;
  category?: string;
  tags?: string[];
}): Promise<Array<{ document: Document; matches: string[] }>> {
  const documents = await listDocuments({
    category: options?.category,
    tags: options?.tags,
  });

  const results: Array<{ document: Document; matches: string[] }> = [];
  const searchPattern = options?.caseSensitive
    ? new RegExp(query, "g")
    : new RegExp(query, "gi");

  for (const doc of documents) {
    try {
      const { content } = await parseDocument(doc.path);
      const matches = content.match(searchPattern);

      if (matches && matches.length > 0) {
        // Get context around matches
        const lines = content.split("\n");
        const matchingLines = lines.filter(line => searchPattern.test(line));

        results.push({
          document: doc,
          matches: matchingLines.slice(0, 5), // Limit to 5 matches per document
        });
      }
    } catch (error) {
      console.error(`Error searching ${doc.path}:`, error);
    }
  }

  return results;
}

/**
 * Get all unique tags
 */
async function getAllTags(): Promise<string[]> {
  const documents = await listDocuments();
  const tagSet = new Set<string>();

  documents.forEach(doc => {
    doc.tags?.forEach(tag => tagSet.add(tag));
  });

  return Array.from(tagSet).sort();
}

/**
 * Get all unique categories
 */
async function getAllCategories(): Promise<string[]> {
  const documents = await listDocuments();
  const categorySet = new Set<string>();

  documents.forEach(doc => {
    if (doc.category) {
      categorySet.add(doc.category);
    }
  });

  return Array.from(categorySet).sort();
}

/**
 * Get directory structure
 */
async function getDirectoryTree(basePath: string = ""): Promise<any> {
  const fullPath = basePath ? join(VAULT_PATH, basePath) : VAULT_PATH;
  const entries = await readdir(fullPath, { withFileTypes: true });

  const tree: any = {
    name: basePath || "root",
    type: "directory",
    children: [],
  };

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue; // Skip hidden files

    if (entry.isDirectory()) {
      const subTree = await getDirectoryTree(join(basePath, entry.name));
      tree.children.push(subTree);
    } else if (entry.name.endsWith(".md")) {
      tree.children.push({
        name: entry.name,
        type: "file",
        path: join(basePath, entry.name),
      });
    }
  }

  return tree;
}

/**
 * Find backlinks to a document
 */
async function getBacklinks(filePath: string): Promise<Array<{ document: Document; context: string[] }>> {
  const documents = await listDocuments();
  const fileName = filePath.replace(/\.md$/, "");
  const backlinks: Array<{ document: Document; context: string[] }> = [];

  // Search for [[fileName]] or [[fileName|alias]]
  const linkPattern = new RegExp(`\\[\\[${fileName}(?:\\|[^\\]]+)?\\]\\]`, "g");

  for (const doc of documents) {
    if (doc.path === filePath) continue; // Skip self

    try {
      const { content } = await parseDocument(doc.path);
      const matches = content.match(linkPattern);

      if (matches && matches.length > 0) {
        const lines = content.split("\n");
        const matchingLines = lines.filter(line => linkPattern.test(line));

        backlinks.push({
          document: doc,
          context: matchingLines.slice(0, 3),
        });
      }
    } catch (error) {
      console.error(`Error finding backlinks in ${doc.path}:`, error);
    }
  }

  return backlinks;
}

// Define MCP tools
const tools: Tool[] = [
  {
    name: "obsidian_list_documents",
    description: "List all documents in Miyabi Obsidian vault. Optionally filter by category, tags, or path.",
    inputSchema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          description: "Filter by category (e.g., 'architecture', 'agents', 'reports')",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Filter by tags (all tags must match)",
        },
        path: {
          type: "string",
          description: "Filter by path prefix (e.g., 'agents/', 'architecture/')",
        },
      },
    },
  },
  {
    name: "obsidian_read_document",
    description: "Read a document from Miyabi Obsidian vault. Returns frontmatter and content.",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Relative path to document (e.g., 'agents/coordinator.md')",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "obsidian_create_document",
    description: "Create a new document in Miyabi Obsidian vault with frontmatter.",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Relative path for new document (e.g., 'reports/2025-11-19-report.md')",
        },
        content: {
          type: "string",
          description: "Document content (markdown)",
        },
        frontmatter: {
          type: "object",
          description: "Frontmatter fields (title, category, tags, status, etc.)",
        },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "obsidian_update_document",
    description: "Update an existing document in Miyabi Obsidian vault.",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Relative path to document",
        },
        content: {
          type: "string",
          description: "Updated content (optional, if not provided keeps existing)",
        },
        frontmatter: {
          type: "object",
          description: "Frontmatter updates (partial, will merge with existing)",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "obsidian_search",
    description: "Search documents by content. Returns matching documents with context.",
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query (supports regex)",
        },
        case_sensitive: {
          type: "boolean",
          description: "Case sensitive search (default: false)",
        },
        category: {
          type: "string",
          description: "Limit search to specific category",
        },
        tags: {
          type: "array",
          items: { type: "string" },
          description: "Limit search to documents with these tags",
        },
      },
      required: ["query"],
    },
  },
  {
    name: "obsidian_get_tags",
    description: "Get all unique tags used in Miyabi Obsidian vault.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "obsidian_get_categories",
    description: "Get all unique categories used in Miyabi Obsidian vault.",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "obsidian_get_directory_tree",
    description: "Get directory structure of Miyabi Obsidian vault.",
    inputSchema: {
      type: "object",
      properties: {
        base_path: {
          type: "string",
          description: "Base path to start from (default: vault root)",
        },
      },
    },
  },
  {
    name: "obsidian_get_backlinks",
    description: "Find all documents that link to a specific document.",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Document path to find backlinks for",
        },
      },
      required: ["path"],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: "miyabi-obsidian-server",
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
      case "obsidian_list_documents": {
        const documents = await listDocuments(args as any);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(documents, null, 2),
            },
          ],
        };
      }

      case "obsidian_read_document": {
        const { path } = args as { path: string };
        const doc = await readDocument(path);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(doc, null, 2),
            },
          ],
        };
      }

      case "obsidian_create_document": {
        const { path, content, frontmatter } = args as {
          path: string;
          content: string;
          frontmatter?: Partial<Frontmatter>;
        };
        const result = await createDocument(path, content, frontmatter || {});
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "obsidian_update_document": {
        const { path, content, frontmatter } = args as {
          path: string;
          content?: string;
          frontmatter?: Partial<Frontmatter>;
        };
        const result = await updateDocument(path, content, frontmatter);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "obsidian_search": {
        const { query, case_sensitive, category, tags } = args as {
          query: string;
          case_sensitive?: boolean;
          category?: string;
          tags?: string[];
        };
        const results = await searchDocuments(query, {
          caseSensitive: case_sensitive,
          category,
          tags,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(results, null, 2),
            },
          ],
        };
      }

      case "obsidian_get_tags": {
        const tags = await getAllTags();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(tags, null, 2),
            },
          ],
        };
      }

      case "obsidian_get_categories": {
        const categories = await getAllCategories();
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(categories, null, 2),
            },
          ],
        };
      }

      case "obsidian_get_directory_tree": {
        const { base_path } = args as { base_path?: string };
        const tree = await getDirectoryTree(base_path);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(tree, null, 2),
            },
          ],
        };
      }

      case "obsidian_get_backlinks": {
        const { path } = args as { path: string };
        const backlinks = await getBacklinks(path);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(backlinks, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error: any) {
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            success: false,
            error: error.message,
            stack: error.stack,
          }, null, 2),
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
  console.error("Miyabi Obsidian MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
