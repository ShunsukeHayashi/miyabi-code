#!/usr/bin/env node
/**
 * Miyabi TradingView Webhook Server
 *
 * TradingViewからのWebhookアラートを受信し、
 * Investment Societyの分析機能と連携して自動レポートを生成
 *
 * Features:
 * - TradingView Webhook受信
 * - 自動テクニカル/ファンダメンタル分析
 * - Slack/Discord/LINE通知
 * - アラート履歴管理
 */
declare const app: import("express-serve-static-core").Express;
export default app;
