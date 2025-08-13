import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { searchBusiness, compDet, compSum } from '../controllers/searchController.js';

const router = express.Router();

/**
 * @swagger
 * /search/business:
 *   post:
 *     summary: Search businesses by category, location, etc.
 *     tags: [Search]
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
 *               category:
 *                 type: string
 *               location:
 *                 type: string
 *               businesstype:
 *                 type: string
 *     responses:
 *       200:
 *         description: List of matching companies
 */
router.post('/business', searchBusiness);

/**
 * @swagger
 * /search/compdet:
 *   post:
 *     summary: Get Company details of the searched company only when the status is Connected
 *     tags: [Search]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               compid:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Company details
 */
router.post('/compdet', compDet);


/**
 * @swagger
 * /search/compsum:
 *   post:
 *     summary: Get Company summary of the searched company only when the status is Not Connected
 *     tags: [Search]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               compid:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Company Summary
 */
router.post('/compsum', compSum);

export default router;