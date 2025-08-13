import pool from '../config/db.js';

export const sendMessage = async (req, res) => {
  try {
    const { sender_id, receiver_id, company_id, message, related_connection_id } = req.body;
    const result = await pool.query(
      `INSERT INTO messages (sender_id, receiver_id, company_id, message, related_connection_id)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [sender_id, receiver_id, company_id, message, related_connection_id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to send message', error: err.message });
  }
};

export const listMessages = async (req, res) => {
  try {
    const { receiver_id } = req.body;
    const result = await pool.query(
      'SELECT * FROM messages WHERE receiver_id = $1 ORDER BY sent_at DESC',
      [receiver_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to fetch messages', error: err.message });
  }
};
