import pool from '../config/db.js';

export const updateProfile = async (req, res) => {
  try {
    const { name, business_desc } = req.body;
    await pool.query('UPDATE companies SET name = $1, business_desc = $2 WHERE id = $3', [
      name,
      business_desc,
      req.user.company_id,
    ]);
    res.json({ msg: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ msg: 'Error updating profile', error: err.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const company = await pool.query('SELECT * FROM companies WHERE id = $1', [user.rows[0].company_id]);
    res.json({ user: user.rows[0], company: company.rows[0] });
  } catch (err) {
    res.status(500).json({ msg: 'Error retrieving profile', error: err.message });
  }
};
