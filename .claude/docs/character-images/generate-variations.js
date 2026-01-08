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

// バリエーション定義
const VARIATIONS = {
  expressions: [
    { id: 'normal', desc: '通常の穏やかな表情' },
    { id: 'focused', desc: '真剣に集中している表情' },
    { id: 'happy', desc: '成功して喜んでいる表情' },
    { id: 'confused', desc: '問題を発見して困惑している表情' },
    { id: 'determined', desc: '解決に向かう決意の表情' }
  ],
  poses: [
    { id: 'standing', desc: '基本の立ちポーズ' },
    { id: 'action', desc: '仕事中の動的なアクションポーズ' },
    { id: 'sitting', desc: '座って作業しているポーズ' },
    { id: 'pointing', desc: '指差して説明しているポーズ' },
    { id: 'victory', desc: '両手を上げた成功のポーズ' }
  ],
  situations: [
    { id: 'office', desc: 'モダンなオフィス環境' },
    { id: 'server', desc: 'サーバールーム、青い光のケーブル' },
    { id: 'meeting', desc: 'ガラス張りの会議室' },
    { id: 'outdoor', desc: '公園でリラックス、桜の木' },
    { id: 'virtual', desc: 'ネオンのデジタル空間' }
  ]
};

// キャラクター固定要素
const CHARACTER_BASES = {
  shikiroon: {
    name: 'しきるん (Shikiroon)',
    base: 'エメラルドグリーンのショートヘア、明るい緑の目、深緑の指揮者風ユニフォームに金の飾緒、シャープな知的メガネ、光るシアンの指揮棒を持つ',
    personality: '権威的だが可愛らしいリーダー'
  },
  tsukuroon: {
    name: 'つくるん (Tsukuroon)',
    base: 'ダークネイビーブルーの乱れた髪、深い青の目、光る二進法パターンの特大紺色パーカー、ゲーミングヘッドセット、ホログラフィックキーボード',
    personality: '集中力が高く、やや疲れた様子の開発者'
  },
  medaman: {
    name: 'めだまん (Medaman)',
    base: 'アイスブルーの顎までのボブカット、シアンの目、白のブレザーに水色の発光アクセント、データ表示のリムレススマートグラス、ホログラフィックタブレットとスタイラス',
    personality: '厳格でプロフェッショナルなレビュアー'
  },
  mitsukeroon: {
    name: 'みつけるん (Mitsukeroon)',
    base: '明るい黄色のスパイキーヘア、アンバーの目、黄色と黒の注意テープ柄ストリートウェアパーカー、大型ヘッドホン、未来的な虫眼鏡',
    personality: 'エネルギッシュで行動的な問題発見者'
  },
  matomeroon: {
    name: 'まとめるん (Matomeroon)',
    base: 'ラベンダーパープルの波状の髪を小さなポニーテール、バイオレットの目、紫と白の配達員風ジャケット、git-mergeアイコンのピン、設計図入りメッセンジャーバッグ',
    personality: '優しく親切なPR作成者'
  }
};

async function generateVariation(characterId, character, variation, outputPath) {
  console.log(`🎨 Generating: ${character.name} - ${variation.type} (${variation.desc})`);
  
  try {
    let prompt = `Masterpiece high-quality anime illustration of ${character.name}, `;
    prompt += `featuring ${character.base}. `;
    prompt += `The character shows ${character.personality} with ${variation.desc}. `;
    
    // バリエーションタイプ別の追加要素
    if (variation.type === 'expression') {
      prompt += `Focus on facial expression, showing ${variation.desc} clearly. `;
    } else if (variation.type === 'pose') {
      prompt += `Full body illustration in ${variation.desc}. `;
    } else if (variation.type === 'situation') {
      prompt += `Set in ${variation.desc} environment with appropriate background. `;
    }
    
    prompt += `Consistent character design, professional 2D anime art style, dramatic lighting, sharp details.`;
    
    const config = {
      responseModalities: ['IMAGE'],
      imageConfig: {
        imageSize: '1K'
      }
    };
    
    const model = 'models/gemini-3-pro-image-preview';
    const contents = [{
      role: 'user',
      parts: [{
        text: prompt
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
      
      writeFileSync(outputPath, buffer);
      console.log(`✅ Saved: ${outputPath}`);
      return { success: true };
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
  
  // コマンドライン引数処理
  const args = process.argv.slice(2);
  const selectedCharacter = args[0] || 'shikiroon';
  const variationType = args[1] || 'all'; // expression, pose, situation, all
  
  if (!CHARACTER_BASES[selectedCharacter]) {
    console.error(`❌ Unknown character: ${selectedCharacter}`);
    console.log('Available:', Object.keys(CHARACTER_BASES).join(', '));
    process.exit(1);
  }
  
  const character = CHARACTER_BASES[selectedCharacter];
  console.log(`\n🌸 Generating variations for ${character.name}`);
  console.log(`Type: ${variationType}\n`);
  
  // 出力ディレクトリ作成
  const outputDir = path.join(__dirname, 'variations', selectedCharacter);
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  
  const results = [];
  
  // バリエーション生成
  if (variationType === 'all' || variationType === 'expression') {
    for (const expr of VARIATIONS.expressions) {
      const outputPath = path.join(outputDir, `${selectedCharacter}_expr_${expr.id}.png`);
      const result = await generateVariation(selectedCharacter, character, 
        { ...expr, type: 'expression' }, outputPath);
      results.push(result);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  if (variationType === 'all' || variationType === 'pose') {
    for (const pose of VARIATIONS.poses) {
      const outputPath = path.join(outputDir, `${selectedCharacter}_pose_${pose.id}.png`);
      const result = await generateVariation(selectedCharacter, character, 
        { ...pose, type: 'pose' }, outputPath);
      results.push(result);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  if (variationType === 'all' || variationType === 'situation') {
    for (const situation of VARIATIONS.situations) {
      const outputPath = path.join(outputDir, `${selectedCharacter}_situ_${situation.id}.png`);
      const result = await generateVariation(selectedCharacter, character, 
        { ...situation, type: 'situation' }, outputPath);
      results.push(result);
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // サマリー
  const successful = results.filter(r => r.success).length;
  console.log(`\n✅ Generated: ${successful}/${results.length} variations`);
  
  // メタデータ保存
  const metadata = {
    character: selectedCharacter,
    generated_at: new Date().toISOString(),
    variations_count: successful,
    variations_type: variationType,
    files: results.filter(r => r.success).map((_, i) => {
      const type = i < 5 ? 'expression' : i < 10 ? 'pose' : 'situation';
      const subId = i % 5;
      const varId = VARIATIONS[type + 's'][subId].id;
      return `${selectedCharacter}_${type.substr(0,4)}_${varId}.png`;
    })
  };
  
  writeFileSync(
    path.join(outputDir, 'metadata.json'),
    JSON.stringify(metadata, null, 2)
  );
}

main().catch(console.error);