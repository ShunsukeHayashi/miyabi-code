#!/usr/bin/env node

import { GoogleGenAI } from '@google/genai';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini AI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// Load agent data from .claude/agents/
const AGENT_MAPPINGS = JSON.parse(
  readFileSync(path.join(__dirname, '../../agent-name-mapping.json'), 'utf-8')
);

// Complete TCG Agent Data with Claude Code integration
const CLAUDE_CODE_AGENTS = [
  {
    // Visual Info
    id: 'coordinator',
    name: { jp: 'しきるん', en: 'Shikiroon' },
    title: 'タスク調整と並列実行の指揮者',
    rarity: 'SSR',
    level: 45,
    type: ['Coding', 'Coordinator'],
    attribute: '⚡Lightning',
    
    // Game Stats
    stats: { hp: 1800, atk: 850, def: 950, spd: 720, int: 900, luk: 75 },
    
    // Skills
    skills: {
      primary: {
        name: 'パラレル・オーケストラ',
        desc: '複数のエージェントを同時に指揮し、タスク効率を300%向上'
      }
    },
    
    // Claude Code Info
    claude_code: {
      agent_path: '.claude/agents/coordinator.md',
      model: 'claude-sonnet-4-20250514',
      tools: ['read', 'grep', 'bash', 'Task', 'TodoWrite'],
      commands: ['/coordinator', '/orchestrate'],
      skills: ['agent-execution', 'task-planning', 'parallel-processing'],
      mcp_tool: 'a2a.task_coordination_and_parallel_execution_agent'
    }
  },
  {
    id: 'codegen',
    name: { jp: 'つくるん', en: 'Tsukuroon' },
    title: 'コード生成の天才プログラマー',
    rarity: 'SR',
    level: 38,
    type: ['Coding', 'Generator'],
    attribute: '🌙Dark',
    stats: { hp: 1500, atk: 1200, def: 600, spd: 850, int: 950, luk: 60 },
    skills: {
      primary: {
        name: 'コードバースト',
        desc: '瞬間的に1000行のコードを生成。バグ発生率わずか0.1%'
      }
    },
    claude_code: {
      agent_path: '.claude/agents/codegen.md',
      model: 'claude-sonnet-4-20250514',
      tools: ['read', 'write', 'Edit', 'MultiEdit', 'bash'],
      commands: ['/codegen', '/generate'],
      skills: ['code-generation', 'language-detection', 'optimization'],
      mcp_tool: 'a2a.code_generation_agent.generate_code'
    }
  },
  {
    id: 'reviewer',
    name: { jp: 'めだまん', en: 'Medaman' },
    title: '完璧主義のコードレビュアー',
    rarity: 'UR',
    level: 72,
    type: ['Coding', 'Analyzer'],
    attribute: '💧Water',
    stats: { hp: 2200, atk: 700, def: 1300, spd: 600, int: 1100, luk: 90 },
    skills: {
      primary: {
        name: '絶対評価の瞳',
        desc: 'すべてのバグを見逃さない。コード品質を100点満点で即座に評価'
      }
    },
    claude_code: {
      agent_path: '.claude/agents/reviewer.md',
      model: 'claude-opus-4-20250805',
      tools: ['read', 'grep', 'Lint', 'SecurityScan'],
      commands: ['/review', '/analyze'],
      skills: ['code-review', 'security-analysis', 'performance-optimization'],
      mcp_tool: 'a2a.code_review_and_quality_assurance_agent.review_code'
    }
  },
  {
    id: 'issue',
    name: { jp: 'みつけるん', en: 'Mitsukeroon' },
    title: 'Issue発見のスペシャリスト',
    rarity: 'R',
    level: 25,
    type: ['Coding', 'Detective'],
    attribute: '🔥Fire',
    stats: { hp: 1200, atk: 900, def: 700, spd: 950, int: 850, luk: 70 },
    skills: {
      primary: {
        name: 'バグハンター',
        desc: '隠れたバグを瞬時に発見。Issue作成速度が200%向上'
      }
    },
    claude_code: {
      agent_path: '.claude/agents/issue.md',
      model: 'claude-sonnet-4-20250514',
      tools: ['read', 'grep', 'GitHub CLI', 'WebSearch'],
      commands: ['/issue', '/analyze-issue'],
      skills: ['issue-analysis', 'bug-detection', 'priority-assessment'],
      mcp_tool: 'a2a.issue_analysis_and_task_breakdown_agent.analyze_issue'
    }
  },
  {
    id: 'pr',
    name: { jp: 'まとめるん', en: 'Matomeroon' },
    title: 'PR作成のマエストロ',
    rarity: 'SR',
    level: 40,
    type: ['Coding', 'Merger'],
    attribute: '✨Light',
    stats: { hp: 1600, atk: 800, def: 900, spd: 750, int: 900, luk: 80 },
    skills: {
      primary: {
        name: 'マージ・シンフォニー',
        desc: 'コンフリクトを優雅に解決。完璧なPRを作成する'
      }
    },
    claude_code: {
      agent_path: '.claude/agents/pr.md',
      model: 'claude-sonnet-4-20250514',
      tools: ['read', 'bash', 'GitHub CLI', 'Edit'],
      commands: ['/pr', '/create-pr'],
      skills: ['pr-creation', 'conflict-resolution', 'documentation'],
      mcp_tool: 'a2a.pull_request_creation_and_review_agent.create_pr'
    }
  }
];

// Generate Claude Code TCG card prompt
function generateClaudeCodeTCGPrompt(agent) {
  const backSideInfo = `
CLAUDE CODE SYSTEM
─────────────────
【Agent Path】
${agent.claude_code.agent_path}

【Model】
${agent.claude_code.model}

【Allowed Tools】
${agent.claude_code.tools.map(t => `• ${t}`).join('\\n')}

【MCP Integration】
${agent.claude_code.mcp_tool}

【Skills】
${agent.claude_code.skills.map(s => `• ${s}`).join('\\n')}

【Execution Command】
${agent.claude_code.commands[0]}

【QR Code】 [Execution Data]`;

  return `Create a DOUBLE-SIDED TCG card with unified frame design for Claude Code Agent system.

CARD STRUCTURE:
- Standard TCG size (63mm x 88mm)
- Double-sided design showing both gameplay AND technical execution info
- Unified frame: 2mm dark grey outer, 3mm ${getRarityColor(agent.rarity)} rarity frame, 8mm black base frame

FRONT SIDE (Gameplay):
- Character: ${agent.name.jp} (${agent.name.en})
- Visual: ${getCharacterDescription(agent.id)}
- Rarity: ${agent.rarity}
- Level: ${agent.level}
- Type: [${agent.type.join('/')}]
- Attribute: ${agent.attribute}
- Stats: HP:${agent.stats.hp} ATK:${agent.stats.atk} DEF:${agent.stats.def} SPD:${agent.stats.spd} INT:${agent.stats.int} LUK:${agent.stats.luk}
- Skill: 【${agent.skills.primary.name}】${agent.skills.primary.desc}
- Card number and edition info at bottom

BACK SIDE (Technical):
- Dark technical theme with circuit patterns
- Title: "CLAUDE CODE SYSTEM" at top
- Information layout:
${backSideInfo}
- Include a stylized QR code containing execution data
- Matrix-style data rain background effect

IMPORTANT: Show BOTH sides of the card in the image - front on left, back on right, with a slight 3D perspective showing the card thickness between them.`;
}

// Helper functions
function getRarityColor(rarity) {
  const colors = {
    'UR': 'rainbow holographic',
    'SSR': 'gold metallic',
    'SR': 'silver metallic',
    'R': 'blue metallic',
    'N': 'grey'
  };
  return colors[rarity] || 'grey';
}

function getCharacterDescription(id) {
  const descriptions = {
    coordinator: 'emerald green short hair, sharp glasses, conductor uniform, glowing baton',
    codegen: 'navy blue messy hair, gaming headset, hoodie with binary patterns',
    reviewer: 'ice blue bob cut, smart glasses with data, white blazer',
    issue: 'yellow spiky hair, caution tape hoodie, magnifying glass',
    pr: 'lavender purple ponytail, courier jacket, git-merge pin'
  };
  return descriptions[id] || '';
}

// Generate card with metadata
async function generateClaudeCodeTCGCard(agent, index) {
  console.log(`\n[${index + 1}/${CLAUDE_CODE_AGENTS.length}] 🎴 Generating Claude Code TCG: ${agent.name.jp}...`);
  
  try {
    const config = {
      responseModalities: ['IMAGE'],
      imageConfig: {
        imageSize: '2K'
      }
    };
    
    const model = 'models/gemini-3-pro-image-preview';
    const contents = [{
      role: 'user',
      parts: [{
        text: generateClaudeCodeTCGPrompt(agent)
      }]
    }];
    
    const response = await ai.models.generateContent({
      model,
      config,
      contents
    });
    
    if (response.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
      const inlineData = response.candidates[0].content.parts[0].inlineData;
      const buffer = Buffer.from(inlineData.data, 'base64');
      
      const outputDir = path.join(__dirname, 'claude-code-tcg');
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }
      
      // Save image
      const imagePath = path.join(outputDir, `${agent.id}_claude_tcg_${agent.rarity}.png`);
      writeFileSync(imagePath, buffer);
      
      // Save complete card data JSON
      const cardData = {
        card_id: `MIYABI-C${String(index + 1).padStart(3, '0')}-${agent.rarity}`,
        version: '1.0.0',
        visual: agent,
        claude_code: agent.claude_code,
        generated_at: new Date().toISOString(),
        image_path: imagePath
      };
      
      const jsonPath = path.join(outputDir, `${agent.id}_card_data.json`);
      writeFileSync(jsonPath, JSON.stringify(cardData, null, 2));
      
      console.log(`✅ Card saved: ${imagePath}`);
      console.log(`📄 Data saved: ${jsonPath}`);
      
      return { success: true, imagePath, jsonPath };
    }
    
    throw new Error('No image data in response');
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Main execution
async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ Error: GEMINI_API_KEY not set!');
    process.exit(1);
  }
  
  console.log('🎮 Claude Code TCG Card Generation');
  console.log('=' * 60);
  console.log('Creating double-sided cards with full execution info...');
  console.log('');
  
  const results = [];
  const startTime = Date.now();
  
  for (let i = 0; i < CLAUDE_CODE_AGENTS.length; i++) {
    const result = await generateClaudeCodeTCGCard(CLAUDE_CODE_AGENTS[i], i);
    results.push({
      agent: CLAUDE_CODE_AGENTS[i],
      ...result
    });
    
    if (i < CLAUDE_CODE_AGENTS.length - 1) {
      console.log('⏳ Waiting 3 seconds...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // Summary
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);
  const successful = results.filter(r => r.success).length;
  
  console.log('\n' + '=' * 60);
  console.log('📊 Generation Complete!');
  console.log(`⏱️  Time: ${duration} seconds`);
  console.log(`✅ Success: ${successful}/${CLAUDE_CODE_AGENTS.length} cards`);
  
  // Create gacha pool configuration
  const gachaPool = {
    name: 'Claude Code Masters Collection',
    version: '1.0.0',
    cards: results.filter(r => r.success).map(r => ({
      id: r.agent.id,
      name: r.agent.name,
      rarity: r.agent.rarity,
      drop_rate: getDropRate(r.agent.rarity),
      card_data_path: r.jsonPath
    })),
    total_drop_rates: {
      UR: '3%',
      SSR: '7%',
      SR: '20%',
      R: '30%',
      N: '40%'
    }
  };
  
  writeFileSync(
    path.join(__dirname, 'claude-code-tcg', 'gacha_pool.json'),
    JSON.stringify(gachaPool, null, 2)
  );
  
  console.log('\n✨ Claude Code TCG System Ready!');
  console.log('📁 Check claude-code-tcg/ directory');
  console.log('🎰 Gacha pool configuration created');
}

function getDropRate(rarity) {
  const rates = {
    UR: 0.03,
    SSR: 0.07,
    SR: 0.20,
    R: 0.30,
    N: 0.40
  };
  return rates[rarity] || 0.40;
}

// Execute
main().catch(console.error);