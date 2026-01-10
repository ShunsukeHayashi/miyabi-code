/**
 * xAI Grok API を使用した X アカウント分析
 * Grok は X のデータにネイティブアクセス可能
 */

const XAI_API_KEY = process.env.XAI_API_KEY;
const USERNAME = 'The_AGI_WAY';

async function askGrok(prompt) {
  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${XAI_API_KEY}`
    },
    body: JSON.stringify({
      model: 'grok-3-latest',
      messages: [
        {
          role: 'system',
          content: 'あなたはX(Twitter)データ分析の専門家です。ユーザーのX投稿履歴とエンゲージメントを詳細に分析し、具体的な数値と洞察を提供してください。日本語で回答してください。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Grok API failed: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function main() {
  console.log('=== Grok による X アカウント分析 ===\n');
  console.log(`対象: @${USERNAME}\n`);

  try {
    // 1. アカウント概要分析
    console.log('1. アカウント概要を分析中...\n');
    const overview = await askGrok(`
@${USERNAME} (ハヤシシュンスケ) のXアカウントを分析してください。

以下の情報を提供してください:
1. フォロワー数とフォロー数
2. アカウントの主なテーマ・トピック
3. 投稿頻度
4. 最近の活動状況
`);
    console.log('📊 アカウント概要:\n');
    console.log(overview);
    console.log('\n---\n');

    // 2. 最新投稿分析
    console.log('2. 最新投稿を分析中...\n');
    const recentPosts = await askGrok(`
@${USERNAME} の最新の投稿を10件分析してください。

各投稿について:
- 投稿内容の要約
- いいね数、RT数、リプライ数
- 投稿日時
- エンゲージメントの評価

最もエンゲージメントが高かった投稿と、その理由も教えてください。
`);
    console.log('📝 最新投稿分析:\n');
    console.log(recentPosts);
    console.log('\n---\n');

    // 3. エンゲージメントパターン
    console.log('3. エンゲージメントパターンを分析中...\n');
    const engagement = await askGrok(`
@${USERNAME} のエンゲージメントパターンを分析してください。

以下を教えてください:
1. どのタイプの投稿が最もエンゲージメントを獲得しているか
2. 最適な投稿時間帯
3. よく使われているハッシュタグとその効果
4. フォロワーが最も反応するトピック
5. 改善すべき点
`);
    console.log('📈 エンゲージメントパターン:\n');
    console.log(engagement);
    console.log('\n---\n');

    // 4. 次の投稿提案
    console.log('4. 次の投稿提案を生成中...\n');
    const suggestion = await askGrok(`
@${USERNAME} のアカウント分析に基づいて、次に投稿すべき内容を3つ提案してください。

各提案には:
1. 具体的な投稿文（280文字以内）
2. なぜこの内容がエンゲージメントを獲得できるか
3. 最適な投稿時間

これまでの投稿スタイルと一貫性を保ちつつ、エンゲージメントを最大化する内容にしてください。
`);
    console.log('💡 次の投稿提案:\n');
    console.log(suggestion);

  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

main();
