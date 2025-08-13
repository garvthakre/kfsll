import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import {
  getPlans,
  saveSubscription,
  getInvoices,
  getInvoiceById,
} from '../controllers/subscriptionController.js';

const router = express.Router();

/**
 * @swagger
 * /subscriptions/plans:
 *   get:
 *     summary: Get all available subscription plans
 *     tags: [Subscriptions]
 *     responses:
 *       200:
 *         description: List of plans
 */
router.get('/plans', getPlans);

/**
 * @swagger
 * /subscriptions:
 *   post:
 *     summary: Purchase a subscription plan
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               plan_id:
 *                 type: integer
 *               start_date:
 *                 type: string
 *                 format: date
 *               end_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Subscription created
 */
router.post('/', authMiddleware, saveSubscription);

/**
 * @swagger
 * /subscriptions/invoices:
 *   get:
 *     summary: Get all invoices for user/company
 *     tags: [Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of invoices
 */
router.get('/invoices', authMiddleware, getInvoices);

/**
 * @swagger
 * /subscriptions/invoices/{id}:
 *   get:
 *     summary: Get invoice by ID
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Invoice details
 */
router.get('/invoices/:id', authMiddleware, getInvoiceById);

export default router;