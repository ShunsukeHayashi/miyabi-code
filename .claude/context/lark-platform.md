# Lark Platform Integration Context

**Priority**: ⭐⭐⭐⭐ (High - Load when Lark operations needed)
**Size**: ~2000 tokens
**Last Updated**: 2025-11-20
**Version**: 1.0.0

**Load When**: Lark API operations, MCP integration, Lark app development

---

## 🎯 Quick Reference

### Available MCP Tools

```yaml
messaging:
  - im.v1.message.create: "Send text/card messages"
  - im.v1.message.list: "Get message history"
  - im.v1.chat.create: "Create group chats"
  - im.v1.chatMembers.get: "List group members"

documents:
  - docx.v1.document.create: "Create Lark Docs"
  - docx.v1.document.block.create: "Add content blocks"
  - docx.v1.document.permission.create: "Manage doc permissions"

base_tables:
  - bitable.v1.app.create: "Create Base app"
  - bitable.v1.app_table.create: "Create table"
  - bitable.v1.app_table_record.batch_create: "Add records"
  - bitable.v1.app_role_member.create: "Grant permissions"

calendar:
  - calendar.v1.calendar_event.create: "Create events"
  - calendar.v1.calendar_event.list: "List events"
  - calendar.v1.calendar_event_attendee.list: "Get attendees"

authentication:
  - Tenant Token: "App-level operations (bot)"
  - User Token: "User-delegated operations (OAuth 2.0)"
```

### API Explorer Pattern

```
URL Format:
https://open.larksuite.com/api-explorer/{app_id}?apiName={action}&project={service}&resource={type}&version={v}

Query Parameters:
- apiName: create, list, get, update, delete, batch_*
- project: im, docx, bitable, calendar, contact, drive, approval, event
- resource: message, chat, document, record, event, user
- version: v1, v2, v4

Example:
?apiName=create&project=im&resource=message&version=v1
→ MCP Tool: im.v1.message.create
→ REST API: /open-apis/im/v1/messages
```

### MCP Tool Naming Scheme

```
Pattern: {project}.{version}.{resource}.{action}

Examples:
- im.v1.message.create
- bitable.v1.app_table_record.batch_create
- docx.v1.document.create
- calendar.v1.calendar_event.list

Source: Node SDK method naming
Reference: client.{project}.{version}.{resource}.{action}()
```

---

## 🏗️ Platform Architecture

### 4-Layer Architecture

```yaml
L1_presentation:
  - h5_web_apps: "WebView applications"
  - mini_programs: "Native-like apps"
  - bots: "Conversational agents"

L2_api:
  server_apis:
    - IM: "Messaging, chats, cards"
    - Docs: "Document collaboration"
    - Base: "Structured data/databases"
    - Calendar: "Events and meetings"

  client_apis:
    - JSAPI: "Device, media, UI, location"

L3_protocol:
  - REST: "https://open.larksuite.com/open-apis/{resource}/{version}/{action}"
  - MCP: "{project}.{version}.{resource}.{action}"
  - Webhooks: "Event v2.0 with encryption"

L4_infrastructure:
  - Feishu (China): "https://open.feishu.cn"
  - Lark (International): "https://open.larksuite.com"
```

### Authentication Flow

```yaml
tenant_access_token:
  use_case: "Bot operations, server-to-server"
  method: "App ID + App Secret"
  validity: "2 hours (auto-refresh)"
  mcp_support: true

user_access_token:
  use_case: "User-specific operations"
  method: "OAuth 2.0 authorization code flow"
  validity: "Variable (with refresh token)"
  mcp_support: true
  callback: "http://localhost:3000/callback"
```

---

## 🔧 Miyabi MCP Integration

### Available MCP Servers

```yaml
lark-mcp-enhanced:
  location: "mcp-servers/lark-mcp-enhanced"
  purpose: "Miyabi-customized Lark operations"
  features:
    - "Automatic permission management"
    - "Preset configurations"
    - "Simplified authentication"
  startup: "npm start"
  recommended_for: "Standard operations"

lark-openapi-mcp-enhanced:
  location: "mcp-servers/lark-openapi-mcp-enhanced"
  purpose: "Full OpenAPI + Genesis AI"
  features:
    - "All API coverage"
    - "Base app auto-generation"
    - "Advanced automation"
  startup: "yarn build && node dist/cli.js mcp"
  recommended_for: "Complex automations"

lark-wiki-mcp-agents:
  location: "mcp-servers/lark-wiki-mcp-agents"
  purpose: "Wiki-focused operations"
  features:
    - "Wiki management"
    - "Document automation"
  recommended_for: "Documentation projects"

miyabi-lark-dev-docs-mcp:
  location: "mcp-servers/miyabi-lark-dev-docs-mcp"
  purpose: "Authenticated docs crawler"
  features:
    - "Login-authenticated access"
    - "Chrome DevTools integration"
    - "Real-time documentation"
  tools:
    - "lark_dev_docs_read"
    - "lark_api_search"
    - "lark_dev_docs_navigate"
  recommended_for: "API research"
```

### Integration Patterns

```yaml
pattern_1_basic_notification:
  use_case: "Send notification to Lark group"
  mcp_tool: "im.v1.message.create"
  auth: "tenant_access_token"
  example:
    receive_id: "chat_12345"
    msg_type: "text"
    content: '{"text": "Build completed ✅"}'

pattern_2_interactive_card:
  use_case: "Send approval request"
  mcp_tool: "im.v1.message.create"
  auth: "user_access_token"
  msg_type: "interactive"
  example:
    receive_id: "user_67890"
    content:
      header: "Approval Request"
      elements:
        - type: "div"
          text: "Request from: John Doe"
        - type: "action"
          actions:
            - tag: "button"
              text: "Approve"
              value: "approve"

pattern_3_document_creation:
  use_case: "Auto-generate Lark Doc from analysis"
  mcp_tools:
    - "docx.v1.document.create"
    - "docx.v1.document.block.create"
  auth: "user_access_token"
  workflow:
    1: "Create document container"
    2: "Add structured blocks (heading, text, code)"
    3: "Set permissions"
    4: "Share with team"

pattern_4_data_sync:
  use_case: "Sync GitHub Issues to Lark Base"
  mcp_tools:
    - "bitable.v1.app.create"
    - "bitable.v1.app_table.create"
    - "bitable.v1.app_table_record.batch_create"
  auth: "tenant_access_token"
  workflow:
    1: "Create/locate Base app"
    2: "Define table schema"
    3: "Batch create records from Issues"
    4: "Grant team access"
```

---

## 🎨 Common Operations

### Send Text Message

```javascript
// MCP Tool: im.v1.message.create
{
  data: {
    receive_id: "chat_12345",
    msg_type: "text",
    content: JSON.stringify({
      text: "🎉 Deployment successful!"
    })
  },
  params: {
    receive_id_type: "chat_id"
  }
}
```

### Create Group Chat

```javascript
// MCP Tool: im.v1.chat.create
{
  data: {
    name: "Project Alpha Team",
    description: "Development team for Project Alpha",
    user_id_list: ["ou_123", "ou_456", "ou_789"],
    chat_type: "private"
  },
  params: {
    user_id_type: "open_id"
  }
}
```

### Create Lark Base Record

```javascript
// MCP Tool: bitable.v1.app_table_record.batch_create
{
  path: {
    app_token: "bascn1234567890",
    table_id: "tbl9876543210"
  },
  data: {
    records: [
      {
        fields: {
          "Issue Number": "#234",
          "Title": "Fix authentication bug",
          "Priority": "High",
          "Status": "In Progress"
        }
      }
    ]
  }
}
```

### Create Lark Document

```javascript
// MCP Tool: docx.v1.document.create
{
  data: {
    folder_token: "fldr_abc123",
    title: "Architecture Overview"
  }
}

// Then add content blocks
// MCP Tool: docx.v1.document.block.create
{
  path: {
    document_id: "doxcn_xyz789"
  },
  data: {
    children: [
      {
        block_type: "heading1",
        heading1: {
          elements: [{ text_run: { content: "System Architecture" } }]
        }
      },
      {
        block_type: "text",
        text: {
          elements: [{ text_run: { content: "This document describes..." } }]
        }
      }
    ]
  }
}
```

---

## 🚨 Error Handling

### Common Errors

```yaml
99991666:
  error: "Rate limit exceeded"
  solution: "Implement exponential backoff retry"
  pattern:
    - "Wait 1s, retry"
    - "Wait 2s, retry"
    - "Wait 4s, retry"

1000:
  error: "Internal error"
  solution: "Retry with same parameters"

230002:
  error: "Invalid access token"
  solution: "Refresh token and retry"

230011:
  error: "Permission denied"
  solution: "Check app permissions in Developer Console"

230003:
  error: "Tenant access token expired"
  solution: "Auto-refresh tenant token (2h validity)"
```

### Retry Pattern

```javascript
async function retryableRequest(fn, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isRetryable = [429, 500, 502, 503, 99991666].includes(error.code);
      if (!isRetryable || attempt === maxRetries - 1) throw error;

      const delay = 1000 * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

---

## 📚 Quick Lookup: API Categories

### IM (Instant Messaging)
```
Core: message, chat, reaction, pin, urgent
Actions: create, list, get, update, delete, reply
```

### Docs (Document Collaboration)
```
Core: document, block, comment, permission
Actions: create, read, update, batch_update
```

### Bitable (Base - Structured Data)
```
Core: app, table, record, field, view
Actions: create, list, get, update, batch_create, batch_update
```

### Calendar
```
Core: calendar, calendar_event, attendee, meeting_room
Actions: create, list, get, update, delete
```

### Contact (User & Org)
```
Core: user, department, role
Actions: get, list, search
```

### Approval (Workflow)
```
Core: instance, definition, comment
Actions: create, get, list, approve, reject
```

---

## 🔐 Security Best Practices

### Credential Management
```yaml
never_do:
  - "Hardcode App ID/Secret in code"
  - "Commit credentials to git"
  - "Log access tokens"
  - "Share credentials in chat"

always_do:
  - "Use environment variables"
  - "Store in secure vault (AWS Secrets Manager)"
  - "Rotate secrets regularly"
  - "Use different credentials per environment"
```

### Webhook Security
```yaml
signature_verification:
  algorithm: "SHA-256"
  input: "{timestamp}{nonce}{encryptKey}{body}"
  header: "X-Lark-Signature"

replay_protection:
  method: "Timestamp validation"
  window: "300 seconds (5 minutes)"
  calculation: "|now - event_timestamp| < 300"
```

---

## 🎯 Decision Tree: Which MCP Server?

```
Task Type?
├─ Basic Operations (message, chat, simple data)
│  └─ Use: lark-mcp-enhanced
│
├─ Complex Automation (Base app generation, advanced workflows)
│  └─ Use: lark-openapi-mcp-enhanced
│
├─ Documentation Management (Wiki, knowledge base)
│  └─ Use: lark-wiki-mcp-agents
│
└─ API Research (lookup documentation, explore APIs)
   └─ Use: miyabi-lark-dev-docs-mcp
```

---

## 📖 Additional Resources

### Official Documentation
```
Feishu (China): https://open.feishu.cn
Lark (International): https://open.larksuite.com
```

### Miyabi Internal
```
Complete Architecture: .lark/LARK_PLATFORM_COMPLETE_ARCHITECTURE.md
Application Framework: .lark/lark_application_construction_framework.md
Platform Context: .lark/lark_open_platform_context.md
```

### MCP Server Locations
```
/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/mcp-servers/
├── lark-mcp-enhanced/
├── lark-openapi-mcp-enhanced/
├── lark-wiki-mcp-agents/
└── miyabi-lark-dev-docs-mcp/
```

---

## 💡 Usage Tips

### Claude Code Integration
1. **Check MCP Availability**: `claude mcp list | grep lark`
2. **Load This Context**: Auto-loaded when "lark" keyword detected
3. **Tool Discovery**: Reference MCP tool naming scheme
4. **Error Handling**: Use retry patterns for transient failures

### Optimal Workflow
1. Identify task (notification, document, sync, etc.)
2. Choose appropriate MCP server
3. Reference integration pattern
4. Construct MCP tool call with correct parameters
5. Handle errors with retry logic
6. Verify result

### Performance Tips
- **Batch Operations**: Use batch_create for multiple records
- **Caching**: Cache frequently-accessed data (user profiles, dept structure)
- **Rate Limits**: Implement request throttling
- **Webhooks**: Use webhooks instead of polling

---

**END OF LARK PLATFORM CONTEXT**

**Related Context Modules**:
- `core-rules.md` - MCP First Approach
- `external-deps.md` - MCP Server Configuration
- `protocols.md` - Communication Protocols

**When to Load**: Any task involving Lark API, MCP tools, or Lark application development
