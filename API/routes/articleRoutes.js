import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { saveArticle, getAllArticles, getSingleArticle } from '../controllers/articleController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Articles
 *   description: Article endpoints
 */

/**
 * @swagger
 * /article/getallarticles:
 *   post:
 *     summary: Get all articles
 *     tags: [Articles]
 *     responses:
 *       200:
 *         description: List of articles
 */
router.post('/getallarticles', getAllArticles);

/**
 * @swagger
 * /article/getarticles:
 *   post:
 *     summary: Get a single article by ID
 *     tags: [Articles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       200:
 *         description: Article found
 *       404:
 *         description: Article not found
 */
router.post('/getarticles', getSingleArticle);

/**
 * @swagger
 * /article/savearticles:
 *   post:
 *     summary: Create a new article
 *     tags: [Articles]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userid:
 *                 type: integer
 *               compid:
 *                 type: integer
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               categoryid:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Article created
 */
router.post('/savearticles', saveArticle);

export default router;