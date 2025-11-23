/**
 * DesignAgent - Auto Design Documentation Generator
 *
 * Generates comprehensive design specifications before implementation:
 * - Entity-Relation Diagrams (Mermaid)
 * - Database Schemas (SQL Migrations)
 * - Interactive Card Templates (Lark Cards)
 * - API Endpoint Specifications (OpenAPI)
 * - Service Layer Design
 * - User Flow Diagrams
 *
 * Phase B: Design Automation (Framework Section 2.2)
 */

import fs from 'fs/promises';
import path from 'path';

/**
 * Main entry point for design specification generation
 */
export async function generateDesignSpecs(projectSpec) {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎨 DesignAgent - Auto Design Documentation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const outputDir = path.join(
    new URL('.', import.meta.url).pathname,
    '../../output/design-specs',
    sanitizeFileName(projectSpec.project_name)
  );

  await fs.mkdir(outputDir, { recursive: true });

  console.log('📊 Generating design specifications...\n');

  // 1. Data Model Design
  console.log('  1️⃣  Generating Entity-Relation Diagrams...');
  const dataModel = await generateDataModel(projectSpec, outputDir);

  // 2. UI/UX Design
  console.log('  2️⃣  Designing Interactive Cards & UI...');
  const uiDesign = await generateUIDesign(projectSpec, outputDir);

  // 3. API Design
  console.log('  3️⃣  Designing API Endpoints & Services...');
  const apiDesign = await generateAPIDesign(projectSpec, outputDir);

  // 4. Architecture Design
  console.log('  4️⃣  Creating Architecture Diagrams...');
  const architecture = await generateArchitecture(projectSpec, outputDir);

  // 5. User Flow Design
  console.log('  5️⃣  Mapping User Journeys...\n');
  const userFlows = await generateUserFlows(projectSpec, outputDir);

  console.log('✅ Design specifications generated!\n');

  return {
    output_directory: outputDir,
    data_model: dataModel,
    ui_design: uiDesign,
    api_design: apiDesign,
    architecture: architecture,
    user_flows: userFlows,
    generated_at: new Date().toISOString(),
    design_files: await listGeneratedFiles(outputDir)
  };
}

/**
 * 1. Data Model Design - ER Diagrams & Database Schemas
 */
async function generateDataModel(projectSpec, outputDir) {
  const modelDir = path.join(outputDir, 'data-model');
  await fs.mkdir(modelDir, { recursive: true });

  // Generate ER Diagram (Mermaid)
  const entities = extractEntities(projectSpec);
  const erDiagram = generateERDiagram(entities);
  await fs.writeFile(path.join(modelDir, 'er-diagram.mmd'), erDiagram);

  // Generate Database Schema (SQL)
  const schema = generateDatabaseSchema(entities);
  await fs.writeFile(path.join(modelDir, 'schema.sql'), schema);

  // Generate Migrations
  const migrations = generateMigrations(entities);
  await fs.writeFile(path.join(modelDir, 'migrations.sql'), migrations);

  // Generate Entity Documentation
  const entityDocs = generateEntityDocumentation(entities);
  await fs.writeFile(path.join(modelDir, 'ENTITIES.md'), entityDocs);

  return {
    entities: entities,
    er_diagram_file: 'er-diagram.mmd',
    schema_file: 'schema.sql',
    migrations_file: 'migrations.sql',
    entity_count: entities.length
  };
}

/**
 * Extract entities from project specification
 */
function extractEntities(projectSpec) {
  const entities = [];
  const intentType = projectSpec.intent_analysis.intent_type;

  // Base entities for all bots
  entities.push({
    name: 'User',
    fields: [
      { name: 'user_id', type: 'VARCHAR(255)', primary: true },
      { name: 'open_id', type: 'VARCHAR(255)', unique: true },
      { name: 'name', type: 'VARCHAR(255)' },
      { name: 'created_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
    ]
  });

  entities.push({
    name: 'Message',
    fields: [
      { name: 'message_id', type: 'VARCHAR(255)', primary: true },
      { name: 'user_id', type: 'VARCHAR(255)', foreign: 'User.user_id' },
      { name: 'chat_id', type: 'VARCHAR(255)' },
      { name: 'content', type: 'TEXT' },
      { name: 'msg_type', type: 'VARCHAR(50)' },
      { name: 'created_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
    ]
  });

  // Intent-specific entities
  if (intentType === 'task_bot' || intentType === 'project_management') {
    entities.push({
      name: 'Task',
      fields: [
        { name: 'task_id', type: 'VARCHAR(255)', primary: true },
        { name: 'user_id', type: 'VARCHAR(255)', foreign: 'User.user_id' },
        { name: 'title', type: 'VARCHAR(500)' },
        { name: 'description', type: 'TEXT' },
        { name: 'status', type: 'VARCHAR(50)', default: "'pending'" },
        { name: 'priority', type: 'VARCHAR(50)', default: "'normal'" },
        { name: 'due_date', type: 'TIMESTAMP' },
        { name: 'created_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' },
        { name: 'updated_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' }
      ]
    });
  }

  if (intentType === 'calendar_bot' || intentType === 'scheduling') {
    entities.push({
      name: 'Event',
      fields: [
        { name: 'event_id', type: 'VARCHAR(255)', primary: true },
        { name: 'user_id', type: 'VARCHAR(255)', foreign: 'User.user_id' },
        { name: 'title', type: 'VARCHAR(500)' },
        { name: 'description', type: 'TEXT' },
        { name: 'start_time', type: 'TIMESTAMP' },
        { name: 'end_time', type: 'TIMESTAMP' },
        { name: 'location', type: 'VARCHAR(255)' },
        { name: 'created_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
      ]
    });
  }

  if (intentType === 'approval_bot' || intentType === 'workflow') {
    entities.push({
      name: 'Approval',
      fields: [
        { name: 'approval_id', type: 'VARCHAR(255)', primary: true },
        { name: 'requester_id', type: 'VARCHAR(255)', foreign: 'User.user_id' },
        { name: 'approver_id', type: 'VARCHAR(255)', foreign: 'User.user_id' },
        { name: 'title', type: 'VARCHAR(500)' },
        { name: 'content', type: 'TEXT' },
        { name: 'status', type: 'VARCHAR(50)', default: "'pending'" },
        { name: 'approved_at', type: 'TIMESTAMP' },
        { name: 'created_at', type: 'TIMESTAMP', default: 'CURRENT_TIMESTAMP' }
      ]
    });
  }

  return entities;
}

/**
 * Generate Mermaid ER Diagram
 */
function generateERDiagram(entities) {
  let diagram = 'erDiagram\n\n';

  // Define entities
  entities.forEach(entity => {
    diagram += `  ${entity.name} {\n`;
    entity.fields.forEach(field => {
      const type = field.type.split('(')[0];
      const key = field.primary ? 'PK' : field.foreign ? 'FK' : '';
      diagram += `    ${type} ${field.name} ${key}\n`;
    });
    diagram += `  }\n\n`;
  });

  // Define relationships
  entities.forEach(entity => {
    entity.fields
      .filter(field => field.foreign)
      .forEach(field => {
        const [refEntity, refField] = field.foreign.split('.');
        diagram += `  ${entity.name} }o--|| ${refEntity} : "belongs to"\n`;
      });
  });

  return diagram;
}

/**
 * Generate Database Schema (SQL)
 */
function generateDatabaseSchema(entities) {
  let schema = '-- Database Schema\n';
  schema += `-- Generated: ${new Date().toISOString()}\n\n`;

  entities.forEach(entity => {
    schema += `-- ${entity.name} Table\n`;
    schema += `CREATE TABLE IF NOT EXISTS ${entity.name.toLowerCase()}s (\n`;

    const fields = entity.fields.map(field => {
      let def = `  ${field.name} ${field.type}`;
      if (field.primary) def += ' PRIMARY KEY';
      if (field.unique) def += ' UNIQUE';
      if (field.default) def += ` DEFAULT ${field.default}`;
      return def;
    });

    schema += fields.join(',\n');
    schema += '\n);\n\n';

    // Add indexes for foreign keys
    entity.fields
      .filter(field => field.foreign)
      .forEach(field => {
        schema += `CREATE INDEX idx_${entity.name.toLowerCase()}_${field.name} ON ${entity.name.toLowerCase()}s(${field.name});\n`;
      });

    schema += '\n';
  });

  return schema;
}

/**
 * Generate Migrations
 */
function generateMigrations(entities) {
  let migrations = '-- Database Migrations\n';
  migrations += `-- Generated: ${new Date().toISOString()}\n\n`;

  migrations += '-- Migration: Initial Schema\n';
  migrations += '-- Run this to set up the database\n\n';

  migrations += 'BEGIN TRANSACTION;\n\n';

  entities.forEach(entity => {
    migrations += `-- Create ${entity.name} table\n`;
    migrations += `CREATE TABLE IF NOT EXISTS ${entity.name.toLowerCase()}s (\n`;

    const fields = entity.fields.map(field => {
      let def = `  ${field.name} ${field.type}`;
      if (field.primary) def += ' PRIMARY KEY';
      if (field.unique) def += ' UNIQUE';
      if (field.default) def += ` DEFAULT ${field.default}`;
      return def;
    });

    migrations += fields.join(',\n');
    migrations += '\n);\n\n';
  });

  migrations += 'COMMIT;\n';

  return migrations;
}

/**
 * Generate Entity Documentation
 */
function generateEntityDocumentation(entities) {
  let docs = '# Data Model - Entity Documentation\n\n';
  docs += `**Generated**: ${new Date().toISOString()}\n\n`;
  docs += '---\n\n';

  docs += '## Entity Overview\n\n';
  docs += `This data model contains **${entities.length} entities**:\n\n`;
  entities.forEach((entity, idx) => {
    docs += `${idx + 1}. **${entity.name}** (${entity.fields.length} fields)\n`;
  });
  docs += '\n---\n\n';

  entities.forEach(entity => {
    docs += `## ${entity.name}\n\n`;
    docs += `**Fields**: ${entity.fields.length}\n\n`;
    docs += '| Field | Type | Constraints |\n';
    docs += '|-------|------|-------------|\n';

    entity.fields.forEach(field => {
      const constraints = [];
      if (field.primary) constraints.push('PRIMARY KEY');
      if (field.unique) constraints.push('UNIQUE');
      if (field.foreign) constraints.push(`FK → ${field.foreign}`);
      if (field.default) constraints.push(`DEFAULT ${field.default}`);

      docs += `| ${field.name} | ${field.type} | ${constraints.join(', ') || '-'} |\n`;
    });

    docs += '\n';

    // Relationships
    const foreignKeys = entity.fields.filter(f => f.foreign);
    if (foreignKeys.length > 0) {
      docs += '**Relationships**:\n';
      foreignKeys.forEach(fk => {
        const [refEntity, refField] = fk.foreign.split('.');
        docs += `- Belongs to **${refEntity}** via \`${fk.name}\` → \`${refField}\`\n`;
      });
      docs += '\n';
    }

    docs += '---\n\n';
  });

  return docs;
}

/**
 * 2. UI/UX Design - Interactive Cards & Wireframes
 */
async function generateUIDesign(projectSpec, outputDir) {
  const uiDir = path.join(outputDir, 'ui-design');
  await fs.mkdir(uiDir, { recursive: true });

  // Generate Interactive Card Templates
  const cards = generateInteractiveCards(projectSpec);
  await fs.writeFile(path.join(uiDir, 'card-templates.json'), JSON.stringify(cards, null, 2));

  // Generate Card Documentation
  const cardDocs = generateCardDocumentation(cards);
  await fs.writeFile(path.join(uiDir, 'CARDS.md'), cardDocs);

  // Generate User Interface Specification
  const uiSpec = generateUISpecification(projectSpec);
  await fs.writeFile(path.join(uiDir, 'UI_SPECIFICATION.md'), uiSpec);

  return {
    card_templates: cards,
    card_count: cards.length,
    card_templates_file: 'card-templates.json',
    documentation_file: 'CARDS.md'
  };
}

/**
 * Generate Interactive Card Templates
 */
function generateInteractiveCards(projectSpec) {
  const cards = [];
  const intentType = projectSpec.intent_analysis.intent_type;

  // Welcome Card
  cards.push({
    name: 'welcome_card',
    title: `Welcome to ${projectSpec.project_name}`,
    description: 'Initial greeting card shown to users',
    template: {
      type: 'template',
      data: {
        template_id: 'AAqkXqeJnJl3Y',
        template_variable: {
          title: projectSpec.project_name,
          description: projectSpec.project_description || 'Your AI assistant powered by Lark',
          actions: ['Get Started', 'Help', 'Settings']
        }
      }
    }
  });

  // Intent-specific cards
  if (intentType === 'task_bot' || intentType === 'project_management') {
    cards.push({
      name: 'task_creation_card',
      title: 'Create New Task',
      description: 'Interactive form for creating tasks',
      template: {
        config: {
          wide_screen_mode: true
        },
        header: {
          title: {
            tag: 'plain_text',
            content: 'Create New Task'
          }
        },
        elements: [
          {
            tag: 'input',
            name: 'task_title',
            required: true,
            placeholder: { content: 'Enter task title...', tag: 'plain_text' }
          },
          {
            tag: 'textarea',
            name: 'task_description',
            placeholder: { content: 'Task description...', tag: 'plain_text' }
          },
          {
            tag: 'select_static',
            name: 'priority',
            placeholder: { content: 'Select priority', tag: 'plain_text' },
            options: [
              { text: { content: 'High', tag: 'plain_text' }, value: 'high' },
              { text: { content: 'Normal', tag: 'plain_text' }, value: 'normal' },
              { text: { content: 'Low', tag: 'plain_text' }, value: 'low' }
            ]
          },
          {
            tag: 'date_picker',
            name: 'due_date',
            placeholder: { content: 'Select due date', tag: 'plain_text' }
          }
        ]
      }
    });

    cards.push({
      name: 'task_list_card',
      title: 'Task List',
      description: 'Display list of tasks with status',
      template: {
        config: {
          wide_screen_mode: true
        },
        header: {
          title: {
            tag: 'plain_text',
            content: 'Your Tasks'
          }
        },
        elements: [
          {
            tag: 'column_set',
            flex_mode: 'none',
            background_style: 'grey',
            columns: [
              {
                tag: 'column',
                width: 'weighted',
                weight: 3,
                elements: [
                  {
                    tag: 'markdown',
                    content: '**Task Title**'
                  }
                ]
              },
              {
                tag: 'column',
                width: 'weighted',
                weight: 1,
                elements: [
                  {
                    tag: 'markdown',
                    content: '**Status**'
                  }
                ]
              },
              {
                tag: 'column',
                width: 'weighted',
                weight: 1,
                elements: [
                  {
                    tag: 'markdown',
                    content: '**Actions**'
                  }
                ]
              }
            ]
          }
        ]
      }
    });
  }

  if (intentType === 'calendar_bot' || intentType === 'scheduling') {
    cards.push({
      name: 'event_creation_card',
      title: 'Create Event',
      description: 'Interactive form for creating calendar events',
      template: {
        config: {
          wide_screen_mode: true
        },
        header: {
          title: {
            tag: 'plain_text',
            content: 'Create Calendar Event'
          }
        },
        elements: [
          {
            tag: 'input',
            name: 'event_title',
            required: true,
            placeholder: { content: 'Event title...', tag: 'plain_text' }
          },
          {
            tag: 'date_picker',
            name: 'start_date',
            placeholder: { content: 'Start date', tag: 'plain_text' }
          },
          {
            tag: 'date_picker',
            name: 'end_date',
            placeholder: { content: 'End date', tag: 'plain_text' }
          },
          {
            tag: 'input',
            name: 'location',
            placeholder: { content: 'Location (optional)', tag: 'plain_text' }
          }
        ]
      }
    });
  }

  if (intentType === 'approval_bot' || intentType === 'workflow') {
    cards.push({
      name: 'approval_request_card',
      title: 'Approval Request',
      description: 'Card for submitting approval requests',
      template: {
        config: {
          wide_screen_mode: true
        },
        header: {
          title: {
            tag: 'plain_text',
            content: 'New Approval Request'
          }
        },
        elements: [
          {
            tag: 'input',
            name: 'request_title',
            required: true,
            placeholder: { content: 'Request title...', tag: 'plain_text' }
          },
          {
            tag: 'textarea',
            name: 'request_content',
            required: true,
            placeholder: { content: 'Request details...', tag: 'plain_text' }
          },
          {
            tag: 'person_picker',
            name: 'approver',
            required: true,
            placeholder: { content: 'Select approver', tag: 'plain_text' }
          }
        ]
      }
    });
  }

  return cards;
}

/**
 * Generate Card Documentation
 */
function generateCardDocumentation(cards) {
  let docs = '# Interactive Card Templates\n\n';
  docs += `**Generated**: ${new Date().toISOString()}\n\n`;
  docs += '---\n\n';

  docs += '## Card Overview\n\n';
  docs += `This design includes **${cards.length} interactive card templates**:\n\n`;

  cards.forEach((card, idx) => {
    docs += `${idx + 1}. **${card.title}** - ${card.description}\n`;
  });

  docs += '\n---\n\n';

  cards.forEach(card => {
    docs += `## ${card.title}\n\n`;
    docs += `**Name**: \`${card.name}\`\n`;
    docs += `**Description**: ${card.description}\n\n`;
    docs += '**Template**:\n```json\n';
    docs += JSON.stringify(card.template, null, 2);
    docs += '\n```\n\n';
    docs += '---\n\n';
  });

  return docs;
}

/**
 * Generate UI Specification
 */
function generateUISpecification(projectSpec) {
  let spec = '# UI/UX Specification\n\n';
  spec += `**Project**: ${projectSpec.project_name}\n`;
  spec += `**Generated**: ${new Date().toISOString()}\n\n`;
  spec += '---\n\n';

  spec += '## Design Principles\n\n';
  spec += '1. **Simplicity** - Clean, uncluttered interface\n';
  spec += '2. **Clarity** - Clear labels and instructions\n';
  spec += '3. **Consistency** - Uniform design patterns\n';
  spec += '4. **Responsiveness** - Adaptive to different screen sizes\n';
  spec += '5. **Accessibility** - Accessible to all users\n\n';

  spec += '## Color Palette\n\n';
  spec += '- **Primary**: #0065FF (Lark Blue)\n';
  spec += '- **Success**: #00BC70\n';
  spec += '- **Warning**: #FF9100\n';
  spec += '- **Error**: #F54A45\n';
  spec += '- **Text**: #1F2329\n';
  spec += '- **Background**: #FFFFFF\n\n';

  spec += '## Typography\n\n';
  spec += '- **Headings**: SF Pro Display, 16-20px, Bold\n';
  spec += '- **Body**: SF Pro Text, 14px, Regular\n';
  spec += '- **Labels**: SF Pro Text, 12px, Medium\n\n';

  spec += '## Interactive Elements\n\n';
  spec += '### Buttons\n';
  spec += '- **Primary Action**: Blue background, white text\n';
  spec += '- **Secondary Action**: White background, blue border\n';
  spec += '- **Destructive Action**: Red background, white text\n\n';

  spec += '### Form Fields\n';
  spec += '- **Input**: 36px height, 8px border-radius\n';
  spec += '- **Textarea**: Auto-resize, minimum 72px height\n';
  spec += '- **Select**: Dropdown with search\n';
  spec += '- **Date Picker**: Calendar overlay\n\n';

  return spec;
}

/**
 * 3. API Design - Endpoints & Service Layer
 */
async function generateAPIDesign(projectSpec, outputDir) {
  const apiDir = path.join(outputDir, 'api-design');
  await fs.mkdir(apiDir, { recursive: true });

  // Generate OpenAPI Specification
  const openapi = generateOpenAPISpec(projectSpec);
  await fs.writeFile(path.join(apiDir, 'openapi.yaml'), openapi);

  // Generate Service Layer Design
  const services = generateServiceDesign(projectSpec);
  await fs.writeFile(path.join(apiDir, 'SERVICE_DESIGN.md'), services);

  // Generate Error Handling Strategy
  const errorHandling = generateErrorHandlingDesign();
  await fs.writeFile(path.join(apiDir, 'ERROR_HANDLING.md'), errorHandling);

  return {
    openapi_file: 'openapi.yaml',
    service_design_file: 'SERVICE_DESIGN.md',
    error_handling_file: 'ERROR_HANDLING.md'
  };
}

/**
 * Generate OpenAPI Specification
 */
function generateOpenAPISpec(projectSpec) {
  const spec = {
    openapi: '3.0.0',
    info: {
      title: projectSpec.project_name,
      description: projectSpec.project_description || 'Lark Bot API',
      version: '1.0.0'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    paths: {
      '/webhook/event': {
        post: {
          summary: 'Handle Lark events',
          description: 'Receives and processes events from Lark',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    event: {
                      type: 'object',
                      description: 'Event data from Lark'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: 'Event processed successfully'
            },
            '400': {
              description: 'Bad request'
            },
            '500': {
              description: 'Internal server error'
            }
          }
        }
      },
      '/health': {
        get: {
          summary: 'Health check',
          description: 'Returns server health status',
          responses: {
            '200': {
              description: 'Server is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      timestamp: { type: 'string', format: 'date-time' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            message: { type: 'string' },
            details: { type: 'object' }
          }
        }
      }
    }
  };

  // Convert to YAML format
  let yaml = 'openapi: 3.0.0\n';
  yaml += `info:\n`;
  yaml += `  title: ${spec.info.title}\n`;
  yaml += `  description: ${spec.info.description}\n`;
  yaml += `  version: ${spec.info.version}\n\n`;

  yaml += 'servers:\n';
  spec.servers.forEach(server => {
    yaml += `  - url: ${server.url}\n`;
    yaml += `    description: ${server.description}\n`;
  });

  yaml += '\npaths:\n';
  Object.entries(spec.paths).forEach(([path, methods]) => {
    yaml += `  ${path}:\n`;
    Object.entries(methods).forEach(([method, details]) => {
      yaml += `    ${method}:\n`;
      yaml += `      summary: ${details.summary}\n`;
      yaml += `      description: ${details.description}\n`;
    });
  });

  return yaml;
}

/**
 * Generate Service Layer Design
 */
function generateServiceDesign(projectSpec) {
  let design = '# Service Layer Design\n\n';
  design += `**Project**: ${projectSpec.project_name}\n`;
  design += `**Generated**: ${new Date().toISOString()}\n\n`;
  design += '---\n\n';

  design += '## Service Architecture\n\n';
  design += '```\n';
  design += '┌─────────────────────────────────────────────┐\n';
  design += '│           Presentation Layer                │\n';
  design += '│  (Event Handlers, Controllers)              │\n';
  design += '└─────────────┬───────────────────────────────┘\n';
  design += '              ↓\n';
  design += '┌─────────────────────────────────────────────┐\n';
  design += '│           Service Layer                     │\n';
  design += '│  (Business Logic, Orchestration)            │\n';
  design += '└─────────────┬───────────────────────────────┘\n';
  design += '              ↓\n';
  design += '┌─────────────────────────────────────────────┐\n';
  design += '│           Data Access Layer                 │\n';
  design += '│  (Repositories, Database)                   │\n';
  design += '└─────────────────────────────────────────────┘\n';
  design += '```\n\n';

  design += '## Core Services\n\n';

  design += '### 1. LarkClient Service\n';
  design += '**Responsibility**: Communication with Lark API\n\n';
  design += '**Methods**:\n';
  design += '- `getTenantAccessToken()` - Get/refresh access token\n';
  design += '- `sendMessage(params)` - Send message to chat\n';
  design += '- `sendCard(params)` - Send interactive card\n';
  design += '- `getUserInfo(userId)` - Get user information\n\n';

  design += '### 2. Message Service\n';
  design += '**Responsibility**: Message processing and routing\n\n';
  design += '**Methods**:\n';
  design += '- `handleTextMessage(message)` - Process text messages\n';
  design += '- `handleCardAction(action)` - Handle card interactions\n';
  design += '- `formatResponse(data)` - Format responses\n\n';

  design += '### 3. Business Logic Service\n';
  design += '**Responsibility**: Core business operations\n\n';
  design += '**Methods**:\n';
  if (projectSpec.intent_analysis.intent_type === 'task_bot') {
    design += '- `createTask(taskData)` - Create new task\n';
    design += '- `updateTask(taskId, updates)` - Update task\n';
    design += '- `listTasks(userId)` - Get user tasks\n';
    design += '- `deleteTask(taskId)` - Delete task\n';
  } else if (projectSpec.intent_analysis.intent_type === 'calendar_bot') {
    design += '- `createEvent(eventData)` - Create calendar event\n';
    design += '- `updateEvent(eventId, updates)` - Update event\n';
    design += '- `listEvents(userId)` - Get user events\n';
    design += '- `deleteEvent(eventId)` - Delete event\n';
  }
  design += '\n';

  design += '## Service Communication Pattern\n\n';
  design += '```javascript\n';
  design += '// Example service interaction\n';
  design += 'class EventHandler {\n';
  design += '  constructor(larkClient, messageService, businessService) {\n';
  design += '    this.lark = larkClient;\n';
  design += '    this.messages = messageService;\n';
  design += '    this.business = businessService;\n';
  design += '  }\n\n';
  design += '  async handleMessage(event) {\n';
  design += '    // 1. Parse message\n';
  design += '    const message = this.messages.parse(event);\n';
  design += '    \n';
  design += '    // 2. Execute business logic\n';
  design += '    const result = await this.business.process(message);\n';
  design += '    \n';
  design += '    // 3. Send response\n';
  design += '    const response = this.messages.formatResponse(result);\n';
  design += '    await this.lark.sendMessage(response);\n';
  design += '  }\n';
  design += '}\n';
  design += '```\n\n';

  return design;
}

/**
 * Generate Error Handling Design
 */
function generateErrorHandlingDesign() {
  let design = '# Error Handling Strategy\n\n';
  design += `**Generated**: ${new Date().toISOString()}\n\n`;
  design += '---\n\n';

  design += '## Error Categories\n\n';
  design += '### 1. Client Errors (4xx)\n';
  design += '- **400 Bad Request**: Invalid input data\n';
  design += '- **401 Unauthorized**: Missing or invalid credentials\n';
  design += '- **403 Forbidden**: Insufficient permissions\n';
  design += '- **404 Not Found**: Resource not found\n';
  design += '- **429 Too Many Requests**: Rate limit exceeded\n\n';

  design += '### 2. Server Errors (5xx)\n';
  design += '- **500 Internal Server Error**: Unexpected server error\n';
  design += '- **502 Bad Gateway**: Lark API error\n';
  design += '- **503 Service Unavailable**: Service temporarily down\n';
  design += '- **504 Gateway Timeout**: Lark API timeout\n\n';

  design += '## Error Handling Pattern\n\n';
  design += '```javascript\n';
  design += 'class ErrorHandler {\n';
  design += '  static handle(error) {\n';
  design += '    // Log error\n';
  design += '    console.error(`[${new Date().toISOString()}]`, error);\n';
  design += '    \n';
  design += '    // Categorize error\n';
  design += '    if (error.code === "LARK_API_ERROR") {\n';
  design += '      return this.handleLarkError(error);\n';
  design += '    } else if (error.code === "VALIDATION_ERROR") {\n';
  design += '      return this.handleValidationError(error);\n';
  design += '    } else {\n';
  design += '      return this.handleUnexpectedError(error);\n';
  design += '    }\n';
  design += '  }\n';
  design += '}\n';
  design += '```\n\n';

  design += '## Retry Strategy\n\n';
  design += '- **Exponential Backoff**: 1s, 2s, 4s, 8s\n';
  design += '- **Max Retries**: 3 attempts\n';
  design += '- **Retry Conditions**: 5xx errors, network errors\n';
  design += '- **No Retry**: 4xx errors (except 429)\n\n';

  return design;
}

/**
 * 4. Architecture Design - System Architecture Diagrams
 */
async function generateArchitecture(projectSpec, outputDir) {
  const archDir = path.join(outputDir, 'architecture');
  await fs.mkdir(archDir, { recursive: true });

  // Generate System Architecture Diagram
  const systemArch = generateSystemArchitecture(projectSpec);
  await fs.writeFile(path.join(archDir, 'system-architecture.mmd'), systemArch);

  // Generate Component Diagram
  const componentDiagram = generateComponentDiagram(projectSpec);
  await fs.writeFile(path.join(archDir, 'components.mmd'), componentDiagram);

  // Generate Architecture Documentation
  const archDocs = generateArchitectureDocumentation(projectSpec);
  await fs.writeFile(path.join(archDir, 'ARCHITECTURE.md'), archDocs);

  return {
    system_architecture_file: 'system-architecture.mmd',
    component_diagram_file: 'components.mmd',
    documentation_file: 'ARCHITECTURE.md'
  };
}

/**
 * Generate System Architecture Diagram
 */
function generateSystemArchitecture(projectSpec) {
  let diagram = 'graph TB\n\n';

  diagram += '  subgraph "Lark Platform"\n';
  diagram += '    A[Lark Client]\n';
  diagram += '  end\n\n';

  diagram += '  subgraph "Bot Application"\n';
  diagram += '    B[Webhook Endpoint]\n';
  diagram += '    C[Event Handler]\n';
  diagram += '    D[Business Logic]\n';
  diagram += '    E[Lark API Client]\n';
  diagram += '    F[Database]\n';
  diagram += '  end\n\n';

  diagram += '  A -->|Events| B\n';
  diagram += '  B --> C\n';
  diagram += '  C --> D\n';
  diagram += '  D --> F\n';
  diagram += '  D --> E\n';
  diagram += '  E -->|Messages| A\n';

  return diagram;
}

/**
 * Generate Component Diagram
 */
function generateComponentDiagram(projectSpec) {
  let diagram = 'graph LR\n\n';

  diagram += '  A[Event Handler] --> B[Message Service]\n';
  diagram += '  A --> C[Lark Client]\n';
  diagram += '  B --> D[Business Service]\n';
  diagram += '  D --> E[Database]\n';
  diagram += '  D --> C\n';
  diagram += '  C --> F[Lark API]\n';

  return diagram;
}

/**
 * Generate Architecture Documentation
 */
function generateArchitectureDocumentation(projectSpec) {
  let docs = '# System Architecture\n\n';
  docs += `**Project**: ${projectSpec.project_name}\n`;
  docs += `**Generated**: ${new Date().toISOString()}\n\n`;
  docs += '---\n\n';

  docs += '## Architecture Pattern\n\n';
  docs += '**Event-Driven Architecture** with layered service design\n\n';

  docs += '## Key Components\n\n';
  docs += '### 1. Webhook Endpoint\n';
  docs += '- Receives events from Lark\n';
  docs += '- Validates webhook signatures\n';
  docs += '- Routes events to handlers\n\n';

  docs += '### 2. Event Handler\n';
  docs += '- Processes different event types\n';
  docs += '- Orchestrates service calls\n';
  docs += '- Manages response flow\n\n';

  docs += '### 3. Business Logic Layer\n';
  docs += '- Core application functionality\n';
  docs += '- Business rule enforcement\n';
  docs += '- Data validation\n\n';

  docs += '### 4. Lark API Client\n';
  docs += '- Token management\n';
  docs += '- API communication\n';
  docs += '- Error handling\n\n';

  docs += '### 5. Database\n';
  docs += '- Persistent data storage\n';
  docs += '- User data\n';
  docs += '- Application state\n\n';

  docs += '## Technology Stack\n\n';
  docs += '- **Runtime**: Node.js\n';
  docs += '- **Framework**: Express.js\n';
  docs += '- **Database**: SQLite (dev), PostgreSQL (prod)\n';
  docs += '- **API Client**: Axios\n';
  docs += '- **Testing**: Vitest\n\n';

  return docs;
}

/**
 * 5. User Flow Design - User Journey Mapping
 */
async function generateUserFlows(projectSpec, outputDir) {
  const flowDir = path.join(outputDir, 'user-flows');
  await fs.mkdir(flowDir, { recursive: true });

  // Generate User Journey Diagrams
  const journeys = generateUserJourneys(projectSpec);

  for (const journey of journeys) {
    await fs.writeFile(
      path.join(flowDir, `${journey.name}.mmd`),
      journey.diagram
    );
  }

  // Generate User Flow Documentation
  const flowDocs = generateUserFlowDocumentation(journeys);
  await fs.writeFile(path.join(flowDir, 'USER_FLOWS.md'), flowDocs);

  return {
    journeys: journeys.map(j => ({ name: j.name, title: j.title })),
    journey_count: journeys.length,
    documentation_file: 'USER_FLOWS.md'
  };
}

/**
 * Generate User Journey Diagrams
 */
function generateUserJourneys(projectSpec) {
  const journeys = [];
  const intentType = projectSpec.intent_analysis.intent_type;

  // Common journey: First-time user
  journeys.push({
    name: 'first-time-user',
    title: 'First-Time User Onboarding',
    diagram: `sequenceDiagram
  actor User
  participant Bot
  participant Lark

  User->>Lark: Add bot to group
  Lark->>Bot: Bot added event
  Bot->>Lark: Send welcome message
  Lark->>User: Display welcome
  User->>Lark: Click "Get Started"
  Lark->>Bot: Button click event
  Bot->>Lark: Send interactive card
  Lark->>User: Display features
`
  });

  // Intent-specific journeys
  if (intentType === 'task_bot' || intentType === 'project_management') {
    journeys.push({
      name: 'create-task',
      title: 'Create Task Flow',
      diagram: `sequenceDiagram
  actor User
  participant Bot
  participant Database

  User->>Bot: @bot create task
  Bot->>User: Send task creation card
  User->>Bot: Fill form and submit
  Bot->>Database: Save task
  Database->>Bot: Task saved
  Bot->>User: Confirmation message
`
    });
  }

  if (intentType === 'calendar_bot' || intentType === 'scheduling') {
    journeys.push({
      name: 'create-event',
      title: 'Create Calendar Event Flow',
      diagram: `sequenceDiagram
  actor User
  participant Bot
  participant Calendar
  participant Database

  User->>Bot: @bot create event
  Bot->>User: Send event form card
  User->>Bot: Fill event details
  Bot->>Database: Save event
  Bot->>Calendar: Create calendar entry
  Calendar->>Bot: Event created
  Bot->>User: Confirmation with event link
`
    });
  }

  return journeys;
}

/**
 * Generate User Flow Documentation
 */
function generateUserFlowDocumentation(journeys) {
  let docs = '# User Flow Documentation\n\n';
  docs += `**Generated**: ${new Date().toISOString()}\n\n`;
  docs += '---\n\n';

  docs += `## User Journeys (${journeys.length})\n\n`;

  journeys.forEach((journey, idx) => {
    docs += `### ${idx + 1}. ${journey.title}\n\n`;
    docs += `**File**: \`${journey.name}.mmd\`\n\n`;
    docs += '**Flow Diagram**:\n```mermaid\n';
    docs += journey.diagram;
    docs += '\n```\n\n';
    docs += '---\n\n';
  });

  return docs;
}

/**
 * Utility: List generated files
 */
async function listGeneratedFiles(dir) {
  const files = [];

  async function scan(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await scan(fullPath);
      } else {
        files.push(path.relative(dir, fullPath));
      }
    }
  }

  await scan(dir);
  return files.sort();
}

/**
 * Utility: Sanitize file name
 */
function sanitizeFileName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default {
  generateDesignSpecs
};
