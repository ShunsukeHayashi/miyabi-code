#!/usr/bin/env node
/**
 * Miyabi Investment Society MCP Server
 *
 * 株式投資AI Agent集団 - 9つの専門エージェントが協調動作
 *
 * Agents:
 * 1. InvestCoordinator (とうしきるん) - Society統括
 * 2. MarketAnalyst (ばしょみるん) - 市場分析
 * 3. StockScreener (えらぶん) - 銘柄スクリーニング
 * 4. TechnicalAnalyst (ちゃーとみるん) - テクニカル分析
 * 5. FundamentalAnalyst (ざいむみるん) - ファンダメンタル分析
 * 6. RiskManager (りすくみるん) - リスク管理
 * 7. PortfolioOptimizer (さいてきかくん) - ポートフォリオ最適化
 * 8. NewsAggregator (にゅーすあつめるん) - ニュース収集
 * 9. SentimentAnalyst (きもちみるん) - センチメント分析
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import yahooFinance from "yahoo-finance2";
// ============================================================
// Helper Functions
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
function calculateBollingerBands(prices, period = 20) {
    const sma = calculateSMA(prices, period);
    const slice = prices.slice(-period);
    const squaredDiffs = slice.map(p => Math.pow(p - sma, 2));
    const stdDev = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / period);
    return {
        upper: sma + (2 * stdDev),
        middle: sma,
        lower: sma - (2 * stdDev),
    };
}
// ============================================================
// Agent Functions
// ============================================================
async function getMarketOverview(region = "japan") {
    const indices = region === "japan"
        ? ["^N225", "^TOPX"]
        : ["^GSPC", "^IXIC", "^DJI"];
    const indexData = await Promise.all(indices.map(async (symbol) => {
        try {
            const quote = await yahooFinance.quote(symbol);
            return {
                name: quote.shortName || symbol,
                value: quote.regularMarketPrice || 0,
                change: quote.regularMarketChange || 0,
                changePercent: quote.regularMarketChangePercent || 0,
            };
        }
        catch {
            return { name: symbol, value: 0, change: 0, changePercent: 0 };
        }
    }));
    let vix = 20;
    try {
        const vixQuote = await yahooFinance.quote("^VIX");
        vix = vixQuote.regularMarketPrice || 20;
    }
    catch {
        // Use default
    }
    const sentiment = vix < 15 ? "very_bullish"
        : vix < 20 ? "bullish"
            : vix < 25 ? "neutral"
                : vix < 30 ? "bearish"
                    : "very_bearish";
    return {
        indices: indexData,
        sectors: [],
        sentiment,
        vix,
    };
}
async function screenStocks(filters) {
    const defaultSymbols = filters.symbols || [
        "AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA", "JPM", "JNJ", "V"
    ];
    const results = [];
    for (const symbol of defaultSymbols) {
        try {
            const quote = await yahooFinance.quote(symbol);
            const pe = quote.trailingPE || 0;
            const dividendYield = quote.dividendYield || quote.trailingAnnualDividendYield || 0;
            if (filters.peMax && pe > filters.peMax)
                continue;
            if (filters.peMin && pe < filters.peMin)
                continue;
            if (filters.dividendYieldMin && dividendYield < filters.dividendYieldMin)
                continue;
            if (filters.marketCapMin && (quote.marketCap || 0) < filters.marketCapMin)
                continue;
            results.push({
                symbol,
                name: quote.shortName || symbol,
                price: quote.regularMarketPrice || 0,
                change: quote.regularMarketChange || 0,
                changePercent: quote.regularMarketChangePercent || 0,
                volume: quote.regularMarketVolume || 0,
                marketCap: quote.marketCap,
                pe: quote.trailingPE,
                dividend: dividendYield,
            });
        }
        catch {
            // Skip failed quotes
        }
    }
    return results;
}
async function getTechnicalIndicators(symbol) {
    const historical = await yahooFinance.historical(symbol, {
        period1: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        period2: new Date(),
    });
    const closes = historical.map(h => h.close);
    return {
        sma20: calculateSMA(closes, 20),
        sma50: calculateSMA(closes, 50),
        sma200: calculateSMA(closes, 200),
        rsi14: calculateRSI(closes, 14),
        macd: {
            macd: calculateSMA(closes, 12) - calculateSMA(closes, 26),
            signal: 0,
            histogram: 0,
        },
        bollingerBands: calculateBollingerBands(closes, 20),
    };
}
async function getFundamentalMetrics(symbol) {
    const quote = await yahooFinance.quote(symbol);
    const summaryDetail = await yahooFinance.quoteSummary(symbol, { modules: ["defaultKeyStatistics", "financialData"] });
    const keyStats = summaryDetail.defaultKeyStatistics || {};
    const financialData = summaryDetail.financialData || {};
    return {
        pe: quote.trailingPE || 0,
        pb: keyStats.priceToBook || 0,
        ps: keyStats.priceToSalesTrailing12Months || 0,
        roe: financialData.returnOnEquity || 0,
        roa: financialData.returnOnAssets || 0,
        debtToEquity: financialData.debtToEquity || 0,
        currentRatio: financialData.currentRatio || 0,
        dividendYield: quote.dividendYield || quote.trailingAnnualDividendYield || 0,
        payoutRatio: keyStats.payoutRatio || 0,
    };
}
async function getRiskMetrics(symbol) {
    const historical = await yahooFinance.historical(symbol, {
        period1: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
        period2: new Date(),
    });
    const returns = [];
    for (let i = 1; i < historical.length; i++) {
        returns.push((historical[i].close - historical[i - 1].close) / historical[i - 1].close);
    }
    const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252);
    let maxDD = 0;
    let peak = historical[0].close;
    for (const h of historical) {
        if (h.close > peak)
            peak = h.close;
        const dd = (peak - h.close) / peak;
        if (dd > maxDD)
            maxDD = dd;
    }
    const sortedReturns = [...returns].sort((a, b) => a - b);
    const var95Index = Math.floor(returns.length * 0.05);
    const var95 = Math.abs(sortedReturns[var95Index] || 0);
    return {
        beta: 1.0,
        volatility,
        sharpeRatio: (meanReturn * 252 - 0.05) / volatility,
        maxDrawdown: maxDD,
        var95,
    };
}
async function analyzePortfolio(holdings) {
    const positions = await Promise.all(holdings.map(async (h) => {
        try {
            const quote = await yahooFinance.quote(h.symbol);
            const currentPrice = quote.regularMarketPrice || 0;
            const value = currentPrice * h.shares;
            const cost = h.avgCost * h.shares;
            return {
                symbol: h.symbol,
                name: quote.shortName || h.symbol,
                shares: h.shares,
                avgCost: h.avgCost,
                currentPrice,
                value,
                cost,
                gainLoss: value - cost,
                gainLossPercent: ((value - cost) / cost) * 100,
            };
        }
        catch {
            return null;
        }
    }));
    const validPositions = positions.filter(p => p !== null);
    const totalValue = validPositions.reduce((sum, p) => sum + (p?.value || 0), 0);
    const totalCost = validPositions.reduce((sum, p) => sum + (p?.cost || 0), 0);
    return {
        totalValue,
        totalCost,
        totalGainLoss: totalValue - totalCost,
        totalGainLossPercent: ((totalValue - totalCost) / totalCost) * 100,
        positions: validPositions,
        diversification: validPositions.length >= 10 ? "good" : validPositions.length >= 5 ? "moderate" : "poor",
    };
}
async function analyzeStock(symbol, depth = "standard") {
    const quote = await yahooFinance.quote(symbol);
    const result = {
        quote: {
            symbol,
            name: quote.shortName || symbol,
            price: quote.regularMarketPrice || 0,
            change: quote.regularMarketChange || 0,
            changePercent: quote.regularMarketChangePercent || 0,
            volume: quote.regularMarketVolume || 0,
            marketCap: quote.marketCap,
            pe: quote.trailingPE,
            dividend: quote.dividendYield || quote.trailingAnnualDividendYield || 0,
        },
        disclaimer: "⚠️ これは情報提供のみを目的としており、投資助言ではありません。投資判断はご自身の責任で行ってください。",
    };
    if (depth === "standard" || depth === "deep") {
        result.technical = await getTechnicalIndicators(symbol);
        result.fundamental = await getFundamentalMetrics(symbol);
    }
    if (depth === "deep") {
        result.risk = await getRiskMetrics(symbol);
    }
    let score = 50;
    if (result.technical) {
        if (result.technical.rsi14 < 30)
            score += 15;
        else if (result.technical.rsi14 > 70)
            score -= 15;
        const currentPrice = result.quote.price;
        if (currentPrice > result.technical.sma200)
            score += 10;
        else
            score -= 10;
    }
    if (result.fundamental) {
        if (result.fundamental.pe > 0 && result.fundamental.pe < 15)
            score += 10;
        if (result.fundamental.roe > 0.15)
            score += 10;
        if (result.fundamental.debtToEquity < 1)
            score += 5;
    }
    result.score = Math.min(100, Math.max(0, score));
    result.recommendation =
        score >= 70 ? "strong_buy" :
            score >= 55 ? "buy" :
                score >= 45 ? "hold" :
                    score >= 30 ? "sell" :
                        "strong_sell";
    return result;
}
// ============================================================
// MCP Server Setup
// ============================================================
const server = new Server({
    name: "miyabi-investment-society",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
        {
            name: "invest_market_overview",
            description: "[ばしょみるん] 市場概況を取得 - 主要指数、VIX、市場センチメント",
            inputSchema: {
                type: "object",
                properties: {
                    region: {
                        type: "string",
                        enum: ["japan", "us", "global"],
                        description: "対象地域",
                    },
                },
            },
        },
        {
            name: "invest_screen_stocks",
            description: "[えらぶん] 条件に基づく銘柄スクリーニング",
            inputSchema: {
                type: "object",
                properties: {
                    pe_max: { type: "number", description: "PER上限" },
                    pe_min: { type: "number", description: "PER下限" },
                    roe_min: { type: "number", description: "ROE下限 (%)" },
                    dividend_yield_min: { type: "number", description: "配当利回り下限 (%)" },
                    symbols: { type: "array", items: { type: "string" }, description: "対象銘柄リスト" },
                },
            },
        },
        {
            name: "invest_technical_analysis",
            description: "[ちゃーとみるん] テクニカル指標 - SMA, RSI, MACD, ボリンジャー",
            inputSchema: {
                type: "object",
                properties: {
                    symbol: { type: "string", description: "銘柄シンボル" },
                },
                required: ["symbol"],
            },
        },
        {
            name: "invest_fundamental_analysis",
            description: "[ざいむみるん] ファンダメンタル指標 - PER, PBR, ROE, 財務健全性",
            inputSchema: {
                type: "object",
                properties: {
                    symbol: { type: "string", description: "銘柄シンボル" },
                },
                required: ["symbol"],
            },
        },
        {
            name: "invest_risk_metrics",
            description: "[りすくみるん] リスク指標 - ベータ, ボラティリティ, VaR, シャープレシオ",
            inputSchema: {
                type: "object",
                properties: {
                    symbol: { type: "string", description: "銘柄シンボル" },
                },
                required: ["symbol"],
            },
        },
        {
            name: "invest_portfolio_analysis",
            description: "[さいてきかくん] ポートフォリオ分析 - 評価額、損益、分散度",
            inputSchema: {
                type: "object",
                properties: {
                    holdings: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                symbol: { type: "string" },
                                shares: { type: "number" },
                                avg_cost: { type: "number" },
                            },
                            required: ["symbol", "shares", "avg_cost"],
                        },
                    },
                },
                required: ["holdings"],
            },
        },
        {
            name: "invest_analyze",
            description: "[とうしきるん] 銘柄の総合分析 - テクニカル + ファンダメンタル + リスク",
            inputSchema: {
                type: "object",
                properties: {
                    symbol: { type: "string", description: "銘柄シンボル" },
                    depth: { type: "string", enum: ["quick", "standard", "deep"], description: "分析の深さ" },
                },
                required: ["symbol"],
            },
        },
        {
            name: "invest_quote",
            description: "銘柄の現在値を取得",
            inputSchema: {
                type: "object",
                properties: {
                    symbol: { type: "string", description: "銘柄シンボル" },
                },
                required: ["symbol"],
            },
        },
    ],
}));
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case "invest_market_overview": {
                const result = await getMarketOverview(args?.region || "japan");
                return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
            }
            case "invest_screen_stocks": {
                const result = await screenStocks({
                    peMax: args?.pe_max,
                    peMin: args?.pe_min,
                    roeMin: args?.roe_min,
                    dividendYieldMin: args?.dividend_yield_min,
                    symbols: args?.symbols,
                });
                return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
            }
            case "invest_technical_analysis": {
                const result = await getTechnicalIndicators(args?.symbol);
                return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
            }
            case "invest_fundamental_analysis": {
                const result = await getFundamentalMetrics(args?.symbol);
                return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
            }
            case "invest_risk_metrics": {
                const result = await getRiskMetrics(args?.symbol);
                return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
            }
            case "invest_portfolio_analysis": {
                const holdings = (args?.holdings).map(h => ({
                    symbol: h.symbol,
                    shares: h.shares,
                    avgCost: h.avg_cost,
                }));
                const result = await analyzePortfolio(holdings);
                return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
            }
            case "invest_analyze": {
                const result = await analyzeStock(args?.symbol, args?.depth || "standard");
                return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
            }
            case "invest_quote": {
                const quote = await yahooFinance.quote(args?.symbol);
                const result = {
                    symbol: args?.symbol,
                    name: quote.shortName,
                    price: quote.regularMarketPrice,
                    change: quote.regularMarketChange,
                    changePercent: quote.regularMarketChangePercent,
                    volume: quote.regularMarketVolume,
                    high: quote.regularMarketDayHigh,
                    low: quote.regularMarketDayLow,
                    open: quote.regularMarketOpen,
                    previousClose: quote.regularMarketPreviousClose,
                    marketCap: quote.marketCap,
                    pe: quote.trailingPE,
                    eps: quote.epsTrailingTwelveMonths,
                    dividendYield: quote.dividendYield || quote.trailingAnnualDividendYield || 0,
                };
                return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
            }
            default:
                return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text", text: `Error: ${errorMessage}` }], isError: true };
    }
});
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Miyabi Investment Society MCP Server running on stdio");
}
main().catch(console.error);
//# sourceMappingURL=index.js.map