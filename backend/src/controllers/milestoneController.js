const Milestone = require('../models/Milestone');

const VALID_TYPES = ['total_balance', 'monthly_profit', 'broker_international_balance'];

const milestoneController = {
  async index(req, res) {
    try {
      const milestones = await Milestone.findAllByUser(req.userId);
      return res.json(milestones);
    } catch (error) {
      console.error('Erro ao buscar metas:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async store(req, res) {
    try {
      const { type, target_amount } = req.body;
      if (!type || !VALID_TYPES.includes(type)) {
        return res.status(400).json({ error: 'type inválido' });
      }
      if (!target_amount || isNaN(parseFloat(target_amount))) {
        return res.status(400).json({ error: 'target_amount é obrigatório' });
      }
      const id = await Milestone.create(req.userId, type, parseFloat(target_amount));
      const milestone = await Milestone.findById(id, req.userId);
      return res.status(201).json(milestone);
    } catch (error) {
      console.error('Erro ao criar meta:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async destroy(req, res) {
    try {
      const deleted = await Milestone.delete(req.params.id, req.userId);
      if (!deleted) {
        return res.status(404).json({ error: 'Meta não encontrada' });
      }
      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao excluir meta:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
};

module.exports = milestoneController;
