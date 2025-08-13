import pool from '../config/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Signup Company
export const SignupCompany = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      gstin,
      primary_category,
      founding_year,
      username,
      contact,
      business_desc,
      website,
      turnover,
      staff_strength,
      company_type_id,
      locations = [],
      sub_categories = []
    } = req.body;

    // Validate required fields
    if (!name || !email || !password || !gstin || !primary_category) {
      return res.status(400).json({ 
        msg: 'Please provide all required fields: Company Name, Email, Password, GSTIN, and Major Business Category' 
      });
    }

    // Check if user already exists
    const userExists = await pool.query(`SELECT id FROM users WHERE email = $1`, [email]);
    if (userExists.rowCount > 0) {
      return res.status(409).json({ msg: 'User already exists with this email' });
    }

    // Check if company already exists with this GSTIN
    const companyExists = await pool.query(`SELECT id FROM companies WHERE gstin = $1`, [gstin]);
    if (companyExists.rowCount > 0) {
      return res.status(409).json({ msg: 'Company already exists with this GSTIN' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Begin transaction
    await pool.query('BEGIN');

    try {
      // Create company first
      const companyResult = await pool.query(
        `INSERT INTO companies (
          name, founding_year, business_desc, gstin, turnover, 
          staff_strength, company_type
        ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
        RETURNING *`,
        [
          name, founding_year, primary_category, gstin, turnover, 
          staff_strength, company_type_id
        ]
      );

      const company = companyResult.rows[0];

      // Create user with company_id
      const userResult = await pool.query(
        `INSERT INTO users (name,email, password_hash, company_id) VALUES ($1, $2, $3, $4) RETURNING id`,
        [username, email, passwordHash, company.id]
      );
      
      const userId = userResult.rows[0].id;

      // Commit transaction
      await pool.query('COMMIT');

      // Generate JWT token
      const token = jwt.sign(
        { id: userId, companyId: company.id },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        msg: 'Company account created successfully',
        company: {
          id: company.id,
          name: company.name,
          gstin: company.gstin,
          status: company.status
        },
        user: {
          id: userId,
          name: username,
          email: email
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
    res.status(500).json({ msg: 'Error creating company account', error: err.message });
  }
};

// Add this function to your Server/controllers/companyController.js file

// Login Company
export const loginCompany = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ 
        msg: 'Please provide email and password' 
      });
    }

    // Check if user exists and get company details
    const userResult = await pool.query(`
      SELECT u.*, c.name as company_name, c.gstin, c.status as company_status
      FROM users u 
      LEFT JOIN companies c ON u.company_id = c.id 
      WHERE u.email = $1
    `, [email]);

    if (userResult.rowCount === 0) {
      return res.status(401).json({ msg: 'Invalid email or password' });
    }

    const user = userResult.rows[0];

    // Check if user has a company associated
    if (!user.company_id) {
      return res.status(401).json({ msg: 'No company associated with this account' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ msg: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        companyId: user.company_id,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return success response
    res.json({
      msg: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        companyId: user.company_id
      },
      company: {
        id: user.company_id,
        name: user.company_name,
        gstin: user.gstin,
        status: user.company_status
      },
      token
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: 'Server error during login', error: err.message });
  }
};

// Update Company Profile
export const updateCompanyProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      founding_year,
      contact,
      email,
      business_desc,
      primary_category,
      website,
      turnover,
      staff_strength,
      company_type_id,
      sub_categories,
      locations
    } = req.body;

    // Check if company exists
    const companyExists = await pool.query(`SELECT id FROM companies WHERE id = $1`, [id]);
    if (companyExists.rowCount === 0) {
      return res.status(404).json({ msg: 'Company not found' });
    }

    const query = `UPDATE companies SET name=$2,founding_year=$3,business_desc=$4,main_business_category_id=$5,staff_strength=$6,contact=$7,email=$8,website=$9,turnover=$10,company_type=$11 WHERE id = $1 RETURNING id`;

    const result = await pool.query(query, [id,name,founding_year,business_desc,primary_category,staff_strength,contact,email,website,turnover,company_type_id]);
    
    await pool.query(`Delete from public.company_category where company_id=$1`,[id]);

    if (sub_categories.length > 0) {
	sub_categories.forEach(element => {
	  saveSecCatg(element);
	});		
    }

    await pool.query(`Delete from public.company_location where company_id=$1`,[id]);

    if (locations.length > 0) {
	locations.forEach(element => {
	  saveLoc(element);
	});		
    }

    res.json({
      msg: 'Company profile updated successfully',
      company: result.rows[0]
    });

  } catch (err) {
    console.error('Company Update error:', err);
    res.status(500).json({ msg: 'Error updating company profile', error: err.message });
  }
};

async function saveSecCatg(catg)
{
    const catgSub = await pool.query(`SELECT id FROM category_master WHERE name=$1 and type='C'`, [catg]);
    const catgSId = 0;
    if (catgSub.rows.length > 0) {
       catgSId = catgSub.rows[0].id; 
    }
    if (catgSId > 0)
    {
       await pool.query(`Insert into public.company_category (company_id,sub_business_category_id) values ($1,$2)`,[id, catgSId]);
    }
}

async function saveLoc(loc)
{
    const locRec = await pool.query(`SELECT id FROM locations WHERE name=$1`, [loc]);
    const locId = 0;
    if (locRec.rows.length > 0) {
       locId = locRec.rows[0].id; 
    }
    if (locId > 0)
    {
      await pool.query(`Insert into public.company_location (company_id,loc_id) values ($1,$2)`,[id, locId]);
    }
}

// Get Company by ID 
export const getACompany = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`SELECT * FROM companies WHERE id = $1`, [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ msg: 'Company not found' });
    }

    const sresult = await pool.query(`SELECT * FROM company_category WHERE company_id = $1`, [id]);

    const lresult = await pool.query(`SELECT * FROM company_location WHERE company_id = $1`, [id]);

    res.json({company : result.rows[0], subcategory: sresult.rows, location : lresult.rows });

  } catch (err) {
    console.error('Get company error:', err);
    res.status(500).json({ msg: 'Error fetching company', error: err.message });
  }
};

export const getTurnover = async (req, res) => {
  try {

    const result = await pool.query(`SELECT id,concat(display,' [',short,']') turnover FROM bustype order by id`);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ msg: 'Turnover not found' });
    }

    res.json(result.rows);

  } catch (err) {
    console.error('Get Turnover error:', err);
    res.status(500).json({ msg: 'Error fetching turnovers', error: err.message });
  }
};