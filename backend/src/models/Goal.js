const db = require('../config/database');

const Goal = {
  async findByUser(userId) {
    const [rows] = await db.query(
      'SELECT * FROM goals WHERE user_id = ?',
      [userId]
    );
    return rows[0];
  },

  async findById(id, userId) {
    const [rows] = await db.query(
      'SELECT * FROM goals WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0];
  },

  async create(userId, data) {
    const { total_balance, monthly_profit, broker_balance, broker_international_balance } = data;
    const [result] = await db.query(
      'INSERT INTO goals (user_id, total_balance, monthly_profit, broker_balance, broker_international_balance) VALUES (?, ?, ?, ?, ?)',
      [userId, total_balance || 0, monthly_profit || 0, broker_balance || 0, broker_international_balance || 0]
    );
    return result.insertId;
  },

  async update(id, userId, data) {
    const { total_balance, monthly_profit, broker_balance, broker_international_balance } = data;
    const [result] = await db.query(
      'UPDATE goals SET total_balance = ?, monthly_profit = ?, broker_balance = ?, broker_international_balance = ? WHERE id = ? AND user_id = ?',
      [total_balance, monthly_profit, broker_balance, broker_international_balance, id, userId]
    );
    return result.affectedRows > 0;
  },

  async upsert(userId, data) {
    const existing = await this.findByUser(userId);
    if (existing) {
      await this.update(existing.id, userId, data);
      return existing.id;
    }
    return this.create(userId, data);
  },

  async delete(id, userId) {
    const [result] = await db.query(
      'DELETE FROM goals WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }
};

module.exports = Goal;
