/**
 * Genesis Templates for Common Business Use Cases
 * These templates provide pre-configured table structures, views, and automation rules
 * for common business scenarios like CRM, Project Management, and HR systems.
 */
import { GenesisTemplate } from '../types';
/**
 * CRM (Customer Relationship Management) Template
 * Includes customers, contacts, opportunities, activities, and reports
 */
export declare const crmTemplate: GenesisTemplate;
/**
 * Project Management Template
 * Includes projects, tasks, milestones, team members, and time tracking
 */
export declare const projectManagementTemplate: GenesisTemplate;
/**
 * HR Management Template
 * Includes employees, departments, leave requests, performance reviews, and onboarding
 */
export declare const hrManagementTemplate: GenesisTemplate;
/**
 * Additional templates collection
 */
export declare const additionalTemplates: GenesisTemplate[];
/**
 * Template registry
 */
export declare const templateRegistry: Map<string, GenesisTemplate>;
/**
 * Get template by ID
 */
export declare function getTemplate(templateId: string): GenesisTemplate | undefined;
/**
 * Get all available templates
 */
export declare function getAllTemplates(): GenesisTemplate[];
/**
 * Get templates by category
 */
export declare function getTemplatesByCategory(category: string): GenesisTemplate[];
