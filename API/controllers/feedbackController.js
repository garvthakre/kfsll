import pool from '../config/db.js';

export const submitFeedback = async (req, res) => {
  try {
    const { userid, compid, message, feedback_type } = req.body;
    
    // Validate required fields
    if (!message || !feedback_type) {
      return res.status(400).json({ 
        msg: 'Message and feedback type are required' 
      });
    }

    // Verify that the feedback_type exists
    const typeCheck = await pool.query(
      'SELECT id FROM feedback_type_master WHERE id = $1',
      [feedback_type]
    );

    if (typeCheck.rowCount === 0) {
      return res.status(400).json({ 
        msg: 'Invalid feedback type' 
      });
    }

    const result = await pool.query(
      `INSERT INTO feedback (user_id, company_id, message, type)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [userid, compid, message, feedback_type]
    );

    res.status(201).json({ 
      msg: 'Feedback submitted successfully',
      feedback: result.rows[0]
    });
  } catch (err) {
    console.error('Error submitting feedback:', err);
    res.status(500).json({ 
      msg: 'Error submitting feedback', 
      error: err.message 
    });
  }
};

export const getFeedbackTypes = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, type_name FROM feedback_type_master ORDER BY type_name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching feedback types:', err);
    res.status(500).json({ 
      msg: 'Error fetching feedback types', 
      error: err.message 
    });
  }
};

export const getAllFeedback = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        f.id,
        f.user_id,
        f.company_id,
        f.message,
        f.submitted_at,
        ft.type_name
      FROM feedback f
      JOIN feedback_type_master ft ON f.type = ft.id
      ORDER BY f.submitted_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching feedback:', err);
    res.status(500).json({ 
      msg: 'Error fetching feedback', 
      error: err.message 
    });
  }
};

export const getFeedbackByCompany = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        f.id,
        f.user_id,
        f.company_id,
        f.message,
        f.submitted_at,
        ft.type_name
      FROM feedback f
      JOIN feedback_type_master ft ON f.type = ft.id
      WHERE f.company_id = $1
      ORDER BY f.submitted_at DESC
    `, [req.user.company_id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching company feedback:', err);
    res.status(500).json({ 
      msg: 'Error fetching company feedback', 
      error: err.message 
    });
  }
};