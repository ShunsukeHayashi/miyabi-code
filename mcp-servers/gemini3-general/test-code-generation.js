#!/usr/bin/env node

/**
 * Test script for Gemini 3 MCP Server - Code Generation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyCW8VhBVDRg7h0NKJJq2tygO7oRvS9jLCI';
const genAI = new GoogleGenerativeAI(apiKey);

async function testCodeGeneration() {
  console.log('🧪 Testing Gemini 3 Pro Preview - Code Generation\n');

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',  // Using available model
  });

  const prompt = `Generate a TypeScript function that:
- Takes an array of numbers
- Returns the sum of all even numbers
- Includes JSDoc comments
- Includes error handling

Return as JSON with this schema:
{
  "code": "string",
  "explanation": "string",
  "language": "string",
  "features": ["string"]
}`;

  try {
    console.log('📝 Prompt:');
    console.log(prompt);
    console.log('\n⏳ Generating...\n');

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            code: { type: 'string' },
            explanation: { type: 'string' },
            language: { type: 'string' },
            features: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['code', 'explanation', 'language']
        }
      }
    });

    const response = await result.response;
    const text = response.text();
    const data = JSON.parse(text);

    console.log('✅ Response:\n');
    console.log('📄 Generated Code:');
    console.log('```typescript');
    console.log(data.code);
    console.log('```\n');

    console.log('💡 Explanation:');
    console.log(data.explanation);
    console.log('\n🎯 Features:');
    data.features?.forEach(f => console.log(`  - ${f}`));

    console.log('\n✨ Test successful!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

testCodeGeneration();
