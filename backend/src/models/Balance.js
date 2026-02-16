const db = require('../config/database');

const Balance = {
  async findByUser(userId) {
    const [rows] = await db.query(
      'SELECT * FROM balances WHERE user_id = ? ORDER BY reference_date DESC',
      [userId]
    );
    return rows;
  },

  async findById(id, userId) {
    const [rows] = await db.query(
      'SELECT * FROM balances WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0];
  },

  async findByType(userId, accountType) {
    const [rows] = await db.query(
      'SELECT * FROM balances WHERE user_id = ? AND account_type = ? ORDER BY reference_date DESC LIMIT 1',
      [userId, accountType]
    );
    return rows[0];
  },

  async create(userId, data) {
    const { account_type, initial_balance, reference_date } = data;
    const [result] = await db.query(
      'INSERT INTO balances (user_id, account_type, initial_balance, reference_date) VALUES (?, ?, ?, ?)',
      [userId, account_type, initial_balance, reference_date]
    );
    return result.insertId;
  },

  async update(id, userId, data) {
    const { initial_balance, reference_date } = data;
    const [result] = await db.query(
      'UPDATE balances SET initial_balance = ?, reference_date = ? WHERE id = ? AND user_id = ?',
      [initial_balance, reference_date, id, userId]
    );
    return result.affectedRows > 0;
  },

  async delete(id, userId) {
    const [result] = await db.query(
      'DELETE FROM balances WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }
};

module.exports = Balance;
