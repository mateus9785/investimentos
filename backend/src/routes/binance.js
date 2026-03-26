const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/authMiddleware');
const { getBinanceBalance } = require('../services/binanceService');

router.use(authMiddleware);

router.get('/balance', async (req, res) => {
  try {
    const balanceUSD = await getBinanceBalance();
    return res.json({ balanceUSD });
  } catch (error) {
    console.error('Erro ao buscar saldo Binance:', error.message);
    return res.status(500).json({ error: 'Erro ao buscar saldo na Binance' });
  }
});

module.exports = router;
