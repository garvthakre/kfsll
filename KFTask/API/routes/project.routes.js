const express = require('express');
const { check } = require('express-validator');
const ProjectController = require('../controllers/project.controller');
const { authenticateToken, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Project:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Project ID
 *         title:
 *           type: string
 *           description: Project title
 *         description:
 *           type: string
 *           description: Project description
 *         client_id:
 *           type: integer
 *           description: Client ID
 *         client_name:
 *           type: string
 *           description: Client name
 *         start_date:
 *           type: string
 *           format: date
 *           description: Project start date
 *         end_date:
 *           type: string
 *           format: date
 *           description: Project end date
 *         status:
 *           type: string
 *           enum: [planning, active, on_hold, completed, cancelled]
 *           description: Project status
 *         budget:
 *           type: number
 *           format: float
 *           description: Project budget
 *         manager_id:
 *           type: integer
 *           description: Project manager's user ID
 *         manager_name:
 *           type: string
 *           description: Project manager's name
 *         department:
 *           type: string
 *           description: Department responsible for the project
 *         priority:
 *           type: string
 *           enum: [low, medium, high, critical]
 *           description: Project priority
 *         task_count:
 *           type: integer
 *           description: Total number of tasks in the project
 *         completed_tasks:
 *           type: integer
 *           description: Number of completed tasks in the project
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Project creation date
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update date
 *     TeamMember:
 *       type: object
 *       properties:
 *         user_id:
 *           type: integer
 *           description: User ID
 *         project_role:
 *           type: string
 *           description: Role in the project
 *         joined_at:
 *           type: string
 *           format: date-time
 *           description: Date when joined the project
 *         first_name:
 *           type: string
 *           description: User's first name
 *         last_name:
 *           type: string
 *           description: User's last name
 *         email:
 *           type: string
 *           description: User's email
 *         department:
 *           type: string
 *           description: User's department
 *         position:
 *           type: string
 *           description: User's position
 *         profile_image:
 *           type: string
 *           description: Profile image URL
 *     CreateProjectRequest:
 *       type: object
 *       required:
 *         - title
 *         - client_id
 *       properties:
 *         title:
 *           type: string
 *           description: Project title
 *         description:
 *           type: string
 *           description: Project description
 *         client_id:
 *           type: integer
 *           description: Client ID
 *         start_date:
 *           type: string
 *           format: date
 *           description: Project start date
 *         end_date:
 *           type: string
 *           format: date
 *           description: Project end date
 *         status:
 *           type: string
 *           enum: [planning, active, on_hold, completed, cancelled]
 *           description: Project status
 *         budget:
 *           type: number
 *           format: float
 *           description: Project budget
 *         manager_id:
 *           type: integer
 *           description: Project manager's user ID
 *         department:
 *           type: string
 *           description: Department responsible for the project
 *         priority:
 *           type: string
 *           enum: [low, medium, high, critical]
 *           description: Project priority
 *         team_members:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: User ID
 *               role:
 *                 type: string
 *                 description: Role in the project
 *     AddTeamMemberRequest:
 *       type: object
 *       required:
 *         - user_id
 *       properties:
 *         user_id:
 *           type: integer
 *           description: User ID
 *         role:
 *           type: string
 *           description: Role in the project
 *     ProjectStats:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           description: Project status
 *         count:
 *           type: integer
 *           description: Number of projects with this status
 *         avg_duration:
 *           type: number
 *           description: Average project duration in days
 */

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects with pagination and filters
 *     tags: [Projects]
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [planning, active, on_hold, completed, cancelled]
 *         description: Filter by status
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter by department
 *       - in: query
 *         name: manager_id
 *         schema:
 *           type: integer
 *         description: Filter by manager ID
 *       - in: query
 *         name: client_id
 *         schema:
 *           type: integer
 *         description: Filter by client ID
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, critical]
 *         description: Filter by priority
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for title, description, client name, or manager name
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           default: created_at
 *         description: Field to sort by
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of projects
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 projects:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Project'
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
router.get('/', authenticateToken, ProjectController.getAllProjects);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *                   properties:
 *                     team_members:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TeamMember'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticateToken, ProjectController.getProjectById);

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProjectRequest'
 *     responses:
 *       201:
 *         description: Project created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.post('/', [
  authenticateToken,
  check('title').notEmpty().withMessage('Title is required'),
  check('client_id').notEmpty().withMessage('Client ID is required')
], ProjectController.createProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update a project
 *     description: Only project manager or admin can update project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProjectRequest'
 *     responses:
 *       200:
 *         description: Project updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.put('/:id', [
  authenticateToken,
  check('title').optional().notEmpty().withMessage('Title cannot be empty if provided')
], ProjectController.updateProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     description: Only project manager or admin can delete project
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticateToken, ProjectController.deleteProject);

/**
 * @swagger
 * /api/projects/{id}/team:
 *   post:
 *     summary: Add team member to project
 *     description: Only project manager or admin can modify team
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddTeamMemberRequest'
 *     responses:
 *       200:
 *         description: Team member added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Project not found
 *       500:
 *         description: Server error
 */
router.post('/:id/team', [
  authenticateToken,
  check('user_id').notEmpty().withMessage('User ID is required')
], ProjectController.addTeamMember);

/**
 * @swagger
 * /api/projects/{id}/team/{userId}:
 *   delete:
 *     summary: Remove team member from project
 *     description: Only project manager or admin can modify team
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID to remove from team
 *     responses:
 *       200:
 *         description: Team member removed successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Project or team member not found
 *       500:
 *         description: Server error
 */
router.delete('/:id/team/:userId', authenticateToken, ProjectController.removeTeamMember);

/**
 * @swagger
 * /api/projects/stats:
 *   get:
 *     summary: Get project statistics
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Project statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProjectStats'
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/stats', authenticateToken, ProjectController.getProjectStats);

export default router;