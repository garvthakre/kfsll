// const jwt = require('jsonwebtoken');
// const { validationResult } = require('express-validator');
// const UserModel = require('../models/user.model');
// const db = require('../config/db');
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import UserModel from '../models/user.model.js';
import db from '../config/db.js';

/**
 * Auth Controller
 * Handles authentication related operations
 */
const AuthController = {
  /**
   * User login
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - JWT token and user info
   */
  async login(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, role } = req.body;

      // Find user by email
      const user = await UserModel.findByEmail(email);
      
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Check if user has the specified role
      if (role && user.role !== role.toLowerCase()) {
        return res.status(403).json({ 
          message: `Access denied. You don't have ${role} privileges.`
        });
      }

      // Check if user is active
      if (user.status !== 'active') {
        return res.status(403).json({ 
          message: 'Your account is inactive or suspended. Please contact an administrator.'
        });
      }

      // Check password
      const isPasswordValid = await UserModel.comparePassword(password, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: user.role,
          firstName: user.first_name,
          lastName: user.last_name
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      // Log login activity
      await db.query(
        'INSERT INTO user_logs (user_id, action, description, ip_address) VALUES ($1, $2, $3, $4)',
        [user.id, 'login', 'User logged in', req.ip]
      );

      // Return user info and token
      return res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role,
          status: user.status
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ message: 'Server error during login' });
    }
  },

  /**
   * Register new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - New user info
   */
async register(req, res) {
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

    // Only allow admin to create users with admin/manager role
    const requestingUserRole = req.user?.role;
    if ((role === 'admin' || role === 'manager') && requestingUserRole !== 'admin') {
      return res.status(403).json({ 
        message: 'You do not have permission to create users with this role' 
      });
    }

    // Create new user with all fields
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

    // Log user creation
    if (req.user) {
      await db.query(
        'INSERT INTO user_logs (user_id, action, description, ip_address) VALUES ($1, $2, $3, $4)',
        [req.user.id, 'user_create', `Created new user: ${newUser.id}`, req.ip]
      );
    }

    return res.status(201).json({
      message: 'User registered successfully',
      user: newUser
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Server error during registration' });
  }
},

  /**
   * Get current logged-in user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - User profile
   */
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      
      // Get user details
      const user = await UserModel.findById(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Remove sensitive data
      delete user.password;

      return res.status(200).json({ user });
    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({ message: 'Server error while getting profile' });
    }
  },

  /**
   * Log out current user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Success message
   */
  async logout(req, res) {
    try {
      // Log logout activity
      if (req.user) {
        await db.query(
          'INSERT INTO user_logs (user_id, action, description, ip_address) VALUES ($1, $2, $3, $4)',
          [req.user.id, 'logout', 'User logged out', req.ip]
        );
      }
      
      return res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
      console.error('Logout error:', error);
      return res.status(500).json({ message: 'Server error during logout' });
    }
  },

  /**
   * Change user password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Success message
   */
  async changePassword(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Get user with password
      const user = await UserModel.findByEmail(req.user.email);
      
      // Validate current password
      const isPasswordValid = await UserModel.comparePassword(
        currentPassword, 
        user.password
      );
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      // Update password
      await UserModel.updatePassword(userId, newPassword);

      // Log password change
      await db.query(
        'INSERT INTO user_logs (user_id, action, description, ip_address) VALUES ($1, $2, $3, $4)',
        [userId, 'password_change', 'User changed password', req.ip]
      );

      return res.status(200).json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Password change error:', error);
      return res.status(500).json({ message: 'Server error during password change' });
    }
  }
};

export default AuthController;