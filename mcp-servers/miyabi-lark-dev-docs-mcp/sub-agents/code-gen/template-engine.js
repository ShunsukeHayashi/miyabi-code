#!/usr/bin/env node
/**
 * Template Engine - Code生成用テンプレートエンジン
 *
 * テンプレートに値を埋め込んでコード生成
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.join(__dirname, 'templates');

/**
 * テンプレートエンジンメインクラス
 */
export class TemplateEngine {
  constructor() {
    this.templates = {};
  }

  /**
   * テンプレートを読み込み
   * @param {string} templateName - Template file name
   */
  async loadTemplate(templateName) {
    const templatePath = path.join(TEMPLATES_DIR, templateName);
    const content = await fs.readFile(templatePath, 'utf-8');
    this.templates[templateName] = content;
    return content;
  }

  /**
   * テンプレートに値を埋め込み
   * @param {string} templateName - Template name
   * @param {Object} variables - Variables to replace
   * @returns {string} Rendered template
   */
  async render(templateName, variables) {
    let template = this.templates[templateName];

    if (!template) {
      template = await this.loadTemplate(templateName);
    }

    let rendered = template;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      rendered = rendered.replaceAll(placeholder, value);
    }

    return rendered;
  }

  /**
   * 複数テンプレートを結合
   * @param {Array} templates - Array of {name, variables}
   * @returns {Promise<string>} Combined output
   */
  async renderMultiple(templates) {
    const results = await Promise.all(
      templates.map(t => this.render(t.name, t.variables))
    );

    return results.join('\n\n');
  }
}

/**
 * API Wrapper生成
 * @param {Object} apiSpec - API specification
 * @returns {Promise<string>} Generated API wrapper code
 */
export async function generateAPIWrapper(apiSpec) {
  const engine = new TemplateEngine();

  const functionName = apiNameToFunctionName(apiSpec.name);
  const apiPath = apiSpec.name.replace(/\./g, '/');

  const variables = {
    API_NAME: apiSpec.name,
    API_DESCRIPTION: apiSpec.description || '',
    REQUIRED_PERMISSION: apiSpec.required_permissions?.[0] || '',
    FUNCTION_NAME: functionName,
    HTTP_METHOD: apiSpec.http_method || 'POST',
    API_PATH: apiPath,
    PARAMETERS: generateParameters(apiSpec),
    REQUEST_BODY: generateRequestBody(apiSpec),
  };

  return await engine.render('api-wrapper.template.js', variables);
}

/**
 * Event Handler生成
 * @param {Object} eventSpec - Event specification
 * @returns {Promise<string>} Generated event handler code
 */
export async function generateEventHandler(eventSpec) {
  const engine = new TemplateEngine();

  const variables = {
    EVENT_TYPE: eventSpec.event_type,
    HANDLER_LOGIC: eventSpec.handler_logic || '  // TODO: Implement handler',
  };

  return await engine.render('event-handler.template.js', variables);
}

/**
 * 完全なアプリケーションコード生成
 * @param {Object} projectSpec - Project specification
 * @returns {Promise<string>} Complete application code
 */
export async function generateApplication(projectSpec) {
  const engine = new TemplateEngine();

  // API Wrappers生成
  const apiWrappers = await Promise.all(
    Object.values(projectSpec.api_selection.api_specifications).map(generateAPIWrapper)
  );

  // Event Handlers生成
  const eventHandlers = await generateEventHandler({
    event_type: 'im.message.receive_v1',
    handler_logic: generateMessageHandlerLogic(projectSpec),
  });

  // Base appテンプレート
  const variables = {
    PROJECT_NAME: projectSpec.task_graph.project_name,
    GENERATED_AT: new Date().toISOString(),
    APP_ID: '{{APP_ID}}',
    APP_SECRET: '{{APP_SECRET}}',
    PORT: '3000',
    EVENT_HANDLERS: eventHandlers,
    API_WRAPPERS: apiWrappers.join('\n\n'),
    HELPER_FUNCTIONS: generateHelperFunctions(projectSpec),
  };

  return await engine.render('base-app.template.js', variables);
}

/**
 * API名を関数名に変換
 */
function apiNameToFunctionName(apiName) {
  // im.v1.message.create → sendMessage
  // calendar.v4.calendar_event.list → listCalendarEvents

  const parts = apiName.split('.');
  const operation = parts[parts.length - 1]; // create, list, etc.
  const resource = parts[parts.length - 2]; // message, calendar_event

  const resourceCamel = resource
    .split('_')
    .map((word, i) => (i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join('');

  const operationMap = {
    create: 'create',
    list: 'list',
    get: 'get',
    update: 'update',
    delete: 'delete',
  };

  const operationVerb = operationMap[operation] || operation;

  if (operationVerb === 'create') {
    return `create${resourceCamel.charAt(0).toUpperCase() + resourceCamel.slice(1)}`;
  } else if (operationVerb === 'list') {
    return `list${resourceCamel.charAt(0).toUpperCase() + resourceCamel.slice(1)}s`;
  } else {
    return `${operationVerb}${resourceCamel.charAt(0).toUpperCase() + resourceCamel.slice(1)}`;
  }
}

/**
 * パラメータ生成
 */
function generateParameters(apiSpec) {
  // Simplified - actual implementation would parse API spec
  if (apiSpec.http_method === 'GET') {
    return 'params = {}';
  } else {
    return 'data = {}';
  }
}

/**
 * リクエストボディ生成
 */
function generateRequestBody(apiSpec) {
  if (apiSpec.http_method === 'GET') {
    return 'params: params,';
  } else {
    return 'data: data,';
  }
}

/**
 * メッセージハンドラーロジック生成
 */
function generateMessageHandlerLogic(projectSpec) {
  return `  const message = event.message;
  const chatId = message.chat_id;
  const text = message.content;

  // Parse command
  const command = JSON.parse(text).text;

  // Handle command
  if (command.includes('help')) {
    await sendMessage(chatId, 'Available commands: help, status');
  } else if (command.includes('status')) {
    await sendMessage(chatId, 'Bot is running!');
  } else {
    await sendMessage(chatId, 'Unknown command. Type "help" for available commands.');
  }`;
}

/**
 * ヘルパー関数生成
 */
function generateHelperFunctions(projectSpec) {
  return `/**
 * Helper: Send text message
 */
async function sendMessage(chatId, text) {
  const token = await getTenantAccessToken();

  await axios.post(
    \`\${LARK_DOMAIN}/open-apis/im/v1/messages\`,
    {
      receive_id: chatId,
      msg_type: 'text',
      content: JSON.stringify({ text }),
    },
    {
      headers: {
        'Authorization': \`Bearer \${token}\`,
        'Content-Type': 'application/json',
      },
      params: {
        receive_id_type: 'chat_id',
      },
    }
  );
}`;
}

// CLI実行時
if (import.meta.url === `file://${process.argv[1]}`) {
  const sampleAPISpec = {
    name: 'im.v1.message.create',
    description: 'Send a message',
    http_method: 'POST',
    required_permissions: ['im:message:write'],
  };

  generateAPIWrapper(sampleAPISpec).then(code => {
    console.log('✅ Generated API Wrapper:\n');
    console.log(code);
  });
}
