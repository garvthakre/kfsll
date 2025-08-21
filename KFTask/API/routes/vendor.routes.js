const express = require('express');
const router = express.Router();
const vendorController = require('../controllers/vendor.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Vendors
 *   description: Vendor management endpoints
 */

/**
 * @swagger
 * /api/vendors:
 *   get:
 *     summary: Get all vendors
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of vendors retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', authenticate, authorize(['admin']), vendorController.getAllVendors);

/**
 * @swagger
 * /api/vendors/{id}:
 *   get:
 *     summary: Get vendor by ID
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Vendor ID
 *     responses:
 *       200:
 *         description: Vendor details retrieved successfully
 *       404:
 *         description: Vendor not found
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/:id', authenticate, vendorController.getVendorById);

/**
 * @swagger
 * /api/vendors:
 *   post:
 *     summary: Create a new vendor
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - company_name
 *               - user_id
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: ID of the user associated with this vendor
 *               company_name:
 *                 type: string
 *                 description: Name of the vendor company
 *               contact_person:
 *                 type: string
 *                 description: Name of the primary contact person
 *               contact_email:
 *                 type: string
 *                 format: email
 *                 description: Email of the contact person
 *               contact_phone:
 *                 type: string
 *                 description: Phone number of the contact person
 *               address:
 *                 type: string
 *                 description: Physical address of the vendor
 *               service_type:
 *                 type: string
 *                 description: Type of service provided
 *               contract_start_date:
 *                 type: string
 *                 format: date
 *                 description: Start date of the contract
 *               contract_end_date:
 *                 type: string
 *                 format: date
 *                 description: End date of the contract
 *     responses:
 *       201:
 *         description: Vendor created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.post('/', authenticate, authorize(['admin']), vendorController.createVendor);

/**
 * @swagger
 * /api/vendors/{id}:
 *   put:
 *     summary: Update a vendor
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Vendor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               company_name:
 *                 type: string
 *               contact_person:
 *                 type: string
 *               contact_email:
 *                 type: string
 *               contact_phone:
 *                 type: string
 *               address:
 *                 type: string
 *               service_type:
 *                 type: string
 *               contract_start_date:
 *                 type: string
 *                 format: date
 *               contract_end_date:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Vendor updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vendor not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authenticate, authorize(['admin', 'vendor']), vendorController.updateVendor);

/**
 * @swagger
 * /api/vendors/{id}:
 *   delete:
 *     summary: Delete a vendor
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Vendor ID
 *     responses:
 *       200:
 *         description: Vendor deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vendor not found
 *       500:
 *         description: Server error
 */
router.delete('/:id', authenticate, authorize(['admin']), vendorController.deleteVendor);

/**
 * @swagger
 * /api/vendors/{id}/consultants:
 *   get:
 *     summary: Get all consultants for a vendor
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Vendor ID
 *     responses:
 *       200:
 *         description: List of consultants retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vendor not found
 *       500:
 *         description: Server error
 */
router.get('/:id/consultants', authenticate, vendorController.getVendorConsultants);

/**
 * @swagger
 * /api/vendors/{id}/projects:
 *   get:
 *     summary: Get all projects for a vendor
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Vendor ID
 *     responses:
 *       200:
 *         description: List of projects retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vendor not found
 *       500:
 *         description: Server error
 */
router.get('/:id/projects', authenticate, vendorController.getVendorProjects);

/**
 * @swagger
 * /api/vendors/{id}/tasks:
 *   get:
 *     summary: Get all tasks assigned to a vendor's consultants
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Vendor ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by task status
 *     responses:
 *       200:
 *         description: List of tasks retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vendor not found
 *       500:
 *         description: Server error
 */
router.get('/:id/tasks', authenticate, vendorController.getVendorTasks);

/**
 * @swagger
 * /api/vendors/consultants/{consultantId}/tasks:
 *   post:
 *     summary: Assign a task to a consultant
 *     tags: [Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: consultantId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Consultant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - task_id
 *             properties:
 *               task_id:
 *                 type: integer
 *                 description: ID of the task to assign
 *     responses:
 *       201:
 *         description: Task assigned successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Consultant not found
 *       500:
 *         description: Server error
 */
router.post('/consultants/:consultantId/tasks', authenticate, authorize(['admin', 'vendor']), vendorController.assignTaskToConsultant);

export default router;