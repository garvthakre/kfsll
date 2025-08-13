import pool from '../config/db.js';

export const saveCompAchievement = async (req, res) => {
  try {
    const { award_type, award_name, authority, date } = req.body;
    const result = await pool.query(
      `INSERT INTO company_achievements (company_id, award_type, award_name, authority, date)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [req.user.company_id, award_type, award_name, authority, date]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to save achievement', error: err.message });
  }
};

export const getCompAchievements = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM company_achievements WHERE company_id = $1', [req.params.compid]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ msg: 'Error retrieving achievements', error: err.message });
  }
};

export const getACompAchievement = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM company_achievements WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ msg: 'Achievement not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching achievement', error: err.message });
  }
};

export const updateCompAchievement = async (req, res) => {
  try {
    const { id, award_type, award_name, authority, date } = req.body;
    await pool.query(
      `UPDATE company_achievements SET award_type=$1, award_name=$2, authority=$3, date=$4 WHERE id=$5`,
      [award_type, award_name, authority, date, id]
    );
    res.json({ msg: 'Achievement updated' });
  } catch (err) {
    res.status(500).json({ msg: 'Error updating achievement', error: err.message });
  }
};

export const deleteCompAchievement = async (req, res) => {
  try {
    await pool.query('DELETE FROM company_achievements WHERE id = $1', [req.params.id]);
    res.json({ msg: 'Achievement deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Error deleting achievement', error: err.message });
  }
};
