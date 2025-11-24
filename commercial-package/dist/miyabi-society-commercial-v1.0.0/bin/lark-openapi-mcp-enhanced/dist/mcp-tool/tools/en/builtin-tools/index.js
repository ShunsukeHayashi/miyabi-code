"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BuiltinTools = void 0;
const builtin_1 = require("./docx/builtin");
const buildin_1 = require("./im/buildin");
const builtin_2 = require("./system/builtin");
const genesis_1 = require("./genesis");
const all_functions_1 = require("./complete/all-functions");
const builtin_3 = require("./bitable/builtin");
exports.BuiltinTools = [
    ...builtin_1.docxBuiltinTools,
    ...buildin_1.imBuiltinTools,
    ...builtin_2.systemBuiltinTools,
    ...genesis_1.genesisTools,
    ...all_functions_1.completeTools,
    ...builtin_3.bitableBuiltinTools,
];
