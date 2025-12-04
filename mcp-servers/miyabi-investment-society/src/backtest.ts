/**
 * Miyabi Investment Society - Backtest Engine
 * バックテストエンジン（かこみるん）
 * 
 * 過去データを使用した戦略検証とパフォーマンス分析
 */

import yahooFinance from 'yahoo-finance2';

// ============================================================
// Types
// ============================================================

export interface BacktestConfig {
  symbol: string;
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD
  initialCapital: number;
  strategy: StrategyType;
  params?: StrategyParams;
}

export type StrategyType = 
  | 'sma_crossover'      // SMAクロスオーバー
  | 'rsi_oversold'       // RSI売られすぎ
  | 'bollinger_bounce'   // ボリンジャーバンド反発
  | 'macd_crossover'     // MACDクロスオーバー
  | 'golden_cross'       // ゴールデンクロス
  | 'custom';            // カスタム

export interface StrategyParams {
  // SMA
  smaFast?: number;
  smaSlow?: number;
  // RSI
  rsiPeriod?: number;
  rsiOversold?: number;
  rsiOverbought?: number;
  // Bollinger
  bbPeriod?: number;
  bbStdDev?: number;
  // MACD
  macdFast?: number;
  macdSlow?: number;
  macdSignal?: number;
  // Risk Management
  stopLossPercent?: number;
  takeProfitPercent?: number;
  positionSize?: number;  // 0-1
}

export interface Trade {
  date: string;
  type: 'buy' | 'sell';
  price: number;
  shares: number;
  value: number;
  reason: string;
}

export interface BacktestResult {
  symbol: string;
  strategy: StrategyType;
  period: {
    start: string;
    end: string;
    tradingDays: number;
  };
  performance: {
    initialCapital: number;
    finalValue: number;
    totalReturn: number;
    totalReturnPercent: number;
    annualizedReturn: number;
    buyAndHoldReturn: number;
    alpha: number;
  };
  risk: {
    volatility: number;
    sharpeRatio: number;
    sortinoRatio: number;
    maxDrawdown: number;
    maxDrawdownDate: string;
    calmarRatio: number;
    var95: number;
  };
  trades: {
    total: number;
    winning: number;
    losing: number;
    winRate: number;
    avgWin: number;
    avgLoss: number;
    profitFactor: number;
    avgHoldingDays: number;
  };
  tradeHistory: Trade[];
  equityCurve: { date: string; value: number }[];
}

// ============================================================
// Helper Functions
// ============================================================

function calculateSMA(prices: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      sma.push(NaN);
    } else {
      const slice = prices.slice(i - period + 1, i + 1);
      sma.push(slice.reduce((a, b) => a + b, 0) / period);
    }
  }
  return sma;
}

function calculateEMA(prices: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);
  
  for (let i = 0; i < prices.length; i++) {
    if (i === 0) {
      ema.push(prices[0]);
    } else if (i < period - 1) {
      ema.push(NaN);
    } else if (i === period - 1) {
      const slice = prices.slice(0, period);
      ema.push(slice.reduce((a, b) => a + b, 0) / period);
    } else {
      ema.push((prices[i] - ema[i - 1]) * multiplier + ema[i - 1]);
    }
  }
  return ema;
}

function calculateRSI(prices: number[], period: number = 14): number[] {
  const rsi: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i === 0) {
      rsi.push(NaN);
      gains.push(0);
      losses.push(0);
    } else {
      const change = prices[i] - prices[i - 1];
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
      
      if (i < period) {
        rsi.push(NaN);
      } else {
        const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
        const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
        
        if (avgLoss === 0) {
          rsi.push(100);
        } else {
          const rs = avgGain / avgLoss;
          rsi.push(100 - (100 / (1 + rs)));
        }
      }
    }
  }
  return rsi;
}

function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): {
  upper: number[];
  middle: number[];
  lower: number[];
} {
  const middle = calculateSMA(prices, period);
  const upper: number[] = [];
  const lower: number[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      upper.push(NaN);
      lower.push(NaN);
    } else {
      const slice = prices.slice(i - period + 1, i + 1);
      const avg = middle[i];
      const squaredDiffs = slice.map(p => Math.pow(p - avg, 2));
      const std = Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / period);
      upper.push(avg + stdDev * std);
      lower.push(avg - stdDev * std);
    }
  }
  
  return { upper, middle, lower };
}

function calculateMACD(prices: number[], fast: number = 12, slow: number = 26, signal: number = 9): {
  macd: number[];
  signal: number[];
  histogram: number[];
} {
  const emaFast = calculateEMA(prices, fast);
  const emaSlow = calculateEMA(prices, slow);
  const macdLine: number[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (isNaN(emaFast[i]) || isNaN(emaSlow[i])) {
      macdLine.push(NaN);
    } else {
      macdLine.push(emaFast[i] - emaSlow[i]);
    }
  }
  
  const signalLine = calculateEMA(macdLine.filter(v => !isNaN(v)), signal);
  const fullSignal: number[] = [];
  let signalIdx = 0;
  
  for (let i = 0; i < macdLine.length; i++) {
    if (isNaN(macdLine[i])) {
      fullSignal.push(NaN);
    } else {
      fullSignal.push(signalLine[signalIdx] || NaN);
      signalIdx++;
    }
  }
  
  const histogram = macdLine.map((m, i) => 
    isNaN(m) || isNaN(fullSignal[i]) ? NaN : m - fullSignal[i]
  );
  
  return { macd: macdLine, signal: fullSignal, histogram };
}

// ============================================================
// Strategy Signals
// ============================================================

interface HistoricalData {
  date: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

function generateSignals(
  data: HistoricalData[],
  strategy: StrategyType,
  params: StrategyParams
): ('buy' | 'sell' | 'hold')[] {
  const closes = data.map(d => d.close);
  const signals: ('buy' | 'sell' | 'hold')[] = [];
  
  switch (strategy) {
    case 'sma_crossover': {
      const fast = calculateSMA(closes, params.smaFast || 10);
      const slow = calculateSMA(closes, params.smaSlow || 30);
      
      for (let i = 0; i < data.length; i++) {
        if (i === 0 || isNaN(fast[i]) || isNaN(slow[i])) {
          signals.push('hold');
        } else if (fast[i] > slow[i] && fast[i - 1] <= slow[i - 1]) {
          signals.push('buy');
        } else if (fast[i] < slow[i] && fast[i - 1] >= slow[i - 1]) {
          signals.push('sell');
        } else {
          signals.push('hold');
        }
      }
      break;
    }
    
    case 'rsi_oversold': {
      const rsi = calculateRSI(closes, params.rsiPeriod || 14);
      const oversold = params.rsiOversold || 30;
      const overbought = params.rsiOverbought || 70;
      
      for (let i = 0; i < data.length; i++) {
        if (isNaN(rsi[i])) {
          signals.push('hold');
        } else if (rsi[i] < oversold && (i === 0 || rsi[i - 1] >= oversold)) {
          signals.push('buy');
        } else if (rsi[i] > overbought && (i === 0 || rsi[i - 1] <= overbought)) {
          signals.push('sell');
        } else {
          signals.push('hold');
        }
      }
      break;
    }
    
    case 'bollinger_bounce': {
      const bb = calculateBollingerBands(closes, params.bbPeriod || 20, params.bbStdDev || 2);
      
      for (let i = 0; i < data.length; i++) {
        if (isNaN(bb.lower[i]) || isNaN(bb.upper[i])) {
          signals.push('hold');
        } else if (closes[i] <= bb.lower[i] && (i === 0 || closes[i - 1] > bb.lower[i - 1])) {
          signals.push('buy');
        } else if (closes[i] >= bb.upper[i] && (i === 0 || closes[i - 1] < bb.upper[i - 1])) {
          signals.push('sell');
        } else {
          signals.push('hold');
        }
      }
      break;
    }
    
    case 'macd_crossover': {
      const macd = calculateMACD(closes, params.macdFast || 12, params.macdSlow || 26, params.macdSignal || 9);
      
      for (let i = 0; i < data.length; i++) {
        if (isNaN(macd.macd[i]) || isNaN(macd.signal[i])) {
          signals.push('hold');
        } else if (macd.macd[i] > macd.signal[i] && (i === 0 || macd.macd[i - 1] <= macd.signal[i - 1])) {
          signals.push('buy');
        } else if (macd.macd[i] < macd.signal[i] && (i === 0 || macd.macd[i - 1] >= macd.signal[i - 1])) {
          signals.push('sell');
        } else {
          signals.push('hold');
        }
      }
      break;
    }
    
    case 'golden_cross': {
      const sma50 = calculateSMA(closes, 50);
      const sma200 = calculateSMA(closes, 200);
      
      for (let i = 0; i < data.length; i++) {
        if (isNaN(sma50[i]) || isNaN(sma200[i])) {
          signals.push('hold');
        } else if (sma50[i] > sma200[i] && (i === 0 || sma50[i - 1] <= sma200[i - 1])) {
          signals.push('buy');
        } else if (sma50[i] < sma200[i] && (i === 0 || sma50[i - 1] >= sma200[i - 1])) {
          signals.push('sell');
        } else {
          signals.push('hold');
        }
      }
      break;
    }
    
    default:
      for (let i = 0; i < data.length; i++) {
        signals.push('hold');
      }
  }
  
  return signals;
}

// ============================================================
// Backtest Engine
// ============================================================

export async function runBacktest(config: BacktestConfig): Promise<BacktestResult> {
  const { symbol, startDate, endDate, initialCapital, strategy, params = {} } = config;
  
  // Fetch historical data
  const historical = await yahooFinance.historical(symbol, {
    period1: startDate,
    period2: endDate,
  });
  
  if (historical.length === 0) {
    throw new Error(`No data found for ${symbol} in the specified period`);
  }
  
  const data: HistoricalData[] = historical.map(h => ({
    date: h.date,
    open: h.open,
    high: h.high,
    low: h.low,
    close: h.close,
    volume: h.volume,
  }));
  
  // Generate signals
  const signals = generateSignals(data, strategy, params);
  
  // Execute trades
  let cash = initialCapital;
  let shares = 0;
  let position: 'long' | 'none' = 'none';
  const trades: Trade[] = [];
  const equityCurve: { date: string; value: number }[] = [];
  const positionSize = params.positionSize || 1.0;
  const stopLoss = params.stopLossPercent || 0;
  const takeProfit = params.takeProfitPercent || 0;
  let entryPrice = 0;
  
  for (let i = 0; i < data.length; i++) {
    const d = data[i];
    const signal = signals[i];
    const dateStr = d.date.toISOString().split('T')[0];
    
    // Check stop loss / take profit
    if (position === 'long' && shares > 0) {
      const pnlPercent = (d.close - entryPrice) / entryPrice * 100;
      
      if (stopLoss > 0 && pnlPercent <= -stopLoss) {
        // Stop loss triggered
        const value = shares * d.close;
        cash += value;
        trades.push({
          date: dateStr,
          type: 'sell',
          price: d.close,
          shares,
          value,
          reason: `Stop Loss (-${stopLoss}%)`,
        });
        shares = 0;
        position = 'none';
      } else if (takeProfit > 0 && pnlPercent >= takeProfit) {
        // Take profit triggered
        const value = shares * d.close;
        cash += value;
        trades.push({
          date: dateStr,
          type: 'sell',
          price: d.close,
          shares,
          value,
          reason: `Take Profit (+${takeProfit}%)`,
        });
        shares = 0;
        position = 'none';
      }
    }
    
    // Execute signal
    if (signal === 'buy' && position === 'none') {
      const investAmount = cash * positionSize;
      const sharesToBuy = Math.floor(investAmount / d.close);
      if (sharesToBuy > 0) {
        const cost = sharesToBuy * d.close;
        cash -= cost;
        shares = sharesToBuy;
        position = 'long';
        entryPrice = d.close;
        trades.push({
          date: dateStr,
          type: 'buy',
          price: d.close,
          shares: sharesToBuy,
          value: cost,
          reason: `${strategy} signal`,
        });
      }
    } else if (signal === 'sell' && position === 'long') {
      const value = shares * d.close;
      cash += value;
      trades.push({
        date: dateStr,
        type: 'sell',
        price: d.close,
        shares,
        value,
        reason: `${strategy} signal`,
      });
      shares = 0;
      position = 'none';
    }
    
    // Record equity
    const portfolioValue = cash + shares * d.close;
    equityCurve.push({ date: dateStr, value: portfolioValue });
  }
  
  // Calculate performance metrics
  const finalValue = equityCurve[equityCurve.length - 1].value;
  const totalReturn = finalValue - initialCapital;
  const totalReturnPercent = (totalReturn / initialCapital) * 100;
  const tradingDays = data.length;
  const years = tradingDays / 252;
  const annualizedReturn = (Math.pow(finalValue / initialCapital, 1 / years) - 1) * 100;
  
  // Buy and hold comparison
  const buyAndHoldShares = Math.floor(initialCapital / data[0].close);
  const buyAndHoldFinal = buyAndHoldShares * data[data.length - 1].close;
  const buyAndHoldReturn = ((buyAndHoldFinal - initialCapital) / initialCapital) * 100;
  
  // Calculate daily returns
  const dailyReturns: number[] = [];
  for (let i = 1; i < equityCurve.length; i++) {
    dailyReturns.push((equityCurve[i].value - equityCurve[i - 1].value) / equityCurve[i - 1].value);
  }
  
  // Volatility
  const avgReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / dailyReturns.length;
  const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100;
  
  // Sharpe Ratio (assuming 5% risk-free rate)
  const riskFreeRate = 0.05;
  const sharpeRatio = (annualizedReturn / 100 - riskFreeRate) / (volatility / 100);
  
  // Sortino Ratio
  const negativeReturns = dailyReturns.filter(r => r < 0);
  const downsideVariance = negativeReturns.length > 0
    ? negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length
    : 0;
  const downsideDeviation = Math.sqrt(downsideVariance) * Math.sqrt(252);
  const sortinoRatio = downsideDeviation > 0 ? (annualizedReturn / 100 - riskFreeRate) / downsideDeviation : 0;
  
  // Max Drawdown
  let maxDrawdown = 0;
  let maxDrawdownDate = '';
  let peak = equityCurve[0].value;
  
  for (const point of equityCurve) {
    if (point.value > peak) {
      peak = point.value;
    }
    const drawdown = (peak - point.value) / peak;
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown;
      maxDrawdownDate = point.date;
    }
  }
  
  // Calmar Ratio
  const calmarRatio = maxDrawdown > 0 ? (annualizedReturn / 100) / maxDrawdown : 0;
  
  // VaR 95%
  const sortedReturns = [...dailyReturns].sort((a, b) => a - b);
  const varIndex = Math.floor(dailyReturns.length * 0.05);
  const var95 = Math.abs(sortedReturns[varIndex] || 0) * 100;
  
  // Trade statistics
  const buyTrades = trades.filter(t => t.type === 'buy');
  const sellTrades = trades.filter(t => t.type === 'sell');
  const completedTrades: { buy: Trade; sell: Trade; pnl: number }[] = [];
  
  for (let i = 0; i < Math.min(buyTrades.length, sellTrades.length); i++) {
    const pnl = sellTrades[i].value - buyTrades[i].value;
    completedTrades.push({ buy: buyTrades[i], sell: sellTrades[i], pnl });
  }
  
  const winningTrades = completedTrades.filter(t => t.pnl > 0);
  const losingTrades = completedTrades.filter(t => t.pnl <= 0);
  const avgWin = winningTrades.length > 0 
    ? winningTrades.reduce((sum, t) => sum + t.pnl, 0) / winningTrades.length 
    : 0;
  const avgLoss = losingTrades.length > 0 
    ? Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0) / losingTrades.length)
    : 0;
  const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;
  
  // Average holding days
  let totalHoldingDays = 0;
  for (const trade of completedTrades) {
    const buyDate = new Date(trade.buy.date);
    const sellDate = new Date(trade.sell.date);
    totalHoldingDays += (sellDate.getTime() - buyDate.getTime()) / (1000 * 60 * 60 * 24);
  }
  const avgHoldingDays = completedTrades.length > 0 ? totalHoldingDays / completedTrades.length : 0;
  
  return {
    symbol,
    strategy,
    period: {
      start: startDate,
      end: endDate,
      tradingDays,
    },
    performance: {
      initialCapital,
      finalValue,
      totalReturn,
      totalReturnPercent,
      annualizedReturn,
      buyAndHoldReturn,
      alpha: annualizedReturn - buyAndHoldReturn,
    },
    risk: {
      volatility,
      sharpeRatio,
      sortinoRatio,
      maxDrawdown: maxDrawdown * 100,
      maxDrawdownDate,
      calmarRatio,
      var95,
    },
    trades: {
      total: trades.length,
      winning: winningTrades.length,
      losing: losingTrades.length,
      winRate: completedTrades.length > 0 ? (winningTrades.length / completedTrades.length) * 100 : 0,
      avgWin,
      avgLoss,
      profitFactor,
      avgHoldingDays,
    },
    tradeHistory: trades,
    equityCurve,
  };
}

// ============================================================
// Multi-Strategy Comparison
// ============================================================

export async function compareStrategies(
  symbol: string,
  startDate: string,
  endDate: string,
  initialCapital: number
): Promise<{ strategy: StrategyType; result: BacktestResult }[]> {
  const strategies: { type: StrategyType; params: StrategyParams }[] = [
    { type: 'sma_crossover', params: { smaFast: 10, smaSlow: 30 } },
    { type: 'sma_crossover', params: { smaFast: 20, smaSlow: 50 } },
    { type: 'rsi_oversold', params: { rsiPeriod: 14, rsiOversold: 30, rsiOverbought: 70 } },
    { type: 'bollinger_bounce', params: { bbPeriod: 20, bbStdDev: 2 } },
    { type: 'macd_crossover', params: { macdFast: 12, macdSlow: 26, macdSignal: 9 } },
    { type: 'golden_cross', params: {} },
  ];
  
  const results: { strategy: StrategyType; result: BacktestResult }[] = [];
  
  for (const s of strategies) {
    try {
      const result = await runBacktest({
        symbol,
        startDate,
        endDate,
        initialCapital,
        strategy: s.type,
        params: s.params,
      });
      results.push({ strategy: s.type, result });
    } catch (error) {
      console.error(`Failed to backtest ${s.type}:`, error);
    }
  }
  
  // Sort by total return
  results.sort((a, b) => b.result.performance.totalReturnPercent - a.result.performance.totalReturnPercent);
  
  return results;
}
