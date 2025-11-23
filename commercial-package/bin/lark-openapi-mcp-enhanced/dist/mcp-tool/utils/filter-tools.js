"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterTools = filterTools;
const types_1 = require("../types");
function filterTools(tools, options) {
    // If no specific tools or projects are allowed, enable all tools
    const hasAllowCriteria = (options.allowTools && options.allowTools.length > 0) ||
        (options.allowProjects && options.allowProjects.length > 0);
    let filteredTools = hasAllowCriteria
        ? tools.filter((tool) => {
            var _a, _b;
            return ((_a = options.allowTools) === null || _a === void 0 ? void 0 : _a.includes(tool.name)) ||
                ((_b = options.allowProjects) === null || _b === void 0 ? void 0 : _b.includes(tool.project));
        })
        : tools; // Enable all tools if no specific criteria
    // Filter by token mode
    if (options.tokenMode && options.tokenMode !== types_1.TokenMode.AUTO) {
        filteredTools = filteredTools.filter((tool) => {
            if (!tool.accessTokens) {
                return false;
            }
            if (options.tokenMode === types_1.TokenMode.USER_ACCESS_TOKEN) {
                return tool.accessTokens.includes('user');
            }
            if (options.tokenMode === types_1.TokenMode.TENANT_ACCESS_TOKEN) {
                return tool.accessTokens.includes('tenant');
            }
            return true;
        });
    }
    return filteredTools;
}
