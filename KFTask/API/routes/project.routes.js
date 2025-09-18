import express from 'express';
import { check } from 'express-validator';
import ProjectController from '../controllers/project.controller.js';
import { authenticateToken, authorize } from '../middleware/auth.middleware.js';

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
 *           enum: [planning, in_progress, on_hold, completed, cancelled]
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
 *           enum: [low, medium, high, urgent]
 *           description: Project priority
 *         project_type:
 *           type: string
 *           description: Type of the project (e.g., web development, mobile app, consulting)
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
 *         - start_date
 *         - end_date
 *         - project_type
 *         - status
 *       properties:
 *         title:
 *           type: string
 *           description: Project title
 *           minLength: 1
 *           maxLength: 255
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
 *           enum: [planning, in_progress, on_hold, completed, cancelled]
 *           description: Project status
 *         project_type:
 *           type: string
 *           description: Type of the project
 *           maxLength: 100
 *           examples: 
 *             - web_development
 *             - mobile_app
 *             - consulting
 *             - research
 *             - marketing
 *             - design
 *             - data_analysis
 *             - infrastructure
 *     UpdateProjectRequest:
 *       type: object
 *       properties:
 *         title:
 *           type: string
 *           description: Project title
 *           minLength: 1
 *           maxLength: 255
 *         description:
 *           type: string
 *           description: Project description
 *         client_id:
 *           type: integer
 *           description: Client ID
 *           minimum: 1
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
 *           enum: [planning, in_progress, on_hold, completed, cancelled]
 *           description: Project status
 *         budget:
 *           type: number
 *           format: float
 *           minimum: 0
 *           description: Project budget
 *         manager_id:
 *           type: integer
 *           description: Project manager's user ID
 *         department:
 *           type: string
 *           description: Department responsible for the project
 *           maxLength: 100
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *           description: Project priority
 *         project_type:
 *           type: string
 *           description: Type of the project
 *           maxLength: 100
 *     AddTeamMemberRequest:
 *       type: object
 *       required:
 *         - user_id
 *       properties:
 *         user_id:
 *           type: integer
 *           description: User ID
 *           minimum: 1
 *         role:
 *           type: string
 *           description: Role in the project
 *           default: member
 *           examples:
 *             - member
 *             - lead
 *             - developer
 *             - designer
 *             - analyst
 *             - tester
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
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: Error message
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               field:
 *                 type: string
 *               message:
 *                 type: string
 *     PaginationResponse:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           description: Total number of items
 *         page:
 *           type: integer
 *           description: Current page number
 *         limit:
 *           type: integer
 *           description: Items per page
 *         pages:
 *           type: integer
 *           description: Total number of pages
 */

/**
 * @swagger
 * /api/projects/stats:
 *   get:
 *     summary: Get project statistics
 *     description: Retrieve comprehensive statistics about projects grouped by status
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Project statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ProjectStats'
 *             example:
 *               stats:
 *                 - status: "in_progress"
 *                   count: 15
 *                   avg_duration: 120
 *                 - status: "completed"
 *                   count: 8
 *                   avg_duration: 90
 *                 - status: "planning"
 *                   count: 5
 *                   avg_duration: null
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/stats', authenticateToken, ProjectController.getProjectStats);
/**
 * @swagger
 * /api/projects/ids-titles:
 *   get:
 *     summary: Get all projects (ID and title only)
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of project IDs and titles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 projects:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: Project ID
 *                       title:
 *                         type: string
 *                         description: Project title
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/ids-titles', authenticateToken, ProjectController.getAllProjectIdsAndTitles);

/**
 * @swagger
 * /api/projects/types:
 *   get:
 *     summary: Get all available project types
 *     description: Retrieve list of all available project types with their labels and descriptions
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Project types retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project_types:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       value:
 *                         type: string
 *                         description: Project type value
 *                         example: "web_development"
 *                       label:
 *                         type: string
 *                         description: Human-readable label
 *                         example: "Web Development"
 *                       description:
 *                         type: string
 *                         description: Description of the project type
 *                         example: "Websites and web applications"
 *                 total:
 *                   type: integer
 *                   description: Total number of project types
 *             example:
 *               project_types:
 *                 - value: "internal"
 *                 - value: "client_project"
 *                 - value: "research"
 *               total: 12
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/types', authenticateToken, ProjectController.getProjectTypes);

/**
 * @swagger
 * /api/projects/statuses:
 *   get:
 *     summary: Get all available project statuses
 *     description: Retrieve list of all available project statuses
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Project statuses retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project_statuses:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["planning", "in_progress", "on_hold", "completed", "cancelled"]
 *             example:
 *               project_statuses:
 *                 - "planning"
 *                 - "in_progress"
 *                 - "on_hold"
 *                 - "completed"
 *                 - "cancelled"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/statuses', authenticateToken, ProjectController.getProjectStatuses);

/**
 * @swagger
 * /api/projects/priorities:
 *   get:
 *     summary: Get all available project priorities
 *     description: Retrieve list of all available project priorities
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Project priorities retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project_priorities:
 *                   type: array
 *                   items:
 *                     type: string
 *                   example: ["low", "medium", "high", "urgent"]
 *             example:
 *               project_priorities:
 *                 - "low"
 *                 - "medium"
 *                 - "high"
 *                 - "urgent"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/priorities', authenticateToken, ProjectController.getProjectPriorities);

/**
 * @swagger
 * /api/projects:
 *   get:
 *     summary: Get all projects with pagination and filters
 *     description: Retrieve a paginated list of projects with optional filtering and sorting
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of results per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [planning, in_progress, on_hold, completed, cancelled]
 *         description: Filter projects by status
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *         description: Filter projects by department
 *       - in: query
 *         name: manager_id
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Filter projects by project manager ID
 *       - in: query
 *         name: client_id
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Filter projects by client ID
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter projects by priority
 *       - in: query
 *         name: project_type
 *         schema:
 *           type: string
 *         description: Filter projects by project type
 *         examples:
 *           web_development:
 *             value: "web_development"
 *             summary: Web Development Projects
 *           mobile_app:
 *             value: "mobile_app"
 *             summary: Mobile Application Projects
 *           consulting:
 *             value: "consulting"
 *             summary: Consulting Projects
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for project title, description, client name, or manager name
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           enum: [title, created_at, start_date, end_date, status, priority, budget]
 *           default: created_at
 *         description: Field to sort by
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order (ascending or descending)
 *     responses:
 *       200:
 *         description: List of projects retrieved successfully
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
 *                   $ref: '#/components/schemas/PaginationResponse'
 *             example:
 *               projects:
 *                 - id: 1
 *                   title: "E-commerce Website"
 *                   description: "Modern e-commerce platform"
 *                   project_type: "web_development"
 *                   status: "in_progress"
 *                   priority: "high"
 *                   budget: 50000.00
 *                   task_count: 25
 *                   completed_tasks: 8
 *               pagination:
 *                 total: 50
 *                 page: 1
 *                 limit: 10
 *                 pages: 5
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/', authenticateToken, ProjectController.getAllProjects);

/**
 * @swagger
 * /api/projects/{id}:
 *   get:
 *     summary: Get project by ID
 *     description: Retrieve detailed information about a specific project including team members
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Project ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Project details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 project:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Project'
 *                     - type: object
 *                       properties:
 *                         team_members:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/TeamMember'
 *             example:
 *               project:
 *                 id: 1
 *                 title: "E-commerce Website"
 *                 description: "Modern e-commerce platform with advanced features"
 *                 project_type: "web_development"
 *                 status: "in_progress"
 *                 priority: "high"
 *                 budget: 50000.00
 *                 team_members:
 *                   - user_id: 2
 *                     project_role: "lead"
 *                     first_name: "John"
 *                     last_name: "Doe"
 *                     email: "john.doe@company.com"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/:id', authenticateToken, ProjectController.getProjectById);

/**
 * @swagger
 * /api/projects:
 *   post:
 *     summary: Create a new project
 *     description: Create a new project with only essential fields - title, start date, end date, project type, and status
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProjectRequest'
 *           examples:
 *             web_development:
 *               summary: Web Development Project
 *               description: Example of creating a web development project
 *               value:
 *                 title: "E-commerce Website"
 *                 start_date: "2024-01-15"
 *                 end_date: "2024-06-15"
 *                 project_type: "web_development"
 *                 status: "planning"
 *             mobile_app:
 *               summary: Mobile App Project
 *               description: Example of creating a mobile application project
 *               value:
 *                 title: "Task Management App"
 *                 start_date: "2024-02-01"
 *                 end_date: "2024-08-01"
 *                 project_type: "mobile_app"
 *                 status: "planning"
 *             consulting:
 *               summary: Consulting Project
 *               description: Example of creating a consulting project
 *               value:
 *                 title: "Digital Transformation Strategy"
 *                 start_date: "2024-03-01"
 *                 end_date: "2024-05-01"
 *                 project_type: "consulting"
 *                 status: "in_progress"
 *     responses:
 *       201:
 *         description: Project created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Project created successfully"
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                       message:
 *                         type: string
 *             example:
 *               errors:
 *                 - field: "title"
 *                   message: "Title is required"
 *                 - field: "start_date"
 *                   message: "Start date is required"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/', [
  authenticateToken,
  check('title')
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  check('start_date')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  check('end_date')
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid date'),
  check('project_type')
    .notEmpty()
    .withMessage('Project type is required')
    .isString()
    .withMessage('Project type must be a string')
    .isLength({ max: 100 })
    .withMessage('Project type must not exceed 100 characters'),
  check('status')
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'])
    .withMessage('Status must be one of: planning, in_progress, on_hold, completed, cancelled')
], ProjectController.createProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   put:
 *     summary: Update a project
 *     description: Update project information with the same required fields as create
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Project ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateProjectRequest'
 *           examples:
 
 
 *               value:
 *                 title: "E-commerce Website"
 *                 start_date: "2024-01-15"
 *                 end_date: "2024-06-15"
 *                 project_type: "web_development"
 *                 status: "planning"
 
 *     responses:
 *       200:
 *         description: Project updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Project updated successfully"
 *                 project:
 *                   $ref: '#/components/schemas/Project'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                       message:
 *                         type: string
 *             example:
 *               errors:
 *                 - field: "title"
 *                   message: "Title is required"
 *                 - field: "start_date"
 *                   message: "Start date is required"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not authorized to update this project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "You do not have permission to update this project"
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put('/:id', [
  authenticateToken,
  check('title')
   .optional()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  check('client_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Client ID must be a positive integer'),
  check('project_type')
   .optional()
    .notEmpty()
    .withMessage('Project type is required')
    .isString()
    .withMessage('Project type must be a string')
    .isLength({ max: 100 })
    .withMessage('Project type must not exceed 100 characters'),
  check('budget')
    .optional({ nullable: true })
    .isFloat({ min: 0 })
    .withMessage('Budget must be a positive number'),
  check('start_date')
   .optional()
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  check('end_date')
   .optional()
    .notEmpty()
    .withMessage('End date is required')
    .isISO8601()
    .withMessage('End date must be a valid date'),
  check('status')
   .optional()
    .notEmpty()
    .withMessage('Status is required')
    .isIn(['planning', 'in_progress', 'on_hold', 'completed', 'cancelled'])
    .withMessage('Status must be one of: planning, in_progress, on_hold, completed, cancelled'),
  check('priority')
   .optional()
    .optional({ nullable: true })
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),
  check('department')
  
    .optional({ nullable: true })
    .isLength({ max: 100 })
    .withMessage('Department must not exceed 100 characters'),
  check('manager_id')
    .optional({ nullable: true })
    .isInt({ min: 1 })
    .withMessage('Manager ID must be a positive integer')
], ProjectController.updateProject);

/**
 * @swagger
 * /api/projects/{id}:
 *   delete:
 *     summary: Delete a project
 *     description: Delete a project permanently. Only project manager or admin can delete the project.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Project ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Project deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Project deleted successfully"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not authorized to delete this project
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "You do not have permission to delete this project"
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id', authenticateToken, ProjectController.deleteProject);

/**
 * @swagger
 * /api/projects/{id}/team:
 *   post:
 *     summary: Add team member to project
 *     description: Add a new team member to a project. Only project manager or admin can modify the team.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Project ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddTeamMemberRequest'
 *           examples:
 *             developer:
 *               summary: Add Developer
 *               description: Add a developer to the project team
 *               value:
 *                 user_id: 5
 *                 role: "developer"
 *             designer:
 *               summary: Add Designer
 *               description: Add a UI/UX designer to the project team
 *               value:
 *                 user_id: 8
 *                 role: "designer"
 *             team_lead:
 *               summary: Add Team Lead
 *               description: Add a team lead to the project
 *               value:
 *                 user_id: 3
 *                 role: "lead"
 *     responses:
 *       200:
 *         description: Team member added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Team member added successfully"
 *                 team_member:
 *                   type: object
 *                   properties:
 *                     project_id:
 *                       type: integer
 *                       example: 1
 *                     user_id:
 *                       type: integer
 *                       example: 5
 *                     role:
 *                       type: string
 *                       example: "developer"
 *                     joined_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       field:
 *                         type: string
 *                       message:
 *                         type: string
 *             example:
 *               errors:
 *                 - field: "user_id"
 *                   message: "User ID is required"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not authorized to modify project team
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "You do not have permission to modify project team"
 *       404:
 *         description: Project not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       409:
 *         description: User already exists in project team
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/:id/team', [
  authenticateToken,
  check('user_id')
    .notEmpty()
    .withMessage('User ID is required')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer'),
  check('role')
    .optional()
    .isString()
    .withMessage('Role must be a string')
    .isLength({ min: 1, max: 50 })
    .withMessage('Role must be between 1 and 50 characters')
], ProjectController.addTeamMember);

/**
 * @swagger
 * /api/projects/{id}/team/{userId}:
 *   delete:
 *     summary: Remove team member from project
 *     description: Remove a team member from the project. Only project manager or admin can modify the team.
 *     tags: [Projects]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Project ID
 *         example: 1
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: User ID to remove from team
 *         example: 5
 *     responses:
 *       200:
 *         description: Team member removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Team member removed successfully"
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Not authorized to modify project team
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               message: "You do not have permission to modify project team"
 *       404:
 *         description: Project or team member not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             examples:
 *               project_not_found:
 *                 summary: Project Not Found
 *                 value:
 *                   message: "Project not found"
 *               member_not_found:
 *                 summary: Team Member Not Found
 *                 value:
 *                   message: "Team member not found in project"
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.delete('/:id/team/:userId', [
  authenticateToken,
  check('id')
    .isInt({ min: 1 })
    .withMessage('Project ID must be a positive integer'),
  check('userId')
    .isInt({ min: 1 })
    .withMessage('User ID must be a positive integer')
], ProjectController.removeTeamMember);

export default router;