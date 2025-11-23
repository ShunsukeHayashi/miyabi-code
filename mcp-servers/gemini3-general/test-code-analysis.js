#!/usr/bin/env node

/**
 * Test script for Gemini 3 MCP Server - Code Analysis
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyCW8VhBVDRg7h0NKJJq2tygO7oRvS9jLCI';
const genAI = new GoogleGenerativeAI(apiKey);

async function testCodeAnalysis() {
  console.log('🧪 Testing Gemini 3 Pro Preview - Code Analysis\n');

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash-exp',
  });

  // Intentionally buggy code for testing
  const buggyCode = `
function processUserData(data) {
  const users = JSON.parse(data);
  for (let i = 0; i <= users.length; i++) {
    console.log(users[i].name);
  }
  return users;
}
`;

  const prompt = `Analyze the following JavaScript code for bugs, performance issues, and security vulnerabilities:

\`\`\`javascript
${buggyCode}
\`\`\`

Provide detailed analysis as JSON:
{
  "overall_quality": "excellent | good | fair | poor",
  "issues": [
    {
      "category": "string (bug/performance/security/style)",
      "severity": "critical | high | medium | low",
      "description": "string",
      "line": number,
      "suggestion": "string"
    }
  ],
  "strengths": ["string"],
  "recommendations": ["string"]
}`;

  try {
    console.log('📝 Analyzing buggy code...\n');

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        topP: 0.95,
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            overall_quality: {
              type: 'string',
              enum: ['excellent', 'good', 'fair', 'poor']
            },
            issues: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  severity: {
                    type: 'string',
                    enum: ['critical', 'high', 'medium', 'low']
                  },
                  description: { type: 'string' },
                  line: { type: 'number' },
                  suggestion: { type: 'string' }
                }
              }
            },
            strengths: {
              type: 'array',
              items: { type: 'string' }
            },
            recommendations: {
              type: 'array',
              items: { type: 'string' }
            }
          },
          required: ['overall_quality', 'issues', 'recommendations']
        }
      }
    });

    const response = await result.response;
    const text = response.text();
    const data = JSON.parse(text);

    console.log('✅ Analysis Results:\n');
    console.log(`📊 Overall Quality: ${data.overall_quality.toUpperCase()}\n`);

    console.log('🐛 Issues Found:');
    data.issues.forEach((issue, idx) => {
      const severityIcon = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢'
      }[issue.severity] || '⚪';

      console.log(`\n  ${idx + 1}. ${severityIcon} [${issue.severity.toUpperCase()}] ${issue.category}`);
      console.log(`     Line ${issue.line}: ${issue.description}`);
      console.log(`     💡 Suggestion: ${issue.suggestion}`);
    });

    if (data.strengths && data.strengths.length > 0) {
      console.log('\n\n✨ Strengths:');
      data.strengths.forEach(s => console.log(`  - ${s}`));
    }

    console.log('\n\n📋 Recommendations:');
    data.recommendations.forEach(r => console.log(`  - ${r}`));

    console.log('\n✨ Test successful!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response);
    }
  }
}

testCodeAnalysis();
