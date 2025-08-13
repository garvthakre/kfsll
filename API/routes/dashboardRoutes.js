import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { getConnections, getMessages, getArticles } from '../controllers/dashboardController.js';
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard endpoints
 */

/**
 * @swagger
 * /dashboard/getconnection:
 *   post:
 *     summary: Get list of Connection
 *     tags: [Dashboard]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - compid
 *             properties:
 *               compid:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: List of Connection
 *       500:
 *         description: Error retrieving connections
 */
router.post('/getconnection', getConnections);

/**
 * @swagger
 * /dashboard/getmessages:
 *   post:
 *     summary: Get Message List
 *     tags: [Dashboard]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userid
 *             properties:
 *               userid:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: List of Messages
 *       500:
 *         description: Error retrieving message
 */
router.post('/getmessages', getMessages);

/**
 * @swagger
 * /dashboard/getarticles:
 *   post:
 *     summary: Get list of Articles
 *     tags: [Dashboard]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userid
 *             properties:
 *               userid:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: List of Articles
 *       500:
 *         description: Error retrieving articles
 */
router.post('/getarticles', getArticles);

export default router;
