const Balance = require('../models/Balance');

const balanceController = {
  async index(req, res) {
    try {
      const balances = await Balance.findByUser(req.userId);
      return res.json(balances);
    } catch (error) {
      console.error('Erro ao listar saldos:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async show(req, res) {
    try {
      const balance = await Balance.findById(req.params.id, req.userId);

      if (!balance) {
        return res.status(404).json({ error: 'Saldo não encontrado' });
      }

      return res.json(balance);
    } catch (error) {
      console.error('Erro ao buscar saldo:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async store(req, res) {
    try {
      const { account_type, initial_balance, reference_date } = req.body;

      if (!account_type || initial_balance === undefined || !reference_date) {
        return res.status(400).json({ error: 'Campos obrigatórios: account_type, initial_balance, reference_date' });
      }

      if (!['bank', 'broker', 'broker_international'].includes(account_type)) {
        return res.status(400).json({ error: 'account_type deve ser bank, broker ou broker_international' });
      }

      const id = await Balance.create(req.userId, {
        account_type,
        initial_balance,
        reference_date
      });

      const balance = await Balance.findById(id, req.userId);
      return res.status(201).json(balance);
    } catch (error) {
      console.error('Erro ao criar saldo:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async update(req, res) {
    try {
      const { initial_balance, reference_date } = req.body;

      const balance = await Balance.findById(req.params.id, req.userId);

      if (!balance) {
        return res.status(404).json({ error: 'Saldo não encontrado' });
      }

      await Balance.update(req.params.id, req.userId, {
        initial_balance: initial_balance ?? balance.initial_balance,
        reference_date: reference_date ?? balance.reference_date
      });

      const updatedBalance = await Balance.findById(req.params.id, req.userId);
      return res.json(updatedBalance);
    } catch (error) {
      console.error('Erro ao atualizar saldo:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async destroy(req, res) {
    try {
      const deleted = await Balance.delete(req.params.id, req.userId);

      if (!deleted) {
        return res.status(404).json({ error: 'Saldo não encontrado' });
      }

      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar saldo:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
};

module.exports = balanceController;
