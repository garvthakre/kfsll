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