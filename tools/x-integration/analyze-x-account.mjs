/**
 * X API v2 を使用したアカウント分析
 * - 最新ツイート取得
 * - エンゲージメント分析
 * - フォロワー反応パターン
 */

const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
const USERNAME = 'The_AGI_WAY';

async function fetchUserByUsername(username) {
  const url = `https://api.twitter.com/2/users/by/username/${username}?user.fields=public_metrics,description,created_at`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${BEARER_TOKEN}`
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`User fetch failed: ${response.status} - ${error}`);
  }

  return response.json();
}

async function fetchUserTweets(userId) {
  const url = `https://api.twitter.com/2/users/${userId}/tweets?max_results=100&tweet.fields=public_metrics,created_at,conversation_id&exclude=retweets,replies`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${BEARER_TOKEN}`
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Tweets fetch failed: ${response.status} - ${error}`);
  }

  return response.json();
}

async function analyzeTweets(tweets) {
  if (!tweets || tweets.length === 0) {
    return { error: 'No tweets to analyze' };
  }

  // エンゲージメント計算
  const analyzed = tweets.map(tweet => {
    const metrics = tweet.public_metrics || {};
    const engagement = (metrics.like_count || 0) +
                      (metrics.retweet_count || 0) * 2 +
                      (metrics.reply_count || 0) * 3 +
                      (metrics.quote_count || 0) * 2;

    return {
      id: tweet.id,
      text: tweet.text.substring(0, 100) + '...',
      created_at: tweet.created_at,
      likes: metrics.like_count || 0,
      retweets: metrics.retweet_count || 0,
      replies: metrics.reply_count || 0,
      quotes: metrics.quote_count || 0,
      impressions: metrics.impression_count || 0,
      engagement_score: engagement
    };
  });

  // ソート（エンゲージメント順）
  analyzed.sort((a, b) => b.engagement_score - a.engagement_score);

  // 統計
  const totalLikes = analyzed.reduce((sum, t) => sum + t.likes, 0);
  const totalRTs = analyzed.reduce((sum, t) => sum + t.retweets, 0);
  const totalReplies = analyzed.reduce((sum, t) => sum + t.replies, 0);
  const avgEngagement = analyzed.reduce((sum, t) => sum + t.engagement_score, 0) / analyzed.length;

  return {
    total_tweets: analyzed.length,
    stats: {
      total_likes: totalLikes,
      total_retweets: totalRTs,
      total_replies: totalReplies,
      avg_likes: Math.round(totalLikes / analyzed.length),
      avg_retweets: Math.round(totalRTs / analyzed.length),
      avg_replies: Math.round(totalReplies / analyzed.length),
      avg_engagement_score: Math.round(avgEngagement)
    },
    top_5_posts: analyzed.slice(0, 5),
    recent_5_posts: tweets.slice(0, 5).map(t => ({
      text: t.text.substring(0, 150) + '...',
      created_at: t.created_at,
      metrics: t.public_metrics
    }))
  };
}

async function main() {
  console.log('=== X API アカウント分析 ===\n');
  console.log(`対象: @${USERNAME}\n`);

  try {
    // ユーザー情報取得
    console.log('1. ユーザー情報取得中...');
    const userData = await fetchUserByUsername(USERNAME);

    if (!userData.data) {
      throw new Error('User not found');
    }

    const user = userData.data;
    console.log('\n📊 アカウント情報:');
    console.log(JSON.stringify({
      id: user.id,
      username: user.username,
      description: user.description?.substring(0, 100),
      created_at: user.created_at,
      metrics: user.public_metrics
    }, null, 2));

    // ツイート取得
    console.log('\n2. 最新ツイート取得中...');
    const tweetsData = await fetchUserTweets(user.id);

    if (!tweetsData.data || tweetsData.data.length === 0) {
      console.log('ツイートが見つかりませんでした');
      return;
    }

    console.log(`取得: ${tweetsData.data.length}件\n`);

    // 分析
    console.log('3. エンゲージメント分析中...\n');
    const analysis = await analyzeTweets(tweetsData.data);

    console.log('📈 統計サマリー:');
    console.log(JSON.stringify(analysis.stats, null, 2));

    console.log('\n🏆 トップ5投稿 (エンゲージメント順):');
    analysis.top_5_posts.forEach((post, i) => {
      console.log(`\n${i + 1}. [Score: ${post.engagement_score}]`);
      console.log(`   ❤️ ${post.likes} | 🔁 ${post.retweets} | 💬 ${post.replies}`);
      console.log(`   "${post.text}"`);
    });

    console.log('\n📝 最新5投稿:');
    analysis.recent_5_posts.forEach((post, i) => {
      console.log(`\n${i + 1}. [${post.created_at}]`);
      console.log(`   ❤️ ${post.metrics?.like_count || 0} | 🔁 ${post.metrics?.retweet_count || 0}`);
      console.log(`   "${post.text}"`);
    });

  } catch (error) {
    console.error('❌ エラー:', error.message);
  }
}

main();
