const Trade = require('../models/Trade');
const InternationalTrade = require('../models/InternationalTrade');

const tradeController = {
  async index(req, res) {
    try {
      const { month, year } = req.query;
      const filters = {};

      if (month && year) {
        filters.month = parseInt(month);
        filters.year = parseInt(year);
      }

      const trades = await Trade.findByUser(req.userId, filters);
      return res.json(trades);
    } catch (error) {
      console.error('Erro ao listar trades:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async show(req, res) {
    try {
      const trade = await Trade.findById(req.params.id, req.userId);

      if (!trade) {
        return res.status(404).json({ error: 'Trade não encontrado' });
      }

      return res.json(trade);
    } catch (error) {
      console.error('Erro ao buscar trade:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async store(req, res) {
    try {
      const { trade_date, pnl, description } = req.body;

      if (!trade_date || pnl === undefined) {
        return res.status(400).json({ error: 'Campos obrigatórios: trade_date, pnl' });
      }

      const id = await Trade.create(req.userId, {
        trade_date,
        pnl,
        description
      });

      const trade = await Trade.findById(id, req.userId);
      return res.status(201).json(trade);
    } catch (error) {
      console.error('Erro ao criar trade:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async update(req, res) {
    try {
      const { trade_date, pnl, description } = req.body;

      const trade = await Trade.findById(req.params.id, req.userId);

      if (!trade) {
        return res.status(404).json({ error: 'Trade não encontrado' });
      }

      await Trade.update(req.params.id, req.userId, {
        trade_date: trade_date ?? trade.trade_date,
        pnl: pnl ?? trade.pnl,
        description: description ?? trade.description
      });

      const updatedTrade = await Trade.findById(req.params.id, req.userId);
      return res.json(updatedTrade);
    } catch (error) {
      console.error('Erro ao atualizar trade:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async destroy(req, res) {
    try {
      const deleted = await Trade.delete(req.params.id, req.userId);

      if (!deleted) {
        return res.status(404).json({ error: 'Trade não encontrado' });
      }

      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar trade:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async calendar(req, res) {
    try {
      const { month, year } = req.params;

      if (!month || !year) {
        return res.status(400).json({ error: 'Mês e ano são obrigatórios' });
      }

      const [domesticCalendar, internationalCalendar] = await Promise.all([
        Trade.getCalendar(req.userId, parseInt(month), parseInt(year)),
        InternationalTrade.getCalendar(req.userId, parseInt(month), parseInt(year))
      ]);

      const merged = {};
      for (const entry of domesticCalendar) {
        const key = entry.date instanceof Date ? entry.date.toISOString().split('T')[0] : String(entry.date);
        merged[key] = (merged[key] || 0) + parseFloat(entry.total_pnl);
      }
      for (const entry of internationalCalendar) {
        const key = entry.date instanceof Date ? entry.date.toISOString().split('T')[0] : String(entry.date);
        merged[key] = (merged[key] || 0) + parseFloat(entry.total_pnl);
      }

      const calendar = Object.entries(merged)
        .map(([date, total_pnl]) => ({ date, total_pnl }))
        .sort((a, b) => a.date.localeCompare(b.date));

      return res.json(calendar);
    } catch (error) {
      console.error('Erro ao buscar calendário:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
};

module.exports = tradeController;
