const db = require('../config/database');

const Category = {
  async findAll() {
    const [rows] = await db.query('SELECT * FROM categories ORDER BY name');
    return rows;
  },

  async findById(id) {
    const [rows] = await db.query('SELECT * FROM categories WHERE id = ?', [id]);
    return rows[0];
  }
};

module.exports = Category;
