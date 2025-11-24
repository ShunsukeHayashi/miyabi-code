---
document_metadata:
  title: "Lark Open Platform - Developer Documentation Context"
  version: "1.0.0"
  last_updated: "2025-01-20"
  source_type: "developer_documentation"
  language: ["en", "zh-CN", "ja"]
  extraction_confidence: 0.92
  platform: "Lark Open Platform"
  base_url: "https://open.larksuite.com"
  documentation_structure: "hierarchical"
---

# Lark Open Platform Documentation Context

## Platform Overview

### Core Purpose
Lark Open Platform provides comprehensive APIs and SDKs enabling developers to build applications that integrate with Lark's collaboration ecosystem. The platform supports both client-side and server-side development with extensive capabilities across messaging, documents, calendars, and more.

### Key Characteristics
- **Multi-language Support**: Documentation available in English, Chinese, and Japanese
- **Dual Architecture**: Separate client-docs and server-docs for different integration approaches
- **OpenAPI Standard**: RESTful API design with comprehensive OpenAPI specifications
- **MCP Integration**: Native Model Context Protocol support for AI agent interactions
- **ISV Support**: Multi-tenant architecture for Independent Software Vendor applications

## Documentation Structure (L1 Categories)

### 1. Client-Side Documentation
**URL**: `https://open.larksuite.com/document/client-docs/`
**Purpose**: Client-side integration guides, SDKs, and UI component documentation

#### L2 Subcategories
- **Introduction & Getting Started**
  - Platform capabilities overview
  - Quick start guides
  - Development environment setup
  - Authentication & authorization flows

- **H5 Applications**
  - H5 app development framework
  - WebView integration
  - JavaScript SDK usage
  - Mobile adaptation guidelines

- **Mini Programs**
  - Lark Mini Program development
  - Component library
  - API references
  - Lifecycle management

- **Desktop Integrations**
  - Desktop client APIs
  - Plugin development
  - Native capabilities access

- **UI Components & Design**
  - Component library documentation
  - Design system guidelines
  - Accessibility standards

### 2. Server-Side Documentation
**URL**: `https://open.larksuite.com/document/server-docs/`
**Purpose**: Server-side API references, webhooks, and backend integration guides

#### L2 Subcategories

##### 2.1 Core APIs

###### Messaging APIs (IM)
- **Message Management**
  - Send messages (text, rich text, interactive cards)
  - Message reactions and emoji
  - Message editing and deletion
  - Message forwarding
  - Batch operations

- **Chat Management**
  - Create and manage group chats
  - Chat member management
  - Chat settings and permissions
  - Chat avatar and description

- **Bot Development**
  - Bot creation and configuration
  - Event subscription
  - Message handling
  - Interactive cards
  - Command handlers

###### Document APIs (Docs/Docx)
- **Document CRUD Operations**
  - Create documents
  - Read document content
  - Update document structure
  - Delete documents
  - Document permissions

- **Document Structure**
  - Block-based architecture
  - Heading hierarchy
  - Text formatting
  - Tables and lists
  - Embedded content

- **Collaboration Features**
  - Real-time collaboration
  - Comment management
  - Version history
  - Document sharing

###### Base (Bitable) APIs
- **Table Operations**
  - Create and manage tables
  - Record CRUD operations
  - Field management
  - View management

- **Data Structure**
  - Field types and schemas
  - Record relationships
  - Filter and sort operations
  - Batch data operations

- **Advanced Features**
  - Formulas and computed fields
  - Data validation rules
  - Automation triggers

###### Calendar APIs
- **Event Management**
  - Create calendar events
  - Update event details
  - Event invitations
  - Recurring events

- **Calendar Operations**
  - Calendar listing
  - Calendar sharing
  - Availability checking
  - Time zone handling

###### Meeting Room APIs
- **Room Management**
  - List meeting rooms
  - Room availability
  - Room booking
  - Resource management

- **Booking Operations**
  - Create bookings
  - Modify reservations
  - Cancel bookings
  - Booking conflicts

###### Email APIs
- **Email Operations**
  - Send emails
  - Email threading
  - Attachment handling
  - Email templates

- **Mailbox Management**
  - Folder operations
  - Email search
  - Bulk operations

###### Approval (Workflow) APIs
- **Approval Flows**
  - Create approval instances
  - Approval routing
  - Multi-level approvals
  - Approval history

- **Form Management**
  - Custom approval forms
  - Field validation
  - Conditional logic

###### Attendance APIs
- **Attendance Records**
  - Clock in/out operations
  - Attendance reports
  - Leave management
  - Overtime tracking

- **Attendance Rules**
  - Schedule management
  - Shift assignments
  - Exception handling

##### 2.2 Platform Services

###### Authentication & Authorization
- **OAuth 2.0 Flow**
  - Authorization code flow
  - Implicit flow
  - Client credentials flow
  - Token refresh mechanisms

- **App Credentials**
  - App ID and App Secret management
  - Tenant access tokens
  - User access tokens
  - Token lifecycle

- **Permission Scopes**
  - Scope definitions
  - Permission levels
  - User consent flows

###### Event Subscriptions
- **Event Schema**
  - Event v1.0 (legacy)
  - Event v2.0 (current)
  - Event types and payloads
  - Event delivery guarantees

- **Webhook Configuration**
  - Endpoint setup
  - Event filtering
  - Retry policies
  - Signature verification

- **Encryption & Security**
  - AES encryption
  - Token verification
  - Challenge-response validation

###### User & Organization APIs
- **User Management**
  - User information retrieval
  - User search
  - Department structures
  - Employee directories

- **Organization Hierarchy**
  - Department operations
  - Role management
  - Custom attributes

##### 2.3 Advanced Features

###### Drive & File APIs
- **File Operations**
  - Upload files
  - Download files
  - File metadata
  - File permissions

- **Folder Management**
  - Folder hierarchy
  - Folder sharing
  - Move and copy operations

###### Search APIs
- **Content Search**
  - Full-text search
  - Filtered search
  - Search across types
  - Result ranking

###### Admin APIs
- **Tenant Management**
  - Tenant information
  - Configuration settings
  - Usage statistics

- **Audit Logs**
  - Activity tracking
  - Security events
  - Compliance reporting

### 3. MCP Integration Documentation
**URL**: `https://open.larksuite.com/document/uAjLw4CM/ukTMukTMukTM/mcp_integration/`
**Purpose**: Model Context Protocol integration for AI agent interactions

#### L2 Subcategories

##### 3.1 MCP Overview
- **What is MCP**
  - Model Context Protocol introduction
  - Benefits for AI integration
  - Use cases and scenarios
  - Architecture overview

- **Lark MCP Implementation**
  - Official lark-mcp package
  - NPM package: `@larksuiteoapi/lark-mcp`
  - Supported API coverage
  - Current limitations

##### 3.2 Getting Started with MCP
- **Prerequisites**
  - Node.js environment
  - Lark application creation
  - Required permissions
  - App credentials

- **Installation & Configuration**
  ```bash
  npx -y @larksuiteoapi/lark-mcp mcp -a <app_id> -s <app_secret> --domain https://open.larksuite.com
  ```

- **MCP Client Configuration**
  - JSON configuration format
  - Parameter specifications
  - Tool selection with `-t` parameter
  - Domain specification

##### 3.3 Authentication for MCP
- **App-level Authentication**
  - App credentials (App ID + App Secret)
  - Tenant access token flow
  - Domain selection (Feishu vs Lark)

- **User-level Authentication**
  - OAuth 2.0 login flow
  - User access token retrieval
  - Scope authorization
  - Callback URL configuration: `http://localhost:3000/callback`

- **Login Command**
  ```bash
  npx -y @larksuiteoapi/lark-mcp login -a cli_xxxx -s yyyyy --scope offline_access docx:document
  ```

##### 3.4 Available MCP Tools
- **Default Enabled APIs**
  - Common messaging operations
  - Basic document operations
  - Standard chat functions

- **Tool Selection**
  - Specific API selection via `-t` parameter
  - Preset configurations
  - Custom tool combinations
  - Examples:
    - `im.v1.message.create` - Send messages
    - `im.v1.message.list` - List messages
    - `im.v1.chat.create` - Create chats

##### 3.5 MCP Capabilities & Limitations
- **Supported Operations**
  - Message CRUD operations
  - Chat management
  - Document reading and importing
  - Calendar operations
  - User information retrieval

- **Current Limitations**
  - ⚠️ File upload/download not supported
  - ⚠️ Direct document editing not available (read-only + import only)
  - Domain restrictions (Feishu/Lark version compatibility)

##### 3.6 MCP Integration Patterns
- **Bot-triggered MCP**
  - Integrate MCP into Lark bots
  - Tool calls via bot conversations
  - Message-driven workflows
  - Event-triggered actions

- **Standalone MCP Services**
  - Independent MCP servers
  - External AI agent connections
  - Programmatic API access

##### 3.7 Configuration Guide
- **Advanced Configuration**
  - Custom API selection
  - Performance tuning
  - Error handling
  - Logging configuration

- **Deployment Scenarios**
  - Development environment
  - Production deployment
  - Multi-tenant setups
  - ISV applications

##### 3.8 Command Line Reference
- **Core Commands**
  - `mcp` - Start MCP server
  - `login` - User authentication
  - Configuration parameters
  - Environment variables

- **Common Parameters**
  - `-a, --app-id` - Application ID
  - `-s, --app-secret` - Application secret
  - `-t, --tools` - Tool selection
  - `--domain` - Platform domain
  - `--scope` - OAuth scopes

## API Design Patterns

### RESTful Principles
- **Resource-based URLs**: `/open-apis/{resource}/{version}/{action}`
- **HTTP Methods**: Standard GET, POST, PUT, DELETE operations
- **Status Codes**: Comprehensive HTTP status code usage
- **Pagination**: Cursor-based and page-based pagination support

### Versioning Strategy
- **API Version Format**: `v1`, `v2`, etc.
- **Backward Compatibility**: Version deprecation policies
- **Migration Guides**: Version upgrade documentation

### Authentication Patterns
- **Bearer Token**: `Authorization: Bearer {access_token}`
- **Tenant Token**: For app-level operations
- **User Token**: For user-specific operations

### Error Handling
- **Standard Error Response**:
  ```json
  {
    "code": 1000,
    "msg": "Error description",
    "data": {}
  }
  ```
- **Common Error Codes**: Documented error code reference
- **Retry Logic**: Exponential backoff recommendations

## SDK & Client Libraries

### Official SDKs
- **JavaScript/TypeScript SDK**
  - NPM package: `@larksuiteoapi/node-sdk`
  - Full API coverage
  - TypeScript support

- **Go SDK**
  - Package: `github.com/larksuite/oapi-sdk-go`
  - Complete API implementation
  - Event callback support

- **Python SDK**
  - PyPI package: `lark-oapi`
  - Pythonic API design
  - Async support

- **Java SDK**
  - Maven dependency
  - Spring Boot integration
  - Enterprise-ready

### Community SDKs
- **Go (chyroc/lark)**
  - Comprehensive API coverage
  - Event v2 support
  - ISV application support

- **Go (go-lark/lark)**
  - IM-focused implementation
  - HTTP middleware support
  - Webhook handling

### MCP SDK
- **@larksuiteoapi/lark-mcp**
  - Model Context Protocol implementation
  - AI agent integration
  - Command-line interface
  - OAuth 2.0 support

## Development Workflow

### Application Lifecycle
1. **Application Creation**
   - Register on Lark Open Platform
   - Configure app information
   - Set redirect URLs

2. **Development Phase**
   - Local testing with ngrok/similar tools
   - Event subscription setup
   - Permission configuration

3. **Testing & Debugging**
   - API testing tools
   - Event simulation
   - Error logging

4. **Deployment**
   - Production environment setup
   - Security hardening
   - Performance optimization

5. **Maintenance**
   - Monitoring and logging
   - Version updates
   - User feedback handling

### Best Practices
- **Security**
  - Never expose app secrets
  - Use HTTPS for all endpoints
  - Validate webhook signatures
  - Implement rate limiting

- **Performance**
  - Cache access tokens
  - Batch API requests where possible
  - Implement pagination for large datasets
  - Use webhooks instead of polling

- **Error Handling**
  - Implement retry logic with exponential backoff
  - Log all API errors
  - Provide meaningful error messages to users
  - Handle rate limiting gracefully

- **User Experience**
  - Minimize permission requests
  - Provide clear authorization descriptions
  - Handle token expiration transparently
  - Support offline mode where applicable

## Cross-References & Related Resources

### Internal Documentation Links
- Client Docs: `/document/client-docs/`
- Server Docs: `/document/server-docs/`
- MCP Integration: `/document/uAjLw4CM/ukTMukTMukTM/mcp_integration/`
- Getting Started: `/document/ukTMukTMukTM/ugzNzUjL4czM14CO3MTN/guide/getting-start`

### External Resources
- **GitHub Repositories**
  - Official MCP: `github.com/larksuite/lark-openapi-mcp`
  - Official Go SDK: `github.com/larksuite/oapi-sdk-go`
  - Community SDK (Go): `github.com/chyroc/lark`
  - Community SDK (Go): `github.com/go-lark/lark`

- **Developer Console**
  - Feishu: `https://open.feishu.cn`
  - Lark International: `https://open.larksuite.com`

### Related Topics
- Lark Help Center: `https://www.larksuite.com/hc/ja-JP/`
- API Rate Limits
- Data Privacy & Compliance
- Regional Differences (Feishu vs Lark)

## Platform Differences: Feishu vs Lark

### Domain Separation
- **Feishu (China)**: `open.feishu.cn`
- **Lark (International)**: `open.larksuite.com`

### Key Differences
- **Application Isolation**: Apps created in one platform cannot be used in the other
- **Feature Parity**: Core features are similar but release timing may differ
- **Compliance**: Different data residency and compliance requirements
- **Payment Systems**: Different payment and billing integrations

### MCP Configuration
```json
{
  "mcpServers": {
    "lark-mcp-cn": {
      "command": "npx",
      "args": ["-y", "@larksuiteoapi/lark-mcp", "mcp", "-a", "<app_id>", "-s", "<app_secret>", "--domain", "https://open.feishu.cn"]
    },
    "lark-mcp-intl": {
      "command": "npx",
      "args": ["-y", "@larksuiteoapi/lark-mcp", "mcp", "-a", "<app_id>", "-s", "<app_secret>", "--domain", "https://open.larksuite.com"]
    }
  }
}
```

## Common Use Cases & Examples

### 1. Send Message via MCP
**Scenario**: AI agent sends message to user/group
**Tool**: `im.v1.message.create`
**Authentication**: User access token (for personal chats) or tenant token (for bot messages)

### 2. Document Processing
**Scenario**: AI agent reads and processes Lark documents
**Capabilities**:
- Import documents for analysis
- Extract content and structure
- Read-only access to shared documents
**Limitation**: Direct editing not supported

### 3. Calendar Integration
**Scenario**: AI-powered scheduling assistant
**Operations**:
- Create calendar events
- Check availability
- Manage meeting invitations

### 4. Bot Development
**Scenario**: Interactive Lark bot with AI capabilities
**Components**:
- Event subscription for incoming messages
- MCP tools for advanced operations
- Interactive card responses
- Command parsing

### 5. Workflow Automation
**Scenario**: Automated approval workflows
**Integration Points**:
- Approval API for workflow management
- Messaging API for notifications
- Document API for form data

## Technical Specifications

### Rate Limits
- **Tenant Token APIs**: Varies by API (typically 100-1000 req/min)
- **User Token APIs**: Generally lower limits per user
- **Webhook Events**: Delivery guarantees with retry logic

### Data Formats
- **Request/Response**: JSON
- **Encoding**: UTF-8
- **Timestamp Format**: Unix timestamp (seconds) or ISO 8601

### Supported Environments
- **Server-side**: Node.js 14+, Go 1.16+, Python 3.7+, Java 8+
- **Client-side**: Modern browsers, iOS 10+, Android 5.0+
- **MCP**: Node.js 14+ (via npx)

## Conclusion

This context document provides a comprehensive hierarchical structure of the Lark Open Platform developer documentation, organized into:

1. **Client-side Documentation**: UI components, mini programs, H5 apps
2. **Server-side Documentation**: Core APIs (messaging, documents, calendar, etc.), platform services, advanced features
3. **MCP Integration**: Model Context Protocol for AI agent interactions

The structure enables AI systems to:
- Quickly locate relevant API documentation
- Understand the relationship between different API endpoints
- Access authentication and authorization patterns
- Reference SDK implementations and examples
- Navigate platform-specific considerations

For AI agents leveraging MCP, this document serves as a comprehensive context map to effectively interact with the Lark ecosystem while understanding current capabilities and limitations.

---

**Document Status**: Active
**Maintenance**: Regular updates as Lark Open Platform evolves
**Confidence Score**: 0.92
**Next Review**: 2025-02-20