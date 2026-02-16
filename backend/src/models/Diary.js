const db = require('../config/database');

const Diary = {
  async findByUser(userId, filters = {}) {
    let query = 'SELECT * FROM diary WHERE user_id = ?';
    const params = [userId];

    if (filters.month && filters.year) {
      query += ' AND MONTH(entry_date) = ? AND YEAR(entry_date) = ?';
      params.push(filters.month, filters.year);
    }

    query += ' ORDER BY entry_date DESC';

    const [rows] = await db.query(query, params);
    return rows;
  },

  async findById(id, userId) {
    const [rows] = await db.query(
      'SELECT * FROM diary WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return rows[0];
  },

  async create(userId, data) {
    const { title, content, image_path, entry_date } = data;
    const [result] = await db.query(
      'INSERT INTO diary (user_id, title, content, image_path, entry_date) VALUES (?, ?, ?, ?, ?)',
      [userId, title, content, image_path, entry_date]
    );
    return result.insertId;
  },

  async update(id, userId, data) {
    const { title, content, image_path, entry_date } = data;
    const [result] = await db.query(
      'UPDATE diary SET title = ?, content = ?, image_path = ?, entry_date = ? WHERE id = ? AND user_id = ?',
      [title, content, image_path, entry_date, id, userId]
    );
    return result.affectedRows > 0;
  },

  async delete(id, userId) {
    const [rows] = await db.query(
      'SELECT image_path FROM diary WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    const [result] = await db.query(
      'DELETE FROM diary WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    return { deleted: result.affectedRows > 0, imagePath: rows[0]?.image_path };
  }
};

module.exports = Diary;
