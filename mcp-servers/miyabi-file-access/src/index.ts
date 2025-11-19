#!/usr/bin/env node

/**
 * Miyabi File Access MCP Server
 *
 * Provides MCP tools for local file system access
 * Supports read, write, list, delete, copy, move, and search operations
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import {
  readFile,
  writeFile,
  readdir,
  stat,
  mkdir,
  unlink,
  rmdir,
  copyFile,
  rename,
  access,
} from "fs/promises";
import { join, resolve, relative, dirname, basename, extname } from "path";
import { constants } from "fs";

/**
 * Configuration
 */
const config = {
  // Default base path (can be overridden via environment variable)
  basePath: process.env.MIYABI_FILE_ACCESS_BASE_PATH || process.cwd(),

  // Allow access outside base path (default: false for security)
  allowOutsideBasePath: process.env.MIYABI_FILE_ACCESS_ALLOW_OUTSIDE === "true",

  // Maximum file size to read (10MB default)
  maxFileSize: parseInt(process.env.MIYABI_FILE_ACCESS_MAX_SIZE || "10485760"),
};

/**
 * Security: Validate path is within allowed base path
 */
function validatePath(filePath: string): string {
  const absolutePath = resolve(config.basePath, filePath);
  const basePath = resolve(config.basePath);

  if (!config.allowOutsideBasePath && !absolutePath.startsWith(basePath)) {
    throw new Error(
      `Access denied: Path '${filePath}' is outside the allowed base path '${basePath}'`
    );
  }

  return absolutePath;
}

/**
 * Check if file/directory exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file statistics
 */
async function getFileStats(filePath: string) {
  const absolutePath = validatePath(filePath);
  const stats = await stat(absolutePath);

  return {
    path: filePath,
    absolutePath,
    size: stats.size,
    isFile: stats.isFile(),
    isDirectory: stats.isDirectory(),
    created: stats.birthtime.toISOString(),
    modified: stats.mtime.toISOString(),
    accessed: stats.atime.toISOString(),
    mode: stats.mode.toString(8),
  };
}

/**
 * Read file content
 */
async function readFileContent(
  filePath: string,
  encoding: BufferEncoding = "utf-8"
): Promise<{ content: string; info: any }> {
  const absolutePath = validatePath(filePath);
  const stats = await stat(absolutePath);

  if (!stats.isFile()) {
    throw new Error(`Path '${filePath}' is not a file`);
  }

  if (stats.size > config.maxFileSize) {
    throw new Error(
      `File size (${stats.size} bytes) exceeds maximum allowed size (${config.maxFileSize} bytes)`
    );
  }

  const content = await readFile(absolutePath, encoding);
  const info = await getFileStats(filePath);

  return { content, info };
}

/**
 * Write file content
 */
async function writeFileContent(
  filePath: string,
  content: string,
  options?: {
    encoding?: BufferEncoding;
    createDirectories?: boolean;
  }
): Promise<{ success: boolean; path: string; info: any }> {
  const absolutePath = validatePath(filePath);

  // Create parent directories if requested
  if (options?.createDirectories) {
    const dir = dirname(absolutePath);
    await mkdir(dir, { recursive: true });
  }

  await writeFile(absolutePath, content, options?.encoding || "utf-8");
  const info = await getFileStats(filePath);

  return {
    success: true,
    path: filePath,
    info,
  };
}

/**
 * List directory contents
 */
async function listDirectory(
  dirPath: string = ".",
  options?: {
    recursive?: boolean;
    includeHidden?: boolean;
    pattern?: string;
  }
): Promise<any[]> {
  const absolutePath = validatePath(dirPath);
  const stats = await stat(absolutePath);

  if (!stats.isDirectory()) {
    throw new Error(`Path '${dirPath}' is not a directory`);
  }

  const entries = await readdir(absolutePath, { withFileTypes: true });
  const results: any[] = [];

  for (const entry of entries) {
    // Skip hidden files unless explicitly included
    if (!options?.includeHidden && entry.name.startsWith(".")) {
      continue;
    }

    // Apply pattern filter if provided
    if (options?.pattern) {
      const regex = new RegExp(options.pattern);
      if (!regex.test(entry.name)) {
        continue;
      }
    }

    const entryPath = join(dirPath, entry.name);
    const { path: _, ...entryInfo } = await getFileStats(entryPath);

    results.push({
      name: entry.name,
      path: entryPath,
      type: entry.isDirectory() ? "directory" : "file",
      ...entryInfo,
    });

    // Recursively list subdirectories if requested
    if (options?.recursive && entry.isDirectory()) {
      const subResults = await listDirectory(entryPath, options);
      results.push(...subResults);
    }
  }

  return results;
}

/**
 * Delete file or directory
 */
async function deletePath(
  filePath: string,
  options?: {
    recursive?: boolean;
  }
): Promise<{ success: boolean; path: string }> {
  const absolutePath = validatePath(filePath);
  const stats = await stat(absolutePath);

  if (stats.isDirectory()) {
    await rmdir(absolutePath, { recursive: options?.recursive });
  } else {
    await unlink(absolutePath);
  }

  return {
    success: true,
    path: filePath,
  };
}

/**
 * Create directory
 */
async function createDirectory(
  dirPath: string,
  options?: {
    recursive?: boolean;
  }
): Promise<{ success: boolean; path: string; info: any }> {
  const absolutePath = validatePath(dirPath);
  await mkdir(absolutePath, { recursive: options?.recursive });
  const info = await getFileStats(dirPath);

  return {
    success: true,
    path: dirPath,
    info,
  };
}

/**
 * Copy file or directory
 */
async function copyPath(
  sourcePath: string,
  destPath: string
): Promise<{ success: boolean; source: string; destination: string }> {
  const absoluteSource = validatePath(sourcePath);
  const absoluteDest = validatePath(destPath);
  const stats = await stat(absoluteSource);

  if (stats.isDirectory()) {
    throw new Error("Directory copying not yet implemented. Use recursive copy for directories.");
  }

  await copyFile(absoluteSource, absoluteDest);

  return {
    success: true,
    source: sourcePath,
    destination: destPath,
  };
}

/**
 * Move/rename file or directory
 */
async function movePath(
  sourcePath: string,
  destPath: string
): Promise<{ success: boolean; source: string; destination: string }> {
  const absoluteSource = validatePath(sourcePath);
  const absoluteDest = validatePath(destPath);

  await rename(absoluteSource, absoluteDest);

  return {
    success: true,
    source: sourcePath,
    destination: destPath,
  };
}

/**
 * Search files by pattern
 */
async function searchFiles(
  dirPath: string = ".",
  options: {
    pattern: string;
    content?: boolean;
    caseSensitive?: boolean;
    recursive?: boolean;
  }
): Promise<Array<{ file: string; matches?: string[] }>> {
  const files = await listDirectory(dirPath, {
    recursive: options.recursive,
    includeHidden: false,
  });

  const results: Array<{ file: string; matches?: string[] }> = [];
  const namePattern = new RegExp(
    options.pattern,
    options.caseSensitive ? "g" : "gi"
  );

  for (const file of files) {
    if (file.type !== "file") continue;

    // Search by filename
    if (namePattern.test(file.name)) {
      results.push({ file: file.path });
      continue;
    }

    // Search by content if requested
    if (options.content) {
      try {
        const { content } = await readFileContent(file.path);
        const matches = content.match(namePattern);

        if (matches && matches.length > 0) {
          const lines = content.split("\n");
          const matchingLines = lines.filter((line) =>
            namePattern.test(line)
          );
          results.push({
            file: file.path,
            matches: matchingLines.slice(0, 5), // Limit to 5 matches
          });
        }
      } catch (error) {
        // Skip files that can't be read
        console.error(`Error searching ${file.path}:`, error);
      }
    }
  }

  return results;
}

// Define MCP tools
const tools: Tool[] = [
  {
    name: "read_file",
    description: "Read content from a file. Returns file content and metadata.",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the file (relative to base path)",
        },
        encoding: {
          type: "string",
          description: "File encoding (default: utf-8)",
          enum: ["utf-8", "ascii", "base64", "binary"],
        },
      },
      required: ["path"],
    },
  },
  {
    name: "write_file",
    description: "Write content to a file. Creates parent directories if needed.",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the file (relative to base path)",
        },
        content: {
          type: "string",
          description: "Content to write to the file",
        },
        encoding: {
          type: "string",
          description: "File encoding (default: utf-8)",
          enum: ["utf-8", "ascii", "base64"],
        },
        create_directories: {
          type: "boolean",
          description: "Create parent directories if they don't exist (default: false)",
        },
      },
      required: ["path", "content"],
    },
  },
  {
    name: "list_files",
    description: "List files and directories. Supports recursive listing and pattern filtering.",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Directory path (default: current directory)",
        },
        recursive: {
          type: "boolean",
          description: "List files recursively (default: false)",
        },
        include_hidden: {
          type: "boolean",
          description: "Include hidden files (default: false)",
        },
        pattern: {
          type: "string",
          description: "Regex pattern to filter files",
        },
      },
    },
  },
  {
    name: "get_file_info",
    description: "Get detailed information about a file or directory.",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the file or directory",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "delete_file",
    description: "Delete a file or directory.",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the file or directory to delete",
        },
        recursive: {
          type: "boolean",
          description: "Delete directories recursively (default: false)",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "create_directory",
    description: "Create a new directory.",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to the directory to create",
        },
        recursive: {
          type: "boolean",
          description: "Create parent directories if needed (default: true)",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "copy_file",
    description: "Copy a file to a new location.",
    inputSchema: {
      type: "object",
      properties: {
        source: {
          type: "string",
          description: "Source file path",
        },
        destination: {
          type: "string",
          description: "Destination file path",
        },
      },
      required: ["source", "destination"],
    },
  },
  {
    name: "move_file",
    description: "Move or rename a file or directory.",
    inputSchema: {
      type: "object",
      properties: {
        source: {
          type: "string",
          description: "Source path",
        },
        destination: {
          type: "string",
          description: "Destination path",
        },
      },
      required: ["source", "destination"],
    },
  },
  {
    name: "search_files",
    description: "Search for files by name or content.",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Directory to search in (default: current directory)",
        },
        pattern: {
          type: "string",
          description: "Regex pattern to search for",
        },
        search_content: {
          type: "boolean",
          description: "Search file contents (default: false, searches filenames only)",
        },
        case_sensitive: {
          type: "boolean",
          description: "Case sensitive search (default: false)",
        },
        recursive: {
          type: "boolean",
          description: "Search recursively (default: true)",
        },
      },
      required: ["pattern"],
    },
  },
];

// Create MCP server
const server = new Server(
  {
    name: "miyabi-file-access",
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
      case "read_file": {
        const { path, encoding } = args as {
          path: string;
          encoding?: BufferEncoding;
        };
        const result = await readFileContent(path, encoding);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "write_file": {
        const { path, content, encoding, create_directories } = args as {
          path: string;
          content: string;
          encoding?: BufferEncoding;
          create_directories?: boolean;
        };
        const result = await writeFileContent(path, content, {
          encoding,
          createDirectories: create_directories,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "list_files": {
        const { path, recursive, include_hidden, pattern } = args as {
          path?: string;
          recursive?: boolean;
          include_hidden?: boolean;
          pattern?: string;
        };
        const result = await listDirectory(path || ".", {
          recursive,
          includeHidden: include_hidden,
          pattern,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "get_file_info": {
        const { path } = args as { path: string };
        const result = await getFileStats(path);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "delete_file": {
        const { path, recursive } = args as {
          path: string;
          recursive?: boolean;
        };
        const result = await deletePath(path, { recursive });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "create_directory": {
        const { path, recursive } = args as {
          path: string;
          recursive?: boolean;
        };
        const result = await createDirectory(path, {
          recursive: recursive !== false, // Default to true
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "copy_file": {
        const { source, destination } = args as {
          source: string;
          destination: string;
        };
        const result = await copyPath(source, destination);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "move_file": {
        const { source, destination } = args as {
          source: string;
          destination: string;
        };
        const result = await movePath(source, destination);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case "search_files": {
        const { path, pattern, search_content, case_sensitive, recursive } =
          args as {
            path?: string;
            pattern: string;
            search_content?: boolean;
            case_sensitive?: boolean;
            recursive?: boolean;
          };
        const result = await searchFiles(path || ".", {
          pattern,
          content: search_content,
          caseSensitive: case_sensitive,
          recursive: recursive !== false, // Default to true
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
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
          text: JSON.stringify(
            {
              success: false,
              error: error.message,
              stack: error.stack,
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
  console.error("Miyabi File Access MCP Server running on stdio");
  console.error(`Base Path: ${config.basePath}`);
  console.error(`Allow Outside Base Path: ${config.allowOutsideBasePath}`);
  console.error(`Max File Size: ${config.maxFileSize} bytes`);
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
