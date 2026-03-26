const db = require('../config/database');

const Category = {
  async findAll() {
    const [rows] = await db.query('SELECT * FROM categories ORDER BY name');
    return rows;
  },


};

module.exports = Category;
