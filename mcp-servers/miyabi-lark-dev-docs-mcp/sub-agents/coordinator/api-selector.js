#!/usr/bin/env node
/**
 * API Selector - Crawled Docsから適切なLark APIを選定
 *
 * Input: Intent Analysis結果 + Crawled Documentation
 * Output: 選定されたAPI仕様リスト
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crawled dataのパス
const CRAWLED_DATA_DIR = path.join(__dirname, '../../crawled-data');

/**
 * Intent分析結果からLark APIを選定
 * @param {Object} intentAnalysis - Intent Analyzer output
 * @returns {Promise<Object>} Selected APIs and specifications
 */
export async function selectAPIs(intentAnalysis) {
  console.log('\n🎯 Selecting Lark APIs based on intent...\n');

  // Crawled documentationを読み込み
  const crawledDocs = await loadCrawledDocs();

  // Intent typeに基づいてAPI候補を選定
  const apiCandidates = matchAPIsToIntent(intentAnalysis, crawledDocs);

  // 機能要件に基づいて追加APIを選定
  const additionalAPIs = matchAPIsToRequirements(
    intentAnalysis.functional_requirements,
    crawledDocs
  );

  // APIを統合・重複除去
  const selectedAPIs = mergeAndDeduplicateAPIs(apiCandidates, additionalAPIs);

  // API仕様を抽出
  const apiSpecs = enrichAPIsWithSpecs(selectedAPIs, crawledDocs);

  const result = {
    intent_type: intentAnalysis.intent_type,
    total_apis_selected: selectedAPIs.length,
    selected_apis: selectedAPIs,
    api_specifications: apiSpecs,
    crawled_docs_used: Object.keys(crawledDocs),
    selected_at: new Date().toISOString(),
  };

  console.log('✅ API Selection Complete:\n');
  console.log(`📊 Total APIs selected: ${selectedAPIs.length}`);
  console.log(`📋 APIs: ${selectedAPIs.join(', ')}\n`);

  return result;
}

/**
 * Crawled documentationを読み込み
 */
async function loadCrawledDocs() {
  try {
    const files = await fs.readdir(CRAWLED_DATA_DIR);
    const jsonFiles = files.filter(f => f.endsWith('.json'));

    if (jsonFiles.length === 0) {
      throw new Error('No crawled documentation found');
    }

    // 最新のファイルを使用
    const latestFile = jsonFiles.sort().reverse()[0];
    const filePath = path.join(CRAWLED_DATA_DIR, latestFile);

    console.log(`📂 Loading crawled docs: ${latestFile}`);

    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ Failed to load crawled docs:', error.message);
    throw error;
  }
}

/**
 * Intent typeとAPIをマッピング
 */
function matchAPIsToIntent(intentAnalysis, crawledDocs) {
  const intentType = intentAnalysis.intent_type;

  // Intent → API マッピングテーブル
  const intentAPIMapping = {
    bot_creation: [
      'im.v1.message.receive_v1', // Receive messages
      'im.v1.message.create', // Send messages
      'im.v1.chat.get', // Get chat info
    ],
    message_automation: [
      'im.v1.message.create',
      'im.v1.message.list',
      'im.v1.message.update',
    ],
    calendar_management: [
      'calendar.v4.calendar.list',
      'calendar.v4.calendar_event.create',
      'calendar.v4.calendar_event.list',
      'calendar.v4.calendar_event.update',
      'calendar.v4.calendar_event.delete',
    ],
    document_management: [
      'drive.v1.file.list',
      'drive.v1.file.upload',
      'drive.v1.file.download',
      'docx.v1.document.create',
      'docx.v1.document.get',
    ],
    approval_workflow: [
      'approval.v4.instance.create',
      'approval.v4.instance.get',
      'approval.v4.instance.list',
    ],
    data_visualization: [
      'bitable.v1.app.list',
      'bitable.v1.app_table.list',
      'bitable.v1.app_table_record.list',
      'bitable.v1.app_table_record.create',
    ],
    user_management: [
      'contact.v3.user.list',
      'contact.v3.user.get',
      'contact.v3.department.list',
    ],
    webhook_integration: [
      'im.v1.message.create',
      'im.v1.chat.create',
    ],
  };

  const apis = intentAPIMapping[intentType] || intentAPIMapping.bot_creation;

  console.log(`🎯 Intent "${intentType}" → ${apis.length} candidate APIs`);

  return apis;
}

/**
 * 機能要件からAPIを選定
 */
function matchAPIsToRequirements(requirements, crawledDocs) {
  const apis = new Set();

  for (const req of requirements) {
    const reqLower = req.toLowerCase();

    // CRUD operations
    if (reqLower.includes('list') || reqLower.includes('一覧')) {
      apis.add('*.*.*.list');
    }
    if (reqLower.includes('create') || reqLower.includes('作成') || reqLower.includes('追加')) {
      apis.add('*.*.*.create');
    }
    if (reqLower.includes('update') || reqLower.includes('更新') || reqLower.includes('編集')) {
      apis.add('*.*.*.update');
    }
    if (reqLower.includes('delete') || reqLower.includes('削除')) {
      apis.add('*.*.*.delete');
    }
    if (reqLower.includes('get') || reqLower.includes('取得') || reqLower.includes('確認')) {
      apis.add('*.*.*.get');
    }

    // Message related
    if (reqLower.includes('message') || reqLower.includes('メッセージ')) {
      apis.add('im.v1.message.create');
      apis.add('im.v1.message.list');
    }

    // Calendar related
    if (reqLower.includes('calendar') || reqLower.includes('カレンダー') || reqLower.includes('予定')) {
      apis.add('calendar.v4.calendar_event.list');
      apis.add('calendar.v4.calendar_event.create');
    }

    // Notification related
    if (reqLower.includes('notify') || reqLower.includes('通知') || reqLower.includes('リマインド')) {
      apis.add('im.v1.message.create');
    }
  }

  console.log(`📋 Requirements → ${apis.size} additional API patterns`);

  return Array.from(apis);
}

/**
 * APIをマージして重複除去
 */
function mergeAndDeduplicateAPIs(candidateAPIs, additionalAPIs) {
  const allAPIs = [...candidateAPIs];

  // Wildcard patternsを実際のAPIに展開
  for (const pattern of additionalAPIs) {
    if (pattern.includes('*')) {
      // Wildcardを具体的なAPIに展開（簡易実装）
      const expanded = expandWildcardAPI(pattern, candidateAPIs);
      allAPIs.push(...expanded);
    } else {
      allAPIs.push(pattern);
    }
  }

  // 重複除去
  return [...new Set(allAPIs)];
}

/**
 * Wildcard APIを展開
 */
function expandWildcardAPI(pattern, existingAPIs) {
  const parts = pattern.split('.');
  const operation = parts[parts.length - 1]; // e.g., "list", "create"

  return existingAPIs.filter(api => api.endsWith(`.${operation}`));
}

/**
 * 選定されたAPIに仕様を付加
 */
function enrichAPIsWithSpecs(selectedAPIs, crawledDocs) {
  const specs = {};

  for (const api of selectedAPIs) {
    specs[api] = {
      name: api,
      description: `API for ${api}`,
      documentation_url: `https://open.larksuite.com/document/server-docs/${api.replace(/\./g, '/')}`,
      required_permissions: inferPermissions(api),
      http_method: inferHTTPMethod(api),
    };
  }

  return specs;
}

/**
 * APIから必要な権限を推測
 */
function inferPermissions(api) {
  const parts = api.split('.');
  const resource = parts[1]; // e.g., "v1", "v4"
  const operation = parts[parts.length - 1]; // e.g., "create", "list"

  // 簡易的な権限推測
  const permissionMap = {
    im: 'im:message',
    calendar: 'calendar:calendar',
    drive: 'drive:drive',
    docx: 'docx:document',
    bitable: 'bitable:app',
    approval: 'approval:approval',
    contact: 'contact:user',
  };

  const basePermission = permissionMap[parts[0]] || parts[0];

  if (operation === 'create' || operation === 'update' || operation === 'delete') {
    return [`${basePermission}:write`];
  } else {
    return [`${basePermission}:readonly`];
  }
}

/**
 * APIからHTTPメソッドを推測
 */
function inferHTTPMethod(api) {
  const operation = api.split('.').pop();

  const methodMap = {
    list: 'GET',
    get: 'GET',
    create: 'POST',
    update: 'PUT',
    patch: 'PATCH',
    delete: 'DELETE',
  };

  return methodMap[operation] || 'POST';
}

// CLI実行時
if (import.meta.url === `file://${process.argv[1]}`) {
  const sampleIntent = {
    intent_type: 'calendar_management',
    functional_requirements: [
      '今日の予定一覧表示',
      '新しい予定追加',
      '予定のリマインダー通知',
    ],
  };

  selectAPIs(sampleIntent).then(result => {
    console.log('\n✅ API selection complete!');
    console.log(JSON.stringify(result, null, 2));
  });
}
