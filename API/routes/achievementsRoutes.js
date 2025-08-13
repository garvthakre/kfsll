import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  saveCompAchievement,
  getCompAchievements,
  getACompAchievement,
  updateCompAchievement,
  deleteCompAchievement,
} from '../controllers/achievementController.js';

const router = express.Router();

/**
 * @swagger
 * /achievement/saveCompAchievement:
 *   post:
 *     summary: Create a new company achievement
 *     tags: [Company]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               award_type:
 *                 type: string
 *               award_name:
 *                 type: string
 *               authority:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Achievement created
 */
router.post('/saveCompAchievement', authMiddleware, saveCompAchievement);

/**
 * @swagger
 * /achievement/getCompAchievement/{compid}:
 *   get:
 *     summary: Get all achievements of a company
 *     tags: [Achievement]
 *     parameters:
 *       - in: path
 *         name: compid
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of achievements
 */
router.get('/getCompAchievement/:compid', getCompAchievements);

/**
 * @swagger
 * /achievement/getACompAchievement/{id}:
 *   get:
 *     summary: Get a specific achievement by ID
 *     tags: [Achievement]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Achievement details
 */
router.get('/getACompAchievement/:id', getACompAchievement);

/**
 * @swagger
 * /achievement/updateCompAchievement:
 *   put:
 *     summary: Update a company achievement
 *     tags: [Achievement]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               award_type:
 *                 type: string
 *               award_name:
 *                 type: string
 *               authority:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Achievement updated
 */
router.put('/updateCompAchievement', authMiddleware, updateCompAchievement);

/**
 * @swagger
 * /achievement/deleteCompAchievement/{id}:
 *   delete:
 *     summary: Delete a company achievement by ID
 *     tags: [Achievement]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Achievement deleted
 */
router.delete('/deleteCompAchievement/:id', authMiddleware, deleteCompAchievement);

export default router;