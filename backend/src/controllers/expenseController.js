const Expense = require('../models/Expense');

const expenseController = {
  async index(req, res) {
    try {
      const { month, year, category_id } = req.query;
      const filters = {};

      if (month && year) {
        filters.month = parseInt(month);
        filters.year = parseInt(year);
      }

      if (category_id) {
        filters.category_id = parseInt(category_id);
      }

      const expenses = await Expense.findByUser(req.userId, filters);
      return res.json(expenses);
    } catch (error) {
      console.error('Erro ao listar gastos:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async show(req, res) {
    try {
      const expense = await Expense.findById(req.params.id, req.userId);

      if (!expense) {
        return res.status(404).json({ error: 'Gasto não encontrado' });
      }

      return res.json(expense);
    } catch (error) {
      console.error('Erro ao buscar gasto:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async store(req, res) {
    try {
      const { category_id, amount, description, expense_date } = req.body;

      if (!category_id || amount === undefined || !expense_date) {
        return res.status(400).json({ error: 'Campos obrigatórios: category_id, amount, expense_date' });
      }

      const id = await Expense.create(req.userId, {
        category_id,
        amount,
        description,
        expense_date
      });

      const expense = await Expense.findById(id, req.userId);
      return res.status(201).json(expense);
    } catch (error) {
      console.error('Erro ao criar gasto:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async update(req, res) {
    try {
      const { category_id, amount, description, expense_date } = req.body;

      const expense = await Expense.findById(req.params.id, req.userId);

      if (!expense) {
        return res.status(404).json({ error: 'Gasto não encontrado' });
      }

      await Expense.update(req.params.id, req.userId, {
        category_id: category_id ?? expense.category_id,
        amount: amount ?? expense.amount,
        description: description ?? expense.description,
        expense_date: expense_date ?? expense.expense_date
      });

      const updatedExpense = await Expense.findById(req.params.id, req.userId);
      return res.json(updatedExpense);
    } catch (error) {
      console.error('Erro ao atualizar gasto:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async destroy(req, res) {
    try {
      const deleted = await Expense.delete(req.params.id, req.userId);

      if (!deleted) {
        return res.status(404).json({ error: 'Gasto não encontrado' });
      }

      return res.status(204).send();
    } catch (error) {
      console.error('Erro ao deletar gasto:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  },

  async byCategory(req, res) {
    try {
      const { month, year } = req.query;
      const now = new Date();
      const m = month ? parseInt(month) : now.getMonth() + 1;
      const y = year ? parseInt(year) : now.getFullYear();

      const expenses = await Expense.sumByCategory(req.userId, m, y);
      return res.json(expenses);
    } catch (error) {
      console.error('Erro ao buscar gastos por categoria:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
};

module.exports = expenseController;
