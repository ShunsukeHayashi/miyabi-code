#!/usr/bin/env node

// To run this code: npm install @google/genai

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

// Load character prompts from JSON
const charactersData = JSON.parse(
  readFileSync(path.join(__dirname, 'prompts.json'), 'utf-8')
);

async function generateCharacterImage(character, index, total) {
  console.log(`\n[${index + 1}/${total}] 🎨 Generating ${character.name_jp} (${character.name_en})...`);
  
  try {
    const config = {
      responseModalities: ['IMAGE'],
      imageConfig: {
        imageSize: '1K' // Can be '1K', '2K', or '4K' for gemini-3-pro-image-preview
      }
    };
    
    const model = 'models/gemini-3-pro-image-preview';
    const contents = [{
      role: 'user',
      parts: [{
        text: character.prompt
      }]
    }];
    
    const response = await ai.models.generateContent({
      model,
      config,
      contents
    });
    
    // Extract and save image
    if (response.candidates?.[0]?.content?.parts?.[0]?.inlineData) {
      const inlineData = response.candidates[0].content.parts[0].inlineData;
      const buffer = Buffer.from(inlineData.data, 'base64');
      
      const outputPath = path.join(__dirname, 'generated', `${character.id}.png`);
      writeFileSync(outputPath, buffer);
      
      console.log(`✅ Saved: ${outputPath}`);
      return { success: true, path: outputPath };
    }
    
    throw new Error('No image data in response');
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🌸 Miyabi Sub-agent Character Image Generation');
  console.log('='.repeat(60));
  console.log(`Model: gemini-3-pro-image-preview`);
  console.log('='.repeat(60));
  
  // Check API key
  if (!process.env.GEMINI_API_KEY) {
    console.error('\n❌ Error: GEMINI_API_KEY not set!');
    console.log('\nPlease run:');
    console.log("export GEMINI_API_KEY='your-api-key'");
    process.exit(1);
  }
  
  // Create output directory
  const outputDir = path.join(__dirname, 'generated');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  
  console.log(`\n📊 Generating ${charactersData.length} character images...`);
  
  const results = [];
  const startTime = Date.now();
  
  // Process characters with rate limiting
  for (let i = 0; i < charactersData.length; i++) {
    const result = await generateCharacterImage(charactersData[i], i, charactersData.length);
    results.push(result);
    
    // Rate limiting delay (3 seconds between requests)
    if (i < charactersData.length - 1) {
      console.log('⏳ Waiting 3 seconds (rate limiting)...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // Summary
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);
  const successful = results.filter(r => r.success).length;
  
  console.log('\n' + '='.repeat(60));
  console.log('📊 Generation Complete!');
  console.log(`⏱️  Time: ${duration} seconds`);
  console.log(`✅ Success: ${successful}/${charactersData.length} images`);
  console.log(`❌ Failed: ${charactersData.length - successful} images`);
  
  // Save results
  const metadata = {
    generated_at: new Date().toISOString(),
    model_used: 'gemini-3-pro-image-preview',
    resolution: '1024x1024',
    total_characters: charactersData.length,
    successfully_generated: successful,
    characters: results.map((result, index) => ({
      ...charactersData[index],
      generated: result.success,
      filename: result.success ? `${charactersData[index].id}.png` : null,
      error: result.error
    }))
  };
  
  writeFileSync(
    path.join(__dirname, 'generation-results.json'),
    JSON.stringify(metadata, null, 2)
  );
  
  if (successful > 0) {
    console.log('\n🎯 Next steps:');
    console.log('1. View images in generated/ directory');
    console.log('2. Open gallery.html in your browser');
    console.log('3. Check generation-results.json for details');
  }
  
  // List failed characters
  if (successful < charactersData.length) {
    console.log('\n⚠️  Failed characters:');
    results.forEach((result, i) => {
      if (!result.success) {
        console.log(`- ${charactersData[i].name_jp}: ${result.error}`);
      }
    });
  }
}

// Run with error handling
main().catch(error => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});