const InternationalTrade = require('../models/InternationalTrade');

const internationalTradeController = {
  async index(req, res) {
    try {
      const { month, year } = req.query;
      const filters = {};

      if (month && year) {
        filters.month = parseInt(month);
        filters.year = parseInt(year);
      }

      const trades = await InternationalTrade.findByUser(req.userId, filters);
      return res.json(trades);
    } catch (error) {
      console.error('Erro ao listar trades internacionais:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async show(req, res) {
    try {
      const trade = await InternationalTrade.findById(req.params.id, req.userId);

      if (!trade) {
        return res.status(404).json({ error: 'Trade não encontrado' });
      }

      return res.json(trade);
    } catch (error) {
      console.error('Erro ao buscar trade internacional:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async store(req, res) {
    try {
      const { trade_date, pnl_usd, exchange_rate, description } = req.body;

      if (!trade_date || pnl_usd === undefined || !exchange_rate) {
        return res.status(400).json({ error: 'Campos obrigatórios: trade_date, pnl_usd, exchange_rate' });
      }

      const id = await InternationalTrade.create(req.userId, {
        trade_date,
        pnl_usd,
        exchange_rate,
        description
      });

      const trade = await InternationalTrade.findById(id, req.userId);
      return res.status(201).json(trade);
    } catch (error) {
      console.error('Erro ao criar trade internacional:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async update(req, res) {
    try {
      const { trade_date, pnl_usd, exchange_rate, description } = req.body;

      const trade = await InternationalTrade.findById(req.params.id, req.userId);

      if (!trade) {
        return res.status(404).json({ error: 'Trade não encontrado' });
      }

      await InternationalTrade.update(req.params.id, req.userId, {
        trade_date: trade_date ?? trade.trade_date,
        pnl_usd: pnl_usd ?? trade.pnl_usd,
        exchange_rate: exchange_rate ?? trade.exchange_rate,
        description: description ?? trade.description
      });

      const updatedTrade = await InternationalTrade.findById(req.params.id, req.userId);
      return res.json(updatedTrade);
    } catch (error) {
      console.error('Erro ao atualizar trade internacional:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async destroy(req, res) {
    try {
      const deleted = await InternationalTrade.delete(req.params.id, req.userId);

      if (!deleted) {
        return res.status(404).json({ error: 'Trade não encontrado' });
      }

      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar trade internacional:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async calendar(req, res) {
    try {
      const { month, year } = req.params;

      if (!month || !year) {
        return res.status(400).json({ error: 'Mês e ano são obrigatórios' });
      }

      const calendar = await InternationalTrade.getCalendar(req.userId, parseInt(month), parseInt(year));
      return res.json(calendar);
    } catch (error) {
      console.error('Erro ao buscar calendário internacional:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
};

module.exports = internationalTradeController;
