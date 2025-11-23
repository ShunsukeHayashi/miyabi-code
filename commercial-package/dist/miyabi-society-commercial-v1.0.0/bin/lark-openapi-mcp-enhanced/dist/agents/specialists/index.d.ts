/**
 * Agent Specialization for Different Domains
 * Domain-specific agents based on Lark MCP tool categories
 */
export * from './base-specialist';
export * from './messaging-specialist';
export * from './document-specialist';
export * from './calendar-specialist';
export * from './coordinator-agent';
export declare const SPECIALIST_DOMAINS: {
    readonly BASE: "base_operations";
    readonly MESSAGING: "messaging";
    readonly DOCUMENT: "document_management";
    readonly CALENDAR: "calendar_management";
    readonly SYSTEM: "system_management";
    readonly COORDINATOR: "workflow_coordination";
};
export type SpecialistDomain = (typeof SPECIALIST_DOMAINS)[keyof typeof SPECIALIST_DOMAINS];
