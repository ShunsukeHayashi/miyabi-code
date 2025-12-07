#!/usr/bin/env node

/**
 * Miyabi Investment Society - HTTP/SSE Server
 *
 * SSEトランスポートで動作するHTTPサーバー版
 */

import http from 'http';
import { URL } from 'url';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import yahooFinance from "yahoo-finance2";

// Import all the types and functions from index.ts
// (In production, these would be properly modularized)

interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  marketCap?: number;
  pe?: number;
  dividend?: number;
}

// Helper Functions
function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return 0;
  const slice = prices.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;
  const changes = [];
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1]);
  }
  const gains = changes.filter(c => c > 0);
  const losses = changes.filter(c => c < 0).map(c => Math.abs(c));
  const avgGain = gains.length > 0 ? gains.reduce((a, b) => a + b, 0) / period : 0;
  const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / period : 0;
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateBollingerBands(prices: number[], period: number = 20) {
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

function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = ['surge', 'jump', 'gain', 'rise', 'up', 'high', 'record', 'beat', 'growth', 'profit', '上昇', '好調'];
  const negativeWords = ['fall', 'drop', 'decline', 'down', 'low', 'miss', 'loss', 'crash', '下落', '不調'];
  const lowerText = text.toLowerCase();
  let score = 0;
  for (const word of positiveWords) if (lowerText.includes(word.toLowerCase())) score++;
  for (const word of negativeWords) if (lowerText.includes(word.toLowerCase())) score--;
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

// Agent Functions
async function getMarketOverview(region: string = "japan") {
  const indices = region === "japan" ? ["^N225", "^TOPX"] : ["^GSPC", "^IXIC", "^DJI"];
  const indexData = await Promise.all(
    indices.map(async (symbol) => {
      try {
        const quote = await yahooFinance.quote(symbol);
        return {
          name: quote.shortName || symbol,
          value: quote.regularMarketPrice || 0,
          change: quote.regularMarketChange || 0,
          changePercent: quote.regularMarketChangePercent || 0,
        };
      } catch {
        return { name: symbol, value: 0, change: 0, changePercent: 0 };
      }
    })
  );
  let vix = 20;
  try {
    const vixQuote = await yahooFinance.quote("^VIX");
    vix = vixQuote.regularMarketPrice || 20;
  } catch {}
  const sentiment = vix < 15 ? "very_bullish" : vix < 20 ? "bullish" : vix < 25 ? "neutral" : vix < 30 ? "bearish" : "very_bearish";
  return { indices: indexData, sectors: [], sentiment, vix };
}

async function getTechnicalIndicators(symbol: string) {
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
    macd: { macd: calculateSMA(closes, 12) - calculateSMA(closes, 26), signal: 0, histogram: 0 },
    bollingerBands: calculateBollingerBands(closes, 20),
  };
}

async function getFundamentalMetrics(symbol: string) {
  const quote = await yahooFinance.quote(symbol) as any;
  const summaryDetail = await yahooFinance.quoteSummary(symbol, { modules: ["defaultKeyStatistics", "financialData"] }) as any;
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

async function getRiskMetrics(symbol: string) {
  const historical = await yahooFinance.historical(symbol, {
    period1: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000),
    period2: new Date(),
  });
  const returns: number[] = [];
  for (let i = 1; i < historical.length; i++) {
    returns.push((historical[i].close - historical[i - 1].close) / historical[i - 1].close);
  }
  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance) * Math.sqrt(252);
  let maxDD = 0;
  let peak = historical[0].close;
  for (const h of historical) {
    if (h.close > peak) peak = h.close;
    const dd = (peak - h.close) / peak;
    if (dd > maxDD) maxDD = dd;
  }
  const sortedReturns = [...returns].sort((a, b) => a - b);
  const var95Index = Math.floor(returns.length * 0.05);
  return {
    beta: 1.0,
    volatility,
    sharpeRatio: (meanReturn * 252 - 0.05) / volatility,
    maxDrawdown: maxDD,
    var95: Math.abs(sortedReturns[var95Index] || 0),
  };
}

async function screenStocks(filters: any) {
  const defaultSymbols = filters.symbols || ["AAPL", "MSFT", "GOOGL", "AMZN", "META", "NVDA", "TSLA", "JPM", "JNJ", "V"];
  const results: StockQuote[] = [];
  for (const symbol of defaultSymbols) {
    try {
      const quote = await yahooFinance.quote(symbol) as any;
      const pe = quote.trailingPE || 0;
      const dividendYield = quote.dividendYield || quote.trailingAnnualDividendYield || 0;
      if (filters.peMax && pe > filters.peMax) continue;
      if (filters.peMin && pe < filters.peMin) continue;
      if (filters.dividendYieldMin && dividendYield < filters.dividendYieldMin) continue;
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
    } catch {}
  }
  return results;
}

async function analyzePortfolio(holdings: { symbol: string; shares: number; avgCost: number }[]) {
  const positions = await Promise.all(
    holdings.map(async (h) => {
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
      } catch {
        return null;
      }
    })
  );
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

async function analyzeStock(symbol: string, depth: string = "standard") {
  const quote = await yahooFinance.quote(symbol) as any;
  const result: any = {
    quote: {
      symbol,
      name: quote.shortName || symbol,
      price: quote.regularMarketPrice || 0,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      volume: quote.regularMarketVolume || 0,
      marketCap: quote.marketCap,
      pe: quote.trailingPE,
      dividend: quote.dividendYield || 0,
    },
    disclaimer: "⚠️ これは情報提供のみを目的としており、投資助言ではありません。",
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
    if (result.technical.rsi14 < 30) score += 15;
    else if (result.technical.rsi14 > 70) score -= 15;
    if (result.quote.price > result.technical.sma200) score += 10;
    else score -= 10;
  }
  if (result.fundamental) {
    if (result.fundamental.pe > 0 && result.fundamental.pe < 15) score += 10;
    if (result.fundamental.roe > 0.15) score += 10;
  }
  result.score = Math.min(100, Math.max(0, score));
  result.recommendation = score >= 70 ? "strong_buy" : score >= 55 ? "buy" : score >= 45 ? "hold" : score >= 30 ? "sell" : "strong_sell";
  return result;
}

async function getStockNews(symbol: string, limit: number = 10) {
  try {
    const quote = await yahooFinance.quote(symbol) as any;
    const searchResult = await yahooFinance.search(symbol, { newsCount: limit }) as any;
    const news = (searchResult.news || []).map((item: any) => ({
      title: item.title || '',
      link: item.link || '',
      publisher: item.publisher || '',
      publishedAt: item.providerPublishTime ? new Date(item.providerPublishTime * 1000).toISOString() : new Date().toISOString(),
      sentiment: analyzeSentiment(item.title || ''),
    }));
    const sentimentScores = news.map((n: any) => n.sentiment === 'positive' ? 1 : n.sentiment === 'negative' ? -1 : 0);
    const avgSentiment = sentimentScores.length > 0 ? sentimentScores.reduce((a: number, b: number) => a + b, 0) / sentimentScores.length : 0;
    return {
      symbol,
      companyName: quote.shortName || symbol,
      newsCount: news.length,
      news,
      overallSentiment: avgSentiment > 0.2 ? 'positive' : avgSentiment < -0.2 ? 'negative' : 'neutral',
    };
  } catch {
    return { symbol, companyName: symbol, newsCount: 0, news: [], overallSentiment: 'neutral' };
  }
}

// Create MCP Server
function createMCPServer() {
  const server = new Server(
    { name: "miyabi-investment-society", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      { name: "invest_market_overview", description: "[ばしょみるん] 市場概況を取得", inputSchema: { type: "object", properties: { region: { type: "string", enum: ["japan", "us"] } } } },
      { name: "invest_screen_stocks", description: "[えらぶん] 銘柄スクリーニング", inputSchema: { type: "object", properties: { pe_max: { type: "number" }, symbols: { type: "array", items: { type: "string" } } } } },
      { name: "invest_technical_analysis", description: "[ちゃーとみるん] テクニカル分析", inputSchema: { type: "object", properties: { symbol: { type: "string" } }, required: ["symbol"] } },
      { name: "invest_fundamental_analysis", description: "[ざいむみるん] ファンダメンタル分析", inputSchema: { type: "object", properties: { symbol: { type: "string" } }, required: ["symbol"] } },
      { name: "invest_risk_metrics", description: "[りすくみるん] リスク指標", inputSchema: { type: "object", properties: { symbol: { type: "string" } }, required: ["symbol"] } },
      { name: "invest_portfolio_analysis", description: "[さいてきかくん] ポートフォリオ分析", inputSchema: { type: "object", properties: { holdings: { type: "array" } }, required: ["holdings"] } },
      { name: "invest_analyze", description: "[とうしきるん] 総合分析", inputSchema: { type: "object", properties: { symbol: { type: "string" }, depth: { type: "string" } }, required: ["symbol"] } },
      { name: "invest_quote", description: "現在値取得", inputSchema: { type: "object", properties: { symbol: { type: "string" } }, required: ["symbol"] } },
      { name: "invest_news_stock", description: "[にゅーすあつめるん] 銘柄ニュース", inputSchema: { type: "object", properties: { symbol: { type: "string" }, limit: { type: "number" } }, required: ["symbol"] } },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
      switch (name) {
        case "invest_market_overview":
          return { content: [{ type: "text", text: JSON.stringify(await getMarketOverview(args?.region as string || "japan"), null, 2) }] };
        case "invest_screen_stocks":
          return { content: [{ type: "text", text: JSON.stringify(await screenStocks({ peMax: args?.pe_max, symbols: args?.symbols }), null, 2) }] };
        case "invest_technical_analysis":
          return { content: [{ type: "text", text: JSON.stringify(await getTechnicalIndicators(args?.symbol as string), null, 2) }] };
        case "invest_fundamental_analysis":
          return { content: [{ type: "text", text: JSON.stringify(await getFundamentalMetrics(args?.symbol as string), null, 2) }] };
        case "invest_risk_metrics":
          return { content: [{ type: "text", text: JSON.stringify(await getRiskMetrics(args?.symbol as string), null, 2) }] };
        case "invest_portfolio_analysis":
          const holdings = (args?.holdings as any[]).map(h => ({ symbol: h.symbol, shares: h.shares, avgCost: h.avg_cost }));
          return { content: [{ type: "text", text: JSON.stringify(await analyzePortfolio(holdings), null, 2) }] };
        case "invest_analyze":
          return { content: [{ type: "text", text: JSON.stringify(await analyzeStock(args?.symbol as string, args?.depth as string), null, 2) }] };
        case "invest_quote":
          const quote = await yahooFinance.quote(args?.symbol as string) as any;
          return { content: [{ type: "text", text: JSON.stringify({ symbol: args?.symbol, name: quote.shortName, price: quote.regularMarketPrice, change: quote.regularMarketChange, volume: quote.regularMarketVolume }, null, 2) }] };
        case "invest_news_stock":
          return { content: [{ type: "text", text: JSON.stringify(await getStockNews(args?.symbol as string, args?.limit as number || 10), null, 2) }] };
        default:
          return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
      }
    } catch (error) {
      return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }], isError: true };
    }
  });

  return server;
}

// HTTP Server with SSE
const PORT = parseInt(process.env.PORT || '3000', 10);

const httpServer = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', service: 'miyabi-investment-society', version: '1.0.0' }));
    return;
  }

  // SSE endpoint
  if (url.pathname === '/sse' || url.pathname === '/mcp') {
    console.log('New SSE connection');
    const server = createMCPServer();
    const transport = new SSEServerTransport('/mcp/messages', res);
    await server.connect(transport);
    return;
  }

  // Messages endpoint for SSE
  if (url.pathname === '/mcp/messages' && req.method === 'POST') {
    // This is handled by SSEServerTransport
    return;
  }

  // Default response
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    service: 'Miyabi Investment Society MCP Server',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      sse: '/sse',
      mcp: '/mcp',
    },
    agents: [
      'とうしきるん (InvestCoordinator)',
      'ばしょみるん (MarketAnalyst)',
      'えらぶん (StockScreener)',
      'ちゃーとみるん (TechnicalAnalyst)',
      'ざいむみるん (FundamentalAnalyst)',
      'りすくみるん (RiskManager)',
      'さいてきかくん (PortfolioOptimizer)',
      'にゅーすあつめるん (NewsAggregator)',
    ],
  }));
});

httpServer.listen(PORT, () => {
  console.log(`Miyabi Investment Society MCP Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
});
