const db = require('../config/database');

const InternationalTrade = {
  async findByUser(userId, filters = {}) {
    let query = 'SELECT id, user_id, trade_date, pnl_usd, exchange_rate, pnl_brl, description, created_at, updated_at FROM international_trades WHERE user_id = ?';
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
      'SELECT id, user_id, trade_date, pnl_usd, exchange_rate, pnl_brl, description, created_at, updated_at FROM international_trades WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0];
  },

  async create(userId, data) {
    const { trade_date, pnl_usd, exchange_rate, description } = data;
    const [result] = await db.query(
      'INSERT INTO international_trades (user_id, trade_date, pnl_usd, exchange_rate, description) VALUES (?, ?, ?, ?, ?)',
      [userId, trade_date, pnl_usd, exchange_rate, description]
    );
    return result.insertId;
  },

  async update(id, userId, data) {
    const { trade_date, pnl_usd, exchange_rate, description } = data;
    const [result] = await db.query(
      'UPDATE international_trades SET trade_date = ?, pnl_usd = ?, exchange_rate = ?, description = ? WHERE id = ? AND user_id = ?',
      [trade_date, pnl_usd, exchange_rate, description, id, userId]
    );
    return result.affectedRows > 0;
  },

  async delete(id, userId) {
    const [result] = await db.query(
      'DELETE FROM international_trades WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  },

  async sumByUser(userId, month, year) {
    const [rows] = await db.query(
      `SELECT COALESCE(SUM(pnl_usd), 0) as total
       FROM international_trades
       WHERE user_id = ? AND MONTH(trade_date) = ? AND YEAR(trade_date) = ?`,
      [userId, month, year]
    );
    return parseFloat(rows[0].total);
  },

  async sumByUserUsd(userId, month, year) {
    const [rows] = await db.query(
      `SELECT COALESCE(SUM(pnl_usd), 0) as total
       FROM international_trades
       WHERE user_id = ? AND MONTH(trade_date) = ? AND YEAR(trade_date) = ?`,
      [userId, month, year]
    );
    return parseFloat(rows[0].total);
  },

  async getCalendar(userId, month, year) {
    const [rows] = await db.query(
      `SELECT DATE(trade_date) as date, SUM(pnl_usd) as total_pnl
       FROM international_trades
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
         COALESCE(SUM(pnl_usd), 0) as total,
         COUNT(DISTINCT DATE(trade_date)) as days_traded
       FROM international_trades
       WHERE user_id = ? AND MONTH(trade_date) = ? AND YEAR(trade_date) = ?`,
      [userId, month, year]
    );
    const { total, days_traded } = rows[0];
    return days_traded > 0 ? parseFloat(total) / days_traded : 0;
  }
};

module.exports = InternationalTrade;
