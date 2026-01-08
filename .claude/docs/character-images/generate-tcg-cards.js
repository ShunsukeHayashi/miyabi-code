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

// TCG Card Templates for each agent
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
    evolution: 'しきるんEX',
    color_scheme: 'emerald_green_gold'
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
    evolution: 'つくるんPRO',
    color_scheme: 'navy_blue_cyan'
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
    evolution: 'めだまんΩ',
    color_scheme: 'ice_blue_silver'
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
    evolution: 'みつけるんDX',
    color_scheme: 'yellow_orange'
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
    evolution: 'まとめるんMASTER',
    color_scheme: 'lavender_purple'
  }
];

// TCG Card Generation Prompt Template
function generateTCGCardPrompt(agent) {
  return `Create a high-quality anime-style TCG (Trading Card Game) card design featuring ${agent.name.jp} (${agent.name.en}).

CARD LAYOUT REQUIREMENTS:
- Card format: Standard TCG vertical rectangle with rounded corners
- Background: Holographic ${agent.color_scheme} gradient with circuit patterns
- Border: ${agent.rarity === 'UR' ? 'Rainbow holographic' : agent.rarity === 'SSR' ? 'Gold metallic' : agent.rarity === 'SR' ? 'Silver metallic' : 'Blue metallic'} frame

TOP SECTION:
- Top left: Large rarity indicator "${agent.rarity}" in gleaming letters
- Top center: Attribute icon ${agent.attribute} with glow effect
- Top right: "Lv.${agent.level}" in digital font

ARTWORK SECTION (Upper half):
- Feature ${agent.name.jp} in dynamic action pose
- Character should match previous descriptions: ${getCharacterDescription(agent.id)}
- Add particle effects and energy aura matching the attribute
- Background: Cyberpunk environment with holographic displays

TITLE BAR:
- Name: "【${agent.name.jp}】" in bold Japanese font
- Subtitle: "${agent.title.jp}" in smaller text
- Type tags: [${agent.type.join('/')}] in tech-style boxes

STATS SECTION (Transparent overlay box):
- HP: ${agent.stats.hp} with health bar visual
- ATK: ${agent.stats.atk} ⚔️ | DEF: ${agent.stats.def} 🛡️ | SPD: ${agent.stats.spd} ⚡

SKILL BOX:
- Skill name: "【${agent.skill.name}】" with skill icon
- Description: "${agent.skill.desc}"
- Cost indicator and cooldown timer graphics

BOTTOM SECTION:
- Evolution indicator: "進化 → ${agent.evolution}"
- Card number: "No.${String(TCG_AGENTS.indexOf(agent) + 1).padStart(3, '0')}"
- Edition mark: "1st Edition ✦"
- Foil effect: ${agent.rarity === 'UR' || agent.rarity === 'SSR' ? 'Yes' : 'No'}

STYLE:
- Anime TCG aesthetic similar to Pokemon/Yu-Gi-Oh cards
- Sharp, clean lines with gradient shading
- Holographic and metallic effects for rare cards
- Professional trading card game quality
- Cyberpunk/digital theme elements`;
}

// Character descriptions for consistency
function getCharacterDescription(id) {
  const descriptions = {
    shikiroon: 'emerald green short hair, sharp glasses, forest green conductor uniform with gold braiding, cyan glowing baton',
    tsukuroon: 'messy dark navy blue hair, gaming headset, oversized navy hoodie with glowing binary patterns, tired but focused expression',
    medaman: 'ice blue bob cut, rimless smart glasses with data display, white blazer with light blue accents, holographic tablet',
    mitsukeroon: 'bright yellow spiky hair, amber eyes, yellow/black caution tape hoodie, large headphones, futuristic magnifying glass',
    matomeroon: 'wavy lavender purple hair in ponytail, violet eyes, purple/white courier jacket, git-merge pin, messenger bag'
  };
  return descriptions[id] || '';
}

async function generateTCGCard(agent, index) {
  console.log(`\n[${index + 1}/${TCG_AGENTS.length}] 🎴 Generating TCG card for ${agent.name.jp}...`);
  
  try {
    const config = {
      responseModalities: ['IMAGE'],
      imageConfig: {
        imageSize: '2K' // Higher resolution for card details
      }
    };
    
    const model = 'models/gemini-3-pro-image-preview';
    const contents = [{
      role: 'user',
      parts: [{
        text: generateTCGCardPrompt(agent)
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
      
      const outputDir = path.join(__dirname, 'tcg-cards');
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }
      
      const outputPath = path.join(outputDir, `${agent.id}_tcg_${agent.rarity}.png`);
      writeFileSync(outputPath, buffer);
      
      console.log(`✅ TCG card saved: ${outputPath}`);
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
  
  console.log('🎮 Miyabi Agent TCG Card Generation');
  console.log('=' * 50);
  console.log(`Generating ${TCG_AGENTS.length} TCG cards with game elements...`);
  
  const results = [];
  const startTime = Date.now();
  
  for (let i = 0; i < TCG_AGENTS.length; i++) {
    const result = await generateTCGCard(TCG_AGENTS[i], i);
    results.push({
      agent: TCG_AGENTS[i],
      ...result
    });
    
    if (i < TCG_AGENTS.length - 1) {
      console.log('⏳ Waiting 3 seconds...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // Summary
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);
  const successful = results.filter(r => r.success).length;
  
  console.log('\n' + '=' * 50);
  console.log('📊 Generation Complete!');
  console.log(`⏱️  Time: ${duration} seconds`);
  console.log(`✅ Success: ${successful}/${TCG_AGENTS.length} cards`);
  
  // Save metadata
  const metadata = {
    generated_at: new Date().toISOString(),
    card_type: 'TCG',
    total_cards: TCG_AGENTS.length,
    successfully_generated: successful,
    cards: results.map(r => ({
      ...r.agent,
      generated: r.success,
      filename: r.success ? `${r.agent.id}_tcg_${r.agent.rarity}.png` : null
    }))
  };
  
  writeFileSync(
    path.join(__dirname, 'tcg-cards', 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );
  
  console.log('\n🎯 Next steps:');
  console.log('1. Check tcg-cards/ directory for generated cards');
  console.log('2. Open tcg-gallery.html to view collection');
  console.log('3. Use cards for agent visualization and gamification');
}

main().catch(console.error);