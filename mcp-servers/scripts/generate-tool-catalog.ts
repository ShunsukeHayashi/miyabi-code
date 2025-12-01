#!/usr/bin/env node

/**
 * Miyabi Tool Catalog Generator
 * 
 * 全MCPサーバーからツール定義を収集し、
 * Tool Search用のカタログを生成するスクリプト
 */

import * as fs from 'fs';
import * as path from 'path';

// ツール定義の型
interface ToolDefinition {
  name: string;
  description: string;
  category: string;
  server: string;
  inputSchema: object;
  defer_loading: boolean;
  keywords: string[];
  usage_frequency: "high" | "medium" | "low";
}

interface ToolCatalog {
  metadata: {
    generatedAt: string;
    totalTools: number;
    version: string;
  };
  alwaysLoaded: string[];
  categories: Record<string, string[]>;
  tools: ToolDefinition[];
}

// カテゴリ定義
const CATEGORY_MAPPINGS: Record<string, { pattern: RegExp; keywords: string[] }> = {
  git: {
    pattern: /^(git_|github_)/,
    keywords: ['git', 'version control', 'commit', 'branch', 'repository', 'pull request', 'issue']
  },
  file: {
    pattern: /^(file_|read_|write_|list_|create_|search_)/,
    keywords: ['file', 'directory', 'filesystem', 'read', 'write', 'create']
  },
  process: {
    pattern: /^(process_|resource_)/,
    keywords: ['process', 'cpu', 'memory', 'system', 'resource', 'monitor']
  },
  network: {
    pattern: /^network_/,
    keywords: ['network', 'connection', 'port', 'interface', 'bandwidth']
  },
  session: {
    pattern: /^tmux_/,
    keywords: ['tmux', 'session', 'terminal', 'pane', 'window']
  },
  log: {
    pattern: /^log_/,
    keywords: ['log', 'debug', 'error', 'warning', 'trace']
  },
  knowledge: {
    pattern: /^obsidian_/,
    keywords: ['obsidian', 'note', 'document', 'knowledge', 'search']
  },
  design: {
    pattern: /^(review_|generate_|create_|check_|analyze_|design_|optimize_|evaluate_)/,
    keywords: ['design', 'ui', 'ux', 'wireframe', 'mockup', 'accessibility']
  },
  marketing: {
    pattern: /^(tsubuyakun_|kakuchan_|dougakun_|hiromeru_|kazoeru_|sasaeru_)/,
    keywords: ['marketing', 'sns', 'content', 'strategy', 'analytics']
  },
  rules: {
    pattern: /^miyabi_rules_/,
    keywords: ['rules', 'protocol', 'validation', 'context']
  },
  claude: {
    pattern: /^claude_/,
    keywords: ['claude', 'mcp', 'config', 'session']
  }
};

// 常時読み込みツール（高頻度使用）
const ALWAYS_LOADED_TOOLS = [
  // Git基本
  'miyabi-git-inspector:git_status',
  'miyabi-git-inspector:git_log',
  'miyabi-git-inspector:git_current_branch',
  
  // GitHub基本
  'miyabi-github:github_list_issues',
  'miyabi-github:github_create_issue',
  
  // Tmux基本
  'miyabi-tmux:tmux_list_sessions',
  'miyabi-tmux:tmux_list_panes',
  'miyabi-tmux:tmux_send_message',
  
  // ファイル基本
  'miyabi-file-watcher:file_recent_changes',
  'miyabi-file-watcher:file_search',
  
  // Claude基本
  'miyabi-claude-code:claude_status',
  
  // Rules基本
  'miyabi-rules:miyabi_rules_list',
];

// 使用頻度の判定
function determineUsageFrequency(toolName: string, server: string): "high" | "medium" | "low" {
  const fullName = `${server}:${toolName}`;
  
  if (ALWAYS_LOADED_TOOLS.includes(fullName)) {
    return 'high';
  }
  
  // 頻繁に使用されるパターン
  const highUsagePatterns = [
    /^git_(status|log|diff|branch)/,
    /^github_(list|create|get)_/,
    /^tmux_(list|send)/,
    /^file_(search|recent)/,
    /^log_get_/,
    /^resource_(cpu|memory|overview)/,
  ];
  
  if (highUsagePatterns.some(p => p.test(toolName))) {
    return 'medium';
  }
  
  return 'low';
}

// カテゴリの判定
function determineCategory(toolName: string): string {
  for (const [category, { pattern }] of Object.entries(CATEGORY_MAPPINGS)) {
    if (pattern.test(toolName)) {
      return category;
    }
  }
  return 'other';
}

// キーワードの生成
function generateKeywords(toolName: string, description: string, category: string): string[] {
  const keywords = new Set<string>();
  
  // ツール名からキーワード抽出
  const nameParts = toolName.split('_');
  nameParts.forEach(part => {
    if (part.length > 2) {
      keywords.add(part.toLowerCase());
    }
  });
  
  // 説明文からキーワード抽出
  const descWords = description.toLowerCase().split(/\W+/);
  descWords.forEach(word => {
    if (word.length > 3 && !['the', 'and', 'for', 'with', 'from'].includes(word)) {
      keywords.add(word);
    }
  });
  
  // カテゴリキーワードを追加
  const categoryMapping = CATEGORY_MAPPINGS[category];
  if (categoryMapping) {
    categoryMapping.keywords.forEach(kw => keywords.add(kw));
  }
  
  return Array.from(keywords).slice(0, 15);
}

// MCPサーバーのツール定義を解析
function parseMCPServerTools(serverName: string, indexPath: string): ToolDefinition[] {
  const tools: ToolDefinition[] = [];
  
  try {
    const content = fs.readFileSync(indexPath, 'utf-8');
    
    // ListToolsRequestSchemaのハンドラーを探す
    const toolsMatch = content.match(/tools:\s*\[([\s\S]*?)\]/g);
    
    if (toolsMatch) {
      // 簡易パース（実際のプロダクションではAST解析推奨）
      const toolDefs = content.match(/{\s*name:\s*["']([^"']+)["'],\s*description:\s*["']([^"']+)["']/g);
      
      if (toolDefs) {
        toolDefs.forEach(def => {
          const nameMatch = def.match(/name:\s*["']([^"']+)["']/);
          const descMatch = def.match(/description:\s*["']([^"']+)["']/);
          
          if (nameMatch && descMatch) {
            const name = nameMatch[1];
            const description = descMatch[1];
            const category = determineCategory(name);
            const fullName = `${serverName}:${name}`;
            
            tools.push({
              name,
              description,
              category,
              server: serverName,
              inputSchema: {},  // 簡略化
              defer_loading: !ALWAYS_LOADED_TOOLS.includes(fullName),
              keywords: generateKeywords(name, description, category),
              usage_frequency: determineUsageFrequency(name, serverName)
            });
          }
        });
      }
    }
  } catch (error) {
    console.error(`Error parsing ${serverName}: ${error}`);
  }
  
  return tools;
}

// メイン処理
async function generateCatalog() {
  const mcpServersDir = '/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers';
  const outputPath = path.join(mcpServersDir, 'tool-catalog.json');
  
  const catalog: ToolCatalog = {
    metadata: {
      generatedAt: new Date().toISOString(),
      totalTools: 0,
      version: '1.0.0'
    },
    alwaysLoaded: ALWAYS_LOADED_TOOLS,
    categories: {},
    tools: []
  };
  
  // MCPサーバーディレクトリを走査
  const serverDirs = fs.readdirSync(mcpServersDir)
    .filter(name => name.startsWith('miyabi-') || name.startsWith('gemini') || name.startsWith('lark'))
    .filter(name => {
      const stat = fs.statSync(path.join(mcpServersDir, name));
      return stat.isDirectory();
    });
  
  console.log(`Found ${serverDirs.length} MCP servers`);
  
  for (const serverDir of serverDirs) {
    const indexPath = path.join(mcpServersDir, serverDir, 'src', 'index.ts');
    
    if (fs.existsSync(indexPath)) {
      console.log(`Processing: ${serverDir}`);
      const tools = parseMCPServerTools(serverDir, indexPath);
      catalog.tools.push(...tools);
      
      // カテゴリ別に分類
      tools.forEach(tool => {
        if (!catalog.categories[tool.category]) {
          catalog.categories[tool.category] = [];
        }
        catalog.categories[tool.category].push(`${tool.server}:${tool.name}`);
      });
    }
  }
  
  catalog.metadata.totalTools = catalog.tools.length;
  
  // JSONファイルに出力
  fs.writeFileSync(outputPath, JSON.stringify(catalog, null, 2));
  
  console.log(`\n✅ Catalog generated: ${outputPath}`);
  console.log(`   Total tools: ${catalog.metadata.totalTools}`);
  console.log(`   Categories: ${Object.keys(catalog.categories).length}`);
  console.log(`   Always loaded: ${catalog.alwaysLoaded.length}`);
  
  // サマリー表示
  console.log('\n📊 Category Summary:');
  Object.entries(catalog.categories).forEach(([cat, tools]) => {
    console.log(`   ${cat}: ${tools.length} tools`);
  });
}

// 実行
generateCatalog().catch(console.error);
