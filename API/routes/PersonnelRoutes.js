import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  saveCompPerson,
  getCompPersons,
  getACompPerson,
  updateCompPerson,
  deleteCompPerson,
} from '../controllers/personnelController.js';

const router = express.Router();

/**
 * @swagger
 * /personnel/saveCompPerson:
 *   post:
 *     summary: Create a new personnel
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
 *               type:
 *                 type: string
 *               name:
 *                 type: string
 *               department:
 *                 type: string
 *               designation:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Personnel created
 */
router.post('/saveCompPerson', authMiddleware, saveCompPerson);

/**
 * @swagger
 * /personnel/getCompPerson/{compid}:
 *   get:
 *     summary: Get all personnel for a company
 *     tags: [Personnel]
 *     parameters:
 *       - in: path
 *         name: compid
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of personnel
 */
router.get('/getCompPerson/:compid', getCompPersons);

/**
 * @swagger
 * /personnel/getACompPerson/{id}:
 *   get:
 *     summary: Get a single personnel by ID
 *     tags: [Personnel]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Personnel details
 */
router.get('/getACompPerson/:id', getACompPerson);

/**
 * @swagger
 * /personnel/updateCompPerson:
 *   put:
 *     summary: Update a company personnel
 *     tags: [Personnel]
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
 *               type:
 *                 type: string
 *               name:
 *                 type: string
 *               department:
 *                 type: string
 *               designation:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Personnel updated
 */
router.put('/updateCompPerson', authMiddleware, updateCompPerson);

/**
 * @swagger
 * /personnel/deleteCompPerson/{id}:
 *   delete:
 *     summary: Delete a personnel by ID
 *     tags: [Personnel]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Personnel deleted
 */
router.delete('/deleteCompPerson/:id', authMiddleware, deleteCompPerson);

export default router;