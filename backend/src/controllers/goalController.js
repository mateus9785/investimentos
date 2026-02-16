const Goal = require('../models/Goal');

const goalController = {
  async index(req, res) {
    try {
      const goal = await Goal.findByUser(req.userId);
      return res.json(goal || { total_balance: 0, monthly_profit: 0 });
    } catch (error) {
      console.error('Erro ao buscar objetivo:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async store(req, res) {
    try {
      const { total_balance, monthly_profit } = req.body;

      const id = await Goal.upsert(req.userId, {
        total_balance: total_balance || 0,
        monthly_profit: monthly_profit || 0
      });

      const goal = await Goal.findById(id, req.userId) || await Goal.findByUser(req.userId);
      return res.status(201).json(goal);
    } catch (error) {
      console.error('Erro ao salvar objetivo:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async update(req, res) {
    try {
      const { total_balance, monthly_profit } = req.body;

      const goal = await Goal.findById(req.params.id, req.userId);

      if (!goal) {
        return res.status(404).json({ error: 'Objetivo não encontrado' });
      }

      await Goal.update(req.params.id, req.userId, {
        total_balance: total_balance ?? goal.total_balance,
        monthly_profit: monthly_profit ?? goal.monthly_profit
      });

      const updatedGoal = await Goal.findById(req.params.id, req.userId);
      return res.json(updatedGoal);
    } catch (error) {
      console.error('Erro ao atualizar objetivo:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async destroy(req, res) {
    try {
      const deleted = await Goal.delete(req.params.id, req.userId);

      if (!deleted) {
        return res.status(404).json({ error: 'Objetivo não encontrado' });
      }

      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar objetivo:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
};

module.exports = goalController;
