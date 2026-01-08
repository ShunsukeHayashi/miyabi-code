#!/usr/bin/env node

// Usage: node generate-batch.js [start] [end]
// Example: node generate-batch.js 0 5  # Generate first 5 characters

import { GoogleGenAI } from '@google/genai';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
const startIndex = parseInt(args[0]) || 0;
const endIndex = parseInt(args[1]) || 5;

// Initialize Gemini AI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// Load character prompts from JSON
const charactersData = JSON.parse(
  readFileSync(path.join(__dirname, 'prompts.json'), 'utf-8')
);

async function generateCharacterImage(character) {
  console.log(`🎨 Generating ${character.name_jp} (${character.name_en})...`);
  
  try {
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
        text: character.prompt
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
      
      const outputPath = path.join(__dirname, 'generated', `${character.id}.png`);
      writeFileSync(outputPath, buffer);
      
      console.log(`✅ Saved: ${character.id}.png`);
      return { success: true, filename: `${character.id}.png` };
    }
    
    throw new Error('No image data in response');
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  // Check API key
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ Error: GEMINI_API_KEY not set!');
    process.exit(1);
  }
  
  // Create output directory
  const outputDir = path.join(__dirname, 'generated');
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }
  
  // Select character range
  const selectedCharacters = charactersData.slice(startIndex, endIndex);
  
  console.log(`\n🌸 Generating images for characters ${startIndex + 1} to ${endIndex}`);
  console.log(`Total: ${selectedCharacters.length} characters\n`);
  
  const results = [];
  
  for (let i = 0; i < selectedCharacters.length; i++) {
    const result = await generateCharacterImage(selectedCharacters[i]);
    results.push({
      character: selectedCharacters[i],
      ...result
    });
    
    // Rate limiting
    if (i < selectedCharacters.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // Summary
  const successful = results.filter(r => r.success).length;
  console.log(`\n✅ Generated: ${successful}/${selectedCharacters.length} images`);
  
  // Save batch results
  const batchResults = {
    batch: `${startIndex}-${endIndex}`,
    generated_at: new Date().toISOString(),
    results: results
  };
  
  writeFileSync(
    path.join(__dirname, `batch-${startIndex}-${endIndex}.json`),
    JSON.stringify(batchResults, null, 2)
  );
}

main().catch(console.error);