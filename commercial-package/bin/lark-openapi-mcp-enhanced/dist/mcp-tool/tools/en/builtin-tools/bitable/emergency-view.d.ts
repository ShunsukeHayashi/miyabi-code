import { McpTool } from '../../../../types';
/**
 * 緊急発注アラートView作成用カスタムツール
 * View作成とフィルター・ソート設定を一括で行う
 */
export declare const createEmergencyOrderViewTool: McpTool;
/**
 * 緊急発注レコード検索ツール
 * 緊急発注が必要な商品を検索して返す
 */
export declare const searchEmergencyOrdersTool: McpTool;
export declare const bitableBuiltinTools: McpTool[];
export type bitableBuiltinToolName = 'bitable.builtin.createEmergencyOrderView' | 'bitable.builtin.searchEmergencyOrders';
