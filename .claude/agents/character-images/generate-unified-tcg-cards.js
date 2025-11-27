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

// Unified frame specification
const UNIFIED_FRAME_SPEC = `
CRITICAL - UNIFIED FRAME SPECIFICATIONS:
- Card must be EXACTLY 63mm x 88mm ratio with 3.5mm rounded corners
- MANDATORY three-layer frame structure (ALL cards must follow this exactly):
  1. Outermost border: 2mm solid dark grey (#1a1a1a) - NO VARIATIONS
  2. Rarity frame: 3mm width (ONLY the color changes by rarity, width stays 3mm)
  3. Base frame: 8mm solid black (#000000) with subtle cyberpunk circuit patterns
  
- PRECISE element placement (measured from card edge):
  - Top bar: 0-15mm from top (contains rarity, attribute, level)
  - Artwork area: 15-53mm from top (exactly 47mm x 38mm)
  - Name bar: 53-61mm from top (8mm height, semi-transparent black)
  - Stats box: 61-73mm from top (12mm height)
  - Skill box: 73-85mm from top
  - Bottom info: 85-88mm from top
  
- CONSISTENT styling:
  - All text boxes must use exact same corner radius (2mm)
  - All borders must be exactly 1px white
  - Font must be consistent across all cards
  - Shadow effects must be identical`;

// TCG Card Templates
const TCG_AGENTS = [
  {
    id: 'shikiroon',
    name: { jp: 'しきるん', en: 'Shikiroon' },
    title: { jp: 'タスク調整と並列実行の指揮者', en: 'Coordinator' },
    rarity: 'SSR',
    level: 45,
    type: ['Coding', 'Coordinator'],
    attribute: '⚡Lightning',
    stats: { hp: 1800, atk: 850, def: 950, spd: 720 },
    skill: {
      name: 'パラレル・オーケストラ',
      desc: '複数のエージェントを同時に指揮し、タスク効率を300%向上させる。'
    },
    evolution: 'しきるんEX'
  },
  {
    id: 'tsukuroon',
    name: { jp: 'つくるん', en: 'Tsukuroon' },
    title: { jp: 'コード生成の天才プログラマー', en: 'Code Generator' },
    rarity: 'SR',
    level: 38,
    type: ['Coding', 'Generator'],
    attribute: '🌙Dark',
    stats: { hp: 1500, atk: 1200, def: 600, spd: 850 },
    skill: {
      name: 'コードバースト',
      desc: '瞬間的に1000行のコードを生成。バグ発生率わずか0.1%。'
    },
    evolution: 'つくるんPRO'
  },
  {
    id: 'medaman',
    name: { jp: 'めだまん', en: 'Medaman' },
    title: { jp: '完璧主義のコードレビュアー', en: 'Code Reviewer' },
    rarity: 'UR',
    level: 72,
    type: ['Coding', 'Analyzer'],
    attribute: '💧Water',
    stats: { hp: 2200, atk: 700, def: 1300, spd: 600 },
    skill: {
      name: '絶対評価の瞳',
      desc: 'すべてのバグを見逃さない。コード品質を100点満点で即座に評価。'
    },
    evolution: 'めだまんΩ'
  },
  {
    id: 'mitsukeroon',
    name: { jp: 'みつけるん', en: 'Mitsukeroon' },
    title: { jp: 'Issue発見のスペシャリスト', en: 'Issue Analyzer' },
    rarity: 'R',
    level: 25,
    type: ['Coding', 'Detective'],
    attribute: '🔥Fire',
    stats: { hp: 1200, atk: 900, def: 700, spd: 950 },
    skill: {
      name: 'バグハンター',
      desc: '隠れたバグを瞬時に発見。Issue作成速度が200%向上。'
    },
    evolution: 'みつけるんDX'
  },
  {
    id: 'matomeroon',
    name: { jp: 'まとめるん', en: 'Matomeroon' },
    title: { jp: 'PR作成のマエストロ', en: 'PR Agent' },
    rarity: 'SR',
    level: 40,
    type: ['Coding', 'Merger'],
    attribute: '✨Light',
    stats: { hp: 1600, atk: 800, def: 900, spd: 750 },
    skill: {
      name: 'マージ・シンフォニー',
      desc: 'コンフリクトを優雅に解決。完璧なPRを作成する。'
    },
    evolution: 'まとめるんMASTER'
  }
];

// Character descriptions
function getCharacterDescription(id) {
  const descriptions = {
    shikiroon: 'emerald green short hair, sharp intellectual glasses, forest green conductor uniform with gold braiding, holding cyan glowing conductor baton',
    tsukuroon: 'messy dark navy blue hair, gaming headset around neck, oversized navy hoodie with glowing binary code patterns, tired but focused expression',
    medaman: 'ice blue bob cut hair, rimless smart glasses with scrolling data display, white blazer with light blue glowing accents, holding holographic tablet',
    mitsukeroon: 'bright yellow spiky hair, amber eyes full of energy, yellow and black caution tape pattern hoodie, large headphones, futuristic magnifying glass',
    matomeroon: 'wavy lavender purple hair in small ponytail, kind violet eyes, purple and white courier jacket, git-merge icon pin, messenger bag with blueprints'
  };
  return descriptions[id] || '';
}

// Rarity frame colors
function getRarityFrameDesc(rarity) {
  const frames = {
    'UR': 'animated rainbow gradient shifting through all colors of spectrum',
    'SSR': 'bright metallic gold with sparkling effect',
    'SR': 'polished silver metallic',
    'R': 'deep metallic blue',
    'N': 'light grey'
  };
  return frames[rarity] || frames['N'];
}

// Generate unified TCG card prompt
function generateUnifiedTCGPrompt(agent, index) {
  return `Create a professional TCG (Trading Card Game) card for ${agent.name.jp} with EXACTLY uniform frame design.

${UNIFIED_FRAME_SPEC}

RARITY-SPECIFIC ELEMENTS:
- Rarity frame (3mm layer) color: ${getRarityFrameDesc(agent.rarity)}
- Card number: No.${String(index + 1).padStart(3, '0')}

CHARACTER SPECIFICS:
- Character: ${agent.name.jp} (${agent.name.en}) 
- Appearance: ${getCharacterDescription(agent.id)}
- Dynamic action pose showing their specialty
- Background: Holographic cyberpunk environment

CARD CONTENT (following exact placement specs):

TOP BAR (0-15mm):
- Left: "${agent.rarity}" in metallic letters
- Center: ${agent.attribute} icon with glow
- Right: "Lv.${agent.level}" in digital font

ARTWORK AREA (15-53mm):
- Exact dimensions: 47mm x 38mm
- Character illustration with particle effects
- 1mm black border around artwork

NAME BAR (53-61mm):
- Background: Semi-transparent black (rgba(0,0,0,0.8))
- Text: "【${agent.name.jp}】${agent.title.jp}"
- White text, gothic font

STATS BOX (61-73mm):
- Background: Semi-transparent grey (rgba(128,128,128,0.3))
- HP: ${agent.stats.hp} ❤️ | ATK: ${agent.stats.atk} ⚔️ | DEF: ${agent.stats.def} 🛡️ | SPD: ${agent.stats.spd} ⚡
- Type: [${agent.type.join('/')}]

SKILL BOX (73-85mm):
- Background: Semi-transparent black (rgba(0,0,0,0.6))
- "【${agent.skill.name}】"
- "${agent.skill.desc}"

BOTTOM INFO (85-88mm):
- Left: "No.${String(index + 1).padStart(3, '0')} / 1st Edition"
- Right: "MIYABI TCG © 2025"
- Center: Evolution arrow "→ ${agent.evolution}"

CRITICAL: The frame structure must be IDENTICAL across all cards. Only the rarity frame COLOR changes.`;
}

async function generateUnifiedTCGCard(agent, index) {
  console.log(`\n[${index + 1}/${TCG_AGENTS.length}] 🎴 Generating unified TCG card for ${agent.name.jp}...`);
  
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
        text: generateUnifiedTCGPrompt(agent, index)
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
      
      const outputDir = path.join(__dirname, 'unified-tcg-cards');
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }
      
      const outputPath = path.join(outputDir, `${agent.id}_unified_${agent.rarity}.png`);
      writeFileSync(outputPath, buffer);
      
      console.log(`✅ Unified TCG card saved: ${outputPath}`);
      return { success: true, path: outputPath };
    }
    
    throw new Error('No image data in response');
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ Error: GEMINI_API_KEY not set!');
    process.exit(1);
  }
  
  console.log('🎮 Miyabi Agent TCG Card Generation - UNIFIED FRAMES');
  console.log('=' * 60);
  console.log('Creating cards with perfectly consistent frame design...');
  console.log('');
  console.log('Frame specifications:');
  console.log('- Outer border: 2mm dark grey (ALL cards)');
  console.log('- Rarity frame: 3mm (color varies)');
  console.log('- Base frame: 8mm black (ALL cards)');
  console.log('=' * 60);
  
  const results = [];
  const startTime = Date.now();
  
  for (let i = 0; i < TCG_AGENTS.length; i++) {
    const result = await generateUnifiedTCGCard(TCG_AGENTS[i], i);
    results.push({
      agent: TCG_AGENTS[i],
      ...result
    });
    
    if (i < TCG_AGENTS.length - 1) {
      console.log('⏳ Waiting 3 seconds...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);
  const successful = results.filter(r => r.success).length;
  
  console.log('\n' + '=' * 60);
  console.log('📊 Generation Complete!');
  console.log(`⏱️  Time: ${duration} seconds`);
  console.log(`✅ Success: ${successful}/${TCG_AGENTS.length} cards`);
  
  // Save metadata
  const metadata = {
    generated_at: new Date().toISOString(),
    card_type: 'TCG_UNIFIED',
    frame_version: '1.0.0',
    frame_spec: {
      outer_border: '2mm #1a1a1a',
      rarity_frame: '3mm (color varies)',
      base_frame: '8mm #000000',
      total_frame_width: '13mm'
    },
    total_cards: TCG_AGENTS.length,
    successfully_generated: successful,
    cards: results.map(r => ({
      ...r.agent,
      generated: r.success,
      filename: r.success ? `${r.agent.id}_unified_${r.agent.rarity}.png` : null
    }))
  };
  
  writeFileSync(
    path.join(__dirname, 'unified-tcg-cards', 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );
  
  console.log('\n✨ All cards now have unified frame structure!');
  console.log('📁 Check unified-tcg-cards/ directory');
}

main().catch(console.error);