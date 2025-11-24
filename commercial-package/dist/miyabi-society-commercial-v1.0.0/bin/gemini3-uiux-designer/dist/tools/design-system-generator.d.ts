import { Gemini3UXClient } from '../gemini-client.js';
import { DesignSystem } from '../types.js';
export declare class DesignSystemGenerator {
    private client;
    constructor(client: Gemini3UXClient);
    generateDesignSystem(projectName: string, brandIdentity?: string, accentColor?: string): Promise<DesignSystem>;
}
//# sourceMappingURL=design-system-generator.d.ts.map