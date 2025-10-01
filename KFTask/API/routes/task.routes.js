// const express = require('express');
// const { check } = require('express-validator');
// const TaskController = require('../controllers/task.controller');
// const { authenticateToken } = require('../middleware/auth.middleware');

import express from 'express';
import { check } from 'express-validator';
import TaskController from '../controllers/task.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     FeedbackReply:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Reply ID
 *           example: 1
 *         feedback_id:
 *           type: integer
 *           description: Feedback/comment ID this reply belongs to
 *           example: 5
 *         user_id:
 *           type: integer
 *           description: User ID who made the reply
 *           example: 2
 *         user_name:
 *           type: string
 *           description: Name of user who replied
 *           example: "John Vendor"
 *         profile_image:
 *           type: string
 *           description: User profile image URL
 *           example: "https://example.com/profile.jpg"
 *         role:
 *           type: string
 *           description: Role of user who replied
 *           example: "vendor"
 *         content:
 *           type: string
 *           description: Reply content
 *           example: "Thank you for the feedback. I'll address this issue."
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Reply creation timestamp
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Reply last update timestamp
 *     AddFeedbackRequest:
 *       type: object
 *       required:
 *         - content
 *       properties:
 *         content:
 *           type: string
 *           description: Feedback content
 *           example: "This task needs more clarification on requirements"
 *     AddReplyRequest:
 *       type: object
 *       required:
 *         - content
 *       properties:
 *         content:
 *           type: string
 *           description: Reply content
 *           example: "Thank you for your feedback. I'll work on improving this."
 *     VerifyTaskRequest:
 *       type: object
 *       required:
 *         - verified
 *       properties:
 *         verified:
 *           type: boolean
 *           description: Whether to approve (true) or reject (false) the task completion
 *           example: true
 *         feedback:
 *           type: string
 *           description: Optional feedback message from vendor
 *           example: "Good work, task completed as expected"
 *         rating:
 *           type: number
 *           minimum: 1
 *           maximum: 5
 *           description: Rating for the task (1-5). Only saved when verified is true
 *           example: 4
 *     PendingVerificationTask:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Task ID
 *           example: 1
 *         title:
 *           type: string
 *           description: Task title
 *           example: "Complete project documentation"
 *         project_id:
 *           type: integer
 *           description: Project ID
 *           example: 1
 *         project_title:
 *           type: string
 *           description: Project title
 *           example: "Website Development"
 *         due_date:
 *           type: string
 *           format: date
 *           description: Task due date
 *           example: "2024-12-31"
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Task creation date
 *         daily_update_id:
 *           type: integer
 *           description: Latest daily update ID
 *           example: 15
 *         latest_update:
 *           type: string
 *           description: Content of latest daily update
 *           example: "Task completed successfully"
 *         update_date:
 *           type: string
 *           format: date
 *           description: Date of latest update
 *         update_created_at:
 *           type: string
 *           format: date-time
 *           description: When the update was created
 *         assignee_name:
 *           type: string
 *           description: Name of task assignee
 *           example: "John Doe"
 *         assignee_id:
 *           type: integer
 *           description: ID of task assignee
 *           example: 5
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
 *           enum: [new, in_progress, completed, to_do, review, on_hold, cancelled]
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
 *           description: Comment/Feedback ID
 *           example: 1
 *         task_id:
 *           type: integer
 *           description: Task ID
 *           example: 5
 *         user_id:
 *           type: integer
 *           description: User ID who made the comment
 *           example: 3
 *         user_name:
 *           type: string
 *           description: User name
 *           example: "John Doe"
 *         profile_image:
 *           type: string
 *           description: User profile image URL
 *           example: "https://example.com/profile.jpg"
 *         role:
 *           type: string
 *           description: User role
 *           example: "consultant"
 *         content:
 *           type: string
 *           description: Comment content
 *           example: "Need clarification on requirements"
 *         reply_status:
 *           type: string
 *           enum: [pending, replied]
 *           description: Status of feedback - 'pending' when created, 'replied' after admin/vendor responds
 *           example: "pending"
 *         replies:
 *           type: array
 *           description: Array of replies to this feedback
 *           items:
 *             $ref: '#/components/schemas/FeedbackReply'
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Comment creation date
 *         updated_at:
 *           type: string
 *           format: date-time
 *           description: Last update date
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
 *     DailyUpdate:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: Daily update ID
 *         task_id:
 *           type: integer
 *           description: Task ID
 *         user_id:
 *           type: integer
 *           description: User ID who made the update
 *         user_name:
 *           type: string
 *           description: User name
 *         profile_image:
 *           type: string
 *           description: User profile image URL
 *         content:
 *           type: string
 *           description: Daily update content
 *         status:
 *           type: string
 *           enum: [new, in_progress, completed]
 *           description: Task status at time of update
 *         update_date:
 *           type: string
 *           format: date
 *           description: Date of the update
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: Update creation timestamp
 *     CreateTaskRequest:
 *       type: object
 *       required:
 *         - title
 *       properties:
 *         title:
 *           type: string
 *           description: Task title
 *           example: "Complete project documentation"
 *         project_id:
 *           type: integer
 *           description: Project ID
 *           example: 1
 *         assignee_id:
 *           type: integer
 *           description: User ID to assign the task to
 *           example: 2
 *         status:
 *           type: string
 *           enum: [new, in_progress, completed]
 *           default: new
 *           description: Task status
 *           example: "new"
 *         due_date:
 *           type: string
 *           format: date
 *           description: Task due date
 *           example: "2024-12-31"
 *     UpdateTaskRequest:
 *       type: object
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
 *           enum: [new, in_progress, completed, to_do, review, on_hold, cancelled]
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
 *     DailyUpdateRequest:
 *       type: object
 *       required:
 *         - content
 *       properties:
 *         content:
 *           type: string
 *           description: Daily update content
 *           example: "Completed the initial research phase and started implementation"
 *         update_date:
 *           type: string
 *           format: date
 *           description: Date of the update (optional, defaults to current date)
 *           example: "2025-09-15"
 *         status:
 *           type: string
 *           enum: [new, in_progress, completed]
 *           description: Task status update (optional)
 *           example: "in_progress"
 *     AddCommentRequest:
 *       type: object
 *       required:
 *         - content
 *       properties:
 *         content:
 *           type: string
 *           description: Comment content
 *           example: "This task needs more clarification on requirements"
 *     TrackTimeRequest:
 *       type: object
 *       required:
 *         - hours
 *       properties:
 *         hours:
 *           type: number
 *           format: float
 *           description: Hours spent
 *           example: 2.5
 *         minutes:
 *           type: integer
 *           description: Minutes spent
 *           example: 30
 *         description:
 *           type: string
 *           description: Description of work done
 *           example: "Implemented user authentication module"
 *         work_date:
 *           type: string
 *           format: date
 *           description: Date when work was performed
 *           example: "2025-09-15"
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
 * /api/tasks/stats:
 *   get:
 *     summary: Get task statistics
 *     description: Retrieve task statistics grouped by status, optionally filtered by project
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *         description: Filter stats by project ID
 *         example: 1
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
 *             example:
 *               stats:
 *                 - status: "in_progress"
 *                   count: 15
 *                 - status: "new"
 *                   count: 8
 *                 - status: "completed"
 *                   count: 25
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/stats', authenticateToken, TaskController.getTaskStats);

/**
 * @swagger
 * /api/tasks/feedback/{user_id}:
 *   get:
 *     summary: Get all feedback for a specific user
 *     description: Get all feedback created by a specific user with pagination
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID to get feedback for
 *         example: 5
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of items per page
 *         example: 50
 *     responses:
 *       200:
 *         description: Feedback retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 feedback:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       task_id:
 *                         type: integer
 *                       task_title:
 *                         type: string
 *                       project_id:
 *                         type: integer
 *                       project_title:
 *                         type: string
 *                       user_id:
 *                         type: integer
 *                       user_name:
 *                         type: string
 *                       profile_image:
 *                         type: string
 *                       role:
 *                         type: string
 *                       content:
 *                         type: string
 *                       reply_status:
 *                         type: string
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                       replies:
 *                         type: array
 *                         items:
 *                           type: object
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
 *       400:
 *         description: Invalid user ID
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/feedback/:user_id', authenticateToken, TaskController.getAllFeedback);
/**
 * @swagger
 * /api/tasks/my-projectsTask:
 *   get:
 *     summary: Get projects where user has assigned tasks
 *     description: Retrieve all projects that have tasks assigned to the current user
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of projects with assigned tasks
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
 *                       task_count:
 *                         type: integer
 *                         description: Number of tasks assigned to user in this project
 *                       tasks:
 *                         type: array
 *                         description: List of tasks in this project
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                               description: Task ID
 *                             title:
 *                               type: string
 *                               description: Task title
 *             example:
 *               projects:
 *                 - id: 1
 *                   title: "Website Development"
 *                   task_count: 5
 *                   tasks:
 *                     - id: 101
 *                       title: "Create homepage"
 *                     - id: 102
 *                       title: "Setup database"
 *                 - id: 2
 *                   title: "Mobile App"
 *                   task_count: 3
 *                   tasks:
 *                     - id: 201
 *                       title: "Design login screen"
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/my-projectsTask', authenticateToken, TaskController.getMyProjectsTask);
/**
 * @swagger
 * /api/tasks/pending-verification/{project_id}:
 *   get:
 *     summary: Get tasks pending verification by project ID
 *     description: Retrieve tasks where consultants have marked daily updates as completed but haven't been verified yet for a specific project.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: project_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Project ID to filter tasks
 *         example: 1
 *     responses:
 *       200:
 *         description: Tasks pending verification for the project
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Tasks pending verification retrieved successfully"
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/PendingVerificationTask'
 *       400:
 *         description: Project ID is required
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/pending-verification/:project_id', authenticateToken, TaskController.getTasksPendingVerification);


/**
 * @swagger
 * /api/tasks/my:
 *   get:
 *     summary: Get all tasks assigned to or created by the user
 *     description: Retrieve paginated tasks where the authenticated user is either the assignee or creator
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
 *         description: Number of tasks per page
 *     responses:
 *       200:
 *         description: Paginated tasks for the authenticated user
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
 *                       description: Total number of tasks
 *                     page:
 *                       type: integer
 *                       description: Current page number
 *                     limit:
 *                       type: integer
 *                       description: Tasks per page
 *                     pages:
 *                       type: integer
 *                       description: Total number of pages
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/my', authenticateToken, TaskController.getMyTasks);

/**
 * @swagger
 * /api/tasks/my-tasksid:
 *   get:
 *     summary: Get all tasks assigned to or created by the user (ID and title only)
 *     description: Retrieve minimal task info for the authenticated user - only ID and title, no pagination
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Minimal task info for the authenticated user (no pagination)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       title:
 *                         type: string
 *                         example: "Complete project documentation"
 *                 total:
 *                   type: integer
 *                   example: 15
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/my-tasksid', authenticateToken, TaskController.getMyTasksWITHIDANDTITLES);
 
/**
 * @swagger
 * /api/tasks/daily-updates:
 *   get:
 *     summary: Get all tasks with daily updates and filters
 *     description: Retrieve all tasks that have daily updates with project info, creator info, and filtering options. Use limit=0 or limit=all to get all results without pagination.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination (ignored if limit=0 or limit=all)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *           default: "10"
 *         description: Number of results per page. Use 0 or "all" to get all results  
 *       - in: query
 *         name: task_id
 *         schema:
 *           type: integer
 *         description: Filter by specific task ID
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *         description: Filter by project ID
 *       - in: query
 *         name: assignee_id
 *         schema:
 *           type: integer
 *         description: Filter by assignee's user ID
 *       - in: query
 *         name: created_by
 *         schema:
 *           type: integer
 *         description: Filter by task creator's user ID
 *       - in: query
 *         name: working_for
 *         schema:
 *           type: integer
 *         description: Filter by working_for user ID (vendor relationship)
 *       - in: query
 *         name: update_date_start
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter daily updates from this date onwards (YYYY-MM-DD)
 *       - in: query
 *         name: update_date_end
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter daily updates up to this date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of tasks with daily updates
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     tasks:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             description: Task ID
 *                             example: 0
 *                           title:
 *                             type: string
 *                             description: Task title
 *                             example: "Complete project documentation"
 *                           project_id:
 *                             type: integer
 *                             description: Project ID
 *                             example: 0
 *                           project_name:
 *                             type: string
 *                             description: Project name
 *                             example: "Website Development"
 *                           assignee_id:
 *                             type: integer
 *                             description: Assignee user ID
 *                             example: 0
 *                           created_by:
 *                             type: integer
 *                             description: Creator user ID
 *                             example: 0
 *                           created_by_name:
 *                             type: string
 *                             description: Creator name
 *                             example: "John Doe"
 *                           status:
 *                             type: string
 *                             description: Task status
 *                             example: "in_progress"
 *                           due_date:
 *                             type: string
 *                             format: date
 *                             description: Task due date
 *                             example: "2024-02-15"
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             description: Task creation date
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                             description: Last update date
 *                           daily_updates_count:
 *                             type: integer
 *                             description: Number of daily updates for this task
 *                             example: 5
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 25
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         pages:
 *                           type: integer
 *                           example: 3
 *                 - type: object
 *                   properties:
 *                     tasks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Task'
 *                     total:
 *                       type: integer
 *                       example: 50
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */

router.get('/daily-updates', authenticateToken, TaskController.getAllTasksWithDailyUpdates);

/**
 * @swagger
 * /api/tasks/vendor-updates:
 *   get:
 *     summary: Get all vendors with daily updates and filters
 *     description: Retrieve all vendors that have daily updates with project info and filtering options. Use limit=0 or limit=all to get all results without pagination.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination (ignored if limit=0 or limit=all)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: string
 *           default: "10"
 *         description: Number of results per page. Use 0 or "all" to get all results  
 *       - in: query
 *         name: vendor_id
 *         schema:
 *           type: integer
 *         description: Filter by specific vendor ID
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *         description: Filter by project ID
 *       - in: query
 *         name: assignee_id
 *         schema:
 *           type: integer
 *         description: Filter by assignee's user ID
 *       - in: query
 *         name: update_date_start
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter daily updates from this date onwards (YYYY-MM-DD)
 *       - in: query
 *         name: update_date_end
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter daily updates up to this date (YYYY-MM-DD)
 *     responses:
 *       200:
 *         description: List of vendors with daily updates
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     vendors:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             description: Vendor ID
 *                             example: 0
 *                           name:
 *                             type: string
 *                             description: Vendor name
 *                             example: "ABC Supplies Ltd"
 *                           project_id:
 *                             type: integer
 *                             description: Project ID
 *                             example: 0
 *                           project_name:
 *                             type: string
 *                             description: Project name
 *                             example: "Website Development"
 *                           assignee_id:
 *                             type: integer
 *                             description: Assignee user ID
 *                             example: 0
 *                           status:
 *                             type: string
 *                             description: Vendor status
 *                             example: "active"
 *                           due_date:
 *                             type: string
 *                             format: date
 *                             description: Vendor due date
 *                             example: "2024-02-15"
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             description: Vendor creation date
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                             description: Last update date
 *                           daily_updates_count:
 *                             type: integer
 *                             description: Number of daily updates for this vendor
 *                             example: 5
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                           example: 25
 *                         page:
 *                           type: integer
 *                           example: 1
 *                         limit:
 *                           type: integer
 *                           example: 10
 *                         pages:
 *                           type: integer
 *                           example: 3
 *                 - type: object
 *                   properties:
 *                     vendors:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Task'
 *                     total:
 *                       type: integer
 *                       example: 50
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */

router.get('/vendor-updates', authenticateToken, TaskController.getAllVendorsWithDailyUpdates);
/**
 * @swagger
 * /api/tasks/ids-titles:
 *   get:
 *     summary: Get all tasks (ID and title only)
 *     description: Retrieve all tasks with only ID and title information for dropdown/selection purposes
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of task IDs and titles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 tasks:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: Task ID
 *                         example: 1
 *                       title:
 *                         type: string
 *                         description: Task title
 *                         example: "Complete project documentation"
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get('/ids-titles', authenticateToken, TaskController.getAllTaskIdsAndTitles);

/**
 * @swagger
 * /api/tasks/overdue:
 *   get:
 *     summary: Get overdue tasks
 *     description: Retrieve tasks that are past their due date and not completed or cancelled
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
 *         example: 5
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
 *     description: Retrieve tasks that are due within a specified number of days
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
 *         example: 7
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of tasks to return
 *         example: 10
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

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks with pagination and filters
 *     description: Retrieve all tasks with comprehensive filtering, searching, and pagination options
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
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Results per page
 *         example: 10
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *         description: Filter by project ID
 *         example: 1
 *       - in: query
 *         name: assignee_id
 *         schema:
 *           type: integer
 *         description: Filter by assignee ID
 *         example: 2
 *       - in: query
 *         name: created_by
 *         schema:
 *           type: integer
 *         description: Filter by creator ID
 *         example: 3
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (comma separated for multiple)
 *         example: "new,in_progress"
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *         description: Filter by priority (comma separated for multiple)
 *         example: "high,critical"
 *       - in: query
 *         name: due_date_start
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by due date range start
 *         example: "2024-01-01"
 *       - in: query
 *         name: due_date_end
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by due date range end
 *         example: "2024-12-31"
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for title or description
 *         example: "documentation"
 *       - in: query
 *         name: sort_by
 *         schema:
 *           type: string
 *           default: due_date
 *         description: Field to sort by
 *         example: "due_date"
 *       - in: query
 *         name: sort_order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *         description: Sort order
 *         example: "asc"
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
 *     description: Retrieve detailed task information including comments, time entries, and daily updates
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
 *         example: 1
 *     responses:
 *       200:
 *         description: Task details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 task:
 *                   allOf:
 *                     - $ref: '#/components/schemas/Task'
 *                     - type: object
 *                       properties:
 *                         feedback:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/TaskComment'
 *                         time_entries:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/TimeEntry'
 *                         daily_updates:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/DailyUpdate'
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
 * /api/tasks/{id}/verify:
 *   put:
 *     summary: Verify task completion by vendor
 *     description: Allow vendors to approve or reject task completion based on consultant's daily update. When approving, can also provide a rating. Only accessible by vendors.
 *     tags: [Tasks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Task ID to verify
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyTaskRequest'
 *     responses:
 *       200:
 *         description: Task verification completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Task completion verified successfully"
 *                 task_id:
 *                   type: integer
 *                   description: Task ID that was verified
 *                   example: 1
 *                 verified:
 *                   type: boolean
 *                   description: Verification result
 *                   example: true
 *                 feedback:
 *                   type: string
 *                   description: Vendor feedback
 *                   example: "Good work, task completed as expected"
 *                 rating:
 *                   type: number
 *                   description: Rating given (only when verified is true)
 *                   example: 4
 *       400:
 *         description: Validation error or no completed daily update found
 *       403:
 *         description: Access denied - only vendors can verify tasks or no permission for this specific task
 *       404:
 *         description: Task not found
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.put('/:id/verify', [
  authenticateToken,
  check('verified').isBoolean().withMessage('Verified field is required and must be boolean'),
  check('feedback').optional().isString().withMessage('Feedback must be a string'),
  check('rating').optional().isFloat({ min: 1, max: 5 }).withMessage('Rating must be a number between 1 and 5')
], TaskController.verifyTaskCompletion);
/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task
 *     description: Create a new task with title, optional project assignment, assignee, status, and due date
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
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Task created successfully"
 *                 task:
 *                   $ref: '#/components/schemas/Task'
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
 *                       msg:
 *                         type: string
 *                       param:
 *                         type: string
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.post('/', [
  authenticateToken,
  check('title').notEmpty().withMessage('Title is required'),
  check('status').optional().isIn(['new', 'in_progress', 'completed']).withMessage('Invalid status value')
], TaskController.createTask);

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update a task
 *     description: Update task details. Only task creator, assignee, manager or admin can update task
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
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTaskRequest'
 *     responses:
 *       200:
 *         description: Task updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Task updated successfully"
 *                 task:
 *                   $ref: '#/components/schemas/Task'
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
  check('title').optional().notEmpty().withMessage('Title cannot be empty if provided'),
  check('status').optional().isIn(['new', 'in_progress', 'completed', 'to_do', 'review', 'on_hold', 'cancelled']).withMessage('Invalid status value')
], TaskController.updateTask);

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete a task
 *     description: Delete a task permanently. Only task creator, manager or admin can delete task
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
 *         example: 1
 *     responses:
 *       200:
 *         description: Task deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Task deleted successfully"
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
 * /api/tasks/{id}/feedback:
 *   get:
 *     summary: Get feedback for a task
 *     description: Retrieve all feedback/comments for a specific task with pagination and filters. Each feedback includes reply_status ('pending' or 'replied') and any replies.
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
 *         example: 1
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Results per page
 *         example: 20
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Filter by user who created feedback
 *         example: 3
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *         description: Filter by project ID
 *         example: 1
 *       - in: query
 *         name: reply_status
 *         schema:
 *           type: string
 *           enum: [pending, replied]
 *         description: Filter by reply status
 *         example: "pending"
 *     responses:
 *       200:
 *         description: List of feedback with reply status and replies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 feedback:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TaskComment'
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
 *                       example: 20
 *                     pages:
 *                       type: integer
 *                       example: 3
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.get('/:id/feedback', authenticateToken, TaskController.getFeedback);


/**
 * @swagger
 * /api/tasks/{id}/feedback:
 *   post:
 *     summary: Add feedback to a task
 *     description: Add feedback/comment to a specific task. The reply_status will automatically be set to 'pending'.
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
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddFeedbackRequest'
 *     responses:
 *       201:
 *         description: Feedback added successfully with status 'pending'
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Feedback added successfully"
 *                 feedback:
 *                   allOf:
 *                     - $ref: '#/components/schemas/TaskComment'
 *                     - type: object
 *                       properties:
 *                         reply_status:
 *                           type: string
 *                           example: "pending"
 *             example:
 *               message: "Feedback added successfully"
 *               feedback:
 *                 id: 10
 *                 task_id: 1
 *                 user_id: 3
 *                 user_name: "John Doe"
 *                 profile_image: "https://example.com/profile.jpg"
 *                 content: "This task needs more clarification"
 *                 reply_status: "pending"
 *                 created_at: "2025-09-30T12:00:00Z"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.post('/:id/feedback', [
  authenticateToken,
  check('content').notEmpty().withMessage('Feedback content is required')
], TaskController.addFeedback);

/**
 * @swagger
 * /api/tasks/{id}/feedback/{feedback_id}/replies:
 *   post:
 *     summary: Add reply to feedback
 *     description: Add a reply to a specific feedback/comment. Only one reply is allowed per feedback. When reply is added, the feedback's reply_status changes from 'pending' to 'replied' automatically.
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
 *         example: 1
 *       - in: path
 *         name: feedback_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Feedback/comment ID to reply to
 *         example: 5
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddReplyRequest'
 *     responses:
 *       201:
 *         description: Reply added successfully and feedback status updated to 'replied'
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Reply added successfully"
 *                 reply:
 *                   $ref: '#/components/schemas/FeedbackReply'
 *                 feedback_status:
 *                   type: string
 *                   example: "replied"
 *             example:
 *               message: "Reply added successfully"
 *               reply:
 *                 id: 1
 *                 feedback_id: 5
 *                 user_id: 2
 *                 user_name: "John Vendor"
 *                 profile_image: "https://example.com/profile.jpg"
 *                 role: "vendor"
 *                 content: "Thank you for the feedback. I'll address this issue."
 *                 created_at: "2025-09-30T10:30:00Z"
 *                 updated_at: "2025-09-30T10:30:00Z"
 *               feedback_status: "replied"
 *       400:
 *         description: Validation error or feedback already has a reply
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "This feedback has already been replied to"
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       msg:
 *                         type: string
 *                       param:
 *                         type: string
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Feedback not found
 *       500:
 *         description: Server error
 */
router.post('/:id/feedback/:feedback_id/replies', [
  authenticateToken,
  check('content').notEmpty().withMessage('Reply content is required')
], TaskController.addFeedbackReply);

/**
 * @swagger
 * /api/tasks/{id}/feedback/{feedback_id}/replies:
 *   get:
 *     summary: Get replies for a feedback
 *     description: Retrieve all replies for a specific feedback/comment with pagination and filters.
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
 *         example: 1
 *       - in: path
 *         name: feedback_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Feedback/comment ID
 *         example: 5
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Results per page
 *         example: 10
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Filter by user who created reply
 *         example: 2
 *     responses:
 *       200:
 *         description: List of replies for the feedback with pagination
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 replies:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/FeedbackReply'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 15
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     pages:
 *                       type: integer
 *                       example: 2
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Feedback not found
 *       500:
 *         description: Server error
 */
router.get('/:id/feedback/:feedback_id/replies', authenticateToken, TaskController.getFeedbackReplies);
/**
 * @swagger
 * /api/tasks/{id}/daily-updates:
 *   get:
 *     summary: Get daily updates for a task
 *     description: Retrieve all daily updates for a specific task, ordered by date
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
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Results per page
 *         example: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *         example: 0
 *     responses:
 *       200:
 *         description: List of daily updates
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 daily_updates:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/DailyUpdate'
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.get('/:id/daily-updates', authenticateToken, TaskController.getDailyUpdates);

/**
 * @swagger
 * /api/tasks/{id}/daily-updates:
 *   post:
 *     summary: Add a daily update to a task
 *     description: Add a daily update to a task with optional status change. If status is provided, it will also update the task's status.
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
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DailyUpdateRequest'
 *     responses:
 *       201:
 *         description: Daily update added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Daily update added successfully"
 *                 daily_update:
 *                   $ref: '#/components/schemas/DailyUpdate'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       404:
 *         description: Task not found
 *       500:
 *         description: Server error
 */
router.post('/:id/daily-updates', [
  authenticateToken,
  check('content').notEmpty().withMessage('Daily update content is required'),
  check('status').optional().isIn(['new', 'in_progress', 'completed']).withMessage('Invalid status value')
], TaskController.addDailyUpdate);

/**
 * @swagger
 * /api/tasks/{id}/time:
 *   get:
 *     summary: Get time entries for a task
 *     description: Retrieve all time entries logged for a specific task
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
 *         example: 1
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
 *     description: Log time spent working on a specific task
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
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TrackTimeRequest'
 *     responses:
 *       201:
 *         description: Time tracked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Time tracked successfully"
 *                 time_entry:
 *                   $ref: '#/components/schemas/TimeEntry'
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
  check('hours').isNumeric().withMessage('Hours must be a number'),
  check('minutes').optional().isInt({ min: 0, max: 59 }).withMessage('Minutes must be between 0 and 59'),
  check('work_date').optional().isDate().withMessage('Work date must be a valid date')
], TaskController.trackTime);

export default router;