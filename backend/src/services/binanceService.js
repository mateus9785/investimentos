const crypto = require('crypto');

const BINANCE_API_KEY = process.env.BINANCE_API_KEY;
const BINANCE_SECRET_KEY = process.env.BINANCE_SECRET_KEY;

async function getServerTime() {
  const timeRes = await fetch('https://api.binance.com/api/v3/time');
  const { serverTime } = await timeRes.json();
  return serverTime;
}

function sign(qs) {
  return crypto.createHmac('sha256', BINANCE_SECRET_KEY).update(qs).digest('hex');
}

async function getBinanceBalance() {
  const serverTime = await getServerTime();
  const qs = `timestamp=${serverTime}`;
  const res = await fetch(`https://fapi.binance.com/fapi/v2/account?${qs}&signature=${sign(qs)}`, {
    headers: { 'X-MBX-APIKEY': BINANCE_API_KEY }
  });
  const data = await res.json();
  if (data.code) throw new Error(`Binance Futures error ${data.code}: ${data.msg}`);
  return parseFloat(data.totalMarginBalance);
}

async function getBtcPrice() {
  const res = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
  const data = await res.json();
  return parseFloat(data.price);
}

async function getOpenPositions() {
  const serverTime = await getServerTime();
  const qs = `timestamp=${serverTime}`;
  const res = await fetch(`https://fapi.binance.com/fapi/v2/positionRisk?${qs}&signature=${sign(qs)}`, {
    headers: { 'X-MBX-APIKEY': BINANCE_API_KEY }
  });
  const data = await res.json();
  if (data.code) throw new Error(`Binance Futures error ${data.code}: ${data.msg}`);
  return data
    .filter(p => parseFloat(p.positionAmt) !== 0)
    .map(p => ({
      symbol: p.symbol,
      side: parseFloat(p.positionAmt) > 0 ? 'LONG' : 'SHORT',
      positionAmt: parseFloat(p.positionAmt),
      entryPrice: parseFloat(p.entryPrice),
      markPrice: parseFloat(p.markPrice),
      unrealizedProfit: parseFloat(p.unRealizedProfit),
      percentage: parseFloat(p.entryPrice) > 0
        ? ((parseFloat(p.markPrice) - parseFloat(p.entryPrice)) / parseFloat(p.entryPrice)) * 100 * (parseFloat(p.positionAmt) > 0 ? 1 : -1)
        : 0,
      leverage: parseInt(p.leverage),
    }));
}

module.exports = { getBinanceBalance, getBtcPrice, getOpenPositions };
