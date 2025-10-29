#!/usr/bin/env node

/**
 * Ollama Integration MCP Server
 * 
 * Provides integration with Ollama server running on Mac mini
 * for local LLM inference using GPT-OSS-20B model.
 */

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

class OllamaIntegrationServer {
  constructor() {
    this.server = new Server(
      {
        name: 'ollama-integration',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'ollama_generate',
            description: 'Generate text using Ollama GPT-OSS-20B model',
            inputSchema: {
              type: 'object',
              properties: {
                prompt: {
                  type: 'string',
                  description: 'The prompt to generate text from',
                },
                temperature: {
                  type: 'number',
                  description: 'Temperature for generation (0.0-1.0)',
                  default: 0.2,
                },
                max_tokens: {
                  type: 'number',
                  description: 'Maximum number of tokens to generate',
                  default: 512,
                },
                reasoning_effort: {
                  type: 'string',
                  description: 'Reasoning effort level (low, medium, high)',
                  enum: ['low', 'medium', 'high'],
                  default: 'medium',
                },
              },
              required: ['prompt'],
            },
          },
          {
            name: 'ollama_chat',
            description: 'Chat completion using Ollama GPT-OSS-20B model',
            inputSchema: {
              type: 'object',
              properties: {
                messages: {
                  type: 'array',
                  description: 'Array of chat messages',
                  items: {
                    type: 'object',
                    properties: {
                      role: {
                        type: 'string',
                        enum: ['user', 'assistant', 'system'],
                      },
                      content: {
                        type: 'string',
                      },
                    },
                    required: ['role', 'content'],
                  },
                },
                temperature: {
                  type: 'number',
                  description: 'Temperature for generation (0.0-1.0)',
                  default: 0.2,
                },
                max_tokens: {
                  type: 'number',
                  description: 'Maximum number of tokens to generate',
                  default: 512,
                },
              },
              required: ['messages'],
            },
          },
          {
            name: 'ollama_models',
            description: 'List available models on Ollama server',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'ollama_health',
            description: 'Check Ollama server health',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'ollama_performance',
            description: 'Test Ollama server performance',
            inputSchema: {
              type: 'object',
              properties: {
                test_prompts: {
                  type: 'array',
                  description: 'Array of test prompts',
                  items: {
                    type: 'string',
                  },
                  default: [
                    'Write a hello world program in Rust',
                    'Explain what is a trait in Rust',
                    'What are the benefits of using async/await?',
                  ],
                },
                concurrency: {
                  type: 'number',
                  description: 'Number of concurrent requests',
                  default: 1,
                },
              },
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'ollama_generate':
            return await this.handleGenerate(args);
          case 'ollama_chat':
            return await this.handleChat(args);
          case 'ollama_models':
            return await this.handleModels();
          case 'ollama_health':
            return await this.handleHealth();
          case 'ollama_performance':
            return await this.handlePerformance(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async handleGenerate(args) {
    const { prompt, temperature = 0.2, max_tokens = 512, reasoning_effort = 'medium' } = args;

    const requestBody = {
      model: 'gpt-oss:20b',
      prompt: prompt,
      stream: false,
      options: {
        temperature: temperature,
        num_predict: max_tokens,
      },
    };

    const startTime = Date.now();
    
    try {
      const response = await fetch('http://100.88.201.67:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      const duration = Date.now() - startTime;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              response: result.response,
              tokens_used: result.eval_count || 0,
              duration_ms: duration,
              reasoning_effort: reasoning_effort,
              model: result.model,
              done_reason: result.done_reason,
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
              duration_ms: duration,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }

  async handleChat(args) {
    const { messages, temperature = 0.2, max_tokens = 512 } = args;

    // Convert messages to prompt format for Ollama
    const prompt = messages
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    return await this.handleGenerate({
      prompt: prompt,
      temperature: temperature,
      max_tokens: max_tokens,
    });
  }

  async handleModels() {
    try {
      const response = await fetch('http://100.88.201.67:11434/api/tags');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              models: result.models || [],
              server: 'http://100.88.201.67:11434',
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }

  async handleHealth() {
    try {
      const startTime = Date.now();
      const response = await fetch('http://100.88.201.67:11434/api/tags');
      const duration = Date.now() - startTime;

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              status: 'healthy',
              server: 'http://100.88.201.67:11434',
              response_time_ms: duration,
              timestamp: new Date().toISOString(),
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              status: 'unhealthy',
              error: error.message,
              server: 'http://100.88.201.67:11434',
              timestamp: new Date().toISOString(),
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }

  async handlePerformance(args) {
    const { test_prompts = [
      'Write a hello world program in Rust',
      'Explain what is a trait in Rust',
      'What are the benefits of using async/await?',
    ], concurrency = 1 } = args;

    const results = [];
    const startTime = Date.now();

    try {
      if (concurrency === 1) {
        // Sequential execution
        for (let i = 0; i < test_prompts.length; i++) {
          const prompt = test_prompts[i];
          const promptStartTime = Date.now();
          
          const result = await this.handleGenerate({ prompt });
          const promptDuration = Date.now() - promptStartTime;
          
          results.push({
            prompt_index: i,
            prompt: prompt,
            duration_ms: promptDuration,
            success: true,
          });
        }
      } else {
        // Concurrent execution
        const promises = test_prompts.map(async (prompt, index) => {
          const promptStartTime = Date.now();
          
          try {
            const result = await this.handleGenerate({ prompt });
            const promptDuration = Date.now() - promptStartTime;
            
            return {
              prompt_index: index,
              prompt: prompt,
              duration_ms: promptDuration,
              success: true,
            };
          } catch (error) {
            const promptDuration = Date.now() - promptStartTime;
            
            return {
              prompt_index: index,
              prompt: prompt,
              duration_ms: promptDuration,
              success: false,
              error: error.message,
            };
          }
        });

        const concurrentResults = await Promise.all(promises);
        results.push(...concurrentResults);
      }

      const totalDuration = Date.now() - startTime;
      const successfulRequests = results.filter(r => r.success).length;
      const avgDuration = results.reduce((sum, r) => sum + r.duration_ms, 0) / results.length;

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              performance_test: {
                total_requests: test_prompts.length,
                successful_requests: successfulRequests,
                failed_requests: test_prompts.length - successfulRequests,
                total_duration_ms: totalDuration,
                average_duration_ms: avgDuration,
                requests_per_minute: (test_prompts.length / totalDuration) * 60000,
                concurrency: concurrency,
                results: results,
              },
              server: 'http://100.88.201.67:11434',
              timestamp: new Date().toISOString(),
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
              server: 'http://100.88.201.67:11434',
              timestamp: new Date().toISOString(),
            }, null, 2),
          },
        ],
        isError: true,
      };
    }
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[Ollama Integration MCP Server] Error:', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Ollama Integration MCP Server running on stdio');
  }
}

const server = new OllamaIntegrationServer();
server.run().catch(console.error);