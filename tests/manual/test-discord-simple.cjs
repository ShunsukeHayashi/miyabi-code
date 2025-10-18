/**
 * Simple Discord Notification Test
 *
 * Tests Discord webhook directly
 */

const https = require('https');
const url = require('url');

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

if (!WEBHOOK_URL) {
  console.error('❌ DISCORD_WEBHOOK_URL environment variable is not set');
  process.exit(1);
}

function sendDiscordMessage(webhookUrl, embed) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(webhookUrl);
    const postData = JSON.stringify({ embeds: [embed] });

    const options = {
      hostname: parsedUrl.hostname,
      port: 443,
      path: parsedUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 204 || res.statusCode === 200) {
          resolve(data);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Discord Webhook Simple Test\n');
  console.log(`✓ Webhook URL: ${WEBHOOK_URL.substring(0, 50)}...\n`);

  // Test Case 1: Success Notification
  console.log('📤 Test Case 1: Success Notification (Agent完了)');
  console.log('-------------------------------------------');

  const successEmbed = {
    title: '✅ CodeGenAgent 実行完了',
    description: 'Agent実行が正常に完了しました（テスト通知）',
    color: 5763719,
    fields: [
      {
        name: 'タスク',
        value: 'Manual test - Success scenario (#manual-test-1)',
        inline: false,
      },
      {
        name: '実行時間',
        value: '2.50s',
        inline: true,
      },
      {
        name: 'ステータス',
        value: 'success',
        inline: true,
      },
      {
        name: '品質スコア',
        value: '95/100',
        inline: true,
      },
      {
        name: '変更内容',
        value: '• ファイル変更: 2個\n• 行数: 150行\n• テストカバレッジ: 87%',
        inline: false,
      },
    ],
    footer: {
      text: '🤖 Generated with Claude Code - Test Notification',
    },
    timestamp: new Date().toISOString(),
  };

  try {
    await sendDiscordMessage(WEBHOOK_URL, successEmbed);
    console.log('✅ Success notification sent!\n');
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }

  // Wait a bit
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test Case 2: Error Notification
  console.log('📤 Test Case 2: Error Notification (Agent失敗)');
  console.log('-------------------------------------------');

  const errorEmbed = {
    title: '❌ ReviewAgent 実行失敗',
    description: 'Agent実行中にエラーが発生しました（テスト通知）',
    color: 15158332, // Red
    fields: [
      {
        name: 'タスク',
        value: 'Manual test - Error scenario (#manual-test-2)',
        inline: false,
      },
      {
        name: '実行時間',
        value: '1.23s',
        inline: true,
      },
      {
        name: 'エラー',
        value: 'Manual test error: Failed to complete review process',
        inline: false,
      },
      {
        name: '推奨アクション',
        value: '• ログを確認してください\n• 環境設定を確認してください\n• 必要に応じてエスカレーション',
        inline: false,
      },
    ],
    footer: {
      text: '🤖 Generated with Claude Code - Test Notification',
    },
    timestamp: new Date().toISOString(),
  };

  try {
    await sendDiscordMessage(WEBHOOK_URL, errorEmbed);
    console.log('✅ Error notification sent!\n');
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }

  // Test Case 3: Summary Report
  await new Promise((resolve) => setTimeout(resolve, 2000));

  console.log('📤 Test Case 3: Test Summary Report');
  console.log('------------------------------------');

  const summaryEmbed = {
    title: '📊 Discord通知Hook テスト完了',
    description: 'すべてのテストケースが正常に実行されました',
    color: 3066993, // Blue
    fields: [
      {
        name: '実行テスト数',
        value: '3',
        inline: true,
      },
      {
        name: '成功',
        value: '3',
        inline: true,
      },
      {
        name: '失敗',
        value: '0',
        inline: true,
      },
      {
        name: 'テスト項目',
        value: '✅ Test 1: 成功通知送信\n✅ Test 2: エラー通知送信\n✅ Test 3: サマリーレポート送信',
        inline: false,
      },
      {
        name: '確認事項',
        value: '• Webhook URLの動作確認\n• Embedフォーマットの確認\n• 日本語文字列の表示確認\n• タイムスタンプの表示確認',
        inline: false,
      },
    ],
    footer: {
      text: '🤖 Generated with Claude Code - Test Summary',
    },
    timestamp: new Date().toISOString(),
  };

  try {
    await sendDiscordMessage(WEBHOOK_URL, summaryEmbed);
    console.log('✅ Summary report sent!\n');
  } catch (error) {
    console.error('❌ Failed:', error.message);
  }

  console.log('\n🎉 All tests completed!');
  console.log('Discordチャンネルで3つの通知を確認してください。\n');
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
