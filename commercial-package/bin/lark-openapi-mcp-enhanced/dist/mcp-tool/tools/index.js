"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllToolsZh = exports.AllTools = exports.CustomWorkflowTools = void 0;
const builtin_tools_1 = require("./en/builtin-tools");
const builtin_tools_2 = require("./zh/builtin-tools");
const gen_tools_1 = require("./en/gen-tools");
const gen_tools_2 = require("./zh/gen-tools");
// Import custom workflow tools
const custom_workflows_1 = require("./custom-workflows");
// Custom workflow tools array
exports.CustomWorkflowTools = [
    custom_workflows_1.employeeOnboardingComplete,
    custom_workflows_1.smartApprovalRouter,
    custom_workflows_1.businessIntelligenceSuite
];
exports.AllTools = [...gen_tools_1.GenTools, ...builtin_tools_1.BuiltinTools, ...exports.CustomWorkflowTools];
exports.AllToolsZh = [...gen_tools_2.GenTools, ...builtin_tools_2.BuiltinTools, ...exports.CustomWorkflowTools];
