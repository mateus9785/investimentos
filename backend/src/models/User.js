const db = require('../config/database');
const bcrypt = require('bcryptjs');

const User = {
  async findByUsername(username) {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
    return rows[0];
  },

  async findById(id) {
    const [rows] = await db.query('SELECT id, username, created_at FROM users WHERE id = ?', [id]);
    return rows[0];
  },

  async create(username, password) {
    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (username, password_hash) VALUES (?, ?)',
      [username, password_hash]
    );
    return result.insertId;
  },

  async validatePassword(user, password) {
    return bcrypt.compare(password, user.password_hash);
  }
};

module.exports = User;
