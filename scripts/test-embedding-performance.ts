#!/usr/bin/env ts-node

/**
 * Embedding Performance Test Script
 * Tests the AI embedding functionality for performance and correctness
 */

import { embeddingService } from '../lib/ai/embedding-service';
import { semanticSearchService } from '../lib/ai/semantic-search-service';
import { PrismaClient } from '@prisma/client';

interface TestResult {
  test: string;
  success: boolean;
  duration: number;
  details?: any;
  error?: string;
}

class EmbeddingPerformanceTest {
  private prisma: PrismaClient;
  private results: TestResult[] = [];

  constructor() {
    this.prisma = new PrismaClient();
  }

  async run() {
    console.log('🚀 Starting Embedding Performance Tests\n');

    try {
      // Test 1: Basic embedding generation
      await this.testBasicEmbedding();

      // Test 2: Batch embedding generation
      await this.testBatchEmbedding();

      // Test 3: Vector storage and retrieval
      await this.testVectorStorage();

      // Test 4: Semantic search performance
      await this.testSemanticSearch();

      // Test 5: Search accuracy
      await this.testSearchAccuracy();

      // Test 6: Recommendation performance
      await this.testRecommendations();

      // Test 7: Database performance (vector operations)
      await this.testDatabasePerformance();

      // Generate summary report
      this.generateReport();

    } catch (error) {
      console.error('❌ Test suite failed:', error);
    } finally {
      await this.cleanup();
    }
  }

  private async testBasicEmbedding() {
    console.log('🧪 Testing basic embedding generation...');

    const testTexts = [
      'Introduction to Machine Learning with Python',
      'Advanced React Hooks and State Management',
      'Database Design Principles and Best Practices',
      'TypeScript for Enterprise Development',
    ];

    for (const text of testTexts) {
      const startTime = Date.now();

      try {
        const result = await embeddingService.generateEmbedding(text);
        const duration = Date.now() - startTime;

        const success = result.embedding.length === 3072 && result.usage.totalTokens > 0;

        this.results.push({
          test: `Basic Embedding: "${text.slice(0, 30)}..."`,
          success,
          duration,
          details: {
            embeddingDimensions: result.embedding.length,
            tokenUsage: result.usage.totalTokens,
            embeddingPreview: result.embedding.slice(0, 5),
          },
        });

        console.log(`  ✅ Generated embedding in ${duration}ms (${result.usage.totalTokens} tokens)`);

      } catch (error) {
        this.results.push({
          test: `Basic Embedding: "${text.slice(0, 30)}..."`,
          success: false,
          duration: Date.now() - startTime,
          error: error.message,
        });

        console.log(`  ❌ Failed: ${error.message}`);
      }
    }

    console.log();
  }

  private async testBatchEmbedding() {
    console.log('🔄 Testing batch embedding generation...');

    const batchTexts = [
      'React fundamentals and component lifecycle',
      'Node.js backend development with Express',
      'PostgreSQL database administration',
      'Docker containerization strategies',
      'GraphQL API design and implementation',
    ];

    const startTime = Date.now();

    try {
      const results = await embeddingService.generateEmbeddingBatch(batchTexts);
      const duration = Date.now() - startTime;

      const success = results.length === batchTexts.length &&
                     results.every(r => r.embedding.length === 3072);

      const totalTokens = results.reduce((sum, r) => sum + r.usage.totalTokens, 0);

      this.results.push({
        test: 'Batch Embedding Generation',
        success,
        duration,
        details: {
          batchSize: batchTexts.length,
          totalTokens,
          averageDuration: Math.round(duration / batchTexts.length),
          efficiencyGain: `${Math.round((batchTexts.length * 2000 - duration) / batchTexts.length)}ms saved per text`,
        },
      });

      console.log(`  ✅ Generated ${results.length} embeddings in ${duration}ms`);
      console.log(`  📊 Average: ${Math.round(duration / batchTexts.length)}ms per embedding`);

    } catch (error) {
      this.results.push({
        test: 'Batch Embedding Generation',
        success: false,
        duration: Date.now() - startTime,
        error: error.message,
      });

      console.log(`  ❌ Failed: ${error.message}`);
    }

    console.log();
  }

  private async testVectorStorage() {
    console.log('💾 Testing vector storage and retrieval...');

    const testData = {
      contentType: 'test_course',
      contentId: 'test-course-001',
      text: 'Complete guide to full-stack web development with React, Node.js, and PostgreSQL',
      embedding: Array.from({ length: 3072 }, () => Math.random() * 2 - 1),
    };

    const startTime = Date.now();

    try {
      // Store embedding
      await embeddingService.storeEmbedding(
        testData.contentType,
        testData.contentId,
        testData.text,
        testData.embedding
      );

      // Retrieve embedding
      const stored = await this.prisma.contentEmbedding.findUnique({
        where: {
          contentType_contentId: {
            contentType: testData.contentType,
            contentId: testData.contentId,
          },
        },
      });

      const duration = Date.now() - startTime;

      const success = !!stored && stored.contentText === testData.text;

      this.results.push({
        test: 'Vector Storage and Retrieval',
        success,
        duration,
        details: {
          stored: !!stored,
          contentMatches: stored?.contentText === testData.text,
          modelUsed: stored?.model,
        },
      });

      console.log(`  ✅ Stored and retrieved vector in ${duration}ms`);

      // Clean up test data
      await this.prisma.contentEmbedding.delete({
        where: {
          contentType_contentId: {
            contentType: testData.contentType,
            contentId: testData.contentId,
          },
        },
      });

    } catch (error) {
      this.results.push({
        test: 'Vector Storage and Retrieval',
        success: false,
        duration: Date.now() - startTime,
        error: error.message,
      });

      console.log(`  ❌ Failed: ${error.message}`);
    }

    console.log();
  }

  private async testSemanticSearch() {
    console.log('🔍 Testing semantic search performance...');

    // First, ensure we have some test data
    await this.setupTestData();

    const searchQueries = [
      'machine learning python tutorial',
      'react hooks state management',
      'database design best practices',
      'typescript enterprise development',
    ];

    for (const query of searchQueries) {
      const startTime = Date.now();

      try {
        const results = await semanticSearchService.searchCourses(query, { limit: 5 });
        const duration = Date.now() - startTime;

        const success = duration < 2000 && Array.isArray(results); // Should respond within 2 seconds

        this.results.push({
          test: `Semantic Search: "${query}"`,
          success,
          duration,
          details: {
            resultCount: results.length,
            topSimilarity: results.length > 0 ? results[0].similarity : 0,
            avgSimilarity: results.length > 0 ?
              results.reduce((sum, r) => sum + r.similarity, 0) / results.length : 0,
          },
        });

        console.log(`  ✅ Found ${results.length} results in ${duration}ms`);
        if (results.length > 0) {
          console.log(`     Top result: "${results[0].course.title}" (similarity: ${results[0].similarity.toFixed(3)})`);
        }

      } catch (error) {
        this.results.push({
          test: `Semantic Search: "${query}"`,
          success: false,
          duration: Date.now() - startTime,
          error: error.message,
        });

        console.log(`  ❌ Failed: ${error.message}`);
      }
    }

    console.log();
  }

  private async testSearchAccuracy() {
    console.log('🎯 Testing search accuracy...');

    // Test specific search scenarios to verify accuracy
    const accuracyTests = [
      {
        query: 'react components hooks',
        expectedKeywords: ['react', 'component', 'hook'],
        description: 'React-related search'
      },
      {
        query: 'database sql postgresql',
        expectedKeywords: ['database', 'sql', 'postgres'],
        description: 'Database-related search'
      },
    ];

    for (const test of accuracyTests) {
      const startTime = Date.now();

      try {
        const results = await semanticSearchService.searchCourses(test.query, { limit: 3 });
        const duration = Date.now() - startTime;

        // Check if results contain expected keywords
        const relevantResults = results.filter(result => {
          const combinedText = `${result.course.title} ${result.course.description}`.toLowerCase();
          return test.expectedKeywords.some(keyword =>
            combinedText.includes(keyword.toLowerCase())
          );
        });

        const accuracy = results.length > 0 ? relevantResults.length / results.length : 0;
        const success = accuracy >= 0.6; // At least 60% of results should be relevant

        this.results.push({
          test: `Search Accuracy: ${test.description}`,
          success,
          duration,
          details: {
            totalResults: results.length,
            relevantResults: relevantResults.length,
            accuracy: Math.round(accuracy * 100) + '%',
            expectedKeywords: test.expectedKeywords,
          },
        });

        console.log(`  📊 Accuracy: ${Math.round(accuracy * 100)}% (${relevantResults.length}/${results.length} relevant)`);

      } catch (error) {
        this.results.push({
          test: `Search Accuracy: ${test.description}`,
          success: false,
          duration: Date.now() - startTime,
          error: error.message,
        });

        console.log(`  ❌ Failed: ${error.message}`);
      }
    }

    console.log();
  }

  private async testRecommendations() {
    console.log('💡 Testing personalized recommendations...');

    // Create a test user with some progress
    const testUser = await this.createTestUser();

    const startTime = Date.now();

    try {
      const recommendations = await semanticSearchService.getPersonalizedRecommendations(
        testUser.id,
        5
      );

      const duration = Date.now() - startTime;
      const success = duration < 3000 && Array.isArray(recommendations);

      this.results.push({
        test: 'Personalized Recommendations',
        success,
        duration,
        details: {
          recommendationCount: recommendations.length,
          avgRelevanceScore: recommendations.length > 0 ?
            recommendations.reduce((sum, r) => sum + r.relevanceScore, 0) / recommendations.length : 0,
        },
      });

      console.log(`  ✅ Generated ${recommendations.length} recommendations in ${duration}ms`);

    } catch (error) {
      this.results.push({
        test: 'Personalized Recommendations',
        success: false,
        duration: Date.now() - startTime,
        error: error.message,
      });

      console.log(`  ❌ Failed: ${error.message}`);
    } finally {
      // Clean up test user
      await this.prisma.user.delete({ where: { id: testUser.id } }).catch(() => {});
    }

    console.log();
  }

  private async testDatabasePerformance() {
    console.log('🗄️ Testing database vector operations...');

    const startTime = Date.now();

    try {
      // Test vector similarity query performance
      const testEmbedding = Array.from({ length: 3072 }, () => Math.random() * 2 - 1);
      const vectorString = `[${testEmbedding.join(',')}]`;

      const similarityResults = await this.prisma.$queryRaw`
        SELECT content_id, content_type,
               1 - (embedding <=> ${vectorString}::vector) as similarity
        FROM content_embeddings
        ORDER BY embedding <=> ${vectorString}::vector
        LIMIT 5
      `;

      const duration = Date.now() - startTime;
      const success = duration < 1000 && Array.isArray(similarityResults);

      this.results.push({
        test: 'Database Vector Operations',
        success,
        duration,
        details: {
          queryType: 'Vector similarity search',
          resultCount: similarityResults.length,
          indexUsed: 'HNSW cosine similarity',
        },
      });

      console.log(`  ✅ Vector similarity query completed in ${duration}ms`);

    } catch (error) {
      this.results.push({
        test: 'Database Vector Operations',
        success: false,
        duration: Date.now() - startTime,
        error: error.message,
      });

      console.log(`  ❌ Failed: ${error.message}`);
    }

    console.log();
  }

  private async setupTestData() {
    // Create some test courses if they don't exist
    const testCourses = [
      {
        id: 'test-course-ml-python',
        title: 'Machine Learning with Python',
        description: 'Complete guide to machine learning using Python, scikit-learn, and TensorFlow',
        status: 'PUBLISHED' as const,
        level: 'INTERMEDIATE' as const,
        slug: 'machine-learning-python',
        creatorId: 'test-creator-id',
      },
      {
        id: 'test-course-react-hooks',
        title: 'Advanced React Hooks',
        description: 'Master React hooks including useState, useEffect, useContext, and custom hooks',
        status: 'PUBLISHED' as const,
        level: 'ADVANCED' as const,
        slug: 'advanced-react-hooks',
        creatorId: 'test-creator-id',
      },
    ];

    for (const course of testCourses) {
      await this.prisma.course.upsert({
        where: { id: course.id },
        create: course,
        update: {},
      });

      // Generate embedding for the course
      try {
        await embeddingService.embedCourse(course.id);
      } catch (error) {
        // Ignore if already exists or creation fails
      }
    }
  }

  private async createTestUser() {
    const testUser = await this.prisma.user.create({
      data: {
        id: 'test-user-embedding',
        email: 'embedding-test@example.com',
        role: 'STUDENT',
      },
    });

    // Create some progress for the user
    await this.prisma.userProgress.createMany({
      data: [
        {
          userId: testUser.id,
          courseId: 'test-course-ml-python',
          progressPercentage: 75,
        },
        {
          userId: testUser.id,
          courseId: 'test-course-react-hooks',
          progressPercentage: 50,
        },
      ],
      skipDuplicates: true,
    });

    return testUser;
  }

  private generateReport() {
    console.log('\n📊 EMBEDDING PERFORMANCE TEST RESULTS\n');
    console.log('=' .repeat(80));

    const successfulTests = this.results.filter(r => r.success);
    const failedTests = this.results.filter(r => !r.success);

    console.log(`✅ Successful tests: ${successfulTests.length}`);
    console.log(`❌ Failed tests: ${failedTests.length}`);
    console.log(`📈 Success rate: ${Math.round((successfulTests.length / this.results.length) * 100)}%`);

    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length;
    console.log(`⏱️  Average test duration: ${Math.round(avgDuration)}ms`);

    console.log('\n📋 Detailed Results:');
    console.log('-'.repeat(80));

    this.results.forEach((result, index) => {
      const icon = result.success ? '✅' : '❌';
      console.log(`${index + 1}. ${icon} ${result.test}`);
      console.log(`   Duration: ${result.duration}ms`);

      if (result.details) {
        Object.entries(result.details).forEach(([key, value]) => {
          console.log(`   ${key}: ${value}`);
        });
      }

      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }

      console.log('');
    });

    // Performance benchmarks
    console.log('🎯 Performance Benchmarks:');
    console.log('-'.repeat(40));

    const benchmarks = [
      { name: 'Single embedding generation', target: '< 3000ms', actual: this.getAvgDuration('Basic Embedding') },
      { name: 'Batch embedding (5 texts)', target: '< 8000ms', actual: this.getDuration('Batch Embedding Generation') },
      { name: 'Vector storage', target: '< 500ms', actual: this.getDuration('Vector Storage and Retrieval') },
      { name: 'Semantic search', target: '< 2000ms', actual: this.getAvgDuration('Semantic Search') },
      { name: 'Database vector ops', target: '< 1000ms', actual: this.getDuration('Database Vector Operations') },
    ];

    benchmarks.forEach(benchmark => {
      const icon = benchmark.actual !== null &&
                  benchmark.actual < parseInt(benchmark.target.replace(/[^0-9]/g, '')) ? '✅' : '❌';
      console.log(`${icon} ${benchmark.name}: ${benchmark.actual}ms (target: ${benchmark.target})`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('Test completed!');
  }

  private getDuration(testName: string): number | null {
    const result = this.results.find(r => r.test.includes(testName));
    return result ? result.duration : null;
  }

  private getAvgDuration(testNamePattern: string): number | null {
    const matchingResults = this.results.filter(r => r.test.includes(testNamePattern));
    if (matchingResults.length === 0) return null;

    const totalDuration = matchingResults.reduce((sum, r) => sum + r.duration, 0);
    return Math.round(totalDuration / matchingResults.length);
  }

  private async cleanup() {
    // Clean up test data
    await this.prisma.contentEmbedding.deleteMany({
      where: { contentType: { startsWith: 'test_' } },
    });

    await this.prisma.course.deleteMany({
      where: { id: { startsWith: 'test-course-' } },
    });

    await this.prisma.user.deleteMany({
      where: { id: { startsWith: 'test-user-' } },
    });

    await embeddingService.cleanup();
    await this.prisma.$disconnect();
  }
}

// Run the tests
const tester = new EmbeddingPerformanceTest();
tester.run();