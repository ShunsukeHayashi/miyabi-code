/**
 * Calendar Management Specialist Agent
 * Specialized for Lark Calendar operations
 */
import { Agent, AgentConfig } from '../agent';
export declare class CalendarSpecialistAgent extends Agent {
    constructor(config?: Partial<AgentConfig>);
    /**
     * Execute MCP tool with calendar-specific error handling
     */
    private executeMcpTool;
    /**
     * Analyze meeting requirements and suggest optimal scheduling
     */
    analyzeMeetingRequirements(requirements: {
        duration: number;
        attendees: string[];
        preferredTimes?: string[];
        roomCapacity?: number;
        location?: string;
    }): Promise<{
        difficulty: 'easy' | 'moderate' | 'challenging';
        recommendations: string[];
        optimalTimes: string[];
        roomSuggestions: string[];
        estimatedSchedulingTime: number;
    }>;
    /**
     * Suggest appropriate meeting rooms based on capacity
     */
    private suggestRooms;
    /**
     * Parse natural language time input
     */
    parseTimeInput(timeString: string): {
        startTime: string;
        endTime: string;
        isValid: boolean;
    };
}
/**
 * Create and register Calendar Specialist Agent
 */
export declare function createCalendarSpecialist(): Promise<string>;
