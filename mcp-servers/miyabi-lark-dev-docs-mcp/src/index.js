#!/usr/bin/env node
/**
 * Miyabi Lark Developer Docs Scraper MCP Server
 * ログイン済みChromeセッションでLark公式ドキュメントをスクレイピング
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import puppeteer from 'puppeteer-core';
import * as cheerio from 'cheerio';

// Chrome CDP接続設定
const CHROME_DEBUGGING_PORT = 9222;
const CHROME_WS_ENDPOINT = `ws://localhost:${CHROME_DEBUGGING_PORT}/devtools/browser`;

let browser = null;
let page = null;

// Chrome接続
async function connectChrome() {
  if (browser) return browser;

  try {
    browser = await puppeteer.connect({
      browserWSEndpoint: CHROME_WS_ENDPOINT,
      defaultViewport: null,
    });
    console.error('✅ Chrome接続成功');
    return browser;
  } catch (error) {
    console.error('❌ Chrome接続失敗:', error.message);
    console.error('\n💡 Chromeをデバッグモードで起動してください：');
    console.error('   /Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222 --user-data-dir=/tmp/chrome-debug');
    throw error;
  }
}

// ページ取得・作成
async function getPage() {
  if (page && !page.isClosed()) return page;

  const browser = await connectChrome();
  const pages = await browser.pages();

  if (pages.length > 0) {
    page = pages[0];
  } else {
    page = await browser.newPage();
  }

  return page;
}

// Lark Developer Docsスクレイピング
async function scrapeLarkDevDocs(url) {
  const page = await getPage();

  await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });

  // ページコンテンツ取得
  const content = await page.content();
  const $ = cheerio.load(content);

  // 本文抽出（Lark Developer Docsの構造に合わせて調整）
  const title = $('h1').first().text().trim();
  const body = $('.markdown-body, .content, article, main').text().trim();

  return {
    title,
    body,
    url,
  };
}

// Lark API検索
async function searchLarkAPI(query) {
  const searchUrl = `https://open.larksuite.com/search?q=${encodeURIComponent(query)}`;
  const page = await getPage();

  await page.goto(searchUrl, {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });

  const content = await page.content();
  const $ = cheerio.load(content);

  const results = [];
  $('.search-result-item, .result-item').each((i, elem) => {
    const title = $(elem).find('h3, .title').text().trim();
    const description = $(elem).find('p, .description').text().trim();
    const link = $(elem).find('a').attr('href');

    if (title && link) {
      results.push({
        title,
        description,
        url: link.startsWith('http') ? link : `https://open.larksuite.com${link}`,
      });
    }
  });

  return results;
}

// MCP Server初期化
const server = new Server(
  {
    name: 'miyabi-lark-dev-docs-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ツールリスト
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'lark_dev_docs_read',
        description: 'Read Lark Developer Documentation page (requires logged-in Chrome session)',
        inputSchema: {
          type: 'object',
          properties: {
            url: {
              type: 'string',
              description: 'Lark Developer Docs URL (e.g., https://open.larksuite.com/document/...)',
            },
          },
          required: ['url'],
        },
      },
      {
        name: 'lark_api_search',
        description: 'Search Lark API documentation',
        inputSchema: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'Search query (API name, feature, etc.)',
            },
          },
          required: ['query'],
        },
      },
      {
        name: 'lark_dev_docs_navigate',
        description: 'Navigate to Lark Developer Docs section',
        inputSchema: {
          type: 'object',
          properties: {
            section: {
              type: 'string',
              description: 'Section name (e.g., "im", "docs", "bot", "event")',
            },
          },
          required: ['section'],
        },
      },
    ],
  };
});

// ツール実行
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'lark_dev_docs_read': {
        const { url } = args;
        const result = await scrapeLarkDevDocs(url);

        return {
          content: [{
            type: 'text',
            text: `# ${result.title}\n\nURL: ${result.url}\n\n${result.body}`,
          }],
        };
      }

      case 'lark_api_search': {
        const { query } = args;
        const results = await searchLarkAPI(query);

        const formatted = results.map((r, i) =>
          `${i + 1}. **${r.title}**\n   ${r.description}\n   ${r.url}`
        ).join('\n\n');

        return {
          content: [{
            type: 'text',
            text: `# Search Results for "${query}"\n\n${formatted}`,
          }],
        };
      }

      case 'lark_dev_docs_navigate': {
        const { section } = args;
        const sectionUrls = {
          im: 'https://open.larksuite.com/document/server-docs/im-v1/message/introduction',
          docs: 'https://open.larksuite.com/document/server-docs/docs-v1/introduction',
          bot: 'https://open.larksuite.com/document/server-docs/bot-v3/bot-overview',
          event: 'https://open.larksuite.com/document/server-docs/event-subscription/overview',
          auth: 'https://open.larksuite.com/document/server-docs/authentication-management/access-token/introduction',
        };

        const url = sectionUrls[section] || sectionUrls.im;
        const result = await scrapeLarkDevDocs(url);

        return {
          content: [{
            type: 'text',
            text: `# ${result.title}\n\nURL: ${result.url}\n\n${result.body}`,
          }],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Error: ${error.message}`,
      }],
      isError: true,
    };
  }
});

// サーバー起動
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 Miyabi Lark Developer Docs MCP Server running');
  console.error('💡 Make sure Chrome is running with --remote-debugging-port=9222');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
