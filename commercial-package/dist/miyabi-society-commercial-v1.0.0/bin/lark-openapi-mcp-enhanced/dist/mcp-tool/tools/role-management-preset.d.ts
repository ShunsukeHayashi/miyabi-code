/**
 * =============================================================================
 * Lark Base Role Management Preset
 * =============================================================================
 * Specialized toolkit for comprehensive Lark Base role and permission management
 * =============================================================================
 */
import { ToolName } from '../tools';
/**
 * Core Lark Base Role Management Tools
 * These tools provide complete role lifecycle management
 */
export declare const ROLE_MANAGEMENT_CORE_TOOLS: ToolName[];
/**
 * Drive Permission Management Tools
 * For Base-level permission management using Drive API
 */
export declare const DRIVE_PERMISSION_TOOLS: ToolName[];
/**
 * User Management Support Tools
 * Essential for user identification and management
 */
export declare const USER_MANAGEMENT_TOOLS: ToolName[];
/**
 * Base Information Tools
 * For Base metadata and structure management
 */
export declare const BASE_INFO_TOOLS: ToolName[];
/**
 * Complete Role Management Preset
 * Includes all tools necessary for comprehensive role management
 */
export declare const ROLE_MANAGEMENT_COMPLETE: ToolName[];
/**
 * Essential Role Management Preset
 * Minimal set of tools for basic role operations
 */
export declare const ROLE_MANAGEMENT_ESSENTIAL: ToolName[];
/**
 * Role Management Tool Categories
 * Organized by functionality for easy reference
 */
export declare const ROLE_MANAGEMENT_CATEGORIES: {
    readonly BITABLE_ROLES: {
        readonly description: "Advanced Lark Base role system with granular permissions";
        readonly tools: ToolName[];
        readonly use_cases: readonly ["Custom role creation with table-specific permissions", "Field-level access control", "Complex permission hierarchies", "Role-based member management"];
        readonly limitations: readonly ["Requires Lark Base Advanced Permission feature", "May not be available in all Lark editions"];
    };
    readonly DRIVE_PERMISSIONS: {
        readonly description: "Universal Base permission management via Drive API";
        readonly tools: ToolName[];
        readonly use_cases: readonly ["Direct Base access control", "Simple permission levels (view/edit/full_access)", "Compatible with all Lark editions", "Immediate permission activation"];
        readonly advantages: readonly ["Works with all Lark Base types", "Immediate effect", "Simple permission model", "Wide compatibility"];
    };
    readonly USER_MANAGEMENT: {
        readonly description: "User identification and organizational management";
        readonly tools: ToolName[];
        readonly use_cases: readonly ["Email to User ID conversion", "Department-based access control", "User information retrieval", "Organizational structure management"];
    };
};
/**
 * Role ID Management Utilities
 */
export declare const ROLE_ID_PATTERNS: {
    readonly FORMAT: RegExp;
    readonly EXAMPLES: {
        readonly ADMIN: "roljAdmin001";
        readonly EDITOR: "roljEdit002";
        readonly VIEWER: "roljView003";
        readonly HR_MANAGER: "roljHR001";
        readonly DEPT_MANAGER: "roljDept001";
    };
    readonly NAMING_CONVENTION: {
        readonly PREFIX: "rolj";
        readonly ADMIN_SUFFIX: "Admin";
        readonly EDITOR_SUFFIX: "Edit";
        readonly VIEWER_SUFFIX: "View";
        readonly DEPARTMENT_SUFFIX: "Dept";
        readonly HR_SUFFIX: "HR";
    };
};
/**
 * Permission Level Mappings
 */
export declare const PERMISSION_LEVELS: {
    readonly DRIVE_PERMISSIONS: {
        readonly FULL_ACCESS: "full_access";
        readonly EDIT: "edit";
        readonly VIEW: "view";
        readonly COMMENT: "comment";
    };
    readonly BITABLE_TABLE_PERMISSIONS: {
        readonly NO_PERM: 0;
        readonly READ: 1;
        readonly EDIT: 2;
        readonly ADMIN: 4;
    };
    readonly BITABLE_BLOCK_PERMISSIONS: {
        readonly NO_PERM: 0;
        readonly READ: 1;
    };
};
/**
 * Role Management Workflows
 */
export declare const ROLE_WORKFLOWS: {
    readonly CREATE_ROLE_WORKFLOW: readonly [{
        readonly step: 1;
        readonly action: "bitable.v1.appRole.create";
        readonly description: "Create custom role with permissions";
        readonly input: "role_name, table_roles, block_roles";
        readonly output: "role_id";
    }, {
        readonly step: 2;
        readonly action: "bitable.v1.appRoleMember.create";
        readonly description: "Add members to the role";
        readonly input: "role_id, member_id";
        readonly output: "member assignment";
    }, {
        readonly step: 3;
        readonly action: "bitable.v1.appRoleMember.list";
        readonly description: "Verify role membership";
        readonly input: "role_id";
        readonly output: "member list";
    }];
    readonly DRIVE_PERMISSION_WORKFLOW: readonly [{
        readonly step: 1;
        readonly action: "contact.v3.user.batchGetId";
        readonly description: "Get user ID from email";
        readonly input: "email_address";
        readonly output: "user_id";
    }, {
        readonly step: 2;
        readonly action: "drive.v1.permissionMember.create";
        readonly description: "Grant Base access permission";
        readonly input: "app_token, user_id, permission_level";
        readonly output: "permission granted";
    }, {
        readonly step: 3;
        readonly action: "drive.v1.permissionMember.list";
        readonly description: "Verify permission assignment";
        readonly input: "app_token";
        readonly output: "permission list";
    }];
    readonly EMERGENCY_ADMIN_WORKFLOW: readonly [{
        readonly step: 1;
        readonly action: "contact.v3.user.batchGetId";
        readonly description: "Identify target user";
        readonly input: "admin_email";
        readonly output: "admin_user_id";
    }, {
        readonly step: 2;
        readonly action: "drive.v1.permissionMember.create";
        readonly description: "Grant full access immediately";
        readonly input: "app_token, admin_user_id, \"full_access\"";
        readonly output: "immediate admin access";
    }];
};
/**
 * Export all presets for use in MCP tool configuration
 */
export declare const ROLE_MANAGEMENT_PRESETS: {
    readonly COMPLETE: ToolName[];
    readonly ESSENTIAL: ToolName[];
    readonly CORE: ToolName[];
    readonly DRIVE: ToolName[];
    readonly USER: ToolName[];
    readonly BASE: ToolName[];
};
