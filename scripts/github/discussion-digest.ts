#!/usr/bin/env tsx
/**
 * Discussion Weekly Digest Generator
 *
 * Generates and posts a weekly summary of GitHub Discussions activity
 * Part of Phase C: Discussions - Message Queue (Issue #139)
 *
 * Features:
 * - Top Ideas (by reaction count)
 * - Most active Q&A threads
 * - Community engagement stats
 * - Posts to Announcements category
 */

import { Octokit } from '@octokit/rest';

// ============================================================================
// Types
// ============================================================================

interface Discussion {
  number: number;
  title: string;
  category: string;
  author: string;
  url: string;
  reactions: number;
  comments: number;
  createdAt: string;
}

interface DigestStats {
  totalDiscussions: number;
  totalComments: number;
  uniqueContributors: number;
  topIdeas: Discussion[];
  topQA: Discussion[];
  newDiscussions: Discussion[];
}

// ============================================================================
// Configuration
// ============================================================================

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPOSITORY = process.env.GITHUB_REPOSITORY || 'ShunsukeHayashi/miyabi-private';
const [owner, repo] = REPOSITORY.split('/');

if (!GITHUB_TOKEN) {
  console.error('❌ GITHUB_TOKEN environment variable is required');
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

// ============================================================================
// GraphQL Queries
// ============================================================================

const DISCUSSIONS_QUERY = `
  query($owner: String!, $repo: String!, $since: DateTime!) {
    repository(owner: $owner, name: $repo) {
      discussions(first: 100, orderBy: {field: CREATED_AT, direction: DESC}) {
        nodes {
          number
          title
          category {
            name
          }
          author {
            login
          }
          url
          createdAt
          reactions {
            totalCount
          }
          comments {
            totalCount
          }
        }
      }
    }
  }
`;

// ============================================================================
// Digest Generator
// ============================================================================

class DiscussionDigest {
  private discussions: Discussion[] = [];

  /**
   * Fetch discussions from the past week
   */
  async fetchDiscussions(): Promise<void> {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    console.log(`📥 Fetching discussions since ${oneWeekAgo.toISOString()}`);

    try {
      const response: any = await octokit.graphql(DISCUSSIONS_QUERY, {
        owner,
        repo,
        since: oneWeekAgo.toISOString(),
      });

      this.discussions = response.repository.discussions.nodes
        .filter((d: any) => new Date(d.createdAt) >= oneWeekAgo)
        .map((d: any) => ({
          number: d.number,
          title: d.title,
          category: d.category.name,
          author: d.author.login,
          url: d.url,
          reactions: d.reactions.totalCount,
          comments: d.comments.totalCount,
          createdAt: d.createdAt,
        }));

      console.log(`✅ Fetched ${this.discussions.length} discussions from the past week`);
    } catch (error) {
      console.error('❌ Failed to fetch discussions:', error);
      throw error;
    }
  }

  /**
   * Calculate digest statistics
   */
  calculateStats(): DigestStats {
    const totalDiscussions = this.discussions.length;
    const totalComments = this.discussions.reduce((sum, d) => sum + d.comments, 0);

    // Unique contributors (discussion authors + commenters)
    const uniqueAuthors = new Set(this.discussions.map((d) => d.author));
    const uniqueContributors = uniqueAuthors.size;

    // Top Ideas (by reactions, Ideas category only)
    const ideas = this.discussions.filter((d) => d.category === 'Ideas');
    const topIdeas = ideas.sort((a, b) => b.reactions - a.reactions).slice(0, 5);

    // Top Q&A (by comment count, Q&A category only)
    const qaThreads = this.discussions.filter((d) => d.category === 'Q&A');
    const topQA = qaThreads.sort((a, b) => b.comments - a.comments).slice(0, 5);

    // New discussions (chronological, all categories)
    const newDiscussions = [...this.discussions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10);

    return {
      totalDiscussions,
      totalComments,
      uniqueContributors,
      topIdeas,
      topQA,
      newDiscussions,
    };
  }

  /**
   * Generate digest markdown
   */
  generateMarkdown(stats: DigestStats): string {
    const weekRange = this.getWeekRange();

    let markdown = `# 📊 Weekly Discussion Digest

**Period**: ${weekRange}
**Generated**: ${new Date().toISOString().split('T')[0]}

---

## 🎉 This Week's Highlights

### Community Engagement
- 💬 **${stats.totalDiscussions} new discussions** started
- 📝 **${stats.totalComments} comments** posted
- 👥 **${stats.uniqueContributors} unique contributors**

---

## 💡 Top Ideas (by reactions)
`;

    if (stats.topIdeas.length > 0) {
      stats.topIdeas.forEach((idea, index) => {
        markdown += `\n${index + 1}. **${idea.title}** ([#${idea.number}](${idea.url}))
   - 👍 ${idea.reactions} reactions
   - 💬 ${idea.comments} comments
   - 👤 by @${idea.author}
`;
      });
    } else {
      markdown += '\n*No new ideas this week. Share your ideas in the [Ideas category](../../discussions/categories/ideas)!*\n';
    }

    markdown += `\n---

## ❓ Most Active Q&A Threads
`;

    if (stats.topQA.length > 0) {
      stats.topQA.forEach((qa, index) => {
        markdown += `\n${index + 1}. **${qa.title}** ([#${qa.number}](${qa.url}))
   - 💬 ${qa.comments} comments
   - 👤 by @${qa.author}
`;
      });
    } else {
      markdown += '\n*No Q&A threads this week. Ask your questions in the [Q&A category](../../discussions/categories/q-a)!*\n';
    }

    markdown += `\n---

## 🆕 All New Discussions
`;

    if (stats.newDiscussions.length > 0) {
      // Group by category
      const byCategory = stats.newDiscussions.reduce((acc, d) => {
        if (!acc[d.category]) {acc[d.category] = [];}
        acc[d.category].push(d);
        return acc;
      }, {} as Record<string, Discussion[]>);

      Object.entries(byCategory).forEach(([category, discussions]) => {
        markdown += `\n### ${this.getCategoryEmoji(category)} ${category}\n`;
        discussions.forEach((d) => {
          markdown += `- [${d.title}](${d.url}) by @${d.author}\n`;
        });
      });
    } else {
      markdown += '\n*No new discussions this week.*\n';
    }

    markdown += `\n---

## 🚀 Get Involved

### Start a Discussion
- 💡 [Share an Idea](../../discussions/new?category=ideas)
- ❓ [Ask a Question](../../discussions/new?category=q-a)
- 🎨 [Show Your Project](../../discussions/new?category=show-and-tell)
- 🤝 [General Chat](../../discussions/new?category=general)

### Community Guidelines
- Be respectful and constructive
- Search before posting duplicates
- Use appropriate categories
- React with 👍 to show support

---

*📅 Next digest: ${this.getNextMonday()}*
*🤖 Automated by Discussion Bot (Issue #139 Phase C)*
`;

    return markdown;
  }

  /**
   * Post digest to Discussions (Announcements category)
   */
  async postDigest(markdown: string): Promise<void> {
    const weekRange = this.getWeekRange();
    const title = `📊 Weekly Digest: ${weekRange}`;

    console.log(`📮 Posting digest: "${title}"`);

    try {
      // Note: GitHub Discussions API for creating discussions is not yet available in REST API
      // For now, we'll output the markdown and suggest manual posting
      // In the future, use GraphQL mutation: createDiscussion

      console.log('\n' + '='.repeat(80));
      console.log('WEEKLY DIGEST MARKDOWN:');
      console.log('='.repeat(80));
      console.log(markdown);
      console.log('='.repeat(80));

      console.log('\n📝 To post this digest:');
      console.log('1. Go to: https://github.com/' + REPOSITORY + '/discussions/new?category=announcements');
      console.log('2. Title: ' + title);
      console.log('3. Paste the markdown above');
      console.log('4. Or use GraphQL createDiscussion mutation');

      console.log('\n✅ Digest generated successfully');

      // TODO: Implement GraphQL createDiscussion mutation when available
      // For now, save to file for manual posting
      const fs = await import('fs');
      const digestPath = `/tmp/discussion-digest-${Date.now()}.md`;
      fs.writeFileSync(digestPath, `# ${title}\n\n${markdown}`);
      console.log(`💾 Saved to: ${digestPath}`);
    } catch (error) {
      console.error('❌ Failed to post digest:', error);
      throw error;
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private getWeekRange(): string {
    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const format = (d: Date) => d.toISOString().split('T')[0];
    return `${format(oneWeekAgo)} ~ ${format(now)}`;
  }

  private getNextMonday(): string {
    const now = new Date();
    const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
    const nextMonday = new Date(now);
    nextMonday.setDate(now.getDate() + daysUntilMonday);
    return nextMonday.toISOString().split('T')[0];
  }

  private getCategoryEmoji(category: string): string {
    const emojiMap: Record<string, string> = {
      Ideas: '💡',
      'Q&A': '❓',
      Announcements: '📢',
      'Show and Tell': '🎨',
      General: '🤝',
      'Roadmap & Planning': '🚀',
    };
    return emojiMap[category] || '📝';
  }
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'generate';

  console.log(`\n🚀 Discussion Weekly Digest Generator`);
  console.log(`📅 Command: ${command}\n`);

  const digest = new DiscussionDigest();

  try {
    // Fetch discussions
    await digest.fetchDiscussions();

    // Calculate stats
    const stats = digest.calculateStats();
    console.log(`\n📊 Stats:`);
    console.log(`   - Discussions: ${stats.totalDiscussions}`);
    console.log(`   - Comments: ${stats.totalComments}`);
    console.log(`   - Contributors: ${stats.uniqueContributors}`);
    console.log(`   - Top Ideas: ${stats.topIdeas.length}`);
    console.log(`   - Top Q&A: ${stats.topQA.length}`);

    // Generate markdown
    const markdown = digest.generateMarkdown(stats);

    if (command === 'post') {
      // Post to discussions
      await digest.postDigest(markdown);
    } else {
      // Just generate (don't post)
      console.log('\n✅ Digest generated (use "post" command to publish)');
      console.log(markdown);
    }

    console.log('\n✅ Done!');
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { DiscussionDigest };
export type { Discussion, DigestStats };
