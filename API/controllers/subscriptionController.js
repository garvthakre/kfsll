import pool from '../config/db.js';

export const getPlans = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM subscription_plans');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching plans', error: err.message });
  }
};

export const saveSubscription = async (req, res) => {
  try {
    const { plan_id, start_date, end_date } = req.body;

    // Create subscription
    await pool.query(
      `INSERT INTO subscriptions (company_id, plan_id, start_date, end_date)
       VALUES ($1, $2, $3, $4)`,
      [req.user.company_id, plan_id, start_date, end_date]
    );

    res.status(201).json({ msg: 'Subscription created' });
  } catch (err) {
    res.status(500).json({ msg: 'Failed to subscribe', error: err.message });
  }
};

export const getInvoices = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM invoices WHERE user_id = $1 OR company_id = $2',
      [req.user.id, req.user.company_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching invoices', error: err.message });
  }
};

export const getInvoiceById = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM invoices WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ msg: 'Invoice not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ msg: 'Error retrieving invoice', error: err.message });
  }
};
