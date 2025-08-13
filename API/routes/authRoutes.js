import express from 'express';
import { register, registernew, login,activateUser,resetPassword } from '../controllers/authController.js';
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication endpoints
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: secret123
 *               companyId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: User already exists
 */
router.post('/register', register);

/**
 * @swagger
 * /auth/registernew:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cname
 *               - uname
 *               - email
 *               - catgid
 *               - gstin
 *               - password
 *             properties:
 *               cname:
 *                 type: string
 *                 example: ABC Company
 *               uname:
 *                 type: string
 *                 example: Mr. Ram
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: secret123
 *               catgid:
 *                 type: integer
 *                 example: 1
 *               gstin:
 *                 type: string
 *                 example: 07ABCDE1234F2Z5
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: User already exists
 *       401:
 *         description: Company already exists. Duplicate Company Name or GSTIN Number.
 */
router.post('/registernew', registernew);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: secret123
 *     responses:
 *       200:
 *         description: Successful login
 *       401:
 *         description: Incorrect password
 *       404:
 *         description: User not found
 */
router.post('/login', login);

/**
 * @swagger
 * /auth/activate:
 *   post:
 *     summary: Activate user via token by admin
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: User activated successfully
 *       400:
 *         description: Invalid token or user
 */
router.post('/activate', activateUser);

/**
 * @swagger
 * /auth/resetPassword:
 *   post:
 *     summary: Send password reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reset email sent
 *       404:
 *         description: User not found
 */
router.post('/resetPassword', resetPassword);

export default router;
