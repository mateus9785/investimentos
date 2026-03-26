const db = require('../config/database');

const Expense = {
  async findByUser(userId, filters = {}) {
    let query = `
      SELECT e.*
      FROM expenses e
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
      `SELECT e.*
       FROM expenses e
       WHERE e.id = ? AND e.user_id = ?`,
      [id, userId]
    );
    return rows[0];
  },

  async create(userId, data) {
    const { amount, description, expense_date, is_mandatory } = data;
    const [result] = await db.query(
      'INSERT INTO expenses (user_id, amount, description, expense_date, is_mandatory) VALUES (?, ?, ?, ?, ?)',
      [userId, amount, description, expense_date, is_mandatory ? 1 : 0]
    );
    return result.insertId;
  },

  async update(id, userId, data) {
    const { amount, description, expense_date, is_mandatory } = data;
    const [result] = await db.query(
      'UPDATE expenses SET amount = ?, description = ?, expense_date = ?, is_mandatory = ? WHERE id = ? AND user_id = ?',
      [amount, description, expense_date, is_mandatory ? 1 : 0, id, userId]
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
