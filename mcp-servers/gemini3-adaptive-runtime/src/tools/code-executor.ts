import { Gemini3Client } from '../gemini-client.js';
import {
  CodeExecutionRequest,
  CodeExecutionResponse,
  CodeExecutionResponseSchema,
} from '../types.js';

/**
 * System instruction for Code Execution
 */
const CODE_EXECUTION_SYSTEM_INSTRUCTION = `**Role:**
You are a Code Execution Engine powered by Gemini 3 Pro Preview.
Your purpose is to write and execute code to solve computational tasks, perform data analysis, and generate insights.

**Core Capabilities:**
1. **Multi-Language Support:** Write code in Python, JavaScript, TypeScript, and other languages.
2. **Data Processing:** Parse, transform, and analyze data efficiently.
3. **Visualization:** Generate data visualizations when appropriate.
4. **Testing:** Write test cases to verify correctness.
5. **Optimization:** Consider performance and efficiency in your solutions.

**Code Quality Standards:**
- Write clean, readable, and well-commented code
- Handle errors and edge cases appropriately
- Use modern language features and best practices
- Include type hints/annotations when applicable
- Explain complex algorithms or logic

**Execution Strategy:**
1. **Understand the Task:** Parse the user's request carefully
2. **Plan the Solution:** Outline your approach before coding
3. **Implement:** Write the code with appropriate structure
4. **Test:** Consider edge cases and validate the solution
5. **Explain:** Provide clear explanation of what the code does

**Output Format:**
Provide a JSON object with:
- code: The complete code to execute
- language: Programming language used
- execution_result: Result of execution (if applicable)
- explanation: Clear explanation of the code and approach`;

/**
 * Code Executor Tool
 * Generates and executes code using Gemini 3's code execution capability
 */
export class CodeExecutor {
  constructor(private client: Gemini3Client) {}

  /**
   * Execute a code generation and execution task
   */
  async executeTask(request: CodeExecutionRequest): Promise<CodeExecutionResponse> {
    // Build the full prompt
    let fullPrompt = `${CODE_EXECUTION_SYSTEM_INSTRUCTION}

**Task:**
${request.task}`;

    // Add language preference if provided
    if (request.language) {
      fullPrompt += `

**Preferred Language:** ${request.language}`;
    }

    // Add context if provided
    if (request.context) {
      fullPrompt += `

**Context/Data:**
${request.context}`;
    }

    fullPrompt += `

**Instructions:**
1. Write the code to accomplish this task
2. Use the code execution tool to run it if appropriate
3. Provide the results and a clear explanation`;

    // Convert Zod schema to JSON schema for Gemini 3
    const responseSchema = {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'The code to execute',
        },
        language: {
          type: 'string',
          description: 'Programming language',
        },
        execution_result: {
          type: 'string',
          description: 'Result of code execution',
        },
        explanation: {
          type: 'string',
          description: 'Explanation of what the code does',
        },
      },
      required: ['code', 'language', 'explanation'],
    };

    // Generate structured content with code execution enabled
    const response = await this.client.generateStructuredContent<CodeExecutionResponse>(
      fullPrompt,
      responseSchema,
      {
        thinkingLevel: request.thinkingLevel || 'high',
        tools: {
          codeExecution: true,
          googleSearch: false,
        },
      }
    );

    return response;
  }

  /**
   * Analyze and optimize existing code
   */
  async analyzeCode(
    code: string,
    language: string,
    analysisGoals?: string[]
  ): Promise<CodeExecutionResponse> {
    let analysisPrompt = `${CODE_EXECUTION_SYSTEM_INSTRUCTION}

**Code to Analyze:**
\`\`\`${language}
${code}
\`\`\`

**Analysis Goals:**`;

    if (analysisGoals && analysisGoals.length > 0) {
      analysisPrompt += `
${analysisGoals.map((goal, idx) => `${idx + 1}. ${goal}`).join('\n')}`;
    } else {
      analysisPrompt += `
1. Identify potential bugs or issues
2. Suggest performance improvements
3. Recommend better practices
4. Check for security vulnerabilities`;
    }

    analysisPrompt += `

**Your Task:**
1. Analyze the code thoroughly
2. Provide an improved version if issues are found
3. Explain all changes and recommendations`;

    const responseSchema = {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Improved code (if changes recommended)',
        },
        language: {
          type: 'string',
          description: 'Programming language',
        },
        execution_result: {
          type: 'string',
          description: 'Analysis results and findings',
        },
        explanation: {
          type: 'string',
          description: 'Detailed explanation of issues and improvements',
        },
      },
      required: ['code', 'language', 'explanation'],
    };

    const response = await this.client.generateStructuredContent<CodeExecutionResponse>(
      analysisPrompt,
      responseSchema,
      {
        thinkingLevel: 'high',
        tools: {
          codeExecution: true,
          googleSearch: false,
        },
      }
    );

    return response;
  }

  /**
   * Generate test cases for code
   */
  async generateTests(
    code: string,
    language: string,
    testFramework?: string
  ): Promise<CodeExecutionResponse> {
    let testPrompt = `${CODE_EXECUTION_SYSTEM_INSTRUCTION}

**Code to Test:**
\`\`\`${language}
${code}
\`\`\`

${testFramework ? `**Test Framework:** ${testFramework}` : ''}

**Your Task:**
1. Analyze the code to understand its functionality
2. Identify edge cases and scenarios to test
3. Write comprehensive test cases
4. Include both positive and negative test cases
5. Ensure good code coverage`;

    const responseSchema = {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Complete test code',
        },
        language: {
          type: 'string',
          description: 'Programming language',
        },
        execution_result: {
          type: 'string',
          description: 'Test execution results if run',
        },
        explanation: {
          type: 'string',
          description: 'Explanation of test strategy and coverage',
        },
      },
      required: ['code', 'language', 'explanation'],
    };

    const response = await this.client.generateStructuredContent<CodeExecutionResponse>(
      testPrompt,
      responseSchema,
      {
        thinkingLevel: 'high',
        tools: {
          codeExecution: true,
          googleSearch: false,
        },
      }
    );

    return response;
  }

  /**
   * Solve algorithmic problems
   */
  async solveAlgorithm(
    problem: string,
    constraints?: string,
    language?: string
  ): Promise<CodeExecutionResponse> {
    let algorithmPrompt = `${CODE_EXECUTION_SYSTEM_INSTRUCTION}

**Problem:**
${problem}

${constraints ? `**Constraints:**\n${constraints}` : ''}

${language ? `**Preferred Language:** ${language}` : '**Preferred Language:** Python'}

**Your Task:**
1. Understand the problem and identify the optimal approach
2. Consider time and space complexity
3. Implement an efficient solution
4. Test with example inputs
5. Explain the algorithm and complexity analysis`;

    const responseSchema = {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'Complete solution code',
        },
        language: {
          type: 'string',
          description: 'Programming language',
        },
        execution_result: {
          type: 'string',
          description: 'Test results with example inputs',
        },
        explanation: {
          type: 'string',
          description: 'Algorithm explanation and complexity analysis',
        },
      },
      required: ['code', 'language', 'explanation'],
    };

    const response = await this.client.generateStructuredContent<CodeExecutionResponse>(
      algorithmPrompt,
      responseSchema,
      {
        thinkingLevel: 'high',
        tools: {
          codeExecution: true,
          googleSearch: false,
        },
      }
    );

    return response;
  }
}
