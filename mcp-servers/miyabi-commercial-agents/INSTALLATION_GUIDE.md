# Miyabi Commercial Agents - Installation Guide

**Version**: 1.0.0
**Last Updated**: 2025-11-19

---

## 🚀 Quick Installation (Recommended)

### Step 1: Verify Build

```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-commercial-agents

# Verify dist/ exists
ls -la dist/

# Should show:
# index.js
# license-validator.js
# agents/ directory
```

### Step 2: Generate Test License Key

For testing purposes, use this format:

```bash
# STARTER tier (2 agents)
export MIYABI_LICENSE_KEY="MIYABI-COMMERCIAL-STARTER-A1B2C3D4E5F6G7H8I9J0"

# PRO tier (5 agents) - RECOMMENDED FOR TESTING
export MIYABI_LICENSE_KEY="MIYABI-COMMERCIAL-PRO-X1Y2Z3A4B5C6D7E8F9G0"

# ENTERPRISE tier (6 agents)
export MIYABI_LICENSE_KEY="MIYABI-COMMERCIAL-ENTERPRISE-K1L2M3N4O5P6Q7R8S9T0"
```

### Step 3: Test Run (Optional)

```bash
# Set license key
export MIYABI_LICENSE_KEY="MIYABI-COMMERCIAL-PRO-X1Y2Z3A4B5C6D7E8F9G0"
export NODE_ENV="production"

# Test run
node dist/index.js

# Expected output:
# ✅ License validated: PRO tier
#    Machine ID: xxxxxxxxxxxxxxxx
# 🚀 Miyabi Commercial Agents Server
#    License: PRO tier
#    Version: 1.0.0
#    Agents: 6 (つぶやくん, 書くちゃん, 動画くん, 広める, 数える, 支える)
```

Press `Ctrl+C` to stop.

### Step 4: Add to Claude Desktop

Edit your Claude Desktop configuration:

```bash
open ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

Add this configuration:

```json
{
  "mcpServers": {
    "miyabi-commercial-agents": {
      "command": "node",
      "args": [
        "/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-commercial-agents/dist/index.js"
      ],
      "env": {
        "MIYABI_LICENSE_KEY": "MIYABI-COMMERCIAL-PRO-X1Y2Z3A4B5C6D7E8F9G0",
        "NODE_ENV": "production"
      }
    }
  }
}
```

**Important**: Replace `MIYABI-COMMERCIAL-PRO-X1Y2Z3A4B5C6D7E8F9G0` with your actual license key.

### Step 5: Restart Claude Desktop

```bash
# Kill all Claude processes
pkill -f "Claude"

# Reopen Claude Desktop
open -a "Claude"
```

### Step 6: Verify in Claude Code

Open a new Claude Code session and try:

```
Use the tsubuyakun_generate_sns_strategy tool to create an Instagram strategy for young professionals
```

---

## 🔑 License Tiers

### Available Tools by Tier

| Tool | STARTER | PRO | ENTERPRISE |
|------|---------|-----|------------|
| tsubuyakun_generate_sns_strategy | ✅ | ✅ | ✅ |
| kakuchan_generate_content | ✅ | ✅ | ✅ |
| dougakun_optimize_youtube | ❌ | ✅ | ✅ |
| hiromeru_create_marketing_plan | ❌ | ✅ | ✅ |
| kazoeru_analyze_data | ❌ | ✅ | ✅ |
| sasaeru_optimize_crm | ❌ | ❌ | ✅ |

### License Key Format

```
MIYABI-COMMERCIAL-{TIER}-{HASH}

where:
  {TIER} = STARTER | PRO | ENTERPRISE
  {HASH} = 20 character alphanumeric code
```

---

## 🧪 Testing Each Agent

### 1. つぶやくん (SNS Strategy) - All Tiers

```typescript
{
  "platform": "instagram",
  "audience": "Young professionals 25-35 interested in productivity",
  "goals": ["increase engagement", "grow followers"],
  "current_followers": 5000,
  "budget": 500
}
```

### 2. 書くちゃん (Content Creation) - All Tiers

```typescript
{
  "type": "blog",
  "topic": "Remote work productivity tips",
  "target_audience": "Remote workers and digital nomads",
  "tone": "friendly",
  "length": 1000,
  "keywords": ["remote work", "productivity", "work from home"]
}
```

### 3. 動画くん (YouTube) - PRO+

```typescript
{
  "channel_name": "Tech Review Channel",
  "niche": "technology reviews",
  "current_subscribers": 10000,
  "goals": ["monetization", "subscriber growth"]
}
```

### 4. 広める (Marketing) - PRO+

```typescript
{
  "product": "SaaS Project Management Tool",
  "target_market": "Small to medium tech companies",
  "budget": 50000,
  "duration_months": 6,
  "objectives": ["brand awareness", "lead generation"]
}
```

### 5. 数える (Analytics) - PRO+

```typescript
{
  "data_source": "Google Analytics",
  "metrics": ["users", "sessions", "conversion_rate"],
  "time_period": "last 30 days"
}
```

### 6. 支える (CRM) - ENTERPRISE

```typescript
{
  "company_name": "Acme Corporation",
  "industry": "Software",
  "size": "medium",
  "stage": "customer"
}
```

---

## 🛠️ Troubleshooting

### Error: License validation failed

**Cause**: Invalid or missing license key

**Solution**:
```bash
# Check environment variable
echo $MIYABI_LICENSE_KEY

# Verify format
# Should match: MIYABI-COMMERCIAL-{TIER}-{20 chars}
```

### Error: Feature requires higher tier

**Cause**: Attempting to use PRO/ENTERPRISE tool with STARTER license

**Solution**: Upgrade your license tier or use tier-appropriate tools

### Error: Server not starting

**Cause**: Missing dependencies or build issues

**Solution**:
```bash
cd /Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/miyabi-commercial-agents

# Rebuild
npm install
npm run build

# Verify
node dist/index.js
```

### Claude Desktop not loading server

**Cause**: Configuration syntax error

**Solution**:
1. Validate JSON syntax: https://jsonlint.com/
2. Check file paths are absolute
3. Verify Node.js is in PATH: `which node`

---

## 📊 Performance Optimization

### Recommended Settings

```json
{
  "env": {
    "MIYABI_LICENSE_KEY": "YOUR_KEY_HERE",
    "NODE_ENV": "production",
    "NODE_OPTIONS": "--max-old-space-size=512"
  }
}
```

### Memory Usage

- **Idle**: ~50MB
- **Active**: ~100MB
- **Peak**: ~200MB

---

## 🔐 Security Best Practices

### License Key Storage

**❌ Don't**:
- Commit license keys to Git
- Share license keys publicly
- Use same key across multiple machines (ENTERPRISE only supports multi-machine)

**✅ Do**:
- Store in environment variables
- Use secure credential management
- Rotate keys periodically

### Environment Security

```json
{
  "env": {
    "MIYABI_LICENSE_KEY": "${MIYABI_LICENSE_KEY}",
    "NODE_ENV": "production"
  }
}
```

Then set in shell:
```bash
echo 'export MIYABI_LICENSE_KEY="YOUR_KEY"' >> ~/.zshrc
source ~/.zshrc
```

---

## 📞 Support

### Getting Help

**License Issues**: sales@miyabi.tech
**Technical Issues**: support@miyabi.tech
**Documentation**: https://docs.miyabi.tech/commercial-agents

### Logs Location

```bash
# Claude Desktop logs
~/Library/Logs/Claude/

# MCP Server logs (stderr)
# Visible in Claude Desktop developer console
```

---

## ✅ Installation Checklist

- [ ] Node.js 18+ installed (`node --version`)
- [ ] Project built (`npm run build` completed)
- [ ] License key obtained
- [ ] Claude Desktop config updated
- [ ] Claude Desktop restarted
- [ ] Test tool call successful

---

**Happy Coding with Miyabi Commercial Agents! 🚀**
