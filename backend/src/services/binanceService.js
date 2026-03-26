const crypto = require('crypto');

const BINANCE_API_KEY = process.env.BINANCE_API_KEY;
const BINANCE_SECRET_KEY = process.env.BINANCE_SECRET_KEY;

async function getBinanceBalance() {
  const timeRes = await fetch('https://api.binance.com/api/v3/time');
  const { serverTime } = await timeRes.json();

  const qs = `timestamp=${serverTime}`;
  const signature = crypto
    .createHmac('sha256', BINANCE_SECRET_KEY)
    .update(qs)
    .digest('hex');

  const res = await fetch(`https://fapi.binance.com/fapi/v2/account?${qs}&signature=${signature}`, {
    headers: { 'X-MBX-APIKEY': BINANCE_API_KEY }
  });

  const data = await res.json();

  if (data.code) {
    throw new Error(`Binance Futures error ${data.code}: ${data.msg}`);
  }

  return parseFloat(data.totalMarginBalance);
}

module.exports = { getBinanceBalance };
