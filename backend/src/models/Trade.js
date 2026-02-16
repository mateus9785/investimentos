const db = require('../config/database');

const Trade = {
  async findByUser(userId, filters = {}) {
    let query = 'SELECT * FROM trades WHERE user_id = ?';
    const params = [userId];

    if (filters.month && filters.year) {
      query += ' AND MONTH(trade_date) = ? AND YEAR(trade_date) = ?';
      params.push(filters.month, filters.year);
    }

    query += ' ORDER BY trade_date DESC';

    const [rows] = await db.query(query, params);
    return rows;
  },

  async findById(id, userId) {
    const [rows] = await db.query(
      'SELECT * FROM trades WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0];
  },

  async create(userId, data) {
    const { trade_date, pnl, description } = data;
    const [result] = await db.query(
      'INSERT INTO trades (user_id, trade_date, pnl, description) VALUES (?, ?, ?, ?)',
      [userId, trade_date, pnl, description]
    );
    return result.insertId;
  },

  async update(id, userId, data) {
    const { trade_date, pnl, description } = data;
    const [result] = await db.query(
      'UPDATE trades SET trade_date = ?, pnl = ?, description = ? WHERE id = ? AND user_id = ?',
      [trade_date, pnl, description, id, userId]
    );
    return result.affectedRows > 0;
  },

  async delete(id, userId) {
    const [result] = await db.query(
      'DELETE FROM trades WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  },

  async sumByUser(userId, month, year) {
    const [rows] = await db.query(
      `SELECT COALESCE(SUM(pnl), 0) as total
       FROM trades
       WHERE user_id = ? AND MONTH(trade_date) = ? AND YEAR(trade_date) = ?`,
      [userId, month, year]
    );
    return parseFloat(rows[0].total);
  },

  async getCalendar(userId, month, year) {
    const [rows] = await db.query(
      `SELECT DATE(trade_date) as date, SUM(pnl) as total_pnl
       FROM trades
       WHERE user_id = ? AND MONTH(trade_date) = ? AND YEAR(trade_date) = ?
       GROUP BY date
       ORDER BY date`,
      [userId, month, year]
    );
    return rows;
  },

  async getDailyAverage(userId, month, year) {
    const [rows] = await db.query(
      `SELECT
         COALESCE(SUM(pnl), 0) as total,
         COUNT(DISTINCT DATE(trade_date)) as days_traded
       FROM trades
       WHERE user_id = ? AND MONTH(trade_date) = ? AND YEAR(trade_date) = ?`,
      [userId, month, year]
    );
    const { total, days_traded } = rows[0];
    return days_traded > 0 ? parseFloat(total) / days_traded : 0;
  }
};

module.exports = Trade;
