// const { validationResult } = require('express-validator');
// const UserModel = require('../models/user.model');
// const db = require('../config/db');
import { validationResult } from 'express-validator';
import UserModel from '../models/user.model.js';
import  db  from '../config/db.js';

/**
 * User Controller
 * Handles user management operations
 */
const UserController = {
  /**
   * Get all users with pagination
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - List of users
   */
  async getAllUsers(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      const users = await UserModel.findAll(limit, offset);
      const total = await UserModel.countTotal();

      return res.status(200).json({
        users,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get all users error:', error);
      return res.status(500).json({ message: 'Server error while fetching users' });
    }
  },

  /**
   * Get user by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - User details
   */
  async getUserById(req, res) {
    try {
      const userId = parseInt(req.params.id);
      
      const user = await UserModel.findById(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json({ user });
    } catch (error) {
      console.error('Get user by ID error:', error);
      return res.status(500).json({ message: 'Server error while fetching user' });
    }
  },

  /**
   * Create new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - New user details
   */
  async createUser(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      first_name, 
      last_name, 
      email, 
      password, 
      role,
      department,
      position,
      designation,
      type,
      working_type,
      working_for,
      profile_image
    } = req.body;

    // Check if email already exists
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'Email is already registered' });
    }

    // Only admin can create admin/manager users
    if ((role === 'admin' || role === 'manager') && req.user.role !== 'admin') {
      return res.status(403).json({ 
        message: 'You do not have permission to create users with this role' 
      });
    }

    const newUser = await UserModel.create({
      first_name,
      last_name,
      email,
      password,
      role: role || 'employee',
      department,
      position,
      designation,
      type,
      working_type,
      working_for,
      profile_image
    });

    // Log user creation activity
    await db.query(
      'INSERT INTO user_logs (user_id, action, description, ip_address) VALUES ($1, $2, $3, $4)',
      [req.user.id, 'user_create', `Created user: ${newUser.id}`, req.ip]
    );

    return res.status(201).json({
      message: 'User created successfully',
      user: newUser
    });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ message: 'Server error while creating user' });
  }
},

  /**
   * Update user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Updated user details
   */
  async updateUser(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const userId = parseInt(req.params.id);
      
      // Check if user exists
      const existingUser = await UserModel.findById(userId);
      if (!existingUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Non-admin users can only update their own profile
      if (req.user.role !== 'admin' && req.user.id !== userId) {
        return res.status(403).json({
          message: 'You do not have permission to update this user'
        });
      }

      // Update user information
      const updatedUser = await UserModel.update(userId, req.body);

      // Log user update activity
      await db.query(
        'INSERT INTO user_logs (user_id, action, description, ip_address) VALUES ($1, $2, $3, $4)',
        [req.user.id, 'user_update', `Updated user: ${userId}`, req.ip]
      );

      return res.status(200).json({
        message: 'User updated successfully',
        user: updatedUser
      });
    } catch (error) {
      console.error('Update user error:', error);
      return res.status(500).json({ message: 'Server error while updating user' });
    }
  },

  /**
   * Update user status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Success message
   */
  async updateUserStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'inactive', 'suspended'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
      }

      // Check if user exists
      const user = await UserModel.findById(id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update user status
      const updatedUser = await UserModel.update(id, { status });

      // Log status change
      await db.query(
        'INSERT INTO user_logs (user_id, action, description, ip_address) VALUES ($1, $2, $3, $4)',
        [req.user.id, 'user_status_change', `Changed status of user ${id} to ${status}`, req.ip]
      );

      return res.status(200).json({
        message: `User status updated to ${status}`,
        user: updatedUser
      });
    } catch (error) {
      console.error('Update user status error:', error);
      return res.status(500).json({ message: 'Server error while updating user status' });
    }
  },
  /**
 * Get user's working relationship details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Working relationship details
 */
async getUserWorkingFor(req, res) {
  try {
    const userId = parseInt(req.params.id);
    
    // Check if user exists
    const user = await UserModel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check permissions - users can see their own info, admins can see anyone's
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      return res.status(403).json({
        message: 'You do not have permission to view this information'
      });
    }

    // If user is not working for anyone
    if (!user.working_for) {
      return res.status(200).json({
        user_id: userId,
        working_for: null,
        working_relationship: 'independent',
        details: {
          user_name: `${user.first_name} ${user.last_name}`,
          user_role: user.role,
          working_type: user.working_type || 'N/A'
        }
      });
    }

    // Get details of who the user is working for
    let workingForDetails = null;
    
    if (user.role === 'consultant' || user.working_for) {
      // Get vendor details
      const vendorQuery = await db.query(
        `SELECT v.*, u.first_name as vendor_first_name, u.last_name as vendor_last_name, u.email as vendor_email
         FROM vendors v
         JOIN users u ON v.user_id = u.id
         WHERE v.user_id = $1`,
        [user.working_for]
      );
      
      if (vendorQuery.rows.length > 0) {
        const vendor = vendorQuery.rows[0];
        workingForDetails = {
          type: 'vendor',
          vendor_id: vendor.id,
          company_name: vendor.company_name,
          vendor_contact: {
            name: `${vendor.vendor_first_name} ${vendor.vendor_last_name}`,
            email: vendor.vendor_email,
            phone: vendor.contact_phone
          },
          service_type: vendor.service_type,
          contract_period: {
            start_date: vendor.contract_start_date,
            end_date: vendor.contract_end_date
          },
          address: vendor.address
        };
      } else {
        // If working_for points to a user who isn't a vendor, get basic user info
        const supervisorQuery = await db.query(
          `SELECT id, first_name, last_name, email, role, department
           FROM users WHERE id = $1`,
          [user.working_for]
        );
        
        if (supervisorQuery.rows.length > 0) {
          const supervisor = supervisorQuery.rows[0];
          workingForDetails = {
            type: 'internal',
            supervisor_id: supervisor.id,
            supervisor_name: `${supervisor.first_name} ${supervisor.last_name}`,
            supervisor_email: supervisor.email,
            supervisor_role: supervisor.role,
            department: supervisor.department
          };
        }
      }
    }

    return res.status(200).json({
      user_id: userId,
      working_for: user.working_for,
      working_relationship: workingForDetails ? workingForDetails.type : 'unknown',
      details: {
        user_name: `${user.first_name} ${user.last_name}`,
        user_role: user.role,
        user_email: user.email,
        working_type: user.working_type || 'N/A',
        department: user.department
      },
      working_for_details: workingForDetails
    });

  } catch (error) {
    console.error('Get user working for error:', error);
    return res.status(500).json({ message: 'Server error while fetching working relationship' });
  }
},

/**
 * Get all users working for a specific vendor/company
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - List of users working for the specified entity
 */
async getUsersWorkingFor(req, res) {
  try {
    const workingForId = parseInt(req.params.workingForId);
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Check if the entity exists (could be vendor or internal user)
    const entityQuery = await db.query(
      'SELECT id, first_name, last_name, email, role FROM users WHERE id = $1',
      [workingForId]
    );

    if (entityQuery.rows.length === 0) {
      return res.status(404).json({ message: 'Entity not found' });
    }

    // Check permissions
    if (req.user.role !== 'admin' && req.user.id !== workingForId) {
      return res.status(403).json({
        message: 'You do not have permission to view this information'
      });
    }

    // Get all users working for this entity
    const usersQuery = await db.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.department, 
              u.position, u.designation, u.type, u.working_type, u.status, u.created_at
       FROM users u
       WHERE u.working_for = $1
       ORDER BY u.first_name, u.last_name
       LIMIT $2 OFFSET $3`,
      [workingForId, limit, offset]
    );

    // Count total users working for this entity
    const countQuery = await db.query(
      'SELECT COUNT(*) FROM users WHERE working_for = $1',
      [workingForId]
    );
    const total = parseInt(countQuery.rows[0].count);

    // Get entity details (vendor info if applicable)
    let entityDetails = entityQuery.rows[0];
    
    // Check if this entity is a vendor
    const vendorQuery = await db.query(
      'SELECT * FROM vendors WHERE user_id = $1',
      [workingForId]
    );
    
    if (vendorQuery.rows.length > 0) {
      entityDetails.vendor_info = vendorQuery.rows[0];
      entityDetails.entity_type = 'vendor';
    } else {
      entityDetails.entity_type = 'internal';
    }

    return res.status(200).json({
      working_for_entity: entityDetails,
      users: usersQuery.rows,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get users working for error:', error);
    return res.status(500).json({ message: 'Server error while fetching users' });
  }
},

  /**
   * Delete user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Success message
   */
  async deleteUser(req, res) {
    try {
      const userId = parseInt(req.params.id);

      // Check if user exists
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Cannot delete yourself
      if (req.user.id === userId) {
        return res.status(400).json({ message: 'Cannot delete your own account' });
      }

      // Only admin can delete users
      if (req.user.role !== 'admin') {
        return res.status(403).json({ 
          message: 'You do not have permission to delete users' 
        });
      }

      // Delete user
      await UserModel.delete(userId);

      // Log user deletion
      await db.query(
        'INSERT INTO user_logs (user_id, action, description, ip_address) VALUES ($1, $2, $3, $4)',
        [req.user.id, 'user_delete', `Deleted user: ${userId}`, req.ip]
      );

      return res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
      console.error('Delete user error:', error);
      return res.status(500).json({ message: 'Server error while deleting user' });
    }
  }
};

export default UserController;