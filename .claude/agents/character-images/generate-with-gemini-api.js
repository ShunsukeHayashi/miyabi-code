#!/usr/bin/env node

import { GoogleGenerativeAI } from "@google/generative-ai";
import * as fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Gemini API configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Load character prompts
const promptsData = fs.readFileSync(path.join(__dirname, 'ALL_CHARACTER_PROMPTS.md'), 'utf-8');

// Character definitions with enhanced prompts
const CHARACTERS = [
  {
    id: "coordinator",
    name: "しきるん (Shikiru-n)",
    prompt: "A masterpiece high-quality anime illustration of Shikiru-n, the Coordinator, depicted as a cute yet authoritative leader. She has neat, short emerald-green hair framing a face characterized by sharp, intellectual glasses that gleam with a commanding light. She is dressed in a pristine, stylized conductor's uniform in deep forest green, detailed with crisp white accents and ornate gold aiguillettes draped elegantly over her shoulders. Striking a dynamic and confident pose, she points forward decisively with one hand while the other wields a sleek, futuristic conductor's baton that pulses with glowing cyan digital energy and particle effects. The background is an immersive high-tech command center filled with semi-transparent holographic displays showing complex schedules, scrolling timelines, and efficient task flow charts, all rendered in a vibrant, professional 2D anime art style with dramatic lighting and sharp details."
  },
  {
    id: "codegen",
    name: "つくるん (Tsukuru-n)",
    prompt: "A masterpiece anime illustration of Tsukuru-n, the Code Generator, featuring messy, tousled dark navy blue hair and a sleek gaming headset. The character's face shows a blend of slight exhaustion and intense, hyper-focused determination, with sharp eyes locked onto the task. They are wearing an oversized, comfortable deep blue hoodie that features luminescent, glowing cyan binary code patterns weaving through the fabric. The character is levitating in mid-air in a cross-legged sitting position, surrounded by a zero-gravity digital aura. Their hands are rapidly typing on a translucent, floating holographic keyboard, with fingertips bursting with radiant digital light upon contact with the virtual keys. The background is a deep cybernetic void dominated by Matrix-style cascading vertical streams of blue data rain, creating a high-contrast cyberpunk atmosphere with cinematic lighting, sharp details, and a professional 2D animation aesthetic."
  },
  {
    id: "reviewer",
    name: "みるん (Miru-n)",
    prompt: "A high-quality anime illustration of a sharp and intellectual female character named Miru-n, representing a code reviewer. She has a sleek, chin-length bob of ice-blue hair and piercing cyan eyes behind rimless smart glasses that display scrolling data. She wears a futuristic, professional white blazer with light blue glowing accents and a fitted pencil skirt, evoking a clean, clinical tech aesthetic. In her hand, she holds a translucent holographic tablet, using a stylus to make precise corrections. She is posed with an air of strict professionalism, one hand adjusting her glasses while analyzing a floating screen. The background features a clean, high-tech server room with floating green checkmarks, magnifying glass icons, and streams of binary code in soft blue light. The art style is crisp and detailed, resembling high-end Kyoto Animation production art, with clean lines and cool-toned lighting."
  },
  {
    id: "issue",
    name: "もんだいくん (Mondai-kun)",
    prompt: "A dynamic anime illustration of an energetic young male character named Mondai-kun, representing issue analysis. He has messy, spiked bright yellow hair and expressive amber eyes that look alert and determined. His outfit consists of an oversized yellow and black streetwear hoodie featuring 'caution tape' patterns and cargo shorts with many pockets containing tools. He is wearing large, high-tech headphones. His pose is action-oriented, leaning forward and pointing accusingly at a floating red 'glitch' bug while holding a futuristic magnifying glass in the other hand. The background is vibrant and chaotic, filled with holographic yellow exclamation marks, warning triangles, and puzzle pieces clicking together. The art style is vibrant and poppy, similar to Studio Trigger, with bold colors, dramatic shading, and a sense of urgency."
  },
  {
    id: "pr",
    name: "ぷるりくん (Pururi-kun)",
    prompt: "A beautiful anime illustration of a gentle and stylish young male character named Pururi-kun, representing Pull Requests. He has wavy, soft lavender-purple hair tied back in a small ponytail and kind violet eyes. He is dressed in a stylish, futuristic courier outfit: a purple and white windbreaker jacket, black gloves, and a messenger bag slung over one shoulder containing rolled-up blueprints. Distinctive accessories include a 'git-merge' icon pin on his chest. He is posed with open arms, guiding two glowing holographic timelines (resembling git branches) to merge into a single path. The background is ethereal and abstract, featuring flowing purple data streams, branching lines converging into one, and floating commit blocks. The art style is atmospheric and soft, resembling Makoto Shinkai's work, with glowing particle effects and dreamy violet lighting."
  }
];

async function generateCharacterImage(character) {
  console.log(`\n🎨 Generating image for ${character.name}...`);
  
  try {
    // Get the model
    const model = genAI.getGenerativeModel({ 
      model: "models/gemini-3-pro-image-preview"
    });
    
    const response = await model.generateContent({
      contents: [{
        parts: [{
          text: character.prompt
        }]
      }],
      generationConfig: {
        responseMimeType: "image/png"
      }
    });

    // Extract image data from response
    const result = await response.response;
    const parts = result.candidates[0].content.parts;
    
    for (const part of parts) {
      if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
        const imageData = part.inlineData.data;
        const buffer = Buffer.from(imageData, "base64");
        
        // Save image
        const outputPath = path.join(__dirname, `${character.id}.png`);
        fs.writeFileSync(outputPath, buffer);
        console.log(`✅ Image saved: ${outputPath}`);
        
        return outputPath;
      }
    }
  } catch (error) {
    console.error(`❌ Error generating ${character.name}:`, error.message);
    return null;
  }
}

async function generateAllCharacters() {
  console.log("🚀 Starting Miyabi Sub-agent Character Image Generation");
  console.log("=".repeat(50));
  
  // Check API key
  if (!process.env.GEMINI_API_KEY) {
    console.error("❌ Error: GEMINI_API_KEY environment variable is not set!");
    console.log("Please set: export GEMINI_API_KEY='your-api-key'");
    process.exit(1);
  }
  
  const results = [];
  
  // Generate images for first 5 characters as a test
  for (const character of CHARACTERS) {
    const result = await generateCharacterImage(character);
    results.push({
      character: character.name,
      success: result !== null,
      path: result
    });
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 Generation Summary");
  const successful = results.filter(r => r.success).length;
  console.log(`✅ Successfully generated: ${successful}/${results.length}`);
  
  if (successful > 0) {
    console.log("\n🎯 Next steps:");
    console.log("1. Check the generated images in this directory");
    console.log("2. Open gallery.html to view all characters");
    console.log("3. Run with gemini-3-pro-image-preview for higher quality");
  }
}

// Run the generation
generateAllCharacters().catch(console.error);