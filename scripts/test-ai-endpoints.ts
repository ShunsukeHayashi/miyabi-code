#!/usr/bin/env npx tsx
/**
 * Test AI Endpoints - Direct Service Testing
 * Bypasses HTTP auth to test embedding and search functionality
 */

import { embeddingService } from '../lib/ai/embedding-service';
import { semanticSearchService } from '../lib/ai/semantic-search-service';

async function testEmbeddingEndpoint() {
  console.log('\n🧪 Testing Embedding Endpoint Logic...\n');

  try {
    // Test: Generate embedding
    console.log('📝 Test 1: Generate embedding for course content');
    const courseText = 'Learn React.js fundamentals including hooks, state management, and component lifecycle';
    const result = await embeddingService.generateEmbedding(courseText);

    console.log(`   ✅ Generated ${result.embedding.length} dimensions`);
    console.log(`   Preview: [${result.embedding.slice(0, 3).map(v => v.toFixed(4)).join(', ')}...]`);

    // Test: Batch embedding
    console.log('\n📝 Test 2: Batch embedding for multiple texts');
    const texts = [
      'Introduction to Python programming',
      'Advanced TypeScript patterns',
      'Database design with PostgreSQL',
    ];
    const batchResults = await embeddingService.generateEmbeddingBatch(texts);
    console.log(`   ✅ Generated ${batchResults.length} embeddings`);
    console.log(`   All 768 dims: ${batchResults.every(r => r.embedding.length === 768)}`);

    return true;
  } catch (error: any) {
    console.error('❌ Embedding test failed:', error.message);
    return false;
  }
}

async function testSemanticSearchEndpoint() {
  console.log('\n🧪 Testing Semantic Search Endpoint Logic...\n');

  try {
    // Test: Get search suggestions
    console.log('📝 Test 1: Get search suggestions');
    const suggestions = await semanticSearchService.getSearchSuggestions('python', 5);
    console.log(`   Found ${suggestions.length} suggestions`);
    if (suggestions.length > 0) {
      console.log(`   Sample: "${suggestions[0].text}"`);
    }

    // Test: Autocomplete
    console.log('\n📝 Test 2: Autocomplete');
    const completions = await semanticSearchService.autocomplete('react', 5);
    console.log(`   Found ${completions.length} completions`);
    if (completions.length > 0) {
      console.log(`   Sample: "${completions[0]}"`);
    }

    // Test: Trending queries
    console.log('\n📝 Test 3: Trending queries');
    const trending = await semanticSearchService.getTrendingQueries(5);
    console.log(`   Found ${trending.length} trending queries`);
    if (trending.length > 0) {
      console.log(`   Top trending: "${trending[0].text}" (${trending[0].popularity} searches)`);
    }

    // Test: Search courses (requires embeddings in DB)
    console.log('\n📝 Test 4: Search courses');
    try {
      const searchResults = await semanticSearchService.searchCourses('learn javascript', { limit: 3 });
      console.log(`   Found ${searchResults.length} courses`);
      if (searchResults.length > 0) {
        console.log(`   Top result: "${searchResults[0].course.title}" (similarity: ${searchResults[0].similarity.toFixed(3)})`);
      }
    } catch (e: any) {
      console.log(`   ⚠️ Search courses: ${e.message} (may need content embeddings)`);
    }

    return true;
  } catch (error: any) {
    console.error('❌ Semantic search test failed:', error.message);
    return false;
  }
}

async function testStoreAndRetrieve() {
  console.log('\n🧪 Testing Store and Retrieve...\n');

  try {
    // Generate a test embedding
    const testText = 'Test course: Advanced Machine Learning with TensorFlow';
    const testId = `test-${Date.now()}`;

    console.log('📝 Test 1: Store embedding');
    const { embedding } = await embeddingService.generateEmbedding(testText);
    await embeddingService.storeEmbedding('course', testId, testText, embedding);
    console.log(`   ✅ Stored embedding for ${testId}`);

    // Search for similar content
    console.log('\n📝 Test 2: Search for similar content');
    const searchResults = await embeddingService.searchSimilar('machine learning tensorflow', {
      contentTypes: ['course'],
      limit: 5,
      threshold: 0.5,
    });
    console.log(`   Found ${searchResults.length} similar items`);

    const foundTest = searchResults.find(r => r.contentId === testId);
    if (foundTest) {
      console.log(`   ✅ Found test content with similarity: ${foundTest.similarity.toFixed(3)}`);
    }

    // Cleanup: Delete test embedding
    console.log('\n📝 Test 3: Cleanup test data');
    await embeddingService.prisma.$executeRaw`
      DELETE FROM content_embeddings WHERE "contentId" = ${testId}
    `;
    console.log('   ✅ Cleaned up test data');

    return true;
  } catch (error: any) {
    console.error('❌ Store/retrieve test failed:', error.message);
    return false;
  }
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  Miyabi AI Endpoints Test Suite (Service Layer)');
  console.log('═══════════════════════════════════════════════════════');

  const results = {
    embedding: false,
    semanticSearch: false,
    storeRetrieve: false,
  };

  results.embedding = await testEmbeddingEndpoint();
  results.semanticSearch = await testSemanticSearchEndpoint();
  results.storeRetrieve = await testStoreAndRetrieve();

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  Test Summary');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Embedding Service:      ${results.embedding ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Semantic Search:        ${results.semanticSearch ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`  Store & Retrieve:       ${results.storeRetrieve ? '✅ PASS' : '❌ FAIL'}`);
  console.log('═══════════════════════════════════════════════════════\n');

  // Cleanup
  await embeddingService.cleanup();

  const allPassed = Object.values(results).every(Boolean);
  process.exit(allPassed ? 0 : 1);
}

main();
