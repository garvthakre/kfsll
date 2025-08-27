import express from 'express';
import {check} from 'express-validator';
import UserController from '../controllers/user.controller.js';
import  { authenticateToken, authorize }  from '../middleware/auth.middleware.js'
const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
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
 *           format: email
 *           description: Email address
 *         role:
 *           type: string
 *           enum: [admin, manager, employee, consultant, vendor]
 *           description: User role
 *         department:
 *           type: string
 *           description: Department
 *         position:
 *           type: string
 *           description: Job position
 *         designation:
 *           type: string
 *           description: Designation
 *         type:
 *           type: string
 *           description: User type
 *         working_type:
 *           type: string
 *           description: Working type
 *         working_for:
 *           type: integer
 *           description: Vendor ID that the user is working for
 *         status:
 *           type: string
 *           enum: [active, inactive, suspended]
 *           description: Account status
 *         profile_image:
 *           type: string
 *           description: Profile image URL
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Account creation date
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update date
 *     CreateUserRequest:
 *       type: object
 *       required:
 *         - first_name
 *         - last_name
 *         - email
 *         - password
 *       properties:
 *         first_name:
 *           type: string
 *           description: First name
 *         last_name:
 *           type: string
 *           description: Last name
 *         email:
 *           type: string
 *           format: email
 *           description: Email address
 *         password:
 *           type: string
 *           format: password
 *           description: Password (min 6 characters)
 *         role:
 *           type: string
 *           enum: [admin, manager, employee, consultant, vendor]
 *           description: User role
 *         department:
 *           type: string
 *           description: Department
 *         position:
 *           type: string
 *           description: Job position
 *         designation:
 *           type: string
 *           description: Designation
 *         type:
 *           type: string
 *           description: User type
 *         working_type:
 *           type: string
 *           description: Working type
 *         working_for:
 *           type: integer
 *           description: Vendor ID that the user is working for
 *         profile_image:
 *           type: string
 *           description: Profile image URL
 *     UpdateUserRequest:
 *       type: object
 *       properties:
 *         first_name:
 *           type: string
 *           description: First name
 *         last_name:
 *           type: string
 *           description: Last name
 *         department:
 *           type: string
 *           description: Department
 *         position:
 *           type: string
 *           description: Job position
 *         designation:
 *           type: string
 *           description: Designation
 *         type:
 *           type: string
 *           description: User type
 *         working_type:
 *           type: string
 *           description: Working type
 *         working_for:
 *           type: integer
 *           description: Vendor ID that the user is working for
 *         profile_image:
 *           type: string
 *           description: Profile image URL
 *     UpdateUserStatusRequest:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [active, inactive, suspended]
 *           description: Account status
 */

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users with pagination
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Results per page
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     pages:
 *                       type: integer
 *                       example: 5
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/', authenticateToken, UserController.getAllUsers);

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticateToken, UserController.getUserById);

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Create a new user
 *     description: Admin role required to create admin/manager users
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateUserRequest'
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Validation error or email exists
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       500:
 *         description: Server error
 */
router.post('/', [
  authenticateToken,
  check('first_name').notEmpty().withMessage('First name is required'),
  check('last_name').notEmpty().withMessage('Last name is required'),
  check('email').isEmail().withMessage('Please provide a valid email'),
  check('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  check('working_for').optional().isInt({ min: 1 }).withMessage('working_for must be a valid vendor ID')
], UserController.createUser);

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Update a user
 *     description: Users can update their own profile, admins can update any user
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserRequest'
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/:id', [
  authenticateToken,
  check('first_name').optional().notEmpty().withMessage('First name cannot be empty if provided'),
  check('last_name').optional().notEmpty().withMessage('Last name cannot be empty if provided'),
  check('working_for').optional().isInt({ min: 1 }).withMessage('working_for must be a valid vendor ID')
], UserController.updateUser);

/**
 * @swagger
 * /api/users/{id}/status:
 *   patch:
 *     summary: Update user status
 *     description: Admin role required
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserStatusRequest'
 *     responses:
 *       200:
 *         description: User status updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.patch('/:id/status', [
  authenticateToken, 
  authorize('admin'),
  check('status').isIn(['active', 'inactive', 'suspended']).withMessage('Invalid status value')
], UserController.updateUserStatus);

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: Admin role required
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       400:
 *         description: Cannot delete own account
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', [authenticateToken, authorize('admin')], UserController.deleteUser);

export default router;