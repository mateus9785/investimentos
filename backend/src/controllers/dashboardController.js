const calculationService = require('../services/calculationService');
const db = require('../config/database');
const Balance = require('../models/Balance');

const dashboardController = {
  async summary(req, res) {
    try {
      const { month, year } = req.query;
      const now = new Date();
      const m = month ? parseInt(month) : now.getMonth() + 1;
      const y = year ? parseInt(year) : now.getFullYear();

      const summary = await calculationService.getDashboardSummary(req.userId, m, y);
      return res.json(summary);
    } catch (error) {
      console.error('Erro ao buscar resumo:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async equityCurve(req, res) {
    try {
      const { month, year } = req.query;
      const now = new Date();
      const m = month ? parseInt(month) : now.getMonth() + 1;
      const y = year ? parseInt(year) : now.getFullYear();

      const brokerBalance = await Balance.findByType(req.userId, 'broker');
      const brokerIntBalance = await Balance.findByType(req.userId, 'broker_international');
      const initialBroker = brokerBalance ? parseFloat(brokerBalance.initial_balance) : 0;
      const initialBrokerInt = brokerIntBalance ? parseFloat(brokerIntBalance.initial_balance) : 0;

      // Fetch exchange rate
      let exchangeRate = 0;
      try {
        const rateRes = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL');
        const rateData = await rateRes.json();
        exchangeRate = parseFloat(rateData.USDBRL.ask);
      } catch {}

      // Get all domestic trades for the month grouped by date
      const [domesticRows] = await db.query(
        `SELECT DATE(trade_date) as date, SUM(pnl) as total_pnl
         FROM trades
         WHERE user_id = ? AND MONTH(trade_date) = ? AND YEAR(trade_date) = ?
         GROUP BY date ORDER BY date`,
        [req.userId, m, y]
      );

      // Get all international trades for the month grouped by date (in USD)
      const [intRows] = await db.query(
        `SELECT DATE(trade_date) as date, SUM(pnl_usd) as total_pnl
         FROM international_trades
         WHERE user_id = ? AND MONTH(trade_date) = ? AND YEAR(trade_date) = ?
         GROUP BY date ORDER BY date`,
        [req.userId, m, y]
      );

      // Merge by date
      const merged = {};
      for (const row of domesticRows) {
        const key = row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date);
        merged[key] = (merged[key] || 0) + parseFloat(row.total_pnl);
      }
      for (const row of intRows) {
        const key = row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date);
        merged[key] = (merged[key] || 0) + parseFloat(row.total_pnl) * exchangeRate;
      }

      const sortedDates = Object.keys(merged).sort();
      let cumulative = 0;

      const curve = sortedDates.map(date => {
        cumulative += merged[date];
        return { date, balance: Math.round(cumulative * 100) / 100, pnl: Math.round(merged[date] * 100) / 100 };
      });

      // Prepend zero point
      curve.unshift({ date: 'Início', balance: 0, pnl: 0 });

      return res.json(curve);
    } catch (error) {
      console.error('Erro ao buscar curva de capital:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
};

module.exports = dashboardController;
