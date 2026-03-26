const db = require('../config/database');

const Milestone = {
  async findAllByUser(userId) {
    const [rows] = await db.query(
      'SELECT * FROM milestones WHERE user_id = ? ORDER BY type, target_amount ASC',
      [userId]
    );
    return rows;
  },

  async findById(id, userId) {
    const [rows] = await db.query(
      'SELECT * FROM milestones WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0];
  },

  async create(userId, type, targetAmount) {
    const [result] = await db.query(
      'INSERT INTO milestones (user_id, type, target_amount) VALUES (?, ?, ?)',
      [userId, type, targetAmount]
    );
    return result.insertId;
  },

  async delete(id, userId) {
    const [result] = await db.query(
      'DELETE FROM milestones WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return result.affectedRows > 0;
  }
};

module.exports = Milestone;
