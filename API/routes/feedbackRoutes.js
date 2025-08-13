import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  submitFeedback,
  getFeedbackTypes,
  getAllFeedback,
  getFeedbackByCompany,
} from '../controllers/feedbackController.js';

const router = express.Router();

/**
 * @swagger
 * /feedback:
 *   post:
 *     summary: Submit user feedback
 *     tags: [Feedback]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - message
 *               - feedback_type
 *             properties:
 *               userid:
 *                 type: integer
 *                 description: User ID
 *               compid:
 *                 type: integer
 *                 description: Company ID
 *               message:
 *                 type: string
 *                 description: The feedback message
 *               feedback_type:
 *                 type: integer
 *                 description: ID of the feedback type from feedback_type_master table
 *     responses:
 *       201:
 *         description: Feedback submitted successfully
 *       400:
 *         description: Invalid input or feedback type
 *       401:
 *         description: Unauthorized
 */
router.post('/', submitFeedback);

/**
 * @swagger
 * /feedback/types:
 *   get:
 *     summary: Get all feedback types
 *     tags: [Feedback]
 *     responses:
 *       200:
 *         description: List of feedback types
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   type_name:
 *                     type: string
 */
router.get('/types', getFeedbackTypes);

/**
 * @swagger
 * /feedback/all:
 *   get:
 *     summary: Get all feedback (admin only)
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all feedback with type information
 */
router.get('/all', authMiddleware, getAllFeedback);

/**
 * @swagger
 * /feedback/company:
 *   get:
 *     summary: Get feedback for user's company
 *     tags: [Feedback]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of company feedback with type information
 */
router.get('/company', authMiddleware, getFeedbackByCompany);

export default router;