#!/usr/bin/env node

import { GoogleGenAI } from '@google/genai';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Gemini AI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// Claude Code: The Agent Architect card data
const ARCHITECT_CARD = {
  id: 'claude-architect',
  name: { 
    jp: 'クロード・アーキテクト', 
    en: 'Claude Code: The Agent Architect' 
  },
  title: 'Claude Codeエージェントシステムの創造主',
  rarity: 'UR',
  level: 99,
  type: ['システム開発', 'AIエージェント'],
  attribute: '🏗️Architecture',
  
  // Variable stats (gacha range)
  stats_range: {
    system_architecture: { min: 900, max: 999 },
    stability: { min: 850, max: 950 },
    extensibility: { min: 880, max: 980 },
    knowledge_base: { min: 950, max: 999 },
    tool_proficiency: { min: 920, max: 990 }
  },
  
  // Skills
  skills: [
    {
      name: '.claude 完全理解',
      eng: 'Directory Mastery',
      effect: 'プロジェクトルートの.claude/ディレクトリ構造を完全把握'
    },
    {
      name: '設定ファイル最適化',
      eng: 'Config Optimization',
      effect: 'settings.jsonの最適化でプロジェクト安定性向上'
    },
    {
      name: 'コンテキスト注入',
      eng: 'Context Injection',
      effect: 'CLAUDE.mdでプロジェクト情報を効率的に理解'
    },
    {
      name: 'カスタムコマンド生成',
      eng: 'Slash Command Creation',
      effect: '/commandで呼び出せる再利用可能なコマンド構築'
    },
    {
      name: 'エージェント定義',
      eng: 'Subagent Definition',
      effect: '専門分野を持つサブエージェントを定義'
    },
    {
      name: 'イベントハンドリング',
      eng: 'Hooks Integration',
      effect: 'hooks.jsonでカスタム処理を実装'
    },
    {
      name: 'スキル開発',
      eng: 'Skills Development',
      effect: '複雑なワークフローをスキルとして定義'
    },
    {
      name: 'プラグイン化',
      eng: 'Plugin Packaging',
      effect: '開発機能をプラグインとしてパッケージ化'
    }
  ],
  
  flavor_text: 'Claude Codeの真髄は、単なるコード生成にあらず。それは、開発者とAIが協調し、堅牢かつ柔軟なシステムを構築するためのフレームワークである。'
};

// Generate rolled stats
function rollStats(statsRange) {
  const rolledStats = {};
  for (const [stat, range] of Object.entries(statsRange)) {
    rolledStats[stat] = Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  }
  return rolledStats;
}

// Generate card prompt
function generateArchitectCardPrompt() {
  const rolledStats = rollStats(ARCHITECT_CARD.stats_range);
  
  return `Create an ULTRA RARE double-sided TCG card for "Claude Code: The Agent Architect" - the ultimate system development card.

CARD SPECIFICATIONS:
- Ultra Rare (UR) rarity with rainbow holographic frame
- Card size: 63mm x 88mm with premium effects
- Double-sided design: Front (Character) and Back (Technical Details)

FRONT SIDE DESIGN:
- Title: "Claude Code: The Agent Architect" / "クロード・アーキテクト"
- Visual: A majestic figure in futuristic architect robes, surrounded by floating holographic code structures and .claude directory trees. The character has an ethereal, AI-like appearance with circuit patterns on the robes.
- Background: A vast digital landscape showing interconnected agent systems, with glowing nodes representing different Claude Code components
- Attribute: 🏗️Architecture (System Development)
- Level: 99 (MAX)
- Rarity: UR with rainbow prismatic effects

STATS DISPLAY (Rolled values):
- 構築力 (System Architecture): ${rolledStats.system_architecture}/999
- 安定性 (Stability): ${rolledStats.stability}/950
- 拡張性 (Extensibility): ${rolledStats.extensibility}/980
- 知識量 (Knowledge Base): ${rolledStats.knowledge_base}/999
- ツール習熟度 (Tool Proficiency): ${rolledStats.tool_proficiency}/990

SKILLS SECTION (List all 8 skills):
${ARCHITECT_CARD.skills.map((skill, i) => `${i+1}. 【${skill.name}】${skill.eng}`).join('\\n')}

BACK SIDE DESIGN:
- Dark technical theme with flowing data streams
- Title: "CLAUDE CODE SYSTEM ARCHITECTURE"
- Directory structure visualization:
  .claude/
  ├── settings.json
  ├── settings.local.json
  ├── CLAUDE.md
  ├── commands/
  ├── agents/
  ├── hooks.json
  ├── skills/
  └── .claude-plugin/

- Key configuration examples shown as holographic panels
- QR code containing link to official documentation
- Flavor text at bottom: "${ARCHITECT_CARD.flavor_text}"

SPECIAL EFFECTS:
- Rainbow holographic foil on both sides
- Embossed text for skill names
- UV spot coating on the character
- Particle effects suggesting data flow
- Premium card stock texture

The image should show BOTH sides of the card with a slight 3D perspective, emphasizing its ultra-rare status with spectacular visual effects.`;
}

// Generate gacha card data
function generateGachaCardData(rolledStats) {
  return {
    card_id: `MIYABI-ARCHITECT-UR-${Date.now()}`,
    version: '1.0.0',
    
    // Visual info
    visual: {
      name_jp: ARCHITECT_CARD.name.jp,
      name_en: ARCHITECT_CARD.name.en,
      title: ARCHITECT_CARD.title,
      rarity: ARCHITECT_CARD.rarity,
      level: ARCHITECT_CARD.level,
      type: ARCHITECT_CARD.type,
      attribute: ARCHITECT_CARD.attribute,
      flavor_text: ARCHITECT_CARD.flavor_text
    },
    
    // Rolled stats
    stats: {
      system_architecture: rolledStats.system_architecture,
      stability: rolledStats.stability,
      extensibility: rolledStats.extensibility,
      knowledge_base: rolledStats.knowledge_base,
      tool_proficiency: rolledStats.tool_proficiency
    },
    
    // Skills with full descriptions
    skills: ARCHITECT_CARD.skills.map(skill => ({
      name: skill.name,
      name_en: skill.eng,
      effect: skill.effect,
      type: 'passive',
      activation: 'automatic'
    })),
    
    // Claude Code integration info
    claude_code_mastery: {
      directories: [
        '.claude/settings.json',
        '.claude/settings.local.json',
        '.claude/CLAUDE.md',
        '.claude/commands/',
        '.claude/agents/',
        '.claude/hooks.json',
        '.claude/skills/',
        '.claude-plugin/plugin.json'
      ],
      
      documentation_links: {
        main: 'https://code.claude.com/docs/',
        japanese: 'https://code.claude.com/docs/ja/',
        full_map: 'https://code.claude.com/docs/en/claude_code_docs_map.md'
      },
      
      capabilities: [
        'Complete .claude directory mastery',
        'Settings optimization',
        'Context injection via CLAUDE.md',
        'Custom slash command creation',
        'Subagent definition and orchestration',
        'Event handling with hooks',
        'Skill development',
        'Plugin packaging'
      ]
    },
    
    // Gacha info
    gacha: {
      pool: 'Premium Agent Development Gacha',
      drop_rate: '0.5%',
      pity_count: 180,
      limited: false,
      special_effect: 'Guarantees successful agent system implementation'
    },
    
    generated_at: new Date().toISOString()
  };
}

// Main generation function
async function generateArchitectCard() {
  console.log('🏗️ Generating Claude Code: The Agent Architect UR Card...');
  
  try {
    const config = {
      responseModalities: ['IMAGE'],
      imageConfig: {
        imageSize: '4K' // Maximum quality for UR card
      }
    };
    
    const model = 'models/gemini-3-pro-image-preview';
    const contents = [{
      role: 'user',
      parts: [{
        text: generateArchitectCardPrompt()
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
      
      // Save card image
      const imagePath = path.join(outputDir, 'claude_architect_UR.png');
      writeFileSync(imagePath, buffer);
      
      // Generate and save card data
      const rolledStats = rollStats(ARCHITECT_CARD.stats_range);
      const cardData = generateGachaCardData(rolledStats);
      const jsonPath = path.join(outputDir, 'claude_architect_card_data.json');
      writeFileSync(jsonPath, JSON.stringify(cardData, null, 2));
      
      console.log('✅ UR Card generated successfully!');
      console.log(`🎴 Image: ${imagePath}`);
      console.log(`📊 Data: ${jsonPath}`);
      console.log('\nRolled Stats:');
      Object.entries(rolledStats).forEach(([stat, value]) => {
        console.log(`  ${stat}: ${value}`);
      });
      
      return { success: true, imagePath, jsonPath, cardData };
    }
    
    throw new Error('No image data in response');
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Execute if run directly
if (import.meta.url === `file://${__filename}`) {
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ Error: GEMINI_API_KEY not set!');
    process.exit(1);
  }
  
  generateArchitectCard().then(result => {
    if (result.success) {
      console.log('\n🌟 Claude Code: The Agent Architect UR card is ready!');
      console.log('This ultra-rare card provides complete mastery over Claude Code systems.');
    }
  });
}

export { generateArchitectCard, ARCHITECT_CARD };