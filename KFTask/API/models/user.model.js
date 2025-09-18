// const db = require('../config/db');
// const bcrypt = require('bcrypt');
import db from '../config/db.js';
import bcrypt from 'bcrypt';
/**
 * User Model
 * Handles database operations for the users table
 */
const UserModel = {
  /**
   * Create a new user
   * @param {Object} userData - User information
   * @returns {Promise<Object>} - New user object
   */
async create(userData) {
  const { 
    first_name, 
    last_name, 
    email, 
     
    role, 
    department, 
    position,
    profile_image,
    designation,
    type,
    working_type,
    working_for,
    phone_no
  } = userData;
    const defaultPassword = 'kftask@123';
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(defaultPassword, salt);

  const query = `
    INSERT INTO users 
    (first_name, last_name, email, password, role, department, position, profile_image, designation, type, working_type, working_for,phone_no) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12,$13) 
    RETURNING id, first_name, last_name, email, role, department, position, status, designation, type, working_type, working_for,phone_no, created_at
  `;

  const values = [
    first_name, 
    last_name, 
    email, 
    hashedPassword, 
    role || 'employee', 
    department || null, 
    position || null,
    profile_image || null,
    designation || null,
    type || null,
    working_type || null,
    working_for || null,
    phone_no || null
  ];

  try {
    const { rows } = await db.query(query, values);
    return rows[0];
  } catch (error) {
    throw error;
  }
},

  /**
   * Find user by email
   * @param {string} email - User email
   * @returns {Promise<Object>} - User object
   */
  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const { rows } = await db.query(query, [email]);
    return rows[0];
  },

  /**
   * Find user by id
   * @param {number} id - User ID
   * @returns {Promise<Object>} - User object
   */
async findById(id) {
  const query = `
    SELECT id, first_name, last_name, email, role, department, 
    position, status, profile_image, designation, type, working_type, working_for,phone_no, created_at, updated_at
    FROM users WHERE id = $1
  `;
  const { rows } = await db.query(query, [id]);
  return rows[0];
},

  /**
   * Get all users with pagination
   * @param {number} limit - Number of results per page
   * @param {number} offset - Pagination offset
   * @returns {Promise<Array>} - Array of users
   */
async findAll(limit = 10, offset = 0) {
  const query = `
    SELECT id, first_name, last_name, email, role, department, 
    position, status, designation, type, working_type, working_for,phone_no, created_at, updated_at
    FROM users
    ORDER BY created_at DESC
    LIMIT $1 OFFSET $2
  `;
  
  const { rows } = await db.query(query, [limit, offset]);
  return rows;
},
/**
 * Get all users' IDs and names with roles either 'employee' or 'consultant'
 * @returns {Promise<Array>} - Array of objects with id and name
 */
/**
 * Get all users' IDs and names with roles either 'employee' or 'consultant'
 * @returns {Promise<Array>} - Array of objects with id and name
 */
async getAllUserIdsAndNamesforuser() {
  const query = `
    SELECT id, first_name || ' ' || last_name AS name
    FROM users
    WHERE role IN ('employee', 'consultant')
    ORDER BY id ASC
  `;
  const { rows } = await db.query(query);
  return rows;
}


,
/**
 * Get all users' IDs and names with roles either 'employee' or 'consultant'
 * @returns {Promise<Array>} - Array of objects with id and name
 */
async getAllUserIdsAndNamesforvendor() {
  const query = `
    SELECT id, first_name || ' ' || last_name AS name,role
    FROM users
    WHERE role IN ('vendor', 'admin')
    ORDER BY id ASC
  `;
  const { rows } = await db.query(query);
  return rows;
}

,
  /**
   * Update user information
   * @param {number} id - User ID
   * @param {Object} userData - User information to update
   * @returns {Promise<Object>} - Updated user object
   */
async update(id, userData) {
  const {
    first_name,
    last_name,
    department,
    position,
    status,
    profile_image,
    designation,
    type,
    working_type,
    working_for,
    phone_no
  } = userData;

  const query = `
    UPDATE users
    SET 
      first_name = COALESCE($1, first_name),
      last_name = COALESCE($2, last_name),
      department = COALESCE($3, department),
      position = COALESCE($4, position),
      status = COALESCE($5, status),
      profile_image = COALESCE($6, profile_image),
      designation = COALESCE($7, designation),
      type = COALESCE($8, type),
      working_type = COALESCE($9, working_type),
      working_for = COALESCE($10, working_for),
      phone_no = COALESCE($11, phone_no),
      email = COALESCE($12, email),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $13
    RETURNING id, first_name, last_name, email, role, department, position, status, designation, type, working_type, working_for,phone_no, created_at, updated_at
  `;

  const values = [first_name, last_name, department, position, status, profile_image, designation, type, working_type, working_for,phone_no,email, id];
  
  const { rows } = await db.query(query, values);
  return rows[0];
},

  /**
   * Update user password
   * @param {number} id - User ID
   * @param {string} password - New password
   * @returns {Promise<boolean>} - Success status
   */
  async updatePassword(id, password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const query = 'UPDATE users SET password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2';
    await db.query(query, [hashedPassword, id]);
    return true;
  },

  /**
   * Delete a user
   * @param {number} id - User ID
   * @returns {Promise<boolean>} - Success status
   */
  async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1';
    const { rowCount } = await db.query(query, [id]);
    return rowCount > 0;
  },

  /**
   * Compare password with hashed password in DB
   * @param {string} password - Plain text password
   * @param {string} hashedPassword - Stored hashed password
   * @returns {Promise<boolean>} - Password match status
   */
  async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  },

  /**
   * Count total users
   * @returns {Promise<number>} - Total user count
   */
  async countTotal() {
    const query = 'SELECT COUNT(*) FROM users';
    const { rows } = await db.query(query);
    return parseInt(rows[0].count);
  },

  /**
   * Find users by vendor (working_for)
   * @param {number} vendorId - Vendor ID
   * @param {number} limit - Number of results per page
   * @param {number} offset - Pagination offset
   * @returns {Promise<Array>} - Array of users working for the vendor
   */
  async findByVendor(vendorId, limit = 10, offset = 0) {
    const query = `
      SELECT id, first_name, last_name, email, role, department, 
      position, status, designation, type, working_type, working_for, created_at, updated_at
      FROM users
      WHERE working_for = $1
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const { rows } = await db.query(query, [vendorId, limit, offset]);
    return rows;
  },

  /**
   * Count users by vendor
   * @param {number} vendorId - Vendor ID
   * @returns {Promise<number>} - Total user count for vendor
   */
  async countByVendor(vendorId) {
    const query = 'SELECT COUNT(*) FROM users WHERE working_for = $1';
    const { rows } = await db.query(query, [vendorId]);
    return parseInt(rows[0].count);
  }
};

 export default UserModel;