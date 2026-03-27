const express = require('express');
const router = express.Router();


router.get('/usd', async (req, res) => {
  try {
    const response = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
    const data = await response.json();
    const rate = parseFloat(data.USDBRL.ask);
    return res.json({ rate });
  } catch (error) {
    console.error('Erro ao buscar cotação:', error);
    return res.status(500).json({ error: 'Erro ao buscar cotação do dólar' });
  }
});

module.exports = router;
