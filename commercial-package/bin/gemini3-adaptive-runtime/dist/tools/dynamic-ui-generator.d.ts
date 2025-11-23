import { Gemini3Client } from '../gemini-client.js';
import { DynamicUIRequest, DynamicUIResponse } from '../types.js';
/**
 * Dynamic UI Generator Tool
 * Generates React TypeScript components based on user intent
 */
export declare class DynamicUIGenerator {
    private client;
    constructor(client: Gemini3Client);
    /**
     * Generate a dynamic UI component
     */
    generateUI(request: DynamicUIRequest): Promise<DynamicUIResponse>;
    /**
     * Iterate on an existing UI based on user feedback
     */
    iterateUI(originalCode: string, feedback: string, thinkingLevel?: string): Promise<DynamicUIResponse>;
}
//# sourceMappingURL=dynamic-ui-generator.d.ts.map