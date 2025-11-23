import { Gemini3UXClient } from '../gemini-client.js';
import { DesignReviewScore } from '../types.js';
/**
 * Design Reviewer Tool
 * Reviews designs using Jonathan Ive's principles
 */
export declare class DesignReviewer {
    private client;
    constructor(client: Gemini3UXClient);
    /**
     * Review a design with Ive's critical eye
     */
    reviewDesign(designCode: string, designDescription: string, context?: string): Promise<DesignReviewScore>;
    /**
     * Quick score a design (faster, less detailed)
     */
    quickScore(designCode: string): Promise<{
        score: number;
        rating: string;
    }>;
}
//# sourceMappingURL=design-reviewer.d.ts.map