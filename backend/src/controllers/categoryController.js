const Category = require('../models/Category');

const categoryController = {
  async index(req, res) {
    try {
      const categories = await Category.findAll();
      return res.json(categories);
    } catch (error) {
      console.error('Erro ao listar categorias:', error);
      return res.status(500).json({ error: 'Erro interno do servidor' });
    }
  }
};

module.exports = categoryController;
