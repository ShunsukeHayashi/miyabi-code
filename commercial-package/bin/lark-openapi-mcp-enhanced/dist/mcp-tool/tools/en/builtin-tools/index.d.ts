import { docxBuiltinToolName } from './docx/builtin';
import { imBuiltinToolName } from './im/buildin';
import { systemBuiltinToolName } from './system/builtin';
import { GenesisToolName } from './genesis';
import { CompleteToolName } from './complete/all-functions';
import { bitableBuiltinToolName } from './bitable/builtin';
export declare const BuiltinTools: import("../../..").McpTool[];
export type BuiltinToolName = docxBuiltinToolName | imBuiltinToolName | systemBuiltinToolName | GenesisToolName | CompleteToolName | bitableBuiltinToolName;
