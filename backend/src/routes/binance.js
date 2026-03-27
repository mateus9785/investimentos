const express = require('express');
const router = express.Router();
const { getBinanceBalance, getBtcPrice, getOpenPositions } = require('../services/binanceService');

router.get('/balance', async (req, res) => {
  try {
    const balanceUSD = await getBinanceBalance();
    return res.json({ balanceUSD });
  } catch (error) {
    console.error('Erro ao buscar saldo Binance:', error.message);
    return res.status(500).json({ error: 'Erro ao buscar saldo na Binance' });
  }
});

router.get('/live', async (req, res) => {
  try {
    const [btcPrice, positions] = await Promise.all([
      getBtcPrice(),
      getOpenPositions(),
    ]);
    return res.json({ btcPrice, positions });
  } catch (error) {
    console.error('Erro ao buscar dados live Binance:', error.message);
    return res.status(500).json({ error: 'Erro ao buscar dados live' });
  }
});

module.exports = router;
