#!/usr/bin/env node
/**
 * Intent Analyzer - User Requestを要件定義に変換
 *
 * Input: 自然言語のUser Request
 * Output: 構造化された要件定義
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * User Requestを分析して構造化された要件定義を生成
 * @param {string} userRequest - ユーザーからのリクエスト（自然言語）
 * @returns {Promise<Object>} 構造化された要件定義
 */
export async function analyzeIntent(userRequest) {
  console.log('\n🔍 Analyzing User Intent...');
  console.log(`📝 User Request: "${userRequest}"\n`);

  // Intent分類
  const intent = classifyIntent(userRequest);

  // 機能要件抽出
  const functionalRequirements = extractFunctionalRequirements(userRequest);

  // 非機能要件抽出
  const nonFunctionalRequirements = extractNonFunctionalRequirements(userRequest);

  // エンティティ抽出
  const entities = extractEntities(userRequest);

  const analysis = {
    original_request: userRequest,
    intent_type: intent.type,
    intent_confidence: intent.confidence,
    functional_requirements: functionalRequirements,
    non_functional_requirements: nonFunctionalRequirements,
    entities: entities,
    analyzed_at: new Date().toISOString(),
  };

  console.log('✅ Intent Analysis Complete:\n');
  console.log(JSON.stringify(analysis, null, 2));

  return analysis;
}

/**
 * Intentを分類
 * @param {string} text - User Request
 * @returns {Object} Intent type and confidence
 */
function classifyIntent(text) {
  const intentPatterns = {
    bot_creation: /bot|ボット|作って|作成/i,
    message_automation: /メッセージ|送信|通知|リマインダー/i,
    calendar_management: /カレンダー|予定|スケジュール|会議/i,
    document_management: /ドキュメント|文書|ファイル|共有/i,
    approval_workflow: /承認|ワークフロー|申請|決裁/i,
    data_visualization: /データ|可視化|ダッシュボード|レポート/i,
    user_management: /ユーザー|メンバー|権限|組織/i,
    webhook_integration: /Webhook|連携|API|統合/i,
  };

  const matches = {};
  for (const [intentType, pattern] of Object.entries(intentPatterns)) {
    if (pattern.test(text)) {
      matches[intentType] = true;
    }
  }

  // Primary intentを選定
  const primaryIntent = Object.keys(matches)[0] || 'general_bot';
  const confidence = Object.keys(matches).length > 0 ? 0.8 : 0.5;

  return {
    type: primaryIntent,
    all_matches: Object.keys(matches),
    confidence,
  };
}

/**
 * 機能要件を抽出
 * @param {string} text - User Request
 * @returns {Array<string>} 機能要件リスト
 */
function extractFunctionalRequirements(text) {
  const requirements = [];

  // 箇条書き検出
  const bulletPoints = text.match(/[0-9]+\.|•|・|\n-\s/g);
  if (bulletPoints) {
    const items = text.split(/[0-9]+\.|•|・|\n-\s/).filter(s => s.trim().length > 0);
    requirements.push(...items.map(s => s.trim()));
  }

  // 機能キーワード検出
  const featurePatterns = {
    list_display: /一覧|リスト|表示|確認/i,
    create: /作成|追加|登録|新規/i,
    update: /更新|編集|変更|修正/i,
    delete: /削除|取り消し/i,
    search: /検索|探す|フィルタ/i,
    notify: /通知|リマインド|アラート/i,
    export: /エクスポート|出力|ダウンロード/i,
    import: /インポート|取り込み|アップロード/i,
  };

  for (const [feature, pattern] of Object.entries(featurePatterns)) {
    if (pattern.test(text)) {
      requirements.push(`${feature}: ${pattern.source}`);
    }
  }

  return [...new Set(requirements)]; // 重複除去
}

/**
 * 非機能要件を抽出
 * @param {string} text - User Request
 * @returns {Object} 非機能要件
 */
function extractNonFunctionalRequirements(text) {
  return {
    real_time: /リアルタイム|即座|すぐに/i.test(text),
    scheduled: /定期|スケジュール|毎日|毎週/i.test(text),
    security: /セキュア|安全|暗号化/i.test(text),
    multi_user: /複数|マルチ|共同|協力/i.test(text),
    mobile_support: /モバイル|スマホ|アプリ/i.test(text),
  };
}

/**
 * エンティティを抽出
 * @param {string} text - User Request
 * @returns {Object} 抽出されたエンティティ
 */
function extractEntities(text) {
  return {
    mentioned_apps: extractMentionedApps(text),
    time_expressions: extractTimeExpressions(text),
    data_types: extractDataTypes(text),
  };
}

/**
 * 言及されているアプリ/サービスを抽出
 */
function extractMentionedApps(text) {
  const apps = {
    lark: /Lark|ラーク/i,
    calendar: /カレンダー|Calendar/i,
    docs: /Docs|ドキュメント|文書/i,
    base: /Base|ベース|データベース/i,
    messenger: /メッセンジャー|チャット|IM/i,
    approval: /承認|Approval/i,
  };

  const mentioned = [];
  for (const [app, pattern] of Object.entries(apps)) {
    if (pattern.test(text)) {
      mentioned.push(app);
    }
  }

  return mentioned;
}

/**
 * 時間表現を抽出
 */
function extractTimeExpressions(text) {
  const timePatterns = {
    daily: /毎日|日次|デイリー/i,
    weekly: /毎週|週次|ウィークリー/i,
    monthly: /毎月|月次|マンスリー/i,
    specific_time: /\d{1,2}時|\d{1,2}:\d{2}/,
    today: /今日|本日/i,
    tomorrow: /明日|翌日/i,
  };

  const expressions = [];
  for (const [type, pattern] of Object.entries(timePatterns)) {
    const match = text.match(pattern);
    if (match) {
      expressions.push({ type, value: match[0] });
    }
  }

  return expressions;
}

/**
 * データ型を抽出
 */
function extractDataTypes(text) {
  const dataPatterns = {
    text: /テキスト|文字|メッセージ/i,
    number: /数値|数字|カウント/i,
    date: /日付|日時|時刻/i,
    file: /ファイル|画像|動画|添付/i,
    list: /リスト|一覧|配列/i,
    json: /JSON|データ構造/i,
  };

  const types = [];
  for (const [type, pattern] of Object.entries(dataPatterns)) {
    if (pattern.test(text)) {
      types.push(type);
    }
  }

  return types;
}

// CLI実行時
if (import.meta.url === `file://${process.argv[1]}`) {
  const userRequest = process.argv[2] || 'カレンダーの予定を管理できるBotを作って';
  analyzeIntent(userRequest).then(() => {
    console.log('\n✅ Intent analysis complete!');
  });
}
