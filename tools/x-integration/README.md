# X (Twitter) Integration Tools

This directory contains scripts for X/Twitter integration with the Miyabi platform.

## 📁 Scripts Overview

| Script | Purpose | Dependencies |
|--------|---------|--------------|
| `analyze-x-account.mjs` | Account analytics & engagement tracking | `TWITTER_BEARER_TOKEN` |
| `analyze-x-grok.mjs` | Grok integration for AI-powered analysis | TBD |
| `extract-post-style.mjs` | Style analysis of @The_AGI_WAY posts | `TWITTER_BEARER_TOKEN` |
| `post-to-x.mjs` | Post content via Miyabi commercial agents | Miyabi TsubuyakunAgent |
| `test-x-post.mjs` | Direct X API v2 posting with OAuth 1.0a | OAuth credentials |

## 🔑 Required Environment Variables

```bash
# For read-only operations (analytics, style extraction)
export TWITTER_BEARER_TOKEN="your_bearer_token_here"

# For posting operations (OAuth 1.0a)
export TWITTER_API_KEY="your_api_key"
export TWITTER_API_SECRET="your_api_secret"
export TWITTER_ACCESS_TOKEN="your_access_token"
export TWITTER_ACCESS_SECRET="your_access_secret"
```

## 🚀 Usage Examples

### Account Analysis
```bash
node analyze-x-account.mjs
```
- Fetches user metrics and recent tweets
- Calculates engagement scores
- Shows top performing posts

### Style Extraction
```bash
node extract-post-style.mjs
```
- Analyzes @The_AGI_WAY posting patterns
- Extracts high-engagement content styles
- Useful for content strategy

### Direct Posting
```bash
node test-x-post.mjs
```
- Tests OAuth 1.0a authentication
- Posts directly to X via API v2
- Includes error handling and verification

### Agent-based Posting
```bash
node post-to-x.mjs
```
- Uses Miyabi's TsubuyakunAgent
- Integrates with the broader agent ecosystem
- Supports dry-run mode

## 🔧 Integration with Miyabi

These tools integrate with the larger Miyabi autonomous development platform:

- **TsubuyakunAgent**: Social media posting agent
- **Analytics Pipeline**: Feeds into business intelligence agents
- **Content Strategy**: Supports marketing and growth agents
- **Community Management**: Automated engagement and monitoring

## 🛡️ Security Notes

- All credentials use environment variables (no hardcoded tokens)
- Bearer tokens for read operations only
- OAuth 1.0a for write operations with proper signature generation
- Rate limiting and error handling included

---

*Part of the Miyabi AntiGravity Edition autonomous development platform*