import pool from '../config/db.js';

export const findUserByEmail = async (email) => {
  const res = await pool.query('SELECT u.id userid,u.name,u.company_id,c.name cname,u.password_hash FROM users u,companies c WHERE u.company_id=c.id and u.email = $1', [email]);
  return res.rows[0];
};

export const createUser = async ({ email, passwordHash, companyId, uname }) => {
  const res = await pool.query(
    `INSERT INTO users (email, password_hash, company_id, name) 
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [email, passwordHash, companyId, uname]
  );
  return res.rows[0];
};

// Get user with company details
export const getUserWithCompany = async (userId) => {
  const res = await pool.query(`
    SELECT u.*, u.company_id 
    FROM users u 
    WHERE u.id = $1
  `, [userId]);
  return res.rows[0];
};