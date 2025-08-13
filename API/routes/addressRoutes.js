import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  saveCompAddress,
  getCompAddresses,
  getACompAddress,
  updateCompAddress,
  deleteCompAddress,
} from '../controllers/addressController.js';

const router = express.Router();
/**
 * @swagger
 * /address/saveCompAddress:
 *   post:
 *     summary: Create a new company address
 *     tags: [Company]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               compid:
 *                 type: integer
 *               address_type_id:
 *                 type: integer
 *               country_iso:
 *                 type: string
 *               state_id:
 *                 type: integer
 *               address_line:
 *                 type: string
 *     responses:
 *       201:
 *         description: Address created
 */
router.post('/saveCompAddress', saveCompAddress);

/**
 * @swagger
 * /address/getCompAddress/{compid}:
 *   post:
 *     summary: Get all company addresses by company ID
 *     tags: [Address]
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
 *         description: List of addresses
 */
router.post('/getCompAddress/:compid', getCompAddresses);

/**
 * @swagger
 * /address/getCompAAddress/{id}:
 *   post:
 *     summary: Get a single company address by ID
 *     tags: [Address]
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
 *         description: Address details
 */
router.post('/getCompAAddress/:id', getACompAddress);

/**
 * @swagger
 * /address/updateCompAddress:
 *   put:
 *     summary: Update a company address
 *     tags: [Address]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: integer
 *               address_type_id:
 *                 type: integer
 *               address_line:
 *                 type: string
 *               city:
 *                 type: string
 *               state_id:
 *                 type: integer
 *               country_iso:
 *                 type: string
 *               pincode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Address updated
 */
router.put('/updateCompAddress', updateCompAddress);

/**
 * @swagger
 * /address/deleteCompAddress/{id}:
 *   delete:
 *     summary: Delete a company address by ID
 *     tags: [Address]
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
 *         description: Address deleted
 */
router.delete('/deleteCompAddress/:id', deleteCompAddress);

export default router;