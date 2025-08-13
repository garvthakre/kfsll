import pool from '../config/db.js';

export const saveArticle = async (req, res) => {
  try {
    const { userid, compid, title, content, categoryid } = req.body;
    const result = await pool.query(
      `INSERT INTO articles (author_id, company_id, title, category_id, content)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userid, compid, title, categoryid, content]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ msg: 'Failed to create article', error: err.message });
  }
};

export const getAllArticles = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM articles ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching articles', error: err.message });
  }
};

export const getSingleArticle = async (req, res) => {
  try {
    const { id } = req.body;
    const result = await pool.query('SELECT * FROM articles WHERE id = $1', [id]);
    if (result.rowCount === 0) return res.status(404).json({ msg: 'Article not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching article', error: err.message });
  }
};
