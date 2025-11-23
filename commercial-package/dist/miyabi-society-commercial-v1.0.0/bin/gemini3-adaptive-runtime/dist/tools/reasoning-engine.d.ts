import { Gemini3Client } from '../gemini-client.js';
import { ReasoningRequest, ReasoningResponse } from '../types.js';
/**
 * Reasoning Engine Tool
 * Performs deep reasoning on complex questions
 */
export declare class ReasoningEngine {
    private client;
    constructor(client: Gemini3Client);
    /**
     * Perform deep reasoning on a question
     */
    reason(request: ReasoningRequest): Promise<ReasoningResponse>;
    /**
     * Compare and analyze multiple options
     */
    compareOptions(question: string, options: Array<{
        name: string;
        details: string;
    }>, criteria?: string[]): Promise<ReasoningResponse>;
    /**
     * Analyze a decision with potential consequences
     */
    analyzeDecision(decision: string, context: string, timeHorizon?: string): Promise<ReasoningResponse>;
}
//# sourceMappingURL=reasoning-engine.d.ts.map