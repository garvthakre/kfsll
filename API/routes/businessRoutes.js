import express from 'express';
import {
  SignupBusiness,
  updateBusinessProfile,
  getBusinessById,
} from '../controllers/businessController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Business
 *   description: Business account and profile APIs
 */

/**
 * @swagger
 * /business/signup:
 *   post:
 *     summary: Signup a business account
 *     tags: [Business]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *               - gstin
 *               - primary_category
 *             properties:
 *               name:
 *                 type: string
 *                 description: Business name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Business email
 *               password:
 *                 type: string
 *                 description: Password for the account
 *               gstin:
 *                 type: string
 *                 description: GST Identification Number
 *               primary_category:
 *                 type: string
 *                 description: Primary business category
 *               founding_year:
 *                 type: integer
 *                 description: Year the business was founded
 *               contact:
 *                 type: string
 *                 description: Contact number
 *               business_desc:
 *                 type: string
 *                 description: Business description
 *               website:
 *                 type: string
 *                 description: Business website URL
 *               turnover:
 *                 type: string
 *                 description: Annual turnover range
 *               staff_strength:
 *                 type: string
 *                 description: Number of employees
 *               company_type:
 *                 type: string
 *                 description: Type of company (Private, Public, etc.)
 *               locations:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Business locations
 *               sub_categories:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Business sub-categories
 *     responses:
 *       201:
 *         description: Business account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                 business:
 *                   type: object
 *                 token:
 *                   type: string
 *       400:
 *         description: Bad request - validation errors
 *       409:
 *         description: Business already exists
 */
router.post('/signup', SignupBusiness);

/**
 * @swagger
 * /business/profile/{id}:
 *   put:
 *     summary: Update business profile by ID
 *     tags: [Business]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Business ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               founding_year:
 *                 type: integer
 *               contact:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               business_desc:
 *                 type: string
 *               primary_category:
 *                 type: string
 *               gstin:
 *                 type: string
 *               website:
 *                 type: string
 *               turnover:
 *                 type: string
 *               staff_strength:
 *                 type: string
 *               company_type:
 *                 type: string
 *               sub_categories:
 *                 type: array
 *                 items:
 *                   type: string
 *               locations:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       404:
 *         description: Business not found
 *       500:
 *         description: Server error
 */
router.put('/profile/:id', updateBusinessProfile);

/**
 * @swagger
 * /business/{id}:
 *   get:
 *     summary: Get business profile by ID
 *     tags: [Business]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Business ID
 *     responses:
 *       200:
 *         description: Business found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 user_id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 founding_year:
 *                   type: integer
 *                 status:
 *                   type: string
 *                 contact:
 *                   type: string
 *                 email:
 *                   type: string
 *                 business_desc:
 *                   type: string
 *                 primary_category:
 *                   type: string
 *                 gstin:
 *                   type: string
 *                 website:
 *                   type: string
 *                 turnover:
 *                   type: string
 *                 staff_strength:
 *                   type: string
 *                 company_type:
 *                   type: string
 *                 sub_categories:
 *                   type: array
 *                   items:
 *                     type: string
 *                 locations:
 *                   type: array
 *                   items:
 *                     type: string
 *                 created_at:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Business not found
 *       500:
 *         description: Server error
 */
router.get('/:id', getBusinessById);

export default router;