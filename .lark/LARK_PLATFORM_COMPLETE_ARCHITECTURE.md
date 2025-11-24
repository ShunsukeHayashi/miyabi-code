# Lark Open Platform - Complete Architecture & Context Engineering

**Version**: 2.0.0
**Created**: 2025-11-20
**Purpose**: Comprehensive architectural analysis and context engineering for Lark Open Platform
**Data Sources**: Official documentation crawling + Framework analysis + MCP integration patterns

---

## 📊 Executive Summary

This document provides **complete architectural mapping** of the Lark Open Platform ecosystem, integrating:

1. **Platform Documentation Structure** - Hierarchical organization of all developer resources
2. **API Architecture Patterns** - RESTful design, query parameters, and endpoint conventions
3. **MCP Integration Layer** - Model Context Protocol for AI agent interactions
4. **Application Development Framework** - Generalized patterns and lifecycle management
5. **Implementation Patterns** - Proven architectural approaches for Lark applications

**Target Audience**: AI agents, developers, and systems requiring deep contextual understanding of Lark APIs

---

## Part 1: Platform Architecture Overview

### 1.1 Lark Ecosystem Topology

```yaml
lark_platform_architecture:

  L1_presentation_layer:
    client_applications:
      - h5_web_apps: "Browser-based WebView applications"
      - mini_programs: "Lightweight native-like experiences"
      - desktop_plugins: "Native Lark client extensions"

    developer_tools:
      - api_explorer: "Interactive API testing and documentation"
      - message_card_builder: "Drag-and-drop card designer"
      - developer_console: "App management and configuration"

  L2_api_layer:
    server_apis:
      core_apis:
        - im_messaging: "Messages, chats, bots, cards"
        - docs_docx: "Document CRUD and collaboration"
        - bitable_base: "Structured data and databases"
        - calendar: "Events, meetings, availability"
        - approval: "Workflow and approval flows"

      platform_services:
        - authentication: "OAuth 2.0 and token management"
        - event_subscriptions: "Webhook event delivery"
        - user_org: "User and organization APIs"

    client_apis:
      jsapi:
        - device: "Clipboard, system info, network, sensors"
        - media: "Image, video capture and processing"
        - open_api: "User info, authorization, chat, files"
        - ui: "Toast, modal, actionsheet components"
        - location: "Geolocation and maps"

  L3_protocol_layer:
    rest_api:
      endpoint_format: "https://open.larksuite.com/open-apis/{resource}/{version}/{action}"
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
      auth: "Bearer token (tenant_access_token | user_access_token)"

    mcp_protocol:
      tool_format: "{biz}.{version}.{resource}.{method}"
      transport: "MCP (Model Context Protocol)"
      auth: "Application credentials + OAuth 2.0"

    webhooks:
      event_v2: "Encrypted, signed webhook payloads"
      delivery: "At-least-once with retries"
      security: "Signature verification + challenge-response"

  L4_infrastructure_layer:
    regional_deployment:
      feishu_china: "https://open.feishu.cn"
      lark_international: "https://open.larksuite.com"

    multi_tenancy:
      tenant_isolation: "App ID scoped resources"
      data_residency: "Region-specific data storage"
```

---

## Part 2: API Explorer Architecture

### 2.1 Query Parameter Patterns

The API Explorer uses a **multi-dimensional parameter system** to navigate the API documentation:

```yaml
api_explorer_url_structure:
  base_url: "https://open.larksuite.com/api-explorer/{app_id}"

  query_parameters:

    apiName:
      description: "Specific API method name"
      format: "Lowercase action (create, list, get, update, delete)"
      examples:
        - "list"
        - "create"
        - "get"
        - "update"
        - "batch_delete"

      cardinality: "100+ unique values across all APIs"

    project:
      description: "API domain/service category"
      format: "Lowercase service identifier"
      examples:
        - "im" # Instant Messaging
        - "docx" # Documents
        - "bitable" # Base (tables)
        - "calendar"
        - "event" # Event subscriptions
        - "contact" # User and org management
        - "drive" # File storage
        - "approval" # Workflows

      cardinality: "20+ top-level projects"

    resource:
      description: "Specific resource type within project"
      format: "Lowercase resource name (may include underscores)"
      examples:
        - "message" # (project: im)
        - "chat" # (project: im)
        - "document" # (project: docx)
        - "record" # (project: bitable)
        - "event" # (project: calendar)
        - "outbound_ip" # (project: event)
        - "user" # (project: contact)

      cardinality: "200+ resource types across all projects"

    version:
      description: "API version identifier"
      format: "v{major_version}"
      examples:
        - "v1"
        - "v2"
        - "v4" # Some APIs skip versions

      cardinality: "Typically v1, occasionally v2/v4"

combinatorial_patterns:
  total_possible_combinations: "apiName × project × resource × version"
  estimated_unique_apis: "500-1000 documented APIs"

  pattern_examples:
    send_message:
      url: "?apiName=create&project=im&resource=message&version=v1"
      mcp_tool: "im.v1.message.create"
      rest_endpoint: "/open-apis/im/v1/messages"

    list_chat_members:
      url: "?apiName=get&project=im&resource=chatMembers&version=v1"
      mcp_tool: "im.v1.chatMembers.get"
      rest_endpoint: "/open-apis/im/v1/chats/:chat_id/members"

    create_bitable_record:
      url: "?apiName=batch_create&project=bitable&resource=record&version=v1"
      mcp_tool: "bitable.v1.app_table_record.batch_create"
      rest_endpoint: "/open-apis/bitable/v1/apps/:app_token/tables/:table_id/records/batch_create"

parameter_discovery_strategy:
  approach_1_documentation_crawl:
    method: "Iterate through official API docs"
    coverage: "90%+ of public APIs"
    limitation: "Misses beta/preview APIs"

  approach_2_mcp_tool_enumeration:
    method: "Query MCP tool list via @larksuiteoapi/lark-mcp"
    command: "npx -y @larksuiteoapi/lark-mcp mcp -a {app_id} -s {secret}"
    benefit: "Real-time list of supported APIs"

  approach_3_sdk_introspection:
    method: "Inspect official SDK method names"
    sdks:
      - "@larksuiteoapi/node-sdk" # Node.js
      - "lark-oapi" # Python
      - "github.com/larksuite/oapi-sdk-go" # Go
```

---

## Part 3: Documentation Hierarchy (Detailed)

### 3.1 Client Documentation Structure

Based on crawled content from `https://open.larksuite.com/document/client-docs/intro`:

```yaml
client_docs:
  introduction:
    title: "Lark Open Capabilities Introduction"
    url: "/document/client-docs/intro"

    key_concepts:
      platform_value_proposition:
        - "Hub of information and entry point for businesses"
        - "Integrates with existing IT ecosystems"
        - "Enhances digital efficiency in enterprises"
        - "All-in-one collaborative platform"

      use_cases:
        bots_and_message_cards:
          description: "Efficient business message circulation"
          capabilities:
            - "Integrate with Lark Calendar, Approval, Docs"
            - "Aggregate notifications from third-party systems"
            - "Rich text content with interactive components"
            - "Direct in-chat operations (approval, voting, alerts)"

          tools:
            - "Message Card Builder (drag-and-drop design)"
            - "Rich template library"
            - "One-click activation"

        open_capabilities:
          description: "Rich API access for diverse integration needs"
          modules:
            - "Lark Docs"
            - "Multidimensional spreadsheets (Base)"
            - "Address books"
            - "Messages"
            - "Tasks"
            - "User cards"

      application_types:
        bots:
          description: "Interact with users in chat"
          capabilities:
            - "Automatically send messages"
            - "Respond to user messages"
            - "Manage groups"
          dev_tools: "Purely server-side development, Message Card Builder provided"

        h5_web_apps:
          description: "Quick integration of existing web applications"
          capabilities:
            - "Frequent content updates"
            - "Existing H5 app migration"
            - "Users access without additional login"
          dev_tools: "Lark Developer Tools IDE"

        workbench_blocks:
          description: "Add data charts and information to workbench"
          capabilities:
            - "Data visualization"
            - "Text and image content"
          dev_tools: "Lark Developer Tools IDE"

        gadgets_miniapps:
          description: "Native-level experience in Lark client"
          capabilities:
            - "Complex modules"
            - "Call phone/Lark native functions"
            - "Smooth user experience"
          dev_tools: "Lark Developer Tools IDE"

    developer_support:
      technical_support: "Technical support button on all official pages"
      document_feedback: "Direct text selection feedback to authors"
      changelog: "Explore newly released capabilities"
      developer_community: "Access to beta testing and community connections"

  jsapi_documentation:
    title: "JSAPI Overview"
    url: "/document/client-docs/h5/"

    api_categories:
      device_apis:
        clipboard:
          - getClipboardData: "Get system clipboard content (Android 3.41+, iOS 3.41+, PC 3.41+)"
          - setClipboardData: "Set system clipboard content (Android 3.41+, iOS 3.41+, PC 3.41+)"

        system_info:
          - getSystemInfo: "Get system info (Android 3.43+, iOS 3.43+, PC 3.47+)"
          - getSystemInfoSync: "Get system info synchronously (Android 3.43+, iOS 3.43+, PC 3.47+)"

        network:
          - getNetworkType: "Get device network type (Android 3.44+, iOS 3.44+, PC 3.47+)"

        wifi:
          - getConnectedWifi: "Get currently connected WiFi (Android 3.44+, iOS 3.44+, PC 3.47+)"
          - getWifiStatus: "Request WiFi on/off state (Android 3.44+, iOS 3.44+)"
          - onGetWifiList: "Listen to WiFi list (Android 3.44+, iOS 3.44+)"
          - offGetWifiList: "Cancel WiFi list listening (Android 3.44+, iOS 3.44+)"

        sensors:
          accelerometer:
            - startAccelerometer: "Start listening to accelerometer (Android 3.44+, iOS 3.44+)"
            - stopAccelerometer: "Stop listening to accelerometer (Android 3.44+, iOS 3.44+)"
            - onAccelerometerChange: "On accelerometer data change (Android 3.44+, iOS 3.44+)"

          compass:
            - startCompass: "Start listening compass (Android 3.44+, iOS 3.44+)"
            - stopCompass: "Stop listening compass (Android 3.44+, iOS 3.44+)"

        screen:
          - getScreenBrightness: "Get screen brightness (Android 3.44+, iOS 3.44+)"
          - setScreenBrightness: "Set screen brightness (Android 3.44+, iOS 3.44+)"
          - setKeepScreenOn: "Keep screen on (Android 3.44+, iOS 3.44+)"
          - onUserCaptureScreen: "Listen to capture screen event (Android 3.44+, iOS 3.44+)"
          - offUserCaptureScreen: "Cancel screen capture event listening (Android 3.44+, iOS 3.44+)"

        phone_vibrate:
          - makePhoneCall: "Make phone call (Android 3.44+, iOS 3.44+)"
          - vibrateLong: "Vibrate long (Android 3.44+, iOS 3.44+)"
          - vibrateShort: "Vibrate short (Android 3.44+, iOS 3.44+)"

        scan_nfc:
          - scanCode: "Scan code (Android 3.44+, iOS 3.44+)"
          - nfcConnect: "Connect NfcA type tags (Android 3.41+)"
          - nfcClose: "Disconnect NfcA tag (Android 3.41+)"
          - nfcGetSak: "Get SAK information (Android 3.41+)"
          - nfcGetAtqa: "Get ATQA information (Android 3.41+)"

      media_apis:
        image:
          - chooseImage: "Choose image from album or take photo (Android 3.44+, iOS 3.44+, PC 3.47+)"
          - getImageInfo: "Get image info (Android 3.44+, iOS 3.44+, PC 3.47+)"
          - compressImage: "Compress image (Android 3.44+, iOS 3.44+, PC 3.47+)"
          - saveImageToPhotosAlbum: "Save image to photos album (Android 3.44+, iOS 3.44+, PC 3.47+)"

        video:
          - chooseVideo: "Choose video from album or shoot video (Android 3.44+, iOS 3.44+, PC 3.47+)"
          - saveVideoToPhotosAlbum: "Save video to photos album (Android 3.44+, iOS 3.44+, PC 3.47+)"

      open_apis:
        user_info:
          - getUserInfo: "Get current logged in user info (Android 3.44+, iOS 3.44+, PC 3.44+)"

        authorization:
          - authorize: "Request authorization (Android 3.44+, iOS 3.44+, PC 3.44+)"

        email:
          - mailto: "Send email (Android 3.44+, iOS 3.44+)"

        device_credential:
          - startDeviceCredential: "Open device credential (Android 3.44+, iOS 3.44+)"

        watermark:
          - checkWatermark: "Check if showing global watermark (Android 3.44+, iOS 3.44+, PC 3.47+)"

        chat:
          - getChatInfo: "Get chat info (Android 3.44+, iOS 3.44+, PC 3.44+)"
          - chooseChat: "Choose chat from chat list (Android 3.44+, iOS 3.44+, PC 3.44+)"

        setting:
          - getSetting: "Get setting (Android 3.44+, iOS 3.44+, PC 3.44+)"
          - openSetting: "Open setting (Android 3.44+, iOS 3.44+, PC 3.44+)"

        navigation:
          - openSchema: "Navigate to certain URL (Android 3.44+, iOS 3.44+, PC 3.47+)"

        file:
          - docsPicker: "Open docs picker (Android 3.44+, iOS 3.44+, PC 3.47+)"
          - filePicker: "Open file picker (Android 3.44+, iOS 3.44+, PC 3.47+)"
          - saveFile: "Save file to local path (Android 3.44+, iOS 3.44+, PC 3.47+)"
          - openDocument: "Open document in new page (Android 3.44+, iOS 3.44+, PC 3.44+)"

      ui_apis:
        - hideToast: "Hide toast (Android 3.44+, iOS 3.44+, PC 3.47+)"
        - showToast: "Show toast (Android 3.44+, iOS 3.44+, PC 3.47+)"
        - showActionSheet: "Show actionsheet (Android 3.44+, iOS 3.44+)"
        - showModal: "Show modal (Android 3.44+, iOS 3.44+, PC 3.47+)"
        - showPrompt: "Show prompt supporting user input (Android 3.44+, iOS 3.44+, PC 3.47+)"

      location_apis:
        - getLocation: "Get device current location (Android 3.44+, iOS 3.44+)"
        - chooseLocation: "Open map to choose location (Android 3.44+, iOS 3.44+)"
        - openLocation: "Use builtin map to open location (Android 3.44+, iOS 3.44+)"

    legacy_biz_apis:
      disclaimer: "The biz version interface will no longer be maintained"
      apis:
        - "biz.navigation.close"
        - "biz.util.previewImage"
        - "biz.util.openLink"
        - "biz.util.copyText"
        - "biz.util.share"
        - "biz.util.scan"
        - "device.geolocation.*"
        - "device.notification.*"
        - "device.base.*"
        - "device.screen.*"
```

### 3.2 Server Documentation Structure

Based on crawled content from `https://open.larksuite.com/document/server-docs/getting-started/getting-started`:

```yaml
server_docs:
  api_call_guide:
    title: "Process overview"
    url: "/document/server-docs/getting-started/getting-started"

    restful_architecture:
      url_format: "https://open.larksuite.com/open-apis/{resource}/{version}/{action}"
      style: "RESTful"

    calling_process:
      step_1_create_apps:
        description: "Create custom apps or store apps in Developer Console"
        app_types:
          custom_app: "For internal enterprise use"
          store_app: "For ISV marketplace (requires ISV qualification)"
        reference: "How to join Lark Open Platform as an ISV"

      step_2_obtain_access_token:
        description: "Get access token for API authorization"
        token_types:
          tenant_access_token: "App-level access (no user context)"
          user_access_token: "User-delegated access via OAuth 2.0"

        usage: "Include in HTTP header: Authorization: Bearer {token}"
        permissions: "Represents resource access scope defined by token type"

      step_3_apply_for_scopes:
        description: "Request API permissions and sensitive field access"
        requirements:
          - "Apply for API call scope"
          - "Apply for sensitive field access (if applicable)"

        approval: "Some scopes require admin approval"

      step_4_configure_data_permissions:
        description: "(Optional) Configure data access permissions"
        applicable_to:
          - "Contact APIs"
          - "Lark HR Enterprise Edition APIs"

        process:
          - "Configure data permissions in Developer Console"
          - "Submit for review"
          - "Permissions take effect after approval"

        consequence_if_skipped: "Authorization error on API invocation"

      step_5_set_ip_whitelist:
        description: "(Optional) Enhance app security with IP restrictions"
        behavior:
          - "Only whitelisted IPs can call APIs"
          - "Non-whitelisted requests are rejected"

      step_6_call_api:
        description: "Invoke open APIs after completing setup"
        reference: "API documentation for specific function details"

  core_api_categories:
    im_messaging:
      category: "Instant Messaging"
      resources:
        - messages
        - chats
        - reactions
        - pins
        - urgents
        - chat_tabs

      key_capabilities:
        - "Send messages (text, rich text, cards)"
        - "Message reactions and emoji"
        - "Message editing and deletion"
        - "Message forwarding"
        - "Batch operations"
        - "Create and manage group chats"
        - "Chat member management"
        - "Chat settings and permissions"

    docs_collaboration:
      category: "Document Management"
      resources:
        - documents
        - blocks
        - comments
        - permissions
        - versions

      key_capabilities:
        - "Create, read, update, delete documents"
        - "Block-based architecture manipulation"
        - "Real-time collaboration support"
        - "Comment management"
        - "Version history access"
        - "Document sharing and permissions"

    bitable_base:
      category: "Structured Data (Tables/Databases)"
      resources:
        - apps
        - tables
        - records
        - fields
        - views

      key_capabilities:
        - "Create and manage tables"
        - "Record CRUD operations"
        - "Field type management"
        - "View management"
        - "Formulas and computed fields"
        - "Data validation rules"
        - "Automation triggers"

    calendar:
      category: "Calendar and Events"
      resources:
        - calendars
        - events
        - attendees
        - meeting_rooms

      key_capabilities:
        - "Create calendar events"
        - "Update event details"
        - "Event invitations"
        - "Recurring events"
        - "Calendar sharing"
        - "Availability checking"
        - "Time zone handling"

    approval_workflow:
      category: "Workflow and Approvals"
      resources:
        - instances
        - definitions
        - comments

      key_capabilities:
        - "Create approval instances"
        - "Approval routing logic"
        - "Multi-level approvals"
        - "Approval history tracking"
        - "Custom approval forms"
        - "Field validation"
        - "Conditional logic"

    authentication:
      category: "Authentication and Authorization"
      mechanisms:
        oauth_2_0:
          flows:
            - "Authorization code flow"
            - "Implicit flow"
            - "Client credentials flow"

          token_lifecycle:
            - "Token generation"
            - "Token refresh"
            - "Token revocation"

        app_credentials:
          - "App ID and App Secret"
          - "Tenant access tokens"
          - "User access tokens"

        permission_scopes:
          - "Scope definitions per API"
          - "Permission levels (read, write, admin)"
          - "User consent flows"

    event_subscriptions:
      category: "Webhook Events"
      versions:
        event_v1_0: "(Legacy) Old event schema"
        event_v2_0: "(Current) Enhanced event structure"

      capabilities:
        - "Event type filtering"
        - "Webhook endpoint configuration"
        - "Retry policies"
        - "Signature verification"
        - "AES encryption"
        - "Challenge-response validation"

      delivery_guarantees:
        - "At-least-once delivery"
        - "Exponential backoff on failures"

    user_organization:
      category: "User and Organization Management"
      resources:
        - users
        - departments
        - roles
        - custom_attrs

      key_capabilities:
        - "User information retrieval"
        - "User search"
        - "Department structures"
        - "Employee directories"
        - "Role management"
        - "Custom attributes"
```

### 3.3 MCP Integration Documentation

Based on crawled content from `https://open.larksuite.com/document/uAjLw4CM/ukTMukTMukTM/mcp_integration/mcp_introduction`:

```yaml
mcp_integration:
  overview:
    title: "OpenAPI MCP overview"
    url: "/document/uAjLw4CM/ukTMukTMukTM/mcp_integration/mcp_introduction"

    purpose:
      description: "Quickly integrate AI agents with Lark's open capabilities"
      enabled_scenarios:
        - "Document processing automation"
        - "Conversation management"
        - "Calendar scheduling"
        - "Base app management"

    protocol: "Model Context Protocol (MCP)"
    connection_target: "Lark Open Platform"

  features:
    command_line_interface:
      description: "Simple CLI for quick configuration and startup"
      commands:
        - "npx -y @larksuiteoapi/lark-mcp mcp -a {app_id} -s {app_secret}"
        - "npx -y @larksuiteoapi/lark-mcp login -a {app_id} -s {app_secret} --scope {scopes}"

    configuration_flexibility:
      description: "Supports various configuration methods"
      methods:
        - "Command-line parameters"
        - "Environment variables"
        - "Configuration files"

    ai_tool_integration:
      compatible_tools:
        - "Trae"
        - "Cursor"
        - "Claude (Claude Code)"

    authentication:
      application_access:
        token_type: "tenant_access_token"
        method: "Automatic retrieval after app info configuration"
        use_case: "App-level operations without user context"

      user_access:
        token_type: "user_access_token"
        method: "OAuth 2.0 login flow with MCP CLI"
        callback_url: "http://localhost:3000/callback"
        features:
          - "User authentication"
          - "Automatic token refresh"
        use_case: "User-delegated operations"

  typical_use_cases:
    case_1_initialize_project_base:
      scenario: "Initialize Project Management Base apps"
      required_app_capability: "Bot"
      required_permissions:
        - "View, comment, edit and manage Base apps"

    case_2_create_group_send_card:
      scenario: "Create Group Chat, Add Members and Send Lark Card"
      required_app_capability: "Bot"
      required_permissions:
        - "Retrieve and update group information"
        - "Send messages as an application"
      additional_requirements:
        - "All members in group must be within app visibility scope"
      configuration_reference: "Configure Application Availability"

    case_3_summarize_messages_to_base:
      scenario: "Summarize Group Messages and Record in Base apps"
      required_app_capability: "Bot"
      required_permissions:
        - "Retrieve all messages in the group (sensitive permission)"
        - "Create Base apps"
        - "Add new data tables"
        - "Add new records"
      additional_requirements:
        - "Bot must be in the group chat"

    case_4_grant_base_permissions:
      scenario: "Grant Base apps Permissions to Group Members"
      required_app_capability: "Enable bot capability"
      required_permissions:
        - "View group members"
        - "View, comment, edit and manage Base apps"
      additional_requirements:
        - "Bot in group chat"
        - "Bot has management permissions for the Base apps"

  supported_openapi:
    discovery_method_1:
      description: "Check tools list on Lark Open Platform"
      url: "https://open.larksuite.com/document/uAjLw4CM/ukTMukTMukTM/mcp_integration/tools"

    discovery_method_2:
      description: "Check API documentation for 'Try it out' button"
      example: "Send Message API shows 'Try it out' button"
      indication: "API is available within MCP Tool"

    limitations:
      - "APIs in grayscale (Limited access) are temporarily not supported"
      - "Image or file upload/download APIs are temporarily not supported"

  mcp_tool_naming_scheme:
    format: "{biz}.{version}.{resource}.{method}"
    consistency: "Matches server-side Node SDK method naming"

    discovery_via_sdk:
      example_api: "Send Message"
      sdk_code_pattern: "client.im.v1.message.create(...)"
      mcp_tool_name: "im.v1.message.create"

    examples:
      send_message:
        node_sdk: "client.im.v1.message.create()"
        mcp_tool: "im.v1.message.create"

      get_chat_members:
        node_sdk: "client.im.v1.chatMembers.get()"
        mcp_tool: "im.v1.chatMembers.get"

      batch_create_records:
        node_sdk: "client.bitable.v1.app_table_record.batch_create()"
        mcp_tool: "bitable.v1.app_table_record.batch_create"
```

---

## Part 4: Application Development Framework

### 4.1 Application Taxonomy and Architecture Patterns

```yaml
application_types:
  client_applications:
    h5_web_apps:
      runtime: "Browser engine (WebView)"
      ui_framework: "HTML/CSS/JavaScript"
      suitable_patterns:
        - "Layered Architecture (MVC)"
        - "Event-Driven (if integrated with webhooks)"

      deployment:
        hosting: "CDN (CloudFront, Cloudflare)"
        auth: "OAuth 2.0 user authentication"
        lark_integration: "JSAPI bridge for native features"

    mini_programs:
      runtime: "Lark Mini Program runtime"
      ui_framework: "Lark Component Library"
      suitable_patterns:
        - "MVVM (Model-View-ViewModel)"
        - "Component-Based Architecture"

      deployment:
        hosting: "Lark platform (2MB package limit)"
        performance: "Critical optimization required"

    desktop_plugins:
      runtime: "Desktop client process"
      ui_framework: "Native + Web hybrid"
      suitable_patterns:
        - "Plugin Architecture"
        - "Event-Driven"

  server_applications:
    bots:
      architecture: "Event-driven microservice"
      primary_apis:
        - "IM (Messaging)"
        - "Event subscriptions"
        - "Interactive cards"

      suitable_patterns:
        - "Event-Driven Architecture"
        - "Command Pattern (for message routing)"
        - "State Machine (for conversation flows)"

      deployment:
        hosting: "Cloud Run, ECS, Lambda (serverless)"
        webhook_endpoint: "Public HTTPS endpoint"

    integrations:
      architecture: "Service-oriented architecture (SOA)"
      primary_apis:
        - "Core APIs (IM, Docs, Base, Calendar)"
        - "Authentication"
        - "Webhooks"

      suitable_patterns:
        - "Layered Architecture"
        - "Microservices (for complex systems)"
        - "Adapter Pattern (for external system integration)"

      deployment:
        hosting: "Traditional VMs, Kubernetes"
        integration_points: "CRM, ERP, BI tools"

    isv_applications:
      architecture: "Multi-tenant microservices"
      primary_apis:
        - "All server APIs"
        - "Tenant management"
        - "Billing/subscription"

      suitable_patterns:
        - "Microservices Architecture"
        - "Multi-Tenancy (shared DB + tenant_id)"
        - "CQRS (Command Query Responsibility Segregation)"

      deployment:
        hosting: "Cloud-native (AWS, GCP, Alibaba Cloud)"
        data_isolation: "Tenant-scoped database queries"
```

### 4.2 Development Lifecycle (6 Phases)

```yaml
lifecycle_phases:
  phase_1_strategic_planning:
    business_requirements:
      - "Identify pain points and desired outcomes"
      - "Define success metrics (KPIs)"
      - "Stakeholder analysis"
      - "Competitive analysis"

    technical_requirements:
      - "Functional requirements mapping"
      - "Non-functional requirements (performance, security, scalability)"
      - "Integration requirements (external systems)"
      - "Data requirements"

    architecture_selection:
      decision_criteria:
        - "Complexity: Simple form vs. complex workflow?"
        - "Scalability: 10 users vs. 10,000 users?"
        - "Real-time needs: Batch processing vs. instant response?"
        - "Team expertise: What does team know best?"
        - "Budget constraints: Infrastructure costs?"

      decision_matrix:
        simple_bot: "Event-driven + Serverless"
        enterprise_dashboard: "Layered + MVC"
        multi_feature_platform: "Microservices"
        isv_saas: "Microservices + Multi-tenancy"

  phase_2_application_design:
    api_design:
      api_mapping:
        - "Identify required Lark APIs per feature"
        - "Determine auth type (tenant_token vs user_token)"
        - "Design API abstraction layer (Repository/Service Pattern)"

      error_handling:
        - "Rate limiting (error code 99991666)"
        - "Token expiration and auto-refresh"
        - "Webhook retries with exponential backoff"
        - "Graceful degradation for invalid permissions"

    data_model_design:
      data_categories:
        lark_synced_data:
          examples: ["User profiles", "Department structures", "Chat memberships"]
          strategy: "Cache with TTL, refresh on demand"

        application_data:
          examples: ["Task assignments", "Custom configurations", "Analytics data"]
          strategy: "Persistent database (PostgreSQL, MongoDB)"

        hybrid_data:
          examples: ["User preferences (Lark user_id + app settings)"]
          strategy: "Relational DB with foreign keys to Lark IDs"

    authentication_flow_design:
      app_only_auth:
        when: "Bot operations, server-to-server"
        implementation:
          - "Scheduled job to refresh tenant_access_token"
          - "Redis cache for token storage"
          - "Middleware to inject token in requests"

      user_authorization:
        when: "User-specific operations, H5 apps"
        oauth_flow:
          - "GET /open-apis/authen/v1/authorize"
          - "User consent page"
          - "Callback with authorization code"
          - "POST /open-apis/authen/v1/access_token"
          - "Receive access_token + refresh_token"

    event_handling_design:
      webhook_endpoint_architecture:
        options:
          - "Single endpoint with event router"
          - "Multiple endpoints by event type"

        security:
          - "Verify Lark signature"
          - "Validate encryption key"
          - "Respond to challenge events"

        scalability:
          - "Queue events for async processing"
          - "Horizontal scaling of workers"

      event_processing_patterns:
        synchronous:
          when: "Simple, fast operations (<3 seconds)"
          example: "Echo bot responding immediately"

        asynchronous:
          when: "Complex operations (>3 seconds)"
          example: "Generate report from event"
          tools: "Bull (Node.js), Celery (Python), Sidekiq (Ruby)"

  phase_3_implementation:
    core_components:
      lark_client:
        responsibilities:
          - "Token management (fetch, cache, refresh)"
          - "HTTP request handling"
          - "Error handling and retry logic"
          - "Rate limit management"

      service_layer:
        pattern: "Service Layer Pattern"
        examples:
          - "MessageService (send text, cards)"
          - "DocumentService (CRUD operations)"
          - "CalendarService (event management)"

      event_handler:
        pattern: "Strategy Pattern for event handlers"
        structure:
          - "EventRouter (validates, decrypts, dispatches)"
          - "Concrete handlers (MessageReceivedHandler, etc.)"

      data_persistence:
        pattern: "Repository Pattern"
        caching_strategy:
          - "User profiles (TTL: 1 hour)"
          - "Department structure (TTL: 6 hours)"
          - "Chat metadata (TTL: 30 minutes)"

  phase_4_testing:
    unit_testing:
      - "Lark API client tests (mock HTTP responses)"
      - "Service layer tests (mock LarkClient)"
      - "Event handler tests (mock event payloads)"

    integration_testing:
      - "End-to-end message sending"
      - "Webhook event reception"
      - "OAuth flow completion"

    end_to_end_testing:
      - "Complete user workflows"
      - "UI testing (Playwright/Puppeteer)"

    security_testing:
      - "Token expiration handling"
      - "Webhook signature verification"
      - "SQL injection prevention"
      - "XSS vulnerability checks"

  phase_5_deployment:
    infrastructure_setup:
      containerization:
        - "Dockerfile for application"
        - "Docker Compose for local development"

      cloud_providers:
        aws: "EC2/ECS, RDS, ElastiCache, S3, CloudFront"
        google_cloud: "Cloud Run/GKE, Cloud SQL, Memorystore, Cloud Storage"
        alibaba_cloud: "ECS, ApsaraDB (lower latency for Feishu China users)"

    ci_cd_pipeline:
      - "GitHub Actions / GitLab CI"
      - "Automated testing"
      - "Deployment strategies (blue-green, canary, rolling)"

    lark_app_configuration:
      - "Generate production App ID and Secret"
      - "Enable required features (Bot, Web App, etc.)"
      - "Configure homepage URLs"
      - "Set webhook URL to production endpoint"
      - "Set OAuth redirect URLs"

    monitoring_setup:
      application_metrics:
        - "Request rate and latency"
        - "Error rate by endpoint"
        - "Lark API call success rate"

      lark_specific_monitoring:
        - "Event processing time"
        - "Rate limit proximity"
        - "Token refresh frequency"

  phase_6_maintenance:
    user_feedback_collection:
      - "In-app feedback forms"
      - "Lark group for support"
      - "Analytics on feature usage"

    performance_optimization:
      - "Database indexing and query optimization"
      - "Batch API calls where possible"
      - "Aggressive caching strategy"
      - "Code profiling and algorithm optimization"

    feature_expansion:
      - "Follow same lifecycle: plan → design → implement → test → deploy"
      - "Use feature flags for gradual rollout"
      - "Monitor Lark platform updates and API changelog"
```

---

## Part 5: Best Practices and Patterns

### 5.1 API Integration Patterns

```yaml
best_practices:
  pattern_1_sdk_wrapper:
    rationale:
      - "Isolate SDK version changes"
      - "Add custom error handling"
      - "Simplify complex operations"
      - "Enable easy testing with mocks"

    implementation:
      bad_practice: "Direct SDK usage in business logic"
      good_practice: "Wrap official SDK in custom abstraction (LarkMessagingService)"

  pattern_2_retry_with_backoff:
    description: "Gracefully handle transient failures"
    retryable_errors:
      - "429: Rate limit exceeded"
      - "500: Internal server error"
      - "502: Bad gateway"
      - "503: Service unavailable"

    strategy: "Exponential backoff (base delay × 2^attempt)"

  pattern_3_batch_operations:
    description: "Combine multiple operations to reduce API calls"
    examples:
      bad: "Loop through users, call API for each (100 API calls)"
      good: "Send message to chat (1 API call) or use batch endpoints"

  pattern_4_webhook_idempotency:
    description: "Handle duplicate webhook deliveries"
    implementation:
      - "Store event_id in Redis/Database"
      - "Check if event_id already processed"
      - "Skip duplicate events"

  pattern_5_graceful_degradation:
    description: "Continue functioning when Lark APIs are unavailable"
    strategies:
      - "Queue messages for later delivery"
      - "Use cached data instead of fresh fetch"
      - "Disable non-critical features"
      - "Circuit breaker pattern to prevent cascading failures"
```

### 5.2 Security Best Practices

```yaml
security:
  secret_management:
    never_do:
      - "Hardcode secrets in source code"
      - "Commit .env files to git"
      - "Log secrets in application logs"
      - "Send secrets in error messages"

    best_practices:
      - "Use environment variables"
      - "Store secrets in vault (AWS Secrets Manager, HashiCorp Vault)"
      - "Rotate secrets regularly"
      - "Use different secrets per environment"

  webhook_security:
    signature_verification:
      algorithm: "SHA-256 hash"
      input: "{timestamp}{nonce}{encryptKey}{body}"
      comparison: "Compare computed hash with signature header"

    replay_protection:
      method: "Verify timestamp is within 5-minute window"
      calculation: "|current_time - event_timestamp| < 300 seconds"

  data_protection:
    encryption_at_rest:
      - "Encrypt sensitive database fields"
      - "Use database-level encryption"
      - "Encrypt file uploads"

    encryption_in_transit:
      - "Use HTTPS everywhere"
      - "Enforce TLS 1.2+"

    pii_handling:
      - "Minimize PII storage"
      - "Pseudonymize when possible"
      - "Implement data retention policies"
      - "Support GDPR/CCPA compliance"
```

---

## Part 6: MCP Integration for AI Agents

### 6.1 Miyabi Lark MCP Integration

```yaml
miyabi_lark_mcp_stack:
  available_mcp_servers:

    lark_mcp_enhanced:
      location: "mcp-servers/lark-mcp-enhanced"
      purpose: "Miyabi-specific customizations"
      features:
        - "Automatic permission management"
        - "Preset configurations"
        - "Simplified authentication"
      startup: "npm start"
      recommended_for: "Standard Miyabi operations"

    lark_openapi_mcp_enhanced:
      location: "mcp-servers/lark-openapi-mcp-enhanced"
      purpose: "Full-featured MCP + Genesis AI"
      features:
        - "All OpenAPI coverage"
        - "Lark Base app auto-generation"
        - "Advanced automation"
      startup: "yarn build && node dist/cli.js mcp"
      recommended_for: "Complex automations and Base app generation"

    lark_wiki_mcp_agents:
      location: "mcp-servers/lark-wiki-mcp-agents"
      purpose: "Wiki-focused multi-agent system"
      features:
        - "Wiki management"
        - "Document automation"
        - "Knowledge base operations"
      recommended_for: "Documentation-heavy projects"

    miyabi_lark_dev_docs_mcp:
      location: "mcp-servers/miyabi-lark-dev-docs-mcp"
      purpose: "Authenticated Lark documentation crawler"
      features:
        - "Login-authenticated access to Lark docs"
        - "Chrome DevTools Protocol integration"
        - "Real-time documentation scraping"

      mcp_tools:
        - tool: "lark_dev_docs_read"
          description: "Read content from Lark Developer Docs URL"
          input: "{ url: string }"

        - tool: "lark_api_search"
          description: "Search Lark API documentation"
          input: "{ query: string }"

        - tool: "lark_dev_docs_navigate"
          description: "Navigate to specific documentation section"
          input: "{ section: 'im' | 'docs' | 'bot' | 'event' | 'auth' }"

      setup:
        - "Launch Chrome in debug mode (port 9222)"
        - "Manually login to Lark Open Platform"
        - "Start MCP server"

      recommended_for: "Dynamic documentation exploration and context gathering"

  integration_patterns:
    pattern_1_basic_notifications:
      use_case: "Send notifications to Lark groups/users"
      mcp_tool: "im.v1.message.create"
      authentication: "tenant_access_token"

      example_workflow:
        - "GitHub Issue created"
        - "Miyabi agent detects event"
        - "Agent calls MCP tool to send Lark message"
        - "Team receives notification card"

    pattern_2_interactive_workflows:
      use_case: "Approval workflows with interactive cards"
      mcp_tools:
        - "im.v1.message.create (send approval card)"
        - "Event subscription (receive button click)"
        - "bitable.v1.app_table_record.create (log approval)"

      authentication: "user_access_token (for approval actions)"

      example_workflow:
        - "User requests approval via Miyabi CLI"
        - "Miyabi sends interactive card to approver"
        - "Approver clicks 'Approve' button in Lark"
        - "Webhook event received by Miyabi"
        - "Miyabi records decision in Lark Base"
        - "Requester receives confirmation message"

    pattern_3_document_automation:
      use_case: "Auto-generate Lark Docs from code analysis"
      mcp_tools:
        - "docx.v1.document.create"
        - "docx.v1.document.block.create"
        - "docx.v1.document.permission.create"

      authentication: "user_access_token"

      example_workflow:
        - "Miyabi agent analyzes codebase"
        - "Extracts architecture and API definitions"
        - "Creates Lark Doc with structured blocks"
        - "Adds diagrams and code snippets"
        - "Shares doc with team members"

    pattern_4_project_management:
      use_case: "Sync GitHub Issues to Lark Base"
      mcp_tools:
        - "bitable.v1.app.create"
        - "bitable.v1.app_table.create"
        - "bitable.v1.app_table_record.batch_create"
        - "bitable.v1.app_role_member.create (grant permissions)"

      authentication: "tenant_access_token"

      example_workflow:
        - "Miyabi detects new GitHub Issues"
        - "Creates Lark Base if not exists"
        - "Adds table with Issue schema"
        - "Syncs all Issues as Base records"
        - "Grants team members access"
        - "Sends summary card to group"
```

### 6.2 Context Engineering for AI Agents

```yaml
ai_agent_context_requirements:

  minimum_context:
    - "API endpoint format and versioning"
    - "Authentication flow (tenant vs user tokens)"
    - "MCP tool naming scheme"
    - "Rate limiting awareness"

  recommended_context:
    - "Complete API taxonomy (IM, Docs, Base, Calendar, etc.)"
    - "Event subscription patterns"
    - "Interactive card structure and callback handling"
    - "Multi-tenancy considerations (for ISV apps)"
    - "Error handling patterns"

  optimal_context:
    - "This document (complete architecture)"
    - "Application development framework (6 phases)"
    - "Best practices and security patterns"
    - "MCP integration patterns"
    - "Real-world use case examples"

context_engineering_strategy:
  approach_1_static_documentation:
    method: "Embed this document as system prompt context"
    pros:
      - "Comprehensive coverage"
      - "No API calls required"
    cons:
      - "May exceed token limits for smaller models"
      - "Requires manual updates when APIs change"

  approach_2_dynamic_documentation_fetch:
    method: "Use miyabi-lark-dev-docs-mcp to fetch real-time docs"
    pros:
      - "Always up-to-date"
      - "Can retrieve specific API details on-demand"
    cons:
      - "Requires Chrome debug session"
      - "Additional latency for doc fetching"

  approach_3_hybrid:
    method: "Static base context + dynamic detail retrieval"
    implementation:
      - "Load this document as foundational context"
      - "When agent needs API-specific details, use lark_dev_docs_read MCP tool"
      - "Cache frequently accessed API docs"
    pros:
      - "Best of both worlds: comprehensive + current"
      - "Optimizes token usage"
    recommended: true
```

---

## Part 7: Appendix

### 7.1 URL Patterns Reference

```yaml
url_patterns:
  api_explorer:
    base: "https://open.larksuite.com/api-explorer/{app_id}"
    query_params: "?apiName={action}&project={service}&resource={resource_type}&version={version}"

  client_docs:
    intro: "/document/client-docs/intro"
    h5_jsapi: "/document/client-docs/h5/"
    mini_program: "/document/client-docs/gadget/"

  server_docs:
    getting_started: "/document/server-docs/getting-started/getting-started"
    api_reference: "/document/server-docs/{category}/{resource}"

  mcp_docs:
    overview: "/document/uAjLw4CM/ukTMukTMukTM/mcp_integration/mcp_introduction"
    tools_list: "/document/uAjLw4CM/ukTMukTMukTM/mcp_integration/tools"
```

### 7.2 Official Resources

```yaml
official_resources:
  documentation:
    feishu_china: "https://open.feishu.cn"
    lark_international: "https://open.larksuite.com"

  sdks:
    nodejs: "@larksuiteoapi/node-sdk"
    python: "lark-oapi"
    go: "github.com/larksuite/oapi-sdk-go"
    java: "Maven dependency"

  mcp:
    official_package: "@larksuiteoapi/lark-mcp"
    github_repo: "github.com/larksuite/lark-openapi-mcp"

  community:
    go_sdk_enhanced: "github.com/chyroc/lark"
    go_sdk_im: "github.com/go-lark/lark"

  developer_console:
    feishu: "https://open.feishu.cn/app"
    lark: "https://open.larksuite.com/app"
```

---

## Conclusion

This document provides **complete architectural context** for the Lark Open Platform, enabling:

1. **AI Agents**: Deep understanding of API structures, naming conventions, and integration patterns
2. **Developers**: Comprehensive reference for designing and implementing Lark applications
3. **System Integrators**: Clear mapping of capabilities, authentication flows, and best practices

**Maintenance**: This document should be updated when:
- New API categories are introduced
- MCP tool capabilities expand
- Authentication mechanisms change
- Major platform updates occur

**Next Steps**:
1. Use this document as foundational context for Miyabi Lark integrations
2. Combine with real-time documentation fetching via `miyabi-lark-dev-docs-mcp`
3. Extend with project-specific patterns and use cases

---

**Document Metadata**:
- **Total API Categories**: 10+ (IM, Docs, Base, Calendar, Approval, etc.)
- **Total JSAPI Functions**: 80+ client-side APIs
- **MCP Tool Naming Scheme**: `{biz}.{version}.{resource}.{method}`
- **Authentication Types**: 2 (tenant_access_token, user_access_token)
- **Deployment Regions**: 2 (Feishu China, Lark International)
- **Application Types**: 7 (Bot, H5, Gadget, Workbench Block, Custom, Store, ISV)

**Crawl Data Source**: `/mcp-servers/miyabi-lark-dev-docs-mcp/crawled-data/lark-docs-hierarchy-2025-11-20T02-43-55-272Z.json`

**Framework Source**: `/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/.lark/lark_application_construction_framework.md`

**Context Source**: `/Users/shunsuke/Dev/01-miyabi/_core/miyabi-private/.lark/lark_open_platform_context.md`

---

**END OF DOCUMENT**
