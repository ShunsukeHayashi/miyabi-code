"use strict";
/**
 * =============================================================================
 * Lark Base Role Management Preset
 * =============================================================================
 * Specialized toolkit for comprehensive Lark Base role and permission management
 * =============================================================================
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ROLE_MANAGEMENT_PRESETS = exports.ROLE_WORKFLOWS = exports.PERMISSION_LEVELS = exports.ROLE_ID_PATTERNS = exports.ROLE_MANAGEMENT_CATEGORIES = exports.ROLE_MANAGEMENT_ESSENTIAL = exports.ROLE_MANAGEMENT_COMPLETE = exports.BASE_INFO_TOOLS = exports.USER_MANAGEMENT_TOOLS = exports.DRIVE_PERMISSION_TOOLS = exports.ROLE_MANAGEMENT_CORE_TOOLS = void 0;
/**
 * Core Lark Base Role Management Tools
 * These tools provide complete role lifecycle management
 */
exports.ROLE_MANAGEMENT_CORE_TOOLS = [
    // Role lifecycle management
    'bitable.v1.appRole.create', // ロール作成
    'bitable.v1.appRole.list', // ロール一覧取得
    'bitable.v1.appRole.update', // ロール更新
    'bitable.v1.appRole.delete', // ロール削除
    // Role member management
    'bitable.v1.appRoleMember.create', // メンバー追加
    'bitable.v1.appRoleMember.list', // メンバー一覧
    'bitable.v1.appRoleMember.delete', // メンバー削除
    'bitable.v1.appRoleMember.batchCreate', // メンバー一括追加
    'bitable.v1.appRoleMember.batchDelete', // メンバー一括削除
];
/**
 * Drive Permission Management Tools
 * For Base-level permission management using Drive API
 */
exports.DRIVE_PERMISSION_TOOLS = [
    // Permission member management
    'drive.v1.permissionMember.create', // 権限メンバー追加
    'drive.v1.permissionMember.list', // 権限メンバー一覧
    'drive.v1.permissionMember.update', // 権限メンバー更新
    'drive.v1.permissionMember.delete', // 権限メンバー削除
    'drive.v1.permissionMember.batchCreate', // 権限メンバー一括追加
    'drive.v1.permissionMember.auth', // 権限確認
    'drive.v1.permissionMember.transferOwner', // オーナー移転
];
/**
 * User Management Support Tools
 * Essential for user identification and management
 */
exports.USER_MANAGEMENT_TOOLS = [
    // User identification
    'contact.v3.user.batchGetId', // メールからユーザーID取得
    'contact.v3.user.list', // ユーザー一覧
    'contact.v3.user.get', // ユーザー詳細取得
    // Department management
    'contact.v3.department.list', // 部署一覧
    'contact.v3.department.get', // 部署詳細取得
];
/**
 * Base Information Tools
 * For Base metadata and structure management
 */
exports.BASE_INFO_TOOLS = [
    // Base management
    'bitable.v1.app.create', // Base作成
    'bitable.v1.app.list', // Base一覧
    'bitable.v1.app.get', // Base詳細取得
    // Table management
    'bitable.v1.appTable.list', // テーブル一覧
    'bitable.v1.appTable.get', // テーブル詳細取得
];
/**
 * Complete Role Management Preset
 * Includes all tools necessary for comprehensive role management
 */
exports.ROLE_MANAGEMENT_COMPLETE = [
    ...exports.ROLE_MANAGEMENT_CORE_TOOLS,
    ...exports.DRIVE_PERMISSION_TOOLS,
    ...exports.USER_MANAGEMENT_TOOLS,
    ...exports.BASE_INFO_TOOLS,
];
/**
 * Essential Role Management Preset
 * Minimal set of tools for basic role operations
 */
exports.ROLE_MANAGEMENT_ESSENTIAL = [
    // Core role operations
    'bitable.v1.appRole.create',
    'bitable.v1.appRole.list',
    'bitable.v1.appRoleMember.create',
    'bitable.v1.appRoleMember.list',
    // Drive permission (recommended approach)
    'drive.v1.permissionMember.create',
    'drive.v1.permissionMember.list',
    // User management
    'contact.v3.user.batchGetId',
];
/**
 * Role Management Tool Categories
 * Organized by functionality for easy reference
 */
exports.ROLE_MANAGEMENT_CATEGORIES = {
    // Lark Base Role API (Advanced Permission System)
    BITABLE_ROLES: {
        description: 'Advanced Lark Base role system with granular permissions',
        tools: exports.ROLE_MANAGEMENT_CORE_TOOLS,
        use_cases: [
            'Custom role creation with table-specific permissions',
            'Field-level access control',
            'Complex permission hierarchies',
            'Role-based member management'
        ],
        limitations: [
            'Requires Lark Base Advanced Permission feature',
            'May not be available in all Lark editions'
        ]
    },
    // Drive Permission API (Universal Approach)
    DRIVE_PERMISSIONS: {
        description: 'Universal Base permission management via Drive API',
        tools: exports.DRIVE_PERMISSION_TOOLS,
        use_cases: [
            'Direct Base access control',
            'Simple permission levels (view/edit/full_access)',
            'Compatible with all Lark editions',
            'Immediate permission activation'
        ],
        advantages: [
            'Works with all Lark Base types',
            'Immediate effect',
            'Simple permission model',
            'Wide compatibility'
        ]
    },
    // User Management
    USER_MANAGEMENT: {
        description: 'User identification and organizational management',
        tools: exports.USER_MANAGEMENT_TOOLS,
        use_cases: [
            'Email to User ID conversion',
            'Department-based access control',
            'User information retrieval',
            'Organizational structure management'
        ]
    }
};
/**
 * Role ID Management Utilities
 */
exports.ROLE_ID_PATTERNS = {
    // Standard Role ID format
    FORMAT: /^rolj[A-Za-z0-9]{8,12}$/,
    // Common Role ID examples
    EXAMPLES: {
        ADMIN: 'roljAdmin001',
        EDITOR: 'roljEdit002',
        VIEWER: 'roljView003',
        HR_MANAGER: 'roljHR001',
        DEPT_MANAGER: 'roljDept001'
    },
    // Role naming conventions
    NAMING_CONVENTION: {
        PREFIX: 'rolj',
        ADMIN_SUFFIX: 'Admin',
        EDITOR_SUFFIX: 'Edit',
        VIEWER_SUFFIX: 'View',
        DEPARTMENT_SUFFIX: 'Dept',
        HR_SUFFIX: 'HR'
    }
};
/**
 * Permission Level Mappings
 */
exports.PERMISSION_LEVELS = {
    // Drive API permission levels
    DRIVE_PERMISSIONS: {
        FULL_ACCESS: 'full_access', // 完全管理権限
        EDIT: 'edit', // 編集権限
        VIEW: 'view', // 閲覧権限
        COMMENT: 'comment' // コメント権限
    },
    // Bitable Role permission levels
    BITABLE_TABLE_PERMISSIONS: {
        NO_PERM: 0, // 権限なし
        READ: 1, // 閲覧のみ
        EDIT: 2, // 編集可能
        ADMIN: 4 // 管理者権限
    },
    // Bitable Block permission levels
    BITABLE_BLOCK_PERMISSIONS: {
        NO_PERM: 0, // 権限なし
        READ: 1 // 閲覧のみ
    }
};
/**
 * Role Management Workflows
 */
exports.ROLE_WORKFLOWS = {
    // Standard role creation workflow
    CREATE_ROLE_WORKFLOW: [
        {
            step: 1,
            action: 'bitable.v1.appRole.create',
            description: 'Create custom role with permissions',
            input: 'role_name, table_roles, block_roles',
            output: 'role_id'
        },
        {
            step: 2,
            action: 'bitable.v1.appRoleMember.create',
            description: 'Add members to the role',
            input: 'role_id, member_id',
            output: 'member assignment'
        },
        {
            step: 3,
            action: 'bitable.v1.appRoleMember.list',
            description: 'Verify role membership',
            input: 'role_id',
            output: 'member list'
        }
    ],
    // Drive permission workflow (recommended)
    DRIVE_PERMISSION_WORKFLOW: [
        {
            step: 1,
            action: 'contact.v3.user.batchGetId',
            description: 'Get user ID from email',
            input: 'email_address',
            output: 'user_id'
        },
        {
            step: 2,
            action: 'drive.v1.permissionMember.create',
            description: 'Grant Base access permission',
            input: 'app_token, user_id, permission_level',
            output: 'permission granted'
        },
        {
            step: 3,
            action: 'drive.v1.permissionMember.list',
            description: 'Verify permission assignment',
            input: 'app_token',
            output: 'permission list'
        }
    ],
    // Emergency admin access workflow
    EMERGENCY_ADMIN_WORKFLOW: [
        {
            step: 1,
            action: 'contact.v3.user.batchGetId',
            description: 'Identify target user',
            input: 'admin_email',
            output: 'admin_user_id'
        },
        {
            step: 2,
            action: 'drive.v1.permissionMember.create',
            description: 'Grant full access immediately',
            input: 'app_token, admin_user_id, "full_access"',
            output: 'immediate admin access'
        }
    ]
};
/**
 * Export all presets for use in MCP tool configuration
 */
exports.ROLE_MANAGEMENT_PRESETS = {
    COMPLETE: exports.ROLE_MANAGEMENT_COMPLETE,
    ESSENTIAL: exports.ROLE_MANAGEMENT_ESSENTIAL,
    CORE: exports.ROLE_MANAGEMENT_CORE_TOOLS,
    DRIVE: exports.DRIVE_PERMISSION_TOOLS,
    USER: exports.USER_MANAGEMENT_TOOLS,
    BASE: exports.BASE_INFO_TOOLS
};
