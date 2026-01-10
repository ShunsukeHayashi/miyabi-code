import { TsubuyakunAgent } from './mcp-servers/miyabi-commercial-agents/dist/agents/tsubuyakun-sns.js';

const agent = new TsubuyakunAgent();

// 最新ニュース + @The_AGI_WAY スタイル
// トレンド: Gemini 3、Anthropic黒字化、Google時価総額

const postContent = `まだOpenAI一強だと思ってる？

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

// 実際に投稿を実行
console.log('=== X投稿実行 ===');
console.log('\n--- 投稿本文 ---');
console.log(postContent);
console.log('\n文字数:', postContent.length);

try {
  const result = await agent.postToX({
    content: postContent,
    dry_run: false  // 実際に投稿
  });

  console.log('\n=== 投稿結果 ===');
  console.log(JSON.stringify(result, null, 2));

  if (result.success) {
    console.log('\n✅ 投稿成功！');
    console.log('Tweet ID:', result.tweet_id);
    console.log('URL:', result.url);
  } else {
    console.log('\n❌ 投稿失敗');
    console.log('エラー:', result.error);
  }
} catch (error) {
  console.error('\n❌ エラー:', error.message);
}
