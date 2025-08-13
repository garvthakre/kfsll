import express from 'express';
import { updateProfile, getProfile } from '../controllers/userController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * /user/updateProfile:
 *   put:
 *     summary: Update user/company profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               business_desc:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 *       400:
 *         description: Invalid data
 */
router.put('/updateProfile', authMiddleware, updateProfile);

/**
 * @swagger
 * /user/getProfile:
 *   get:
 *     summary: Get user and company profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile fetched
 *       401:
 *         description: Unauthorized
 */
router.get('/getProfile', authMiddleware, getProfile);

export default router;