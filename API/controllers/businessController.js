import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Signup Business
export const SignupBusiness = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      gstin,
      primary_category,
      founding_year,
      contact,
      business_desc,
      website,
      turnover,
      staff_strength,
      company_type,
      locations = [],
      sub_categories = []
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !gstin || !primary_category) {
      return res.status(400).json({ 
        msg: 'Please provide all required fields: name, email, password, gstin, primary_category' 
      });
    }

    // Check if user already exists
    const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExists.rowCount > 0) {
      return res.status(409).json({ msg: 'User already exists with this email' });
    }

    // Check if business already exists with this GSTIN
    const businessExists = await pool.query('SELECT id FROM business WHERE gstin = $1', [gstin]);
    if (businessExists.rowCount > 0) {
      return res.status(409).json({ msg: 'Business already exists with this GSTIN' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Begin transaction
    await pool.query('BEGIN');

    try {
      // Create user first
      const userResult = await pool.query(
        'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
        [email, passwordHash]
      );
      
      const userId = userResult.rows[0].id;

      // Create business
      const businessResult = await pool.query(
        `INSERT INTO business (
          user_id, name, founding_year, contact, email, business_desc, 
          primary_category, gstin, website, turnover, staff_strength, 
          company_type, sub_categories, locations
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
        RETURNING *`,
        [
          userId, name, founding_year, contact, email, business_desc,
          primary_category, gstin, website, turnover, staff_strength,
          company_type, sub_categories, locations
        ]
      );

      // Commit transaction
      await pool.query('COMMIT');

      const business = businessResult.rows[0];

      // Generate JWT token
      const token = jwt.sign(
        { id: userId, businessId: business.id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        msg: 'Business account created successfully',
        business: {
          id: business.id,
          name: business.name,
          email: business.email,
          status: business.status
        },
        token
      });

    } catch (error) {
      // Rollback transaction on error
      await pool.query('ROLLBACK');
      throw error;
    }

  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ msg: 'Error creating business account', error: err.message });
  }
};

// Update Business Profile
export const updateBusinessProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      founding_year,
      contact,
      email,
      business_desc,
      primary_category,
      gstin,
      website,
      turnover,
      staff_strength,
      company_type,
      sub_categories,
      locations
    } = req.body;

    // Check if business exists
    const businessExists = await pool.query('SELECT id FROM business WHERE id = $1', [id]);
    if (businessExists.rowCount === 0) {
      return res.status(404).json({ msg: 'Business not found' });
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount++}`);
      values.push(name);
    }
    if (founding_year !== undefined) {
      updates.push(`founding_year = $${paramCount++}`);
      values.push(founding_year);
    }
    if (contact !== undefined) {
      updates.push(`contact = $${paramCount++}`);
      values.push(contact);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email);
    }
    if (business_desc !== undefined) {
      updates.push(`business_desc = $${paramCount++}`);
      values.push(business_desc);
    }
    if (primary_category !== undefined) {
      updates.push(`primary_category = $${paramCount++}`);
      values.push(primary_category);
    }
    if (gstin !== undefined) {
      updates.push(`gstin = $${paramCount++}`);
      values.push(gstin);
    }
    if (website !== undefined) {
      updates.push(`website = $${paramCount++}`);
      values.push(website);
    }
    if (turnover !== undefined) {
      updates.push(`turnover = $${paramCount++}`);
      values.push(turnover);
    }
    if (staff_strength !== undefined) {
      updates.push(`staff_strength = $${paramCount++}`);
      values.push(staff_strength);
    }
    if (company_type !== undefined) {
      updates.push(`company_type = $${paramCount++}`);
      values.push(company_type);
    }
    if (sub_categories !== undefined) {
      updates.push(`sub_categories = $${paramCount++}`);
      values.push(sub_categories);
    }
    if (locations !== undefined) {
      updates.push(`locations = $${paramCount++}`);
      values.push(locations);
    }

    if (updates.length === 0) {
      return res.status(400).json({ msg: 'No fields to update' });
    }

    values.push(id); // Add id for WHERE clause
    const query = `UPDATE business SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;

    const result = await pool.query(query, values);

    res.json({
      msg: 'Business profile updated successfully',
      business: result.rows[0]
    });

  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ msg: 'Error updating business profile', error: err.message });
  }
};

// Get Business by ID
export const getBusinessById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM business WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ msg: 'Business not found' });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error('Get business error:', err);
    res.status(500).json({ msg: 'Error fetching business', error: err.message });
  }
};