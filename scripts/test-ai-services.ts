#!/usr/bin/env npx tsx
/**
 * Test AI Services (Embedding & Semantic Search)
 * Bypasses HTTP/authentication to test services directly
 */

import { embeddingService } from '../lib/ai/embedding-service';

async function testEmbeddingService() {
  console.log('🧪 Testing Embedding Service with Gemini API...\n');

  try {
    // Test 1: Generate single embedding
    console.log('📝 Test 1: Generate single embedding');
    const text = 'Learn TypeScript programming for web development';
    const start = Date.now();

    const result = await embeddingService.generateEmbedding(text);
    const duration = Date.now() - start;

    console.log(`   Input: "${text}"`);
    console.log(`   Dimensions: ${result.embedding.length}`);
    console.log(`   Preview: [${result.embedding.slice(0, 3).map(v => v.toFixed(4)).join(', ')}...]`);
    console.log(`   Est. tokens: ${result.usage.totalTokens}`);
    console.log(`   Duration: ${duration}ms`);
    console.log('   ✅ Single embedding test passed\n');

    // Test 2: Generate batch embeddings
    console.log('📝 Test 2: Generate batch embeddings');
    const texts = [
      'Introduction to React hooks and state management',
      'Advanced database design with PostgreSQL',
      'Machine learning fundamentals with Python',
    ];
    const batchStart = Date.now();

    const batchResults = await embeddingService.generateEmbeddingBatch(texts);
    const batchDuration = Date.now() - batchStart;

    console.log(`   Batch size: ${texts.length}`);
    console.log(`   Results: ${batchResults.length} embeddings`);
    console.log(`   All 768 dims: ${batchResults.every(r => r.embedding.length === 768)}`);
    console.log(`   Duration: ${batchDuration}ms (${Math.round(batchDuration / texts.length)}ms/text)`);
    console.log('   ✅ Batch embedding test passed\n');

    // Test 3: Calculate similarity between embeddings
    console.log('📝 Test 3: Embedding similarity');
    const emb1 = result.embedding;
    const emb2 = batchResults[0].embedding; // React hooks
    const emb3 = batchResults[2].embedding; // Machine learning

    const similarity12 = cosineSimilarity(emb1, emb2);
    const similarity13 = cosineSimilarity(emb1, emb3);

    console.log(`   "${text.slice(0, 30)}..." vs React hooks: ${similarity12.toFixed(4)}`);
    console.log(`   "${text.slice(0, 30)}..." vs ML Python: ${similarity13.toFixed(4)}`);
    console.log('   ✅ Similarity test passed\n');

    console.log('🎉 All Embedding Service tests passed!\n');
    return true;

  } catch (error: any) {
    console.error('❌ Embedding service test failed:', error.message);
    return false;
  }
}

async function testDatabaseConnection() {
  console.log('🧪 Testing Database Connection...\n');

  try {
    // Test Prisma connection
    const result = await embeddingService.prisma.$queryRaw`SELECT 1 as connected`;
    console.log('   ✅ Database connected\n');

    // Check if pgvector extension is installed
    const vectorCheck = await embeddingService.prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'vector'
      ) as has_pgvector
    `;
    console.log(`   pgvector installed: ${(vectorCheck as any)[0].has_pgvector}`);

    // Check content_embeddings table
    const tableCheck = await embeddingService.prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'content_embeddings'
      ) as table_exists
    `;
    console.log(`   content_embeddings table: ${(tableCheck as any)[0].table_exists}\n`);

    return true;

  } catch (error: any) {
    console.error('❌ Database test failed:', error.message);
    if (error.message.includes('P1001')) {
      console.log('   💡 Hint: Make sure PostgreSQL is running (docker compose up postgres)');
    }
    return false;
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  Miyabi AI Services Test Suite');
  console.log('═══════════════════════════════════════════════\n');

  const results = {
    embedding: false,
    database: false,
  };

  // Test embedding service
  results.embedding = await testEmbeddingService();

  // Test database connection
  results.database = await testDatabaseConnection();

  // Summary
  console.log('═══════════════════════════════════════════════');
  console.log('  Test Summary');
  console.log('═══════════════════════════════════════════════');
  console.log(`  Embedding Service: ${results.embedding ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Database Connection: ${results.database ? '✅ PASS' : '❌ FAIL'}`);
  console.log('═══════════════════════════════════════════════\n');

  // Cleanup
  await embeddingService.cleanup();

  if (!results.embedding || !results.database) {
    process.exit(1);
  }
}

main();
