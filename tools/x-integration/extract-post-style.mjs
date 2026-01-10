/**
 * @The_AGI_WAY の投稿スタイル抽出
 */

const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;

if (!BEARER_TOKEN) {
  console.error('❌ TWITTER_BEARER_TOKEN environment variable is required');
  process.exit(1);
}

async function fetchUserTweets(username) {
  // Get user ID
  const userRes = await fetch(
    `https://api.twitter.com/2/users/by/username/${username}?user.fields=public_metrics`,
    { headers: { 'Authorization': `Bearer ${BEARER_TOKEN}` } }
  );
  const userData = await userRes.json();

  if (!userData.data) {
    console.error('User API Error:', JSON.stringify(userData, null, 2));
    throw new Error('Failed to get user');
  }

  const userId = userData.data.id;
  console.log(`User ID: ${userId}\n`);

  // Get tweets
  const tweetsRes = await fetch(
    `https://api.twitter.com/2/users/${userId}/tweets?max_results=100&tweet.fields=public_metrics,created_at&exclude=retweets,replies`,
    { headers: { 'Authorization': `Bearer ${BEARER_TOKEN}` } }
  );
  return tweetsRes.json();
}

async function extractStyle(tweets) {
  // Sort by engagement
  const sorted = tweets.map(t => ({
    text: t.text,
    likes: t.public_metrics?.like_count || 0,
    rts: t.public_metrics?.retweet_count || 0,
    replies: t.public_metrics?.reply_count || 0,
    score: (t.public_metrics?.like_count || 0) +
           (t.public_metrics?.retweet_count || 0) * 2 +
           (t.public_metrics?.reply_count || 0) * 3
  })).sort((a, b) => b.score - a.score);

  // Top 10 for style extraction
  const top10 = sorted.slice(0, 10);

  console.log('=== トップ10投稿 (全文) ===\n');
  top10.forEach((t, i) => {
    console.log(`--- ${i + 1}. [Score: ${t.score} | ❤️${t.likes} 🔁${t.rts} 💬${t.replies}] ---`);
    console.log(t.text);
    console.log('');
  });

  // Pattern analysis
  console.log('\n=== スタイルパターン抽出 ===\n');

  const patterns = {
    openings: [],
    closings: [],
  };

  top10.forEach(t => {
    const lines = t.text.split('\n').filter(l => l.trim());
    if (lines.length > 0) patterns.openings.push(lines[0]);
    if (lines.length > 1) patterns.closings.push(lines[lines.length - 1]);
  });

  console.log('【オープニングパターン】');
  patterns.openings.forEach(o => console.log(`  - ${o.substring(0, 60)}`));

  console.log('\n【クロージングパターン】');
  patterns.closings.forEach(c => console.log(`  - ${c.substring(0, 60)}`));

  return { top10, patterns };
}

async function main() {
  console.log('=== @The_AGI_WAY 投稿スタイル抽出 ===\n');

  const data = await fetchUserTweets('The_AGI_WAY');
  if (!data.data) {
    console.error('Tweets Error:', JSON.stringify(data, null, 2));
    return;
  }

  await extractStyle(data.data);
}

main().catch(console.error);
