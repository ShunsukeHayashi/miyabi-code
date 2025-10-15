#!/usr/bin/env tsx
/**
 * Auto-Convert Popular Ideas to Issues
 *
 * Automatically converts Ideas with high reactions (👍 ≥ 5) to Issues
 * Part of Phase C: Discussions - Message Queue (Issue #139)
 *
 * Features:
 * - Checks Ideas category for high-reaction discussions
 * - Auto-converts to Issue with appropriate labels
 * - Links back to original Discussion
 * - Prevents duplicate conversions
 */

import { Octokit } from '@octokit/rest';

// ============================================================================
// Types
// ============================================================================

interface Idea {
  number: number;
  title: string;
  body: string;
  author: string;
  url: string;
  reactions: number;
  createdAt: string;
}

// ============================================================================
// Configuration
// ============================================================================

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPOSITORY = process.env.GITHUB_REPOSITORY || 'ShunsukeHayashi/miyabi-private';
const REACTION_THRESHOLD = parseInt(process.env.REACTION_THRESHOLD || '5', 10);
const [owner, repo] = REPOSITORY.split('/');

if (!GITHUB_TOKEN) {
  console.error('❌ GITHUB_TOKEN environment variable is required');
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

// ============================================================================
// GraphQL Queries
// ============================================================================

const IDEAS_QUERY = `
  query($owner: String!, $repo: String!) {
    repository(owner: $owner, name: $repo) {
      discussions(first: 100, orderBy: {field: CREATED_AT, direction: DESC}) {
        nodes {
          number
          title
          body
          author {
            login
          }
          url
          category {
            name
          }
          reactions(content: THUMBS_UP) {
            totalCount
          }
          createdAt
          labels(first: 10) {
            nodes {
              name
            }
          }
        }
      }
    }
  }
`;

// ============================================================================
// Auto-Converter
// ============================================================================

class IdeaAutoConverter {
  private ideas: Idea[] = [];

  /**
   * Fetch ideas from Ideas category
   */
  async fetchIdeas(): Promise<void> {
    console.log(`📥 Fetching ideas from "Ideas" category...`);

    try {
      const response: any = await octokit.graphql(IDEAS_QUERY, {
        owner,
        repo,
      });

      // Filter for Ideas category only
      const allDiscussions = response.repository.discussions.nodes;
      const ideasDiscussions = allDiscussions.filter((d: any) => d.category.name === 'Ideas');

      this.ideas = ideasDiscussions.map((d: any) => ({
        number: d.number,
        title: d.title,
        body: d.body || '',
        author: d.author.login,
        url: d.url,
        reactions: d.reactions.totalCount,
        createdAt: d.createdAt,
        labels: d.labels?.nodes?.map((l: any) => l.name) || [],
      }));

      console.log(`✅ Fetched ${this.ideas.length} ideas from "Ideas" category`);
    } catch (error) {
      console.error('❌ Failed to fetch ideas:', error);
      throw error;
    }
  }

  /**
   * Find ideas that qualify for auto-conversion
   */
  findQualifyingIdeas(): Idea[] {
    const qualifying = this.ideas.filter((idea: any) => {
      const hasEnoughReactions = idea.reactions >= REACTION_THRESHOLD;
      const notAlreadyConverted = !idea.labels?.includes('converted-to-issue');
      return hasEnoughReactions && notAlreadyConverted;
    });

    console.log(`\n🔍 Found ${qualifying.length} ideas qualifying for conversion (≥ ${REACTION_THRESHOLD} 👍)`);

    return qualifying;
  }

  /**
   * Convert an idea to an Issue
   */
  async convertToIssue(idea: Idea): Promise<number | null> {
    console.log(`\n🔄 Converting idea #${idea.number}: "${idea.title}"`);

    try {
      // Check if already converted (search for existing issues with discussion link)
      const existingIssues = await octokit.rest.search.issuesAndPullRequests({
        q: `repo:${REPOSITORY} is:issue "${idea.url}" in:body`,
      });

      if (existingIssues.data.total_count > 0) {
        console.log(`⚠️  Idea #${idea.number} already converted to Issue #${existingIssues.data.items[0].number}`);
        return null;
      }

      // Create Issue
      const issueBody = `## 💡 Idea from Community

${idea.body}

---

### 📊 Community Support
- 👍 **${idea.reactions} reactions** (auto-converted at ≥ ${REACTION_THRESHOLD})
- 👤 Original author: @${idea.author}
- 💬 [Original Discussion](${idea.url})

---

*🤖 Automatically converted by Discussion Bot (Issue #139 Phase C)*
`;

      const issue = await octokit.rest.issues.create({
        owner,
        repo,
        title: idea.title,
        body: issueBody,
        labels: ['enhancement', '📝from-discussion', '🤝community'],
      });

      console.log(`✅ Created Issue #${issue.data.number}`);

      // Comment on Discussion to notify conversion
      await this.commentOnDiscussion(idea.number, issue.data.number);

      return issue.data.number;
    } catch (error) {
      console.error(`❌ Failed to convert idea #${idea.number}:`, error);
      return null;
    }
  }

  /**
   * Comment on Discussion to notify conversion
   */
  private async commentOnDiscussion(discussionNumber: number, issueNumber: number): Promise<void> {
    try {
      // Note: GitHub Discussions API doesn't have a direct REST endpoint for comments yet
      // This is a placeholder - in production, use GraphQL mutation: addDiscussionComment
      console.log(`📝 Would comment on Discussion #${discussionNumber} about Issue #${issueNumber}`);

      // TODO: Implement GraphQL addDiscussionComment mutation
      /*
      const mutation = `
        mutation($discussionId: ID!, $body: String!) {
          addDiscussionComment(input: {discussionId: $discussionId, body: $body}) {
            comment {
              id
            }
          }
        }
      `;
      */
    } catch (error) {
      console.error(`⚠️  Failed to comment on discussion:`, error);
    }
  }

  /**
   * Run auto-conversion process
   */
  async run(): Promise<void> {
    console.log(`\n🚀 Auto-Convert Popular Ideas`);
    console.log(`📊 Reaction Threshold: ${REACTION_THRESHOLD} 👍\n`);

    // Fetch ideas
    await this.fetchIdeas();

    // Find qualifying ideas
    const qualifying = this.findQualifyingIdeas();

    if (qualifying.length === 0) {
      console.log('\n✅ No ideas qualify for auto-conversion at this time');
      return;
    }

    // Convert each qualifying idea
    console.log(`\n🔄 Converting ${qualifying.length} ideas to Issues...\n`);

    let converted = 0;
    for (const idea of qualifying) {
      const issueNumber = await this.convertToIssue(idea);
      if (issueNumber) {
        converted++;
      }
      // Rate limiting: wait 1 second between conversions
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(`\n✅ Conversion complete: ${converted}/${qualifying.length} ideas converted to Issues`);
  }
}

// ============================================================================
// CLI
// ============================================================================

async function main() {
  try {
    const converter = new IdeaAutoConverter();
    await converter.run();
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

export { IdeaAutoConverter };
