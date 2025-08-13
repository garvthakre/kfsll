import pool from '../config/db.js';

export const listConnections = async (req, res) => {
  try {
    const { receiver_company_id } = req.body;
    const result = await pool.query(
      `SELECT to_char(c.created_at,'dd-Mon-yy') sendon,c1.name,c.message FROM connections c,companies c1 WHERE c.sender_company_id=c1.id and c.status='pending' and c.receiver_company_id = $1 order by c.created_at`,
      [receiver_company_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching connections', error: err.message });
  }
};

export const sendConnectionRequest = async (req, res) => {
  try {
    const { sender_company_id, receiver_company_id, message } = req.body;
    const result = await pool.query(
      `INSERT INTO connections (sender_company_id, receiver_company_id, message)
       VALUES ($1, $2, $3) RETURNING *`,
      [sender_company_id, receiver_company_id, message]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ msg: 'Error sending request', error: err.message });
  }
};

export const takeConnectionAction = async (req, res) => {
  try {
    const { action, replmessage } = req.body;
    const { id } = req.params;
    await pool.query(
      `UPDATE connections SET status = $1, replmessage = $2, 
constatus = (case when $1='Accept' then 'Y' else 'N' end)  WHERE id = $3`,
      [action, replmessage, id]
    );
    res.json({ msg: 'Connection updated' });
  } catch (err) {
    res.status(500).json({ msg: 'Error updating connection', error: err.message });
  }
};