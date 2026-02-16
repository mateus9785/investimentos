const db = require('../config/database');

const Expense = {
  async findByUser(userId, filters = {}) {
    let query = `
      SELECT e.*, c.name as category_name
      FROM expenses e
      JOIN categories c ON e.category_id = c.id
      WHERE e.user_id = ?
    `;
    const params = [userId];

    if (filters.month && filters.year) {
      query += ' AND MONTH(e.expense_date) = ? AND YEAR(e.expense_date) = ?';
      params.push(filters.month, filters.year);
    }

    if (filters.category_id) {
      query += ' AND e.category_id = ?';
      params.push(filters.category_id);
    }

    query += ' ORDER BY e.expense_date DESC';

    const [rows] = await db.query(query, params);
    return rows;
  },

  async findById(id, userId) {
    const [rows] = await db.query(
      `SELECT e.*, c.name as category_name
       FROM expenses e
       JOIN categories c ON e.category_id = c.id
       WHERE e.id = ? AND e.user_id = ?`,
      [id, userId]
    );
    return rows[0];
  },

  async create(userId, data) {
    const { category_id, amount, description, expense_date } = data;
    const [result] = await db.query(
      'INSERT INTO expenses (user_id, category_id, amount, description, expense_date) VALUES (?, ?, ?, ?, ?)',
      [userId, category_id, amount, description, expense_date]
    );
    return result.insertId;
  },

  async update(id, userId, data) {
    const { category_id, amount, description, expense_date } = data;
    const [result] = await db.query(
      'UPDATE expenses SET category_id = ?, amount = ?, description = ?, expense_date = ? WHERE id = ? AND user_id = ?',
      [category_id, amount, description, expense_date, id, userId]
    );
    return result.affectedRows > 0;
  },

  async delete(id, userId) {
    const [result] = await db.query(
      'DELETE FROM expenses WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  },

  async sumByUser(userId, month, year) {
    const [rows] = await db.query(
      `SELECT COALESCE(SUM(amount), 0) as total
       FROM expenses
       WHERE user_id = ? AND MONTH(expense_date) = ? AND YEAR(expense_date) = ?`,
      [userId, month, year]
    );
    return parseFloat(rows[0].total);
  },

  async sumByCategory(userId, month, year) {
    const [rows] = await db.query(
      `SELECT c.name, COALESCE(SUM(e.amount), 0) as total
       FROM categories c
       LEFT JOIN expenses e ON c.id = e.category_id AND e.user_id = ?
         AND MONTH(e.expense_date) = ? AND YEAR(e.expense_date) = ?
       GROUP BY c.id, c.name
       ORDER BY total DESC`,
      [userId, month, year]
    );
    return rows;
  }
};

module.exports = Expense;
