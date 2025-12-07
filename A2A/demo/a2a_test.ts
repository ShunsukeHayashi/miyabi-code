/**
 * A2A PUSH Communication Test
 * PUSH型通信プロトコルのテストスクリプト
 *
 * テスト内容:
 * 1. 基本的なメッセージ送信
 * 2. ステータス報告 (開始/進行中/完了/エラー)
 * 3. エージェント間リレー
 * 4. タイムスタンプ付きログ
 */

import { execSync } from "child_process";

// 環境変数からPane IDを取得
const CONDUCTOR_PANE = process.env.MIYABI_CONDUCTOR_PANE || "%101";
const CODEGEN_PANE = process.env.MIYABI_CODEGEN_PANE || "%102";

interface TestResult {
  name: string;
  passed: boolean;
  message: string;
  duration: number;
}

const results: TestResult[] = [];

function log(msg: string): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${msg}`);
}

function sendToPane(paneId: string, message: string): boolean {
  try {
    execSync(
      `tmux send-keys -t ${paneId} '${message.replace(/'/g, "'\\''")}' && sleep 0.5 && tmux send-keys -t ${paneId} Enter`,
      { timeout: 5000 }
    );
    return true;
  } catch {
    return false;
  }
}

function paneExists(paneId: string): boolean {
  try {
    const result = execSync(`tmux list-panes -a -F "#{pane_id}" 2>/dev/null`, {
      encoding: "utf-8",
    });
    return result.includes(paneId);
  } catch {
    return false;
  }
}

function runTest(name: string, testFn: () => boolean): void {
  log(`テスト開始: ${name}`);
  const start = Date.now();

  try {
    const passed = testFn();
    const duration = Date.now() - start;

    results.push({
      name,
      passed,
      message: passed ? "成功" : "失敗",
      duration,
    });

    log(`  ${passed ? "✅" : "❌"} ${name} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - start;
    results.push({
      name,
      passed: false,
      message: String(error),
      duration,
    });
    log(`  ❌ ${name}: ${error}`);
  }
}

// テスト1: Conductorペーン存在確認
runTest("Conductorペーン存在確認", () => {
  return paneExists(CONDUCTOR_PANE);
});

// テスト2: 基本メッセージ送信
runTest("基本メッセージ送信 (PUSH)", () => {
  const message = `[楓] テスト: A2A PUSH通信テスト開始`;
  return sendToPane(CONDUCTOR_PANE, message);
});

// テスト3: ステータス報告 - 開始
runTest("ステータス報告 - 開始", () => {
  const message = `[楓] 開始: a2a_test.ts 実行`;
  return sendToPane(CONDUCTOR_PANE, message);
});

// テスト4: ステータス報告 - 進行中
runTest("ステータス報告 - 進行中", () => {
  const message = `[楓] 進行中: 50% - テストケース実行中`;
  return sendToPane(CONDUCTOR_PANE, message);
});

// テスト5: エージェント間リレーメッセージ
runTest("エージェント間リレー", () => {
  const message = `[楓→桜] レビュー依頼: PR #test-001`;
  return sendToPane(CONDUCTOR_PANE, message);
});

// テスト6: ステータス報告 - 完了
runTest("ステータス報告 - 完了", () => {
  const message = `[楓] 完了: 全テストケース実行完了`;
  return sendToPane(CONDUCTOR_PANE, message);
});

// 結果サマリー
console.log("\n=== A2A PUSH通信テスト結果 ===");
console.log("");

const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;
const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

results.forEach((r) => {
  console.log(`${r.passed ? "✅" : "❌"} ${r.name}: ${r.message} (${r.duration}ms)`);
});

console.log("");
console.log(`合計: ${results.length} テスト`);
console.log(`成功: ${passed} / 失敗: ${failed}`);
console.log(`実行時間: ${totalTime}ms`);
console.log("");

// Conductorへ最終報告
if (paneExists(CONDUCTOR_PANE)) {
  const finalMessage = `[楓] 完了: a2a_test.ts - ${passed}/${results.length} テスト成功`;
  sendToPane(CONDUCTOR_PANE, finalMessage);
  console.log(`📤 Conductorへ報告完了: ${finalMessage}`);
}

// 終了コード
process.exit(failed > 0 ? 1 : 0);
