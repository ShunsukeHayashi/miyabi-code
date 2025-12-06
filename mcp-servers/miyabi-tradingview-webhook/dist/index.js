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
import express from 'express';
import cors from 'cors';
import yahooFinance from 'yahoo-finance2';
import dotenv from 'dotenv';
dotenv.config();
const app = express();
const PORT = process.env.PORT || 3456;
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.text());
// ============================================================
// Alert History (In-Memory Store)
// ============================================================
const alertHistory = [];
const MAX_HISTORY = 100;
function addToHistory(result) {
    alertHistory.unshift(result);
    if (alertHistory.length > MAX_HISTORY) {
        alertHistory.pop();
    }
}
// ============================================================
// Technical Analysis Functions
// ============================================================
function calculateSMA(prices, period) {
    if (prices.length < period)
        return 0;
    const slice = prices.slice(-period);
    return slice.reduce((a, b) => a + b, 0) / period;
}
function calculateRSI(prices, period = 14) {
    if (prices.length < period + 1)
        return 50;
    const changes = [];
    for (let i = 1; i < prices.length; i++) {
        changes.push(prices[i] - prices[i - 1]);
    }
    const gains = changes.filter(c => c > 0);
    const losses = changes.filter(c => c < 0).map(c => Math.abs(c));
    const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;
    if (avgLoss === 0)
        return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
}
function determineTrend(price, sma20, sma50, sma200) {
    if (price > sma20 && sma20 > sma50 && sma50 > sma200) {
        return '🟢 Strong Uptrend';
    }
    else if (price > sma50 && sma50 > sma200) {
        return '🟢 Uptrend';
    }
    else if (price < sma20 && sma20 < sma50 && sma50 < sma200) {
        return '🔴 Strong Downtrend';
    }
    else if (price < sma50 && sma50 < sma200) {
        return '🔴 Downtrend';
    }
    else {
        return '🟡 Sideways';
    }
}
// ============================================================
// Analysis Function
// ============================================================
async function analyzeSymbol(symbol, alertType) {
    // Get current quote
    const quote = await yahooFinance.quote(symbol);
    // Get historical data for technical analysis
    const historical = await yahooFinance.historical(symbol, {
        period1: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        period2: new Date(),
    });
    const closes = historical.map(h => h.close);
    // Calculate technical indicators
    const sma20 = calculateSMA(closes, 20);
    const sma50 = calculateSMA(closes, 50);
    const sma200 = calculateSMA(closes, 200);
    const rsi14 = calculateRSI(closes, 14);
    const currentPrice = quote.regularMarketPrice || 0;
    const trend = determineTrend(currentPrice, sma20, sma50, sma200);
    // Calculate score
    let score = 50;
    // RSI scoring
    if (rsi14 < 30)
        score += 15;
    else if (rsi14 > 70)
        score -= 15;
    else if (rsi14 < 40)
        score += 5;
    else if (rsi14 > 60)
        score -= 5;
    // Trend scoring
    if (currentPrice > sma200)
        score += 10;
    else
        score -= 10;
    if (currentPrice > sma50)
        score += 5;
    else
        score -= 5;
    // PE scoring (if available)
    const pe = quote.trailingPE || 0;
    if (pe > 0 && pe < 15)
        score += 10;
    else if (pe > 30)
        score -= 5;
    score = Math.min(100, Math.max(0, score));
    // Determine recommendation
    const recommendation = score >= 70 ? '🟢 STRONG BUY' :
        score >= 55 ? '🟢 BUY' :
            score >= 45 ? '🟡 HOLD' :
                score >= 30 ? '🔴 SELL' :
                    '🔴 STRONG SELL';
    const result = {
        symbol,
        alertType,
        quote: {
            price: currentPrice,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0,
            volume: quote.regularMarketVolume || 0,
        },
        technical: {
            sma20,
            sma50,
            sma200,
            rsi14,
            trend,
        },
        fundamental: {
            pe: quote.trailingPE || 0,
            pb: quote.priceToBook || 0,
            marketCap: quote.marketCap || 0,
            dividendYield: quote.dividendYield || quote.trailingAnnualDividendYield || 0,
        },
        recommendation,
        score,
        timestamp: new Date().toISOString(),
    };
    return result;
}
// ============================================================
// Notification Functions
// ============================================================
function formatSlackMessage(result) {
    const priceEmoji = result.quote.change >= 0 ? '📈' : '📉';
    const changeSign = result.quote.change >= 0 ? '+' : '';
    return {
        blocks: [
            {
                type: 'header',
                text: {
                    type: 'plain_text',
                    text: `🚨 TradingView Alert: ${result.symbol}`,
                    emoji: true,
                },
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*Alert Type:*\n${result.alertType}`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Price:*\n${priceEmoji} $${result.quote.price.toFixed(2)} (${changeSign}${result.quote.changePercent.toFixed(2)}%)`,
                    },
                ],
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*RSI (14):*\n${result.technical.rsi14.toFixed(1)}`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Trend:*\n${result.technical.trend}`,
                    },
                ],
            },
            {
                type: 'section',
                fields: [
                    {
                        type: 'mrkdwn',
                        text: `*Score:*\n${result.score}/100`,
                    },
                    {
                        type: 'mrkdwn',
                        text: `*Recommendation:*\n${result.recommendation}`,
                    },
                ],
            },
            {
                type: 'context',
                elements: [
                    {
                        type: 'mrkdwn',
                        text: `⚠️ これは情報提供のみを目的としています。投資判断はご自身の責任で行ってください。`,
                    },
                ],
            },
        ],
    };
}
function formatDiscordMessage(result) {
    const priceEmoji = result.quote.change >= 0 ? '📈' : '📉';
    const changeSign = result.quote.change >= 0 ? '+' : '';
    const color = result.score >= 55 ? 0x00ff00 : result.score >= 45 ? 0xffff00 : 0xff0000;
    return {
        embeds: [
            {
                title: `🚨 TradingView Alert: ${result.symbol}`,
                color,
                fields: [
                    {
                        name: 'Alert Type',
                        value: result.alertType,
                        inline: true,
                    },
                    {
                        name: 'Price',
                        value: `${priceEmoji} $${result.quote.price.toFixed(2)} (${changeSign}${result.quote.changePercent.toFixed(2)}%)`,
                        inline: true,
                    },
                    {
                        name: 'RSI (14)',
                        value: result.technical.rsi14.toFixed(1),
                        inline: true,
                    },
                    {
                        name: 'Trend',
                        value: result.technical.trend,
                        inline: true,
                    },
                    {
                        name: 'Score',
                        value: `${result.score}/100`,
                        inline: true,
                    },
                    {
                        name: 'Recommendation',
                        value: result.recommendation,
                        inline: true,
                    },
                ],
                footer: {
                    text: '⚠️ 投資助言ではありません。投資判断はご自身の責任で。',
                },
                timestamp: result.timestamp,
            },
        ],
    };
}
function formatLineMessage(result) {
    const priceEmoji = result.quote.change >= 0 ? '📈' : '📉';
    const changeSign = result.quote.change >= 0 ? '+' : '';
    return `🚨 TradingView Alert: ${result.symbol}

${priceEmoji} 価格: $${result.quote.price.toFixed(2)} (${changeSign}${result.quote.changePercent.toFixed(2)}%)

📊 テクニカル分析:
• RSI(14): ${result.technical.rsi14.toFixed(1)}
• トレンド: ${result.technical.trend}

🎯 スコア: ${result.score}/100
💡 推奨: ${result.recommendation}

⚠️ 投資助言ではありません`;
}
async function sendNotification(payload) {
    try {
        let webhookUrl;
        let body;
        switch (payload.channel) {
            case 'slack':
                webhookUrl = process.env.SLACK_WEBHOOK_URL;
                body = payload.data ? formatSlackMessage(payload.data) : { text: payload.message };
                break;
            case 'discord':
                webhookUrl = process.env.DISCORD_WEBHOOK_URL;
                body = payload.data ? formatDiscordMessage(payload.data) : { content: payload.message };
                break;
            case 'line':
                webhookUrl = process.env.LINE_NOTIFY_URL;
                body = { message: payload.data ? formatLineMessage(payload.data) : payload.message };
                break;
            case 'webhook':
                webhookUrl = process.env.CUSTOM_WEBHOOK_URL;
                body = payload.data || { message: payload.message };
                break;
        }
        if (!webhookUrl) {
            console.log(`[Notification] ${payload.channel} webhook not configured`);
            return false;
        }
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        if (response.ok) {
            console.log(`[Notification] Sent to ${payload.channel}`);
            return true;
        }
        else {
            console.error(`[Notification] Failed to send to ${payload.channel}: ${response.statusText}`);
            return false;
        }
    }
    catch (error) {
        console.error(`[Notification] Error:`, error);
        return false;
    }
}
// ============================================================
// Parse TradingView Alert
// ============================================================
function parseTradingViewAlert(body) {
    // TradingView can send various formats
    // Format 1: JSON object
    if (typeof body === 'object') {
        return {
            symbol: body.symbol || body.ticker || body.SYMBOL || 'UNKNOWN',
            action: body.action || body.signal || body.ACTION || 'alert',
            price: body.price || body.close || body.PRICE,
            timeframe: body.timeframe || body.interval || body.TIMEFRAME,
            indicator: body.indicator || body.INDICATOR,
            message: body.message || body.MESSAGE,
            strategy: body.strategy || body.STRATEGY,
            timestamp: body.timestamp || new Date().toISOString(),
        };
    }
    // Format 2: Plain text (parse manually)
    if (typeof body === 'string') {
        const lines = body.split('\n');
        const alert = {
            symbol: 'UNKNOWN',
            action: 'alert',
            message: body,
        };
        // Try to extract symbol from common patterns
        const symbolMatch = body.match(/\b([A-Z]{1,5})\b/);
        if (symbolMatch) {
            alert.symbol = symbolMatch[1];
        }
        // Try to extract action
        if (body.toLowerCase().includes('buy'))
            alert.action = 'buy';
        else if (body.toLowerCase().includes('sell'))
            alert.action = 'sell';
        return alert;
    }
    return {
        symbol: 'UNKNOWN',
        action: 'alert',
        message: String(body),
    };
}
// ============================================================
// API Routes
// ============================================================
// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'miyabi-tradingview-webhook',
        timestamp: new Date().toISOString(),
        alertCount: alertHistory.length,
    });
});
// Main TradingView Webhook endpoint
app.post('/webhook/tradingview', async (req, res) => {
    console.log('='.repeat(60));
    console.log(`[${new Date().toISOString()}] TradingView Alert Received`);
    console.log('Body:', JSON.stringify(req.body, null, 2));
    try {
        // Parse the alert
        const alert = parseTradingViewAlert(req.body);
        console.log('Parsed Alert:', alert);
        // Analyze the symbol
        console.log(`Analyzing ${alert.symbol}...`);
        const analysis = await analyzeSymbol(alert.symbol, alert.action);
        // Add to history
        addToHistory(analysis);
        // Send notifications
        const notificationChannels = ['slack', 'discord', 'line', 'webhook'];
        for (const channel of notificationChannels) {
            await sendNotification({
                channel,
                message: `Alert for ${alert.symbol}`,
                data: analysis,
            });
        }
        console.log('Analysis Result:', JSON.stringify(analysis, null, 2));
        console.log('='.repeat(60));
        res.json({
            success: true,
            alert,
            analysis,
        });
    }
    catch (error) {
        console.error('Error processing alert:', error);
        res.status(500).json({
            success: false,
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
// Get alert history
app.get('/alerts', (req, res) => {
    const limit = parseInt(req.query.limit) || 20;
    res.json({
        count: alertHistory.length,
        alerts: alertHistory.slice(0, limit),
    });
});
// Get latest alert for a symbol
app.get('/alerts/:symbol', (req, res) => {
    const symbol = req.params.symbol.toUpperCase();
    const alerts = alertHistory.filter(a => a.symbol.toUpperCase() === symbol);
    if (alerts.length === 0) {
        res.status(404).json({ error: `No alerts found for ${symbol}` });
        return;
    }
    res.json({
        symbol,
        count: alerts.length,
        latest: alerts[0],
        history: alerts.slice(0, 10),
    });
});
// Manual analysis endpoint
app.post('/analyze', async (req, res) => {
    const { symbol } = req.body;
    if (!symbol) {
        res.status(400).json({ error: 'Symbol is required' });
        return;
    }
    try {
        const analysis = await analyzeSymbol(symbol, 'manual');
        res.json(analysis);
    }
    catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
// Test notification endpoint
app.post('/test-notification', async (req, res) => {
    const { channel, symbol } = req.body;
    try {
        const analysis = await analyzeSymbol(symbol || 'AAPL', 'test');
        const result = await sendNotification({
            channel: channel || 'slack',
            message: 'Test notification',
            data: analysis,
        });
        res.json({
            success: result,
            channel,
            analysis,
        });
    }
    catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : String(error),
        });
    }
});
// ============================================================
// Start Server
// ============================================================
app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('🚀 Miyabi TradingView Webhook Server');
    console.log('='.repeat(60));
    console.log(`Server running on port ${PORT}`);
    console.log(`Webhook URL: http://localhost:${PORT}/webhook/tradingview`);
    console.log('');
    console.log('Endpoints:');
    console.log(`  POST /webhook/tradingview - TradingView Webhook`);
    console.log(`  GET  /alerts              - Get alert history`);
    console.log(`  GET  /alerts/:symbol      - Get alerts for symbol`);
    console.log(`  POST /analyze             - Manual analysis`);
    console.log(`  POST /test-notification   - Test notifications`);
    console.log(`  GET  /health              - Health check`);
    console.log('');
    console.log('Environment Variables:');
    console.log(`  SLACK_WEBHOOK_URL:   ${process.env.SLACK_WEBHOOK_URL ? '✅ Set' : '❌ Not set'}`);
    console.log(`  DISCORD_WEBHOOK_URL: ${process.env.DISCORD_WEBHOOK_URL ? '✅ Set' : '❌ Not set'}`);
    console.log(`  LINE_NOTIFY_URL:     ${process.env.LINE_NOTIFY_URL ? '✅ Set' : '❌ Not set'}`);
    console.log(`  CUSTOM_WEBHOOK_URL:  ${process.env.CUSTOM_WEBHOOK_URL ? '✅ Set' : '❌ Not set'}`);
    console.log('='.repeat(60));
});
export default app;
//# sourceMappingURL=index.js.map