import { Gemini3Client } from '../gemini-client.js';
import { CodeExecutionRequest, CodeExecutionResponse } from '../types.js';
/**
 * Code Executor Tool
 * Generates and executes code using Gemini 3's code execution capability
 */
export declare class CodeExecutor {
    private client;
    constructor(client: Gemini3Client);
    /**
     * Execute a code generation and execution task
     */
    executeTask(request: CodeExecutionRequest): Promise<CodeExecutionResponse>;
    /**
     * Analyze and optimize existing code
     */
    analyzeCode(code: string, language: string, analysisGoals?: string[]): Promise<CodeExecutionResponse>;
    /**
     * Generate test cases for code
     */
    generateTests(code: string, language: string, testFramework?: string): Promise<CodeExecutionResponse>;
    /**
     * Solve algorithmic problems
     */
    solveAlgorithm(problem: string, constraints?: string, language?: string): Promise<CodeExecutionResponse>;
}
//# sourceMappingURL=code-executor.d.ts.map