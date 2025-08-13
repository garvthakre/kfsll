import pool from '../config/db.js';

export const getBusinessCategories = async (req, res) => {
  try {
    const result = await pool.query(`SELECT id,name FROM category_master where type='C'`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching categories', error: err.message });
  }
};

export const getArticleCategories = async (req, res) => {
  try {
    const result = await pool.query(`SELECT id,name FROM category_master where type='A'`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching article catagories', error: err.message });
  }
};

export const getAddressType = async (req, res) => {
  try {
    const result = await pool.query(`SELECT id,addtype FROM addresstype`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching address types', error: err.message });
  }
};
export const getBusinessTypes = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM business_type_master');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching business types', error: err.message });
  }
};

export const getLocations = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM locations');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching locations', error: err.message });
  }
};


export const getCompanyTypes = async (req, res) => {
  try {
    const result = await pool.query('SELECT DISTINCT company_type FROM companies');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching types', error: err.message });
  }
};

export const getCountries = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM country_master');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching countries', error: err.message });
  }
};

export const getStates = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM state_master WHERE country_iso_code = $1', [req.params.countryid]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ msg: 'Error fetching states', error: err.message });
  }
};
