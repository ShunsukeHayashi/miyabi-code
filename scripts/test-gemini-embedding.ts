#!/usr/bin/env npx tsx
/**
 * Gemini Embedding API Test Script
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error('❌ GEMINI_API_KEY not set');
  process.exit(1);
}

console.log('🚀 Testing Gemini Embedding API...\n');

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

async function testSingleEmbedding() {
  console.log('📝 Test 1: Single Embedding');
  const text = 'Introduction to Machine Learning with Python';
  const start = Date.now();

  const result = await model.embedContent(text);
  const duration = Date.now() - start;

  const embedding = result.embedding.values;
  const preview = embedding.slice(0, 3).map(v => v.toFixed(4)).join(', ');

  console.log(`   Text: "${text}"`);
  console.log(`   Dimensions: ${embedding.length}`);
  console.log(`   Preview: [${preview}...]`);
  console.log(`   Duration: ${duration}ms`);
  console.log(`   ✅ Success\n`);

  return embedding;
}

async function testBatchEmbedding() {
  console.log('📝 Test 2: Batch Embedding');
  const texts = [
    'React hooks and state management',
    'Database design best practices',
    'TypeScript for enterprise applications',
  ];
  const start = Date.now();

  const batchResult = await model.batchEmbedContents({
    requests: texts.map(content => ({
      content: { parts: [{ text: content }] },
    })),
  });
  const duration = Date.now() - start;

  const allCorrectDims = batchResult.embeddings.every(e => e.values.length === 768);

  console.log(`   Batch size: ${texts.length}`);
  console.log(`   Results: ${batchResult.embeddings.length} embeddings`);
  console.log(`   All 768 dims: ${allCorrectDims}`);
  console.log(`   Duration: ${duration}ms (${Math.round(duration / texts.length)}ms/text)`);
  console.log(`   ✅ Success\n`);

  return batchResult.embeddings;
}

async function testSimilarity(embedding1: number[], embedding2: number[]) {
  console.log('📝 Test 3: Cosine Similarity');

  // Calculate cosine similarity
  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  const similarity = dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));

  console.log(`   Similarity: ${similarity.toFixed(4)}`);
  console.log(`   ✅ Success\n`);
}

async function main() {
  try {
    // Test single embedding
    const singleEmb = await testSingleEmbedding();

    // Test batch embedding
    const batchEmb = await testBatchEmbedding();

    // Test similarity calculation
    await testSimilarity(singleEmb, batchEmb[0].values);

    console.log('🎉 All Gemini embedding tests passed!');

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
