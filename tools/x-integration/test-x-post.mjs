/**
 * Twitter API v2 直接投稿テスト
 * OAuth 1.0a署名を手動で生成
 */

import crypto from 'crypto';

const API_KEY = process.env.TWITTER_API_KEY;
const API_SECRET = process.env.TWITTER_API_SECRET;
const ACCESS_TOKEN = process.env.TWITTER_ACCESS_TOKEN;
const ACCESS_SECRET = process.env.TWITTER_ACCESS_SECRET;

console.log('=== OAuth 認証情報チェック ===');
console.log('API_KEY:', API_KEY ? `${API_KEY.substring(0, 8)}...` : 'NOT SET');
console.log('API_SECRET:', API_SECRET ? `${API_SECRET.substring(0, 8)}...` : 'NOT SET');
console.log('ACCESS_TOKEN:', ACCESS_TOKEN ? `${ACCESS_TOKEN.substring(0, 8)}...` : 'NOT SET');
console.log('ACCESS_SECRET:', ACCESS_SECRET ? `${ACCESS_SECRET.substring(0, 8)}...` : 'NOT SET');

if (!API_KEY || !API_SECRET || !ACCESS_TOKEN || !ACCESS_SECRET) {
  console.error('\n❌ 認証情報が不足しています');
  process.exit(1);
}

// OAuth 1.0a署名生成
function generateOAuthSignature(method, url, params, consumerSecret, tokenSecret) {
  const sortedParams = Object.keys(params).sort().map(k =>
    `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`
  ).join('&');

  const baseString = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams)
  ].join('&');

  const signingKey = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(tokenSecret)}`;

  return crypto.createHmac('sha1', signingKey)
    .update(baseString)
    .digest('base64');
}

function generateOAuthHeader(method, url, bodyParams = {}) {
  const oauthParams = {
    oauth_consumer_key: API_KEY,
    oauth_nonce: crypto.randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
    oauth_token: ACCESS_TOKEN,
    oauth_version: '1.0'
  };

  const allParams = { ...oauthParams, ...bodyParams };
  const signature = generateOAuthSignature(method, url, allParams, API_SECRET, ACCESS_SECRET);
  oauthParams.oauth_signature = signature;

  const headerParts = Object.keys(oauthParams).sort().map(k =>
    `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`
  );

  return `OAuth ${headerParts.join(', ')}`;
}

async function postTweet(text) {
  const url = 'https://api.twitter.com/2/tweets';
  const body = { text };

  const authHeader = generateOAuthHeader('POST', url);

  console.log('\n=== リクエスト送信 ===');
  console.log('URL:', url);
  console.log('Method: POST');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': authHeader,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  const result = await response.json();

  console.log('\n=== レスポンス ===');
  console.log('Status:', response.status);
  console.log('Body:', JSON.stringify(result, null, 2));

  return { status: response.status, data: result };
}

// テスト投稿
const testContent = `まだOpenAI一強だと思ってる？

今週のAI業界、地殻変動起きてるよ。

1. Salesforce CEO
「Gemini 3を2時間使ったらChatGPTに戻れない」

2. Anthropic
OpenAIより先に黒字化する見込み（WSJ報道）

3. Google時価総額
Microsoft超え。Alphabet株は今年+70%

4. LMSYSランキング
Gemini 3 Proがトップに

OpenAI帝国、崩壊の始まり。

2025年、勝者は「一社に賭けなかった人」。

お前ら、まだChatGPTだけ使ってんの？`;

console.log('\n=== 投稿内容 ===');
console.log(testContent);
console.log('\n文字数:', testContent.length);

postTweet(testContent).then(result => {
  if (result.status === 201) {
    console.log('\n✅ 投稿成功！');
    console.log('Tweet ID:', result.data.data?.id);
    console.log('URL: https://twitter.com/The_AGI_WAY/status/' + result.data.data?.id);
  } else {
    console.log('\n❌ 投稿失敗');
  }
}).catch(err => {
  console.error('\n❌ エラー:', err.message);
});
