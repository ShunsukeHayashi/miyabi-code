#!/usr/bin/env node
/**
 * Lark Developer Docs Complete Hierarchy Crawler
 * Cookie認証 + 完全階層クロール
 */

import puppeteer from 'puppeteer-core';
import * as cheerio from 'cheerio';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CHROME_DEBUG_PORT = 9222;
const OUTPUT_DIR = path.join(__dirname, '../crawled-data');

// Chromeのデバッグ用WebSocket URLを動的取得
async function getChromeWebSocketUrl() {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${CHROME_DEBUG_PORT}/json/version`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve(json.webSocketDebuggerUrl);
        } catch (err) {
          reject(err);
        }
      });
    }).on('error', reject);
  });
}

// ログインCookie（ユーザー提供）
const LOGIN_COOKIES = `passport_web_did=7527963542536847394; passport_trace_id=7527963542553624610; QXV0aHpDb250ZXh0=010b30f336164ac495214ce751ef184c; __tea__ug__uid=7527963518265394704; is_anonymous_session=; lang=ja; i18n_locale=ja; meego_target_unit=larkjpaws; open_locale=en-US; nonRegisterTraffic=true; _ga=GA1.1.1712303633.1752741893; _sc_consent={%22lark%22:true%2C%22ga%22:true%2C%22fb%22:true%2C%22hubspot%22:true%2C%22linkedin%22:true%2C%22twitter%22:true}; _sc_version=1; hubspotutk=e359d01a3a827b6bda91fefcbf770854; deviceId=cmd759quf00003b791c6ifjc5; _fuid=NDMzOTIwYjQtZWFhZC00Nzg3LThlOTUtMWNmYzNhYjVmYjYw; _yjsu_yjad=1756192208.f6382f4d-f74c-4b08-b29d-7b470f7f653a; fid=025901ca-c53e-42ae-a126-8f64fea7a9cd; _gcl_au=1.1.570414987.1761039936; _csrf_token=62090553d5d06c49f6d6d122928858e4cc6062c3-1761651639; locale=en-US; lark_oapi_csrf_token=uk5pkbo2s+BXu5h9rDCX86sHTjZrX1rPdNLOFUMRubk=; __hssrc=1; __hstc=194011442.e359d01a3a827b6bda91fefcbf770854.1752741894569.1763601310892.1763603216902.128; first_landing_url=https://accounts.larksuite.com/accounts/page/login?app_id=7&no_trap=1&redirect_uri=https%253A%252F%252Fopen.larksuite.com%252Fapi-explorer%253FapiName%253Dlist%2526project%253Devent%2526resource%253Doutbound_ip%2526version%253Dv1; landing_url=https://accounts.larksuite.com/accounts/page/login?app_id=7&no_trap=1&redirect_uri=https%253A%252F%252Fopen.larksuite.com%252Fapi-explorer%253FapiName%253Dlist%2526project%253Devent%2526resource%253Doutbound_ip%2526version%253Dv1; s_v_web_id=verify_mi6t5u48_HcOFzqHX_PDn0_4hrm_BEGJ_VLyyXShOPQkr; msToken=j9M7lnMfhs-zzhZ_1uDJaCgrbvkDoYwFdV_DrzV8RuNb09iicZZoqMEEivFcf29izpHuXo3l6Y0kgBUKgu-K0Kmy2NQKhufxmDOIdV7Qr3MIJCgbDB-DtM-TslukOx2ajWw=; session=XN0YXJ0-43dsfe89-4694-4054-a42e-4b674bnju6fs-WVuZA; session_list=XN0YXJ0-43dsfe89-4694-4054-a42e-4b674bnju6fs-WVuZA; login_recently=1; sl_session=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjM2NDg3MjQsInVuaXQiOiJsYXJrc2dhd3MiLCJyYXciOnsibWV0YSI6IkFXaFlNV3pZd0FBaVpYZWhTdWlKUUNGb2VMTDFBd0FBSW1oNHN2VURBQUFpYUhpekJpK0FBQ0lDS2dJQVFVRkJRVUZCUVVGQlJHeHdTRzUzVkRoclFVOUdVVDA5Iiwic3VtIjoiZWI4NzczNzRkNzFjY2I0NzliMWQxNTg4ODc2MjI4MDFhNGExYTc2MWFjNTJlZjMyODMwNDdmMDFjMjkwZGI0MyIsImxvYyI6ImVuX3VzIiwiYXBjIjoiUmVsZWFzZSIsImlhdCI6MTc2MzYwNTUyNCwic2FjIjp7IlVzZXJTdGFmZlN0YXR1cyI6IjEiLCJVc2VyVHlwZSI6IjQyIn0sImxvZCI6bnVsbCwibnMiOiJsYXJrIiwibnNfdWlkIjoiNzUxODgxMzkyMTQ1NzczMzY2NiIsIm5zX3RpZCI6IjczMTE0ODk4NjMxNjAyNTA0MDEiLCJvdCI6MywiYWkiOlt7ImFtIjo3LCJjdCI6MTc2MzYwNTUyNH1dLCJjdCI6MTc2MzYwNTUyNCwicnQiOjE3NjM2MDU1MjR9fQ.VfWWhGJIghqXUS2CX-8ktqViN46_6m5cKFC-Zmev3GtMUfzvINwUUZdLsVb8hJDWvePtYX0J3beXh8L7nHgYfw; passport_app_access_token=eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjM2NDg3MjQsInVuaXQiOiJsYXJrc2dhd3MiLCJyYXciOnsibV9hY2Nlc3NfaW5mbyI6eyI3Ijp7ImlhdCI6MTc2MzYwNTUyNCwiYWNjZXNzIjp0cnVlfX0sInN1bSI6ImViODc3Mzc0ZDcxY2NiNDc5YjFkMTU4ODg3NjIyODAxYTRhMWE3NjFhYzUyZWYzMjgzMDQ3ZjAxYzI5MGRiNDMifX0.CndDnUU3IIA7tNeYwOXdyM1FPWM3RMKVtX49cZHRl9gPQpvS6MtNCVoSg3MLdfJD2eOvXcC-Wx5NOuZOgOGGqA; swp_csrf_token=959aa889-618c-4056-b9cd-5d0b9e7128ee; t_beda37=f10f11fbbe825e6e6a83b3d6c7c2aa49987eb8cf7b66249e3bf84502f0cb3833; __gtm_referrer=https%3A%2F%2Faccounts.larksuite.com%2F; __hssc=194011442.18.1763603216902; _ga_HDCQDHCV0P=GS2.1.s1763601307$o188$g1$t1763605737$j60$l0$h0`;

// 対象URL
const TARGET_URLS = {
  api_explorer: 'https://open.larksuite.com/api-explorer/cli_a994d7e3b8789e1a?apiName=list&project=event&resource=outbound_ip&version=v1',
  client_docs_intro: 'https://open.larksuite.com/document/client-docs/intro',
  server_docs: 'https://open.larksuite.com/document/server-docs/getting-started/getting-started',
  client_docs_h5: 'https://open.larksuite.com/document/client-docs/h5/',
  mcp_integration: 'https://open.larksuite.com/document/uAjLw4CM/ukTMukTMukTM/mcp_integration/mcp_introduction',
};

let browser = null;
let page = null;

// Cookieをパース
function parseCookies(cookieString) {
  return cookieString.split('; ').map(cookie => {
    const [name, value] = cookie.split('=');
    return {
      name,
      value,
      domain: '.larksuite.com',
      path: '/',
    };
  });
}

// Chrome接続 + Cookie設定
async function setupBrowser() {
  const wsUrl = await getChromeWebSocketUrl();
  console.log(`🔗 Connecting to Chrome: ${wsUrl}`);

  browser = await puppeteer.connect({
    browserWSEndpoint: wsUrl,
    defaultViewport: null,
  });

  page = await browser.newPage();

  // Cookie設定
  const cookies = parseCookies(LOGIN_COOKIES);
  await page.setCookie(...cookies);

  console.log('✅ Browser setup complete with login cookies');
  return page;
}

// ページクロール
async function crawlPage(url) {
  console.log(`\n🔍 Crawling: ${url}`);

  await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });

  // ページコンテンツ取得
  const content = await page.content();
  const $ = cheerio.load(content);

  // タイトル抽出
  const title = $('h1').first().text().trim() || $('title').text().trim();

  // ナビゲーション階層抽出
  const nav = [];
  $('.sidebar nav a, .menu a, .navigation a').each((i, elem) => {
    const linkText = $(elem).text().trim();
    const linkHref = $(elem).attr('href');
    if (linkText && linkHref) {
      nav.push({ text: linkText, href: linkHref });
    }
  });

  // 本文抽出
  const body = $('.markdown-body, .content, article, main, .doc-content').text().trim();

  return {
    url,
    title,
    navigation: nav,
    content_preview: body.substring(0, 1000),
    full_content: body,
    crawled_at: new Date().toISOString(),
  };
}

// API Explorerのパラメータパターン抽出
async function extractAPIExplorerPatterns(url) {
  console.log(`\n🔍 Extracting API Explorer patterns from: ${url}`);

  await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: 60000,
  });

  const content = await page.content();
  const $ = cheerio.load(content);

  // APIリスト抽出
  const apis = [];
  $('.api-item, .api-list-item, [data-api-name]').each((i, elem) => {
    const apiName = $(elem).attr('data-api-name') || $(elem).find('.api-name').text().trim();
    const method = $(elem).find('.method, .http-method').text().trim();
    const path = $(elem).find('.path, .api-path').text().trim();

    if (apiName || path) {
      apis.push({ apiName, method, path });
    }
  });

  // クエリパラメータ抽出
  const queryParams = [];
  $('[name^="param"], .param-item, .query-param').each((i, elem) => {
    const paramName = $(elem).attr('name') || $(elem).find('.param-name').text().trim();
    const paramType = $(elem).find('.param-type').text().trim();
    const paramDesc = $(elem).find('.param-desc').text().trim();

    if (paramName) {
      queryParams.push({ name: paramName, type: paramType, description: paramDesc });
    }
  });

  return {
    url,
    apis,
    queryParams,
    total_apis: apis.length,
    total_params: queryParams.length,
  };
}

// 階層構造を再帰的にクロール
async function crawlHierarchy(startUrl, maxDepth = 3) {
  const visited = new Set();
  const hierarchy = {};

  async function crawl(url, depth) {
    if (depth > maxDepth || visited.has(url)) return;
    visited.add(url);

    const data = await crawlPage(url);
    hierarchy[url] = data;

    // 子ページをクロール
    for (const link of data.navigation.slice(0, 10)) { // 最初の10リンクのみ
      const absoluteUrl = new URL(link.href, url).href;
      if (absoluteUrl.startsWith('https://open.larksuite.com/document/')) {
        await crawl(absoluteUrl, depth + 1);
      }
    }
  }

  await crawl(startUrl, 0);
  return hierarchy;
}

// メイン実行
async function main() {
  try {
    await setupBrowser();
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    const results = {};

    // 1. API Explorer
    console.log('\n=== API Explorer ===');
    results.api_explorer = await extractAPIExplorerPatterns(TARGET_URLS.api_explorer);

    // 2. Client Docs Intro
    console.log('\n=== Client Docs Intro ===');
    results.client_docs_intro = await crawlHierarchy(TARGET_URLS.client_docs_intro, 2);

    // 3. Server Docs
    console.log('\n=== Server Docs ===');
    results.server_docs = await crawlHierarchy(TARGET_URLS.server_docs, 2);

    // 4. Client Docs H5
    console.log('\n=== Client Docs H5 ===');
    results.client_docs_h5 = await crawlHierarchy(TARGET_URLS.client_docs_h5, 2);

    // 5. MCP Integration
    console.log('\n=== MCP Integration ===');
    results.mcp_integration = await crawlHierarchy(TARGET_URLS.mcp_integration, 2);

    // 結果を保存
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(OUTPUT_DIR, `lark-docs-hierarchy-${timestamp}.json`);
    await fs.writeFile(outputFile, JSON.stringify(results, null, 2));

    console.log(`\n✅ Crawling complete!`);
    console.log(`📁 Output: ${outputFile}`);

    await browser.close();
  } catch (error) {
    console.error('❌ Crawling failed:', error);
    process.exit(1);
  }
}

main();
