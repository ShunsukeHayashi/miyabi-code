#!/usr/bin/env node
/**
 * Miyabi Lark Event Subscription Server
 * ユーザーからの@メンションを受信して応答するBotサーバー
 */

const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// 設定
const PORT = process.env.PORT || 3000;
const APP_ID = process.env.APP_ID || 'cli_a994d7e3b8789e1a';
const APP_SECRET = process.env.APP_SECRET || 'rNrwfiZCD9aRCCrQY5E1OeifhDg2kZJL';
const WEBHOOK_URL = 'https://open.larksuite.com/open-apis/bot/v2/hook/37b6a36e-677a-4f8f-b89c-b04b51265a25';

// Tenant Access Token取得
let tenantAccessToken = null;
let tokenExpiry = 0;

async function getTenantAccessToken() {
  const now = Date.now();
  if (tenantAccessToken && now < tokenExpiry) {
    return tenantAccessToken;
  }

  try {
    const response = await axios.post(
      'https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal',
      {
        app_id: APP_ID,
        app_secret: APP_SECRET
      }
    );

    if (response.data.code === 0) {
      tenantAccessToken = response.data.tenant_access_token;
      tokenExpiry = now + (response.data.expire - 60) * 1000; // 60秒マージン
      console.log('✅ Tenant Access Token取得成功');
      return tenantAccessToken;
    } else {
      console.error('❌ Token取得失敗:', response.data);
      return null;
    }
  } catch (error) {
    console.error('❌ Token取得エラー:', error.message);
    return null;
  }
}

// イベント受信エンドポイント
app.post('/webhook/events', async (req, res) => {
  console.log('\n📨 イベント受信:', JSON.stringify(req.body, null, 2));

  // 1. URL検証チャレンジ（初回設定時）
  if (req.body.type === 'url_verification') {
    console.log('🔐 URL検証チャレンジ受信');
    return res.json({
      challenge: req.body.challenge
    });
  }

  // 2. イベントタイプ確認
  if (req.body.header?.event_type === 'im.message.receive_v1') {
    const event = req.body.event;
    const messageContent = JSON.parse(event.message.content);
    const chatId = event.message.chat_id;
    const messageId = event.message.message_id;
    const text = messageContent.text;

    console.log(`📩 メッセージ受信: "${text}"`);
    console.log(`📍 Chat ID: ${chatId}`);

    // 3. Botへのメンションを含むメッセージに応答
    const mentions = event.message.mentions || [];
    const isBotMentioned = mentions.some(mention => mention.name === 'Miyabi Bot' || mention.name === 'MCP Integration Tool');

    if (isBotMentioned) {
      console.log('🤖 Botへのメンション検出 - 応答します');

      try {
        const token = await getTenantAccessToken();
        if (!token) {
          console.error('❌ Token取得失敗 - 応答できません');
          return res.json({ ok: true });
        }

        // メッセージ送信
        const replyResponse = await axios.post(
          'https://open.larksuite.com/open-apis/im/v1/messages',
          {
            receive_id: chatId,
            msg_type: 'text',
            content: JSON.stringify({
              text: `✅ メッセージ受信しました！\n\n受信内容: "${text}"\n\n🤖 Miyabi Bot - Event Subscription経由で応答中`
            })
          },
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            params: {
              receive_id_type: 'chat_id'
            }
          }
        );

        console.log('✅ 応答送信成功:', replyResponse.data);
      } catch (error) {
        console.error('❌ 応答送信エラー:', error.response?.data || error.message);
      }
    }
  }

  // 4. Larkへ200 OKを返す（必須）
  res.json({ ok: true });
});

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Miyabi Lark Event Server',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`\n🚀 Miyabi Lark Event Server 起動\n`);
  console.log(`📡 Event Endpoint: http://localhost:${PORT}/webhook/events`);
  console.log(`❤️  Health Check: http://localhost:${PORT}/health`);
  console.log(`\n⚙️  設定:`);
  console.log(`   - APP_ID: ${APP_ID}`);
  console.log(`   - Port: ${PORT}`);
  console.log(`\n待機中...\n`);
});
