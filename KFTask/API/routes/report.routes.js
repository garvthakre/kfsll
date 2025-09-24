import express from 'express';
const router = express.Router();

import {getProjectStatusReport,getTaskReport,getUserLogsReport,getUserPerformanceReport,getVendorPerformanceReport,exportReport} from '../controllers/report.controller.js';
import { authenticateToken, authorize } from '../middleware/auth.middleware.js'

/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Reporting endpoints
 */

/**
 * @swagger
 * /api/reports/tasks:
 *   get:
 *     summary: Get task report  
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *         description: Filter by project ID
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by task status
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
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
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Task report retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current_page:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 *                     total_items:
 *                       type: integer
 *                     items_per_page:
 *                       type: integer
 *                     has_next:
 *                       type: boolean
 *                     has_previous:
 *                       type: boolean
 *                 filters:
 *                   type: object
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/tasks', authenticateToken, getTaskReport);

 
/**
 * @swagger
 * /api/reports/user-performance:
 *   get:
 *     summary: Get all tasks created by the authenticated user  
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Filter by project ID (0 for all projects)
 *       - in: query
 *         name: assignee_id
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Filter by assignee ID (0 for all assignees)
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           default: "0"
 *         description: Filter by status (0 for all statuses)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of tasks per page (max 100)
 *     responses:
 *       200:
 *         description: List of created tasks in simplified format
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     tasks:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           task_title:
 *                             type: string
 *                             example: "Task-1"
 *                           project_title:
 *                             type: string
 *                             example: "Project-1"
 *                           assigned_user:
 *                             type: string
 *                             example: "John Doe"
 *                           created_on:
 *                             type: string
 *                             example: "10-Jan-2025"
 *                           completion_date:
 *                             type: string
 *                             example: "12-Jan-2025"
 *                           status:
 *                             type: string
 *                             example: "Completed"
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                         hasNextPage:
 *                           type: boolean
 *                         hasPrevPage:
 *                           type: boolean
 *                     filters_applied:
 *                       type: object
 *                       properties:
 *                         project_id:
 *                           type: integer
 *                         assignee_id:
 *                           type: integer
 *                         status:
 *                           type: string
 *       401:
 *         description: Not authenticated
 *       500:
 *         description: Server error
 */
router.get(
  '/user-performance',
  authenticateToken,
  authorize(['admin', 'manager', 'vendor']), 
  getUserPerformanceReport
);
/**
 * @swagger
 * /api/reports/project-status:
 *   get:
 *     summary: Get project status report 
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: project_id
 *         schema:
 *           type: integer
 *         description: Filter by project ID
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
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Project status report retrieved successfully with pagination
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/project-status', authenticateToken, getProjectStatusReport);

/**
 * @swagger
 * /api/reports/vendor-performance:
 *   get:
 *     summary: Get vendor performance report with filtering and pagination
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: vendor_id
 *         schema:
 *           type: integer
 *         description: Filter by vendor ID
 *       - in: query
 *         name: consultant_id
 *         schema:
 *           type: integer
 *         description: Filter by consultant ID
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date (YYYY-MM-DD)
 *       - in: query
 *         name: task_status
 *         schema:
 *           type: string
 *         description: Filter by task status (comma-separated for multiple statuses, e.g., "completed,in_progress")
 *         example: "completed,in_progress,pending"
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
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Vendor performance report retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       vendor_id:
 *                         type: integer
 *                       company_name:
 *                         type: string
 *                       total_projects:
 *                         type: integer
 *                       total_consultants:
 *                         type: integer
 *                       total_tasks:
 *                         type: integer
 *                       completed_tasks:
 *                         type: integer
 *                       in_progress_tasks:
 *                         type: integer
 *                       pending_tasks:
 *                         type: integer
 *                       overdue_tasks:
 *                         type: integer
 *                       completion_rate:
 *                         type: number
 *                       avg_completion_days:
 *                         type: number
 *                       avg_days_before_due:
 *                         type: number
 *                       consultants:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             user_id:
 *                               type: integer
 *                             user_name:
 *                               type: string
 *                             email:
 *                               type: string
 *                             specialization:
 *                               type: string
 *                             total_tasks:
 *                               type: integer
 *                             completed_tasks:
 *                               type: integer
 *                             in_progress_tasks:
 *                               type: integer
 *                             pending_tasks:
 *                               type: integer
 *                             overdue_tasks:
 *                               type: integer
 *                             completion_rate:
 *                               type: number
 *                             avg_completion_days:
 *                               type: number
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     current_page:
 *                       type: integer
 *                     total_pages:
 *                       type: integer
 *                     total_items:
 *                       type: integer
 *                     items_per_page:
 *                       type: integer
 *                     has_next:
 *                       type: boolean
 *                     has_previous:
 *                       type: boolean
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total_vendors:
 *                       type: integer
 *                     total_consultants:
 *                       type: integer
 *                     total_tasks:
 *                       type: integer
 *                     total_completed_tasks:
 *                       type: integer
 *                     total_overdue_tasks:
 *                       type: integer
 *                     overall_completion_rate:
 *                       type: number
 *                 filters:
 *                   type: object
 *                 generated_at:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 * 
 */
router.get('/vendor-performance', authenticateToken, authorize(['admin','vendor']), getVendorPerformanceReport);

/**
 * @swagger
 * /api/reports/export:
 *   post:
 *     summary: Export report to CSV/Excel
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - report_type
 *             properties:
 *               report_type:
 *                 type: string
 *                 description: Type of report to export (tasks, user-performance, project-status, vendor-performance)
 *               filters:
 *                 type: object
 *                 description: Report filters
 *               format:
 *                 type: string
 *                 description: Export format (csv or xlsx)
 *     responses:
 *       200:
 *         description: Report exported successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/export', authenticateToken, exportReport);

/**
 * @swagger
 * /api/reports/user-logs:
 *   get:
 *     summary: Get employee user activity logs report
 *     tags: [Reports]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type
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
 *           default: 20
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: Employee user logs retrieved successfully with pagination
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       500:
 *         description: Server error
 */
router.get(
  '/user-logs', 
  authenticateToken, 
  authorize(['admin','vendor']), 
  getUserLogsReport
);

export default router;