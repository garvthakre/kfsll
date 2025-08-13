import express from 'express';
import {
  SignupCompany,
  loginCompany,
  updateCompanyProfile,
  getACompany, getTurnover,
  
} from '../controllers/companyController.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Company
 *   description: Company account and profile APIs
 */

/**
 * @swagger
 * /company/signup:
 *   post:
 *     summary: Signup a company account
 *     tags: [Company]
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
 *                 description: Company name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Company email
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
 *                 description: Year the company was founded
 *               username:
 *                 type: string
 *                 description: Authorized User Name
 *               contact:
 *                 type: string
 *                 description: Contact number
 *               business_desc:
 *                 type: string
 *                 description: Company description
 *               website:
 *                 type: string
 *                 description: Company website URL
 *               turnover:
 *                 type: integer
 *                 description: Annual turnover id
 *               staff_strength:
 *                 type: string
 *                 description: Number of employees
 *               company_type_id:
 *                 type: integer
 *                 description: Type of Company (id for it)
 *               locations:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Company locations
 *               sub_categories:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Company sub-categories
 *     responses:
 *       201:
 *         description: Company account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                 company:
 *                   type: object
 *                 token:
 *                   type: string
 *       400:
 *         description: Bad request - validation errors
 *       409:
 *         description: Company already exists
 */
router.post('/signup', SignupCompany);

/**
 * @swagger
 * /company/login:
 *   post:
 *     summary: Login to company account
 *     tags: [Company]
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
 *                 format: email
 *                 description: Company email address
 *                 example: company@example.com
 *               password:
 *                 type: string
 *                 description: Password for the account
 *                 example: yourpassword123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Login successful
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     email:
 *                       type: string
 *                     companyId:
 *                       type: integer
 *                 company:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     gstin:
 *                       type: string
 *                     status:
 *                       type: string
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *       400:
 *         description: Bad request - missing email or password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Please provide email and password
 *       401:
 *         description: Unauthorized - invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Invalid email or password
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 msg:
 *                   type: string
 *                   example: Server error during login
 */
router.post('/login', loginCompany);


/**
 * @swagger
 * /company/profile/{id}:
 *   put:
 *     summary: Update company profile by ID
 *     tags: [Company]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID
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
 *                 type: integer
 *               website:
 *                 type: string
 *               turnover:
 *                 type: integer
 *               staff_strength:
 *                 type: string
 *               company_type_id:
 *                 type: integer
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
 *         description: Company not found
 *       500:
 *         description: Error updating company profile
 */
router.put('/profile/:id', updateCompanyProfile);

 

/**
 * @swagger
 * /company/getACompany/{id}:
 *   get:
 *     summary: Get another company public profile (legacy endpoint)
 *     tags: [Company]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Company found
 *       404:
 *         description: Not found
 */
router.get('/getACompany/:id', getACompany);

/**
 * @swagger
 * /company/getTurnover:
 *   get:
 *     summary: Get Turnover list
 *     tags: [Company]
 *     responses:
 *       200:
 *         description: Turnover list
 *       404:
 *         description: Turnover not found
 *       500:
 *         description: Error fetching turnovers
 */
router.get('/getTurnover', getTurnover);


export default router;