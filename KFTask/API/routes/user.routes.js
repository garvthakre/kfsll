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
 *         designation:
 *           type: string
 *           description: Designation
 *         role:
 *           type: string
 *           enum: [admin, manager, employee, consultant, vendor]
 *           description: User role
 *         type:
 *           type: string
 *           description: User type
 *         working_type:
 *           type: string
 *           description: Working type
 *         working_for:
 *           type: integer
 *           description: Vendor ID that the user is working for
 *         email:
 *           type: string
 *           format: email
 *           description: Email address
 *         mobile_number:
 *           type: string
 *           description: Mobile phone number
 *         status:
 *           type: string
 *           enum: [active, inactive, suspended]
 *           description: Account status
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
 *         - designation
 *         - role
 *         - type
 *         - working_type
 *         - email
 *         - phone_no
 *       properties:
 *         first_name:
 *           type: string
 *           description: First name
 *         last_name:
 *           type: string
 *           description: Last name
 *         designation:
 *           type: string
 *           description: Designation
 *         role:
 *           type: string
 *           enum: [admin, manager, employee, consultant, vendor]
 *           description: User role
 *         type:
 *           type: string
 *           description: User type
 *         working_type:
 *           type: string
 *           description: Working type
 *         working_for:
 *           type: integer
 *           description: Vendor ID that the user is working for (optional)
 *         email:
 *           type: string
 *           format: email
 *           description: Email address
 *         mobile_number:
 *           type: string
 *           description: Mobile phone number
 *     UpdateUserRequest:
 *       type: object
 *       properties:
 *         first_name:
 *           type: string
 *           description: First name
 *         last_name:
 *           type: string
 *           description: Last name
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
 *         phone_no:
 *           type: string
 *           description: Mobile phone number
 *     UpdateUserStatusRequest:
 *       type: object
 *       required:
 *         - status
 *       properties:
 *         status:
 *           type: string
 *           enum: [active, inactive, suspended]
 *           description: Account status
 *     DashboardOverview:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             totalUsers:
 *               type: integer
 *               example: 124
 *               description: Total number of users in the system
 *             activeProjects:
 *               type: integer
 *               example: 18
 *               description: Number of active projects (not completed or cancelled)
 *             pendingTasks:
 *               type: integer
 *               example: 45
 *               description: Number of pending tasks (not completed)
 *     DetailedDashboardStats:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *         data:
 *           type: object
 *           properties:
 *             overview:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                 activeProjects:
 *                   type: integer
 *                 pendingTasks:
 *                   type: integer
 *             users:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 active:
 *                   type: integer
 *                 admin:
 *                   type: integer
 *                 manager:
 *                   type: integer
 *                 employee:
 *                   type: integer
 *             projects:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 planning:
 *                   type: integer
 *                 inProgress:
 *                   type: integer
 *                 completed:
 *                   type: integer
 *                 onHold:
 *                   type: integer
 *                 cancelled:
 *                   type: integer
 *             tasks:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                 todo:
 *                   type: integer
 *                 inProgress:
 *                   type: integer
 *                 completed:
 *                   type: integer
 *                 onHold:
 *                   type: integer
 *                 overdue:
 *                   type: integer
 */

/**
 * @swagger
 * /api/users/dashboard/overview:
 *   get:
 *     summary: Get dashboard overview statistics
 *     description: Returns basic dashboard data including total users, active projects, and pending tasks
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard overview data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DashboardOverview'
 *       401:
 *         description: Authentication required
 *       500:
 *         description: Server error
 */
router.get('/dashboard/overview', authenticateToken, UserController.getDashboardOverview);
 

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
 * /api/users/user:
 *   get:
 *     summary: Get all users (ID and name only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user IDs and names
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: User ID
 *                       name:
 *                         type: string
 *                         description: User full name
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/ids-names', authenticateToken, UserController.getAllUserIdsAndNamesforuser);
// /**
//  * @swagger
//  * /api/users/admin:
//  *   get:
//  *     summary: Get all users (ID and name only)
//  *     tags: [Users]
//  *     security:
//  *       - bearerAuth: []
//  *     responses:
//  *       200:
//  *         description: List of user IDs and names
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 users:
//  *                   type: array
//  *                   items:
//  *                     type: object
//  *                     properties:
//  *                       id:
//  *                         type: integer
//  *                         description: User ID
//  *                       name:
//  *                         type: string
//  *                         description: User full name
//  *       401:
//  *         description: Not authenticated
//  *       500:
//  *         description: Server error
//  */
// router.get('/id-admin', authenticateToken, UserController.getAllUserIdsAndNamesforvendor);
 /**
 * @swagger
 * /api/users/roles:
 *   get:
 *     summary: Get all available user roles
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available roles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 roles:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["admin", "manager", "employee", "consultant", "vendor"]
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/roles', authenticateToken, UserController.getUserRoles);

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
 * /api/users/{id}/working-for:
 *   get:
 *     summary: Get user's working relationship details
 *     description: Shows who the user is working for (vendor/company) and relationship details
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
 *         description: Working relationship details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user_id:
 *                   type: integer
 *                   example: 123
 *                 working_for:
 *                   type: integer
 *                   example: 456
 *                   nullable: true
 *                 working_relationship:
 *                   type: string
 *                   enum: [vendor, internal, independent, unknown]
 *                   example: vendor
 *                 details:
 *                   type: object
 *                   properties:
 *                     user_name:
 *                       type: string
 *                       example: "John Doe"
 *                     user_role:
 *                       type: string
 *                       example: "consultant"
 *                     user_email:
 *                       type: string
 *                       example: "john@example.com"
 *                     working_type:
 *                       type: string
 *                       example: "full-time"
 *                     designation:
 *                       type: string
 *                       example: "Software Engineer"
 *                 working_for_details:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [vendor, internal]
 *                     company_name:
 *                       type: string
 *                       example: "ABC Consulting"
 *                     vendor_contact:
 *                       type: object
 *                       properties:
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         phone:
 *                           type: string
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/:id/working-for', authenticateToken, UserController.getUserWorkingFor);

/**
 * @swagger
 * /api/users/{id}/projects:
 *   get:
 *     summary: Get all projects that a user is part of
 *     description: Returns projects where user is either a manager or team member. Users can only see their own projects, admins can see any user's projects.
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
 *         description: List of projects user is involved in
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 123
 *                     name:
 *                       type: string
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       example: "john@example.com"
 *                     role:
 *                       type: string
 *                       example: "employee"
 *                 projects:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       title:
 *                         type: string
 *                       description:
 *                         type: string
 *                       status:
 *                         type: string
 *                       priority:
 *                         type: string
 *                       project_type:
 *                         type: string
 *                       start_date:
 *                         type: string
 *                         format: date
 *                       end_date:
 *                         type: string
 *                         format: date
 *                       budget:
 *                         type: number
 *                       manager_name:
 *                         type: string
 *                       client_name:
 *                         type: string
 *                       task_count:
 *                         type: integer
 *                       completed_tasks:
 *                         type: integer
 *                       user_role_in_project:
 *                         type: string
 *                         description: Role of the user in this specific project
 *                         example: "member"
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     pages:
 *                       type: integer
 *                       example: 3
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized - can only view own projects unless admin
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/:id/projects', authenticateToken, UserController.getUserProjects);

/**
 * @swagger
 * /api/users/working-for/{workingForId}:
 *   get:
 *     summary: Get all users working for a specific vendor/company
 *     description: Returns list of users who are working for the specified vendor or internal entity
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workingForId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the vendor/company that users are working for
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
 *         description: List of users working for the specified entity
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 working_for_entity:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     first_name:
 *                       type: string
 *                     last_name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *                     entity_type:
 *                       type: string
 *                       enum: [vendor, internal]
 *                     vendor_info:
 *                       type: object
 *                       nullable: true
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Entity not found
 *       500:
 *         description: Server error
 */
router.get('/working-for/:workingForId', authenticateToken, UserController.getUsersWorkingFor);

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