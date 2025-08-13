import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  saveCompProject,
  getCompProjects,
  getACompProject,
  updateCompProject,
  deleteCompProject,
} from '../controllers/projectController.js';

const router = express.Router();

/**
 * @swagger
 * /project/saveCompProject:
 *   post:
 *     summary: Create a new company project
 *     tags: [Project]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               project_name:
 *                 type: string
 *               client_type:
 *                 type: string
 *               value:
 *                 type: number
 *               details:
 *                 type: string
 *               project_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Project created
 */
router.post('/saveCompProject', authMiddleware, saveCompProject);

/**
 * @swagger
 * /project/getCompProject/{compid}:
 *   get:
 *     summary: Get all company projects
 *     tags: [Project]
 *     parameters:
 *       - in: path
 *         name: compid
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of projects
 */
router.get('/getCompProject/:compid', getCompProjects);

/**
 * @swagger
 * /project/getACompProject/{id}:
 *   get:
 *     summary: Get a specific project by ID
 *     tags: [Project]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Project details
 */
router.get('/getACompProject/:id', getACompProject);

/**
 * @swagger
 * /project/updateCompProject:
 *   put:
 *     summary: Update a company project
 *     tags: [Project]
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
 *               project_name:
 *                 type: string
 *               client_type:
 *                 type: string
 *               value:
 *                 type: number
 *               details:
 *                 type: string
 *               project_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Project updated
 */
router.put('/updateCompProject', authMiddleware, updateCompProject);

/**
 * @swagger
 * /project/deleteCompProject/{id}:
 *   delete:
 *     summary: Delete a project by ID
 *     tags: [Project]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Project deleted
 */
router.delete('/deleteCompProject/:id', authMiddleware, deleteCompProject);

export default router;