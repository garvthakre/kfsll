import express from 'express';
import { check } from 'express-validator';
import AuthController from '../controllers/auth.controller.js';
import {authenticateToken} from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     LoginRequest:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           description: User's password
 *         role:
 *           type: string
 *           enum: [admin, manager, employee, consultant, vendor]
 *           description: Role to login as (optional)
 *     RegisterRequest:
 *       type: object
 *       required:
 *         - first_name
 *         - last_name
 *         - email
 *         - password
 *       properties:
 *         first_name:
 *           type: string
 *           description: User's first name
 *         last_name:
 *           type: string
 *           description: User's last name
 *         email:
 *           type: string
 *           format: email
 *           description: User's email address
 *         password:
 *           type: string
 *           format: password
 *           description: User's password (min 6 characters)
 *         role:
 *           type: string
 *           enum: [admin, manager, employee, consultant, vendor]
 *           description: User role (admin users only)
 *         department:
 *           type: string
 *           description: User's department
 *         position:
 *           type: string
 *           description: User's job position
 *     ChangePasswordRequest:
 *       type: object
 *       required:
 *         - currentPassword
 *         - newPassword
 *       properties:
 *         currentPassword:
 *           type: string
 *           format: password
 *           description: Current password
 *         newPassword:
 *           type: string
 *           format: password
 *           description: New password (min 6 characters)
 *     UserProfile:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: User ID
 *         first_name:
 *           type: string
 *           description: First name
 *         last_name:
 *           type: string
 *           description: Last name
 *         email:
 *           type: string
 *           description: Email address
 *         role:
 *           type: string
 *           description: User role
 *         department:
 *           type: string
 *           description: Department
 *         position:
 *           type: string
 *           description: Job position
 *         status:
 *           type: string
 *           description: Account status
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate a user
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     firstName:
 *                       type: string
 *                       example: John
 *                     lastName:
 *                       type: string
 *                       example: Doe
 *                     role:
 *                       type: string
 *                       example: admin
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account inactive or wrong role
 *       500:
 *         description: Server error
 */
router.post('/login', [
  check('email').isEmail().withMessage('Please provide a valid email'),
  check('password').notEmpty().withMessage('Password is required')
], AuthController.login);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Only admins can create users with admin/manager roles
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or email already exists
 *       403:
 *         description: Not authorized to create users with specific roles
 *       500:
 *         description: Server error
 */
router.post('/register', [
  check('first_name').notEmpty().withMessage('First name is required'),
  check('last_name').notEmpty().withMessage('Last name is required'),
  check('email').isEmail().withMessage('Please provide a valid email'),
  check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], authenticateToken, AuthController.register);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/UserProfile'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/profile', authenticateToken, AuthController.getProfile);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Log out current user
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully logged out
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.post('/logout', authenticateToken, AuthController.logout);

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change user password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Current password is incorrect
 *       500:
 *         description: Server error
 */
router.post('/change-password', authenticateToken, [
  check('currentPassword').notEmpty().withMessage('Current password is required'),
  check('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], AuthController.changePassword);

export default router;