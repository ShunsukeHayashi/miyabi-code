#!/usr/bin/env node
/**
 * omakase.ai 事業計画スライド画像生成スクリプト
 * BytePlus ARK API (seedream-4-0-250828) を使用
 *
 * 彩（ImageGenAgent）による手書き風インフォグラフィック生成
 */

import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

// 設定
const CONFIG = {
  apiKey: process.env.BYTEPLUS_API_KEY || '',
  apiEndpoint: 'https://ark.ap-southeast-1.bytepluses.com/api/v3/images/generations',
  model: 'seedream-4-0-250828',
  outputDir: '/Users/shunsuke/Dev/omakase_ai/docs/slides/images',
  rateLimitMs: 2000,
  maxRetries: 3,
  width: 1920,
  height: 1080,
  responseFormat: 'b64_json',
  watermark: false,
};

// スライド定義
interface SlideSpec {
  id: string;
  filename: string;
  prompt: string;
  negativePrompt: string;
}

const SLIDES: SlideSpec[] = [
  {
    id: 'slide_01_title',
    filename: 'slide_01_title.png',
    prompt: `Hand-drawn whiteboard style infographic illustration, graphic recording aesthetic.
Central large smartphone device in black outline, emitting colorful purple and blue sound waves radiating outward.
Surrounding the phone: shopping cart icon, clothing items (shirt, dress), shoes icons, all in simple line art.
A cheerful stick figure person with a smiling face talking to the smartphone, speech bubble indicated.
Marker pen and crayon texture, white paper background texture.
Color accents: yellow/orange, blue/green, purple highlights with black outlines.
Friendly, startup pitch deck vibe, professional yet approachable.
High quality, clean composition, 8k resolution.`,
    negativePrompt: 'Japanese text, kanji, hiragana, katakana, English text, words, letters, realistic photo, 3D render, cluttered, busy, dark, gloomy, low quality, blurry, distorted',
  },
  {
    id: 'slide_02_problem',
    filename: 'slide_02_problem.png',
    prompt: `Hand-drawn whiteboard style infographic, graphic recording aesthetic.
Stressed stick figure person holding head in hands, distressed expression.
Large boulder/rock pressing down from above, crushing weight metaphor.
Left side: downward red graph arrow trending down.
Right side: upward red graph arrow trending up sharply.
Dark cloudy atmosphere with gray storm clouds.
Marker pen texture, white paper background.
Color scheme: red for graphs, gray for clouds, black outlines, minimal color accents.
Conveys struggle and pressure, business challenges.
High quality, clean composition, 8k resolution.`,
    negativePrompt: 'Japanese text, any text, letters, words, realistic photo, 3D render, cheerful, bright, colorful, low quality, blurry',
  },
  {
    id: 'slide_03_solution',
    filename: 'slide_03_solution.png',
    prompt: `Hand-drawn whiteboard style infographic, graphic recording aesthetic.
Friendly robot character with superhero cape, simple line art design.
Robot shooting laser beam from hand, shattering the boulder into pieces.
Shattered rock pieces transforming into sparkling crystals and gems.
The previously distressed stick figure now smiling with victorious pose, arms raised in celebration.
Bright yellow sunburst radiating from center background.
Marker pen and crayon texture, white paper background.
Color scheme: yellow sunburst, blue/purple robot, orange cape, black outlines.
Triumphant, hopeful, solution-focused atmosphere.
High quality, clean composition, 8k resolution.`,
    negativePrompt: 'Japanese text, any text, realistic photo, 3D render, dark, gloomy, complex details, low quality, blurry',
  },
  {
    id: 'slide_04_market',
    filename: 'slide_04_market.png',
    prompt: `Hand-drawn whiteboard style infographic, graphic recording aesthetic.
Blue ocean representing market opportunity, waves illustrated with blue marker strokes.
Central treasure island with palm trees and treasure chest.
Large flag planted on the island peak.
Small distant ships (competitors) far from the island, not yet arrived.
Large upward growth arrow trending skyward.
Treasure chest with coins spilling out.
Marker pen texture, white paper background.
Color scheme: blue ocean, green island, yellow treasure, orange flag, black outlines.
Conveys untapped market opportunity and growth potential.
High quality, clean composition, 8k resolution.`,
    negativePrompt: 'Japanese text, any text, realistic photo, 3D render, crowded, busy, dark colors, low quality, blurry',
  },
  {
    id: 'slide_05_business',
    filename: 'slide_05_business.png',
    prompt: `Hand-drawn whiteboard style infographic, graphic recording aesthetic.
Large pie chart in center: 70% blue segment, 15% green segment, 10% yellow segment, 5% red segment, clear segment divisions.
Three pricing plan boxes arranged horizontally below the chart, simple rectangular boxes.
Gold coins falling from above like rain, simple circle shapes with currency symbols.
Stick figure customers looking up at the chart, smiling faces.
Marker pen texture, white paper background.
Color scheme: blue, green, yellow, red for chart; gold coins; black outlines.
Conveys business model and revenue streams.
High quality, clean composition, 8k resolution.`,
    negativePrompt: 'Japanese text, any text, realistic photo, 3D render, complex charts, low quality, blurry',
  },
  {
    id: 'slide_06_roadmap',
    filename: 'slide_06_roadmap.png',
    prompt: `Hand-drawn whiteboard style infographic, graphic recording aesthetic.
Road path starting from left to right, gradually widening and ascending uphill.
Three milestone flags along the road path, spaced evenly, different colors (blue, green, purple).
Green rolling hills landscape in background, simple curved hill shapes.
Large goal flag at the top right end of the road.
Car or vehicle traveling up the road toward the goal.
Marker pen texture, white paper background.
Color scheme: gray road, green hills, colorful milestone flags, black outlines.
Conveys growth trajectory and future milestones.
High quality, clean composition, 8k resolution.`,
    negativePrompt: 'Japanese text, any text, realistic photo, 3D render, complex landscape, low quality, blurry',
  },
  {
    id: 'slide_07_moat',
    filename: 'slide_07_moat.png',
    prompt: `Hand-drawn whiteboard style infographic, graphic recording aesthetic.
Medieval castle in center, simple castle outline with towers and battlements.
Four concentric moat rings surrounding the castle, each a different color: innermost blue, then green, purple, outermost orange.
Small boats on outer moat trying to approach, unable to penetrate the moats.
Large flag on top of the castle tower.
Marker pen texture, white paper background.
Color scheme: gray castle, blue/green/purple/orange moats, black outlines.
Conveys competitive advantage and defensive moats.
High quality, clean composition, 8k resolution.`,
    negativePrompt: 'Japanese text, any text, realistic photo, 3D render, complex architecture, low quality, blurry',
  },
  {
    id: 'slide_08_closing',
    filename: 'slide_08_closing.png',
    prompt: `Hand-drawn whiteboard style infographic, graphic recording aesthetic.
Large purple megaphone in center, bold and prominent.
Items bursting out from the megaphone: gold coins, hearts, shopping products, stars.
Two stick figures: one representing shop owner/seller (left) and one customer (right), both with big smiles.
Upward trending graph arrow in background.
Stars and sparkles scattered around for celebratory feel.
Large orange button/circle element at bottom (call-to-action metaphor).
Marker pen and crayon texture, white paper background.
Color scheme: purple megaphone, orange button, gold coins, mixed colorful elements, black outlines.
Conveys call to action, growth, and mutual success.
High quality, clean composition, 8k resolution.`,
    negativePrompt: 'Japanese text, any text, realistic photo, 3D render, dark, gloomy, low quality, blurry',
  },
];

// 画像生成関数
async function generateImage(slide: SlideSpec): Promise<void> {
  console.log(`[ImageGenAgent/彩] Starting generation: ${slide.id}`);

  const requestBody = {
    model: CONFIG.model,
    prompt: slide.prompt,
    negative_prompt: slide.negativePrompt,
    width: CONFIG.width,
    height: CONFIG.height,
    response_format: CONFIG.responseFormat,
    watermark: CONFIG.watermark,
  };

  let retries = 0;

  while (retries < CONFIG.maxRetries) {
    try {
      console.log(`[ImageGenAgent/彩] API Request: ${slide.id} (attempt ${retries + 1}/${CONFIG.maxRetries})`);

      const response = await axios.post(CONFIG.apiEndpoint, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.apiKey}`,
        },
        timeout: 60000,
      });

      if (response.status === 200 && response.data.data && response.data.data.length > 0) {
        const base64Data = response.data.data[0].b64_json;
        const imageBuffer = Buffer.from(base64Data, 'base64');

        const outputPath = path.join(CONFIG.outputDir, slide.filename);
        fs.writeFileSync(outputPath, imageBuffer);

        const stats = fs.statSync(outputPath);
        const sizeKB = (stats.size / 1024).toFixed(1);

        console.log(`[ImageGenAgent/彩] SUCCESS: ${slide.filename} (${sizeKB} KB, ${CONFIG.width}x${CONFIG.height})`);
        return;
      } else {
        throw new Error('Invalid API response format');
      }
    } catch (error: any) {
      retries++;
      console.error(`[ImageGenAgent/彩] ERROR (attempt ${retries}/${CONFIG.maxRetries}): ${error.message}`);

      if (retries < CONFIG.maxRetries) {
        const delay = CONFIG.rateLimitMs * retries;
        console.log(`[ImageGenAgent/彩] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw new Error(`Failed to generate ${slide.id} after ${CONFIG.maxRetries} attempts: ${error.message}`);
      }
    }
  }
}

// メイン実行
async function main() {
  console.log('[ImageGenAgent/彩] omakase.ai スライド画像生成開始！');
  console.log(`[ImageGenAgent/彩] 出力先: ${CONFIG.outputDir}`);
  console.log(`[ImageGenAgent/彩] 総スライド数: ${SLIDES.length}`);

  // APIキー確認
  if (!CONFIG.apiKey) {
    throw new Error('BYTEPLUS_API_KEY environment variable is not set');
  }

  // 出力ディレクトリ作成
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
    console.log(`[ImageGenAgent/彩] Created output directory: ${CONFIG.outputDir}`);
  }

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < SLIDES.length; i++) {
    const slide = SLIDES[i];
    console.log(`\n[ImageGenAgent/彩] === Slide ${i + 1}/${SLIDES.length}: ${slide.id} ===`);

    try {
      await generateImage(slide);
      successCount++;

      // レート制限
      if (i < SLIDES.length - 1) {
        console.log(`[ImageGenAgent/彩] Rate limit wait: ${CONFIG.rateLimitMs}ms`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.rateLimitMs));
      }
    } catch (error: any) {
      console.error(`[ImageGenAgent/彩] FAILED: ${slide.id} - ${error.message}`);
      failCount++;
    }
  }

  console.log('\n[ImageGenAgent/彩] === 生成完了サマリー ===');
  console.log(`成功: ${successCount}/${SLIDES.length}`);
  console.log(`失敗: ${failCount}/${SLIDES.length}`);
  console.log(`出力先: ${CONFIG.outputDir}`);

  if (failCount > 0) {
    process.exit(1);
  }
}

// 実行
main().catch(error => {
  console.error('[ImageGenAgent/彩] FATAL ERROR:', error);
  process.exit(1);
});
