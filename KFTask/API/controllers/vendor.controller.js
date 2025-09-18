// const db = require('../config/db');
// const vendorUtils = require('../utils/vendor.utils');
// const { logUserAction } = require('../utils/audit.utils');
import db from '../config/db.js';
import { 
  isUserVendor, 
  getVendorIdByUserId, 
  getVendorConsultantIds,
  canVendorAccessProject,
  getVendorTaskStats,
  isConsultantFromVendor
} from '../utils/vendor.utils.js';
import { logUserAction } from '../utils/audit.utils.js';

/**
 * Get all vendors with pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const getAllVendors = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    // Get vendors with user information
    const vendors = await db.query(
      `SELECT v.*, u.first_name, u.last_name, u.email, u.status
       FROM vendors v
       JOIN users u ON v.user_id = u.id
       ORDER BY v.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    
    // Count total vendors for pagination
    const countResult = await db.query('SELECT COUNT(*) FROM vendors');
    const totalVendors = parseInt(countResult.rows[0].count);
    
    res.status(200).json({
      success: true,
      data: vendors.rows,
      pagination: {
        total: totalVendors,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(totalVendors / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};
/**
 * Get all vendors' IDs and company names (no pagination, no filters)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const getAllVendorIdsAndNames = async (req, res, next) => {
  try {
    const result = await db.query(`
      SELECT id, company_name AS name
      FROM vendors
      ORDER BY id ASC
    `);

    res.status(200).json({
      success: true,
      vendors: result.rows
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Get consultants working for the current vendor user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const getMyConsultants = async (req, res, next) => {
  try {
    const vendorUserId = req.user.id;

    // Verify vendor exists for the logged-in user
    const vendor = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [vendorUserId]
    );

    if (vendor.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor profile not found for the logged-in user'
      });
    }

    // Same permission logic (skip since user is self)
    // For admin or vendor accessing own consultants

    // Fetch consultants working for this vendor
    const consultants = await db.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.status, u.department, u.position, u.designation, u.type, u.working_type
       FROM users u
       WHERE u.role = 'consultant' AND u.working_for = $1
       ORDER BY u.first_name, u.last_name`,
      [vendorUserId]
    );

    res.status(200).json({
      success: true,
      data: consultants.rows
    });
  } catch (error) {
    next(error);
  }
};


/**
 * Get vendor by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const getVendorById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if requesting user has permission
    if (req.user.role !== 'admin' && req.user.id !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to access this vendor\'s information'
      });
    }
    
    // Get vendor with user information
    const vendor = await db.query(
      `SELECT v.*, u.first_name, u.last_name, u.email, u.status
       FROM vendors v
       JOIN users u ON v.user_id = u.id
       WHERE v.id = $1`,
      [id]
    );
    
    if (vendor.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: vendor.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new vendor
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const createVendor = async (req, res, next) => {
  try {
    const {
      user_id,
      company_name,
      contact_person,
      contact_email,
      contact_phone,
      address,
      service_type,
      contract_start_date,
      contract_end_date
    } = req.body;
    
    // Validate required fields
    if (!company_name || !user_id) {
      return res.status(400).json({
        success: false,
        message: 'Company name and user ID are required'
      });
    }
    
    // Check if user exists and has role 'vendor'
    const user = await db.query(
      'SELECT * FROM users WHERE id = $1',
      [user_id]
    );
    
    if (user.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check if vendor already exists for this user
    const existingVendor = await db.query(
      'SELECT * FROM vendors WHERE user_id = $1',
      [user_id]
    );
    
    if (existingVendor.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'A vendor profile already exists for this user'
      });
    }
    
    // Create vendor
    const newVendor = await db.query(
      `INSERT INTO vendors (
        user_id, 
        company_name, 
        contact_person, 
        contact_email, 
        contact_phone, 
        address, 
        service_type, 
        contract_start_date, 
        contract_end_date
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
      RETURNING *`,
      [
        user_id,
        company_name,
        contact_person || null,
        contact_email || null,
        contact_phone || null,
        address || null,
        service_type || null,
        contract_start_date || null,
        contract_end_date || null
      ]
    );
    
    // If user doesn't have vendor role, update it
    if (user.rows[0].role !== 'vendor') {
      await db.query(
        'UPDATE users SET role = $1 WHERE id = $2',
        ['vendor', user_id]
      );
    }
    
    // Log the action
    await logUserAction(req.user.id, 'Created vendor profile', `Created vendor profile for user ID: ${user_id}, Company: ${company_name}`);
    
    res.status(201).json({
      success: true,
      data: newVendor.rows[0],
      message: 'Vendor created successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a vendor
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const updateVendor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      company_name,
      contact_person,
      contact_email,
      contact_phone,
      address,
      service_type,
      contract_start_date,
      contract_end_date
    } = req.body;
    
    // Check if vendor exists
    const vendor = await db.query(
      'SELECT * FROM vendors WHERE id = $1',
      [id]
    );
    
    if (vendor.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    // Check if requesting user has permission
    if (req.user.role !== 'admin' && vendor.rows[0].user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this vendor'
      });
    }
    
    // Update vendor
    const updatedVendor = await db.query(
      `UPDATE vendors SET
        company_name = COALESCE($1, company_name),
        contact_person = COALESCE($2, contact_person),
        contact_email = COALESCE($3, contact_email),
        contact_phone = COALESCE($4, contact_phone),
        address = COALESCE($5, address),
        service_type = COALESCE($6, service_type),
        contract_start_date = COALESCE($7, contract_start_date),
        contract_end_date = COALESCE($8, contract_end_date)
      WHERE id = $9
      RETURNING *`,
      [
        company_name || null,
        contact_person || null,
        contact_email || null,
        contact_phone || null,
        address || null,
        service_type || null,
        contract_start_date || null,
        contract_end_date || null,
        id
      ]
    );
    
    // Log the action
    await logUserAction(req.user.id, 'Updated vendor profile', `Updated vendor profile ID: ${id}`);
    
    res.status(200).json({
      success: true,
      data: updatedVendor.rows[0],
      message: 'Vendor updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a vendor
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const deleteVendor = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get vendor details before deletion for logging
    const vendor = await db.query(
      'SELECT * FROM vendors WHERE id = $1',
      [id]
    );
    
    if (vendor.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    // Delete vendor (foreign key constraint will handle associated records)
    await db.query(
      'DELETE FROM vendors WHERE id = $1',
      [id]
    );
    
    // Log the action
    await logUserAction(req.user.id, 'Deleted vendor profile', `Deleted vendor profile ID: ${id}, Company: ${vendor.rows[0].company_name}`);
    
    res.status(200).json({
      success: true,
      message: 'Vendor deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all consultants for a vendor
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const getVendorConsultants = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if vendor exists
    const vendor = await db.query(
      'SELECT * FROM vendors WHERE id = $1',
      [id]
    );
    
    if (vendor.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    // Check permissions if not admin
    if (req.user.role !== 'admin') {
      // If vendor role, check if the user is associated with this vendor
      if (req.user.role === 'vendor' && vendor.rows[0].user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view these consultants'
        });
      }
    }
    
    // Get consultants for this vendor
    // We identify consultants working for this vendor through their association in the users table
    // by checking which users are working for this vendor
    const consultants = await db.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.status, u.department, u.position, u.designation, u.type, u.working_type
       FROM users u
       WHERE u.role = 'consultant' AND u.working_for = $1
       ORDER BY u.first_name, u.last_name`,
      [id]  
    );
    
    res.status(200).json({
      success: true,
      data: consultants.rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all projects for a vendor
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const getVendorProjects = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Check if vendor exists
    const vendor = await db.query(
      'SELECT * FROM vendors WHERE id = $1',
      [id]
    );
    
    if (vendor.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    // Check permissions if not admin
    if (req.user.role !== 'admin') {
      // If vendor role, check if the user is associated with this vendor
      if (req.user.role === 'vendor' && vendor.rows[0].user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view these projects'
        });
      }
    }
    
    // Get projects associated with this vendor
    // Projects are associated with vendors through the project type field
    const projects = await db.query(
      `SELECT p.*
       FROM projects p
       WHERE p.project_type LIKE $1
       ORDER BY p.start_date DESC`,
      [`%Vendor - ${vendor.rows[0].company_name}%`]
    );
    
    res.status(200).json({
      success: true,
      data: projects.rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all tasks assigned to a vendor's consultants
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const getVendorTasks = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.query;
    
    // Check if vendor exists
    const vendor = await db.query(
      'SELECT * FROM vendors WHERE id = $1',
      [id]
    );
    
    if (vendor.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Vendor not found'
      });
    }
    
    // Check permissions if not admin
    if (req.user.role !== 'admin') {
      // If vendor role, check if the user is associated with this vendor
      if (req.user.role === 'vendor' && vendor.rows[0].user_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view these tasks'
        });
      }
    }
    
    // Create base query
    let query = `
      SELECT t.*, p.title as project_name, u.first_name, u.last_name
      FROM tasks t
      JOIN task_assignments ta ON t.id = ta.task_id
      JOIN users u ON ta.user_id = u.id
      JOIN projects p ON t.project_id = p.id
      WHERE u.working_for = $1
    `;
    
    const queryParams = [vendor.rows[0].user_id];
    
    // Add status filter if provided
    if (status) {
      query += ` AND t.status = $2`;
      queryParams.push(status);
    }
    
    query += ` ORDER BY t.due_date ASC`;
    
    const tasks = await db.query(query, queryParams);
    
    res.status(200).json({
      success: true,
      data: tasks.rows
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Assign a task to a consultant
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const assignTaskToConsultant = async (req, res, next) => {
  try {
    const { consultantId } = req.params;
    const { task_id } = req.body;
    
    if (!task_id) {
      return res.status(400).json({
        success: false,
        message: 'Task ID is required'
      });
    }
    
    // Check if consultant exists and is active
  const consultant = await db.query(
      `SELECT u.id, u.first_name, u.last_name, u.status, u.working_for, u.role
       FROM users u
       WHERE u.id = $1 AND u.role = 'consultant'`,
      [consultantId]
    );
    
    if (consultant.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Consultant not found'
      });
    }
    
    if (consultant.rows[0].status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Cannot assign task to inactive consultant'
      });
    }
    
    // Check if task exists
    const task = await db.query(
      'SELECT * FROM tasks WHERE id = $1',
      [task_id]
    );
    
    if (task.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Check permissions if not admin
    if (req.user.role !== 'admin') {
      // If vendor role, check if the consultant works for this vendor
      if (req.user.role === 'vendor') {
        // Get vendor's user_id
        const vendor = await db.query(
          'SELECT * FROM vendors WHERE user_id = $1',
          [req.user.id]
        );
        
        if (vendor.rows.length === 0 || consultant.rows[0].working_for !== req.user.id) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to assign tasks to this consultant'
          });
        }
      } else {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to assign tasks'
        });
      }
    }
    
    // Check if task is already assigned to this consultant
    const existingAssignment = await db.query(
      'SELECT * FROM task_assignments WHERE task_id = $1 AND user_id = $2',
      [task_id, consultantId]
    );
    
    if (existingAssignment.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Task is already assigned to this consultant'
      });
    }
    
    // Create task assignment
    const assignment = await db.query(
      `INSERT INTO task_assignments (
        task_id, 
        user_id, 
        assigned_by
      ) 
      VALUES ($1, $2, $3) 
      RETURNING *`,
      [
        task_id,
        consultantId,
        req.user.id
      ]
    );
    
    // Log the action
    await logUserAction(
      req.user.id, 
      'Task assigned', 
      `Task ID: ${task_id} assigned to ${consultant.rows[0].first_name} ${consultant.rows[0].last_name}`
    );
    
    res.status(201).json({
      success: true,
      data: assignment.rows[0],
      message: 'Task assigned successfully'
    });
  } catch (error) {
    next(error);
  }
};