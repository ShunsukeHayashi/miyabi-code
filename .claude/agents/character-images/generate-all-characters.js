#!/usr/bin/env node

import { GoogleGenAI } from "@google/genai";
import * as fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const MODEL = process.env.MODEL || "gemini-2.5-flash-image";
const RESOLUTION = process.env.RESOLUTION || "1K"; // 1K, 2K, 4K (for Pro model)

// Initialize Gemini AI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// Load all character data from prompts.json
const charactersData = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'prompts.json'), 'utf-8')
);

// Transform to use the detailed prompts
const CHARACTERS = charactersData.map(char => ({
  id: char.id,
  name: `${char.name_jp} (${char.name_en})`,
  prompt: char.prompt
}));

async function generateCharacterImage(character, index) {
  console.log(`\n[${index + 1}/${CHARACTERS.length}] 🎨 Generating ${character.name}...`);
  
  try {
    // Configure based on model
    const config = {
      responseModalities: ['IMAGE'],
      imageConfig: {
        aspectRatio: "1:1"
      }
    };
    
    // Add resolution for Pro model
    if (MODEL === "gemini-3-pro-image-preview") {
      config.imageConfig.imageSize = RESOLUTION;
    }
    
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: character.prompt,
      config: config
    });

    // Extract and save image
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");
        
        const outputPath = path.join(__dirname, `${character.id}.png`);
        fs.writeFileSync(outputPath, buffer);
        
        console.log(`✅ Saved: ${character.id}.png`);
        return { success: true, path: outputPath };
      }
    }
    
    return { success: false, error: "No image data in response" };
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function updateGalleryWithResults(results) {
  // Update metadata with generation results
  const metadata = {
    generated_at: new Date().toISOString(),
    model_used: MODEL,
    resolution: MODEL === "gemini-3-pro-image-preview" ? RESOLUTION : "1024x1024",
    total_characters: CHARACTERS.length,
    successfully_generated: results.filter(r => r.success).length,
    characters: results.map((result, index) => ({
      ...charactersData[index],
      generated: result.success,
      filename: result.success ? `${charactersData[index].id}.png` : null,
      error: result.error
    }))
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'generation-results.json'),
    JSON.stringify(metadata, null, 2)
  );
  
  console.log("\n✅ Updated generation-results.json");
}

async function main() {
  console.log("🌸 Miyabi Sub-agent Character Image Generation");
  console.log("=" * 60);
  console.log(`Model: ${MODEL}`);
  if (MODEL === "gemini-3-pro-image-preview") {
    console.log(`Resolution: ${RESOLUTION}`);
  }
  console.log("=" * 60);
  
  // Check API key
  if (!process.env.GEMINI_API_KEY) {
    console.error("\n❌ Error: GEMINI_API_KEY not set!");
    console.log("\nPlease run:");
    console.log("export GEMINI_API_KEY='your-api-key'");
    process.exit(1);
  }
  
  console.log(`\n📊 Generating ${CHARACTERS.length} character images...`);
  
  const results = [];
  const startTime = Date.now();
  
  // Process characters with rate limiting
  for (let i = 0; i < CHARACTERS.length; i++) {
    const result = await generateCharacterImage(CHARACTERS[i], i);
    results.push(result);
    
    // Rate limiting delay (except for last character)
    if (i < CHARACTERS.length - 1) {
      console.log("⏳ Waiting 3 seconds (rate limiting)...");
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  // Summary
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);
  const successful = results.filter(r => r.success).length;
  
  console.log("\n" + "=" * 60);
  console.log("📊 Generation Complete!");
  console.log(`⏱️  Time: ${duration} seconds`);
  console.log(`✅ Success: ${successful}/${CHARACTERS.length} images`);
  console.log(`❌ Failed: ${CHARACTERS.length - successful} images`);
  
  // Update gallery data
  await updateGalleryWithResults(results);
  
  if (successful > 0) {
    console.log("\n🎯 Next steps:");
    console.log("1. View images in this directory");
    console.log("2. Open gallery.html in your browser");
    console.log("3. Check generation-results.json for details");
  }
  
  // List failed characters
  if (successful < CHARACTERS.length) {
    console.log("\n⚠️  Failed characters:");
    results.forEach((result, i) => {
      if (!result.success) {
        console.log(`- ${CHARACTERS[i].name}: ${result.error}`);
      }
    });
  }
}

// Run with error handling
main().catch(error => {
  console.error("\n💥 Fatal error:", error);
  process.exit(1);
});