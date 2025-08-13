import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  listConnections,
  sendConnectionRequest,
  takeConnectionAction,
} from '../controllers/connectionController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Connections
 *   description: Connection endpoints
 */


/**
 * @swagger
 * /connection/getconnections:
 *   post:
 *     summary: List connection requests for logged-in user
 *     tags: [Connections]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               receiver_company_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: List of connection requests
 */
router.post('/getconnections', listConnections);

/**
 * @swagger
 * /connection/sendrequest:
 *   post:
 *     summary: Send a connection request
 *     tags: [Connections]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sender_company_id:
 *                 type: integer
 *               receiver_company_id:
 *                 type: integer
 *               message:
 *                 type: string
 *     responses:
 *       201:
 *         description: Connection request sent
 */
router.post('/sendrequest', sendConnectionRequest);

/**
 * @swagger
 * /connection/getconnections/{id}:
 *   put:
 *     summary: Accept or reject a connection request
 *     tags: [Connections]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               action:
 *                 type: string
 *                 enum: [accepted, rejected]
 *               replmessage:
 *                 type: string
 *     responses:
 *       200:
 *         description: Connection status updated
 */
router.put('/getconnections/:id', takeConnectionAction);

export default router;