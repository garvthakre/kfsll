const express = require('express');
const { check } = require('express-validator');
const TaskController = require('../controllers/task.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Task:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Task ID
 *         title:
 *           type: string
 *           description: Task title
 *         description:
 *           type: string
 *           description: Task description
 *         project_id:
 *           type: integer
 *           description: Project ID the task belongs to
 *         project_title:
 *           type: string
 *           description: Project title
 *         assignee_id:
 *           type: integer
 *           description: User ID of task assignee
 *         assignee_name:
 *           type: string
 *           description: Name of task assignee
 *         created_by:
 *           type: integer
 *           description: User ID of task creator
 *         creator_name:
 *           type: string
 *           description: Name of task creator
 *         status:
 *           type: string
 *           enum: [to_do, in_progress, review, on_hold, completed, cancelled]
 *           description: Task status
 *         priority:
 *           type: string
 *           enum: [low, medium, high, critical]
 *           description: Task priority
 *         due_date:
 *           type: string
 *           format: date
 *           description: Task due date
 *         estimated_hours:
 *           type: number
 *           format: float
 *           description: Estimated hours to complete task
 *         actual_hours:
 *           type: number
 *           format: float
 *           description: Actual hours spent on task
 *         comment_count:
 *           type: integer
 *           description: Number of comments on task
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Task creation date
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update date
 *     TaskComment:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Comment ID
 *         task_id:
 *           type: integer
 *           description: Task ID
 *         user_id:
 *           type: integer
 *           description: User ID who made the comment
 *         user_name:
 *           type: string
 *           description: User name
 *         profile_image:
 *           type: string
 *           description: User profile image URL
 *         content:
 *           type: string
 *           description: Comment content
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Comment creation date
 *     TimeEntry:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Time entry ID
 *         task_id:
 *           type: integer
 *           description: Task ID
 *         user_id:
 *           type: integer
 *           description: User ID who logged time
 *         user_name:
 *           type: string
 *           description: User name
 *         hours:
 *           type: number
 *           format: float
 *           description: Hours logged
 *         minutes:
 *           type: integer
 *           description: Minutes logged
 *         description:
 *           type: string
 *           description: Description of work done
 *         work_date:
 *           type: string
 *           format: date
 *           description: Date when work was performed
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Time entry creation date
 *     CreateTaskRequest:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         title:
 *           type: string
 *           description: Task title
 *         description:
 *           type: string
 *           description: Task description
 *         project_id:
 *           type: integer
 *           description: Project ID
 *         assignee_id:
 *           type: integer
 *           description: User ID to assign the task to
 *         status:
 *           type: string
 *           enum: [to_do, in_progress, review, on_hold, completed, cancelled]
 *           default: to_do
 *           description: Task status
 *         priority:
 *           type: string
 *           enum: [low, medium, high, critical]
 *           default: medium
 *           description: Task priority
 *         due_date:
 *           type: string
 *           format: date
 *           description: Task due date
 *         estimated_hours:
 *           type: number
 *           format: float
 *           description: Estimated hours to complete task
 *     AddCommentRequest:
 *       type: object
 *       required:
 *         - content
 *       properties:
 *         content:
 *           type: string
 *           description: Comment content
 *     TrackTimeRequest:
 *       type: object
 *       required:
 *         - hours
 *       properties:
 *         hours:
 *           type: number
 *           format: float
 *           description: Hours spent
 *         minutes:
 *           type: integer
 *           description: Minutes spent
 *         description:
 *           type: string
 *           description: Description of work done
 *         work_date:
 *           type: string
 *           format: date
 *           description: Date when work was performed
 *     TaskStats:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           description: Task status
 *         count:
 *           type: integer
 *           description: Number of tasks with this status
 */

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks with pagination and filters
 *     tags: [Tasks]
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
 *         name: project_id
 *         schema:
 *           type: integer
 *         description: Filter by project ID
 *       - in: query
 *         name: assignee_id
 *         schema:
 *           type: integer
 *         description: Filter by assignee ID
 *       - in: query
 *         name: created_by
 *         schema:
 *           type: integer
 *         description: Filter by creator ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (comma separated for multiple)
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: Filter by priority (comma separated for multiple)
 *       - in: query
 *         name: due_date_start
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by due date range start
 *       - in: query
 *         name: due_date_end
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by due date range end
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for title or description
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           default: due_date
 *         description: Field to sort by
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
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
router.get('/', authenticateToken, TaskController.getAllTasks);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get task by ID with comments and time entries
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 task:
 *                   $ref: '#/components/schemas/Task'
 *                   properties:
 *                     comments:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TaskComment'
 *                     time_entries:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/TimeEntry'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticateToken, TaskController.getTaskById);

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskRequest'
 *     responses:
 *       201:
 *         description: Task created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.post('/', [
  authenticateToken,
  check('title').notEmpty().withMessage('Title is required')
], TaskController.createTask);

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update a task
 *     description: Only task creator, assignee, manager or admin can update task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTaskRequest'
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.put('/:id', [
  authenticateToken,
  check('title').optional().notEmpty().withMessage('Title cannot be empty if provided')
], TaskController.updateTask);

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     description: Only task creator, manager or admin can delete task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticateToken, TaskController.deleteTask);

/**
 * @swagger
 * /api/tasks/{id}/comments:
 *   get:
 *     summary: Get comments for a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Results per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *     responses:
 *       200:
 *         description: List of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 comments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TaskComment'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.get('/:id/comments', authenticateToken, TaskController.getComments);

/**
 * @swagger
 * /api/tasks/{id}/comments:
 *   post:
 *     summary: Add a comment to a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddCommentRequest'
 *     responses:
 *       201:
 *         description: Comment added successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.post('/:id/comments', [
  authenticateToken,
  check('content').notEmpty().withMessage('Comment content is required')
], TaskController.addComment);

/**
 * @swagger
 * /api/tasks/{id}/time:
 *   get:
 *     summary: Get time entries for a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     responses:
 *       200:
 *         description: List of time entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 time_entries:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TimeEntry'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.get('/:id/time', authenticateToken, TaskController.getTimeEntries);

/**
 * @swagger
 * /api/tasks/{id}/time:
 *   post:
 *     summary: Track time on a task
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TrackTimeRequest'
 *     responses:
 *       201:
 *         description: Time tracked successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.post('/:id/time', [
  authenticateToken,
  check('hours').isNumeric().withMessage('Hours must be a number')
], TaskController.trackTime);

/**
 * @swagger
 * /api/tasks/stats:
 *   get:
 *     summary: Get task statistics
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *         description: Filter stats by project ID
 *     responses:
 *       200:
 *         description: Task statistics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TaskStats'
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/stats', authenticateToken, TaskController.getTaskStats);

/**
 * @swagger
 * /api/tasks/overdue:
 *   get:
 *     summary: Get overdue tasks
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of tasks to return
 *     responses:
 *       200:
 *         description: List of overdue tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/overdue', authenticateToken, TaskController.getOverdueTasks);

/**
 * @swagger
 * /api/tasks/upcoming:
 *   get:
 *     summary: Get upcoming tasks due soon
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *         description: Number of days to look ahead
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of tasks to return
 *     responses:
 *       200:
 *         description: List of upcoming tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Task'
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/upcoming', authenticateToken, TaskController.getUpcomingTasks);

export default router;