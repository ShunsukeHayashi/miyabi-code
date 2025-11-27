#!/usr/bin/env node

import { GoogleGenAI } from '@google/genai';
import { writeFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

const agent = {
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
};

async function generateCard() {
  console.log('🎴 Generating unified TCG card for まとめるん...');
  
  const prompt = `Create a professional TCG card with EXACTLY uniform frame design.

CRITICAL - UNIFIED FRAME SPECIFICATIONS:
- Card must be EXACTLY 63mm x 88mm ratio with 3.5mm rounded corners
- MANDATORY three-layer frame structure (ALL cards must follow this exactly):
  1. Outermost border: 2mm solid dark grey (#1a1a1a) - NO VARIATIONS
  2. Rarity frame: 3mm width polished silver metallic (SR)
  3. Base frame: 8mm solid black (#000000) with subtle cyberpunk circuit patterns

Character: まとめるん (Matomeroon)
Appearance: wavy lavender purple hair in small ponytail, kind violet eyes, purple and white courier jacket, git-merge icon pin, messenger bag with blueprints
Dynamic pose showing PR merging action

TOP BAR (0-15mm): SR | ✨Light | Lv.40
ARTWORK (15-53mm): Character illustration with particle effects
NAME BAR (53-61mm): 【まとめるん】PR作成のマエストロ
STATS BOX (61-73mm): HP:1600 ❤️ | ATK:800 ⚔️ | DEF:900 🛡️ | SPD:750 ⚡
SKILL BOX (73-85mm): 【マージ・シンフォニー】コンフリクトを優雅に解決。完璧なPRを作成する。
BOTTOM (85-88mm): No.005 / 1st Edition | MIYABI TCG © 2025 | → まとめるんMASTER`;

  try {
    const response = await ai.models.generateContent({
      model: 'models/gemini-3-pro-image-preview',
      config: {
        responseModalities: ['IMAGE'],
        imageConfig: { imageSize: '2K' }
      },
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    });

    if (response.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
      const buffer = Buffer.from(response.candidates[0].content.parts[0].inlineData.data, 'base64');
      const outputPath = path.join(__dirname, 'unified-tcg-cards', 'matomeroon_unified_SR.png');
      writeFileSync(outputPath, buffer);
      console.log('✅ Unified TCG card saved:', outputPath);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

generateCard();