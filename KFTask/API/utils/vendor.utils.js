const db = require('../config/db');

/**
 * Check if a user is a vendor
 * @param {Number} userId - User ID to check
 * @returns {Promise<Boolean>} - True if user is a vendor, false otherwise
 */
exports.isUserVendor = async (userId) => {
  try {
    const result = await db.query(
      'SELECT COUNT(*) FROM vendors WHERE user_id = $1',
      [userId]
    );
    
    return parseInt(result.rows[0].count) > 0;
  } catch (error) {
    console.error('Error in isUserVendor:', error);
    return false;
  }
};

/**
 * Get vendor ID by user ID
 * @param {Number} userId - User ID to check
 * @returns {Promise<Number|null>} - Vendor ID or null if not found
 */
exports.getVendorIdByUserId = async (userId) => {
  try {
    const result = await db.query(
      'SELECT id FROM vendors WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0].id;
  } catch (error) {
    console.error('Error in getVendorIdByUserId:', error);
    return null;
  }
};

/**
 * Get consultant IDs associated with a vendor
 * @param {Number} vendorId - Vendor ID
 * @returns {Promise<Array>} - Array of consultant user IDs
 */
exports.getVendorConsultantIds = async (vendorId) => {
  try {
    // Get vendor user ID first
    const vendorResult = await db.query(
      'SELECT user_id FROM vendors WHERE id = $1',
      [vendorId]
    );
    
    if (vendorResult.rows.length === 0) {
      return [];
    }
    
    const vendorUserId = vendorResult.rows[0].user_id;
    
    // Get all users working for this vendor
    const result = await db.query(
      `SELECT c.user_id
       FROM consultants c
       JOIN users u ON c.user_id = u.id
       WHERE u.working_for = $1`,
      [vendorUserId]
    );
    
    return result.rows.map(row => row.user_id);
  } catch (error) {
    console.error('Error in getVendorConsultantIds:', error);
    return [];
  }
};

/**
 * Check if a vendor can access a specific project
 * @param {Number} vendorId - Vendor ID
 * @param {Number} projectId - Project ID
 * @returns {Promise<Boolean>} - True if vendor can access project, false otherwise
 */
exports.canVendorAccessProject = async (vendorId, projectId) => {
  try {
    // Get vendor details
    const vendorResult = await db.query(
      'SELECT company_name FROM vendors WHERE id = $1',
      [vendorId]
    );
    
    if (vendorResult.rows.length === 0) {
      return false;
    }
    
    const companyName = vendorResult.rows[0].company_name;
    
    // Check if project is associated with this vendor
    const projectResult = await db.query(
      `SELECT COUNT(*) 
       FROM projects 
       WHERE id = $1 AND project_type LIKE $2`,
      [projectId, `%Vendor - ${companyName}%`]
    );
    
    return parseInt(projectResult.rows[0].count) > 0;
  } catch (error) {
    console.error('Error in canVendorAccessProject:', error);
    return false;
  }
};

/**
 * Get task statistics for a vendor
 * @param {Number} vendorId - Vendor ID
 * @returns {Promise<Object>} - Task statistics
 */
exports.getVendorTaskStats = async (vendorId) => {
  try {
    // Get vendor user ID first
    const vendorResult = await db.query(
      'SELECT user_id FROM vendors WHERE id = $1',
      [vendorId]
    );
    
    if (vendorResult.rows.length === 0) {
      return {
        total: 0,
        completed: 0,
        inProgress: 0,
        overdue: 0
      };
    }
    
    const vendorUserId = vendorResult.rows[0].user_id;
    
    // Get task statistics
    const statsResult = await db.query(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
        SUM(CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'completed' THEN 1 ELSE 0 END) as overdue
      FROM tasks t
      JOIN task_assignments ta ON t.id = ta.task_id
      JOIN users u ON ta.user_id = u.id
      WHERE u.working_for = $1`,
      [vendorUserId]
    );
    
    return {
      total: parseInt(statsResult.rows[0].total) || 0,
      completed: parseInt(statsResult.rows[0].completed) || 0,
      inProgress: parseInt(statsResult.rows[0].in_progress) || 0,
      overdue: parseInt(statsResult.rows[0].overdue) || 0
    };
  } catch (error) {
    console.error('Error in getVendorTaskStats:', error);
    return {
      total: 0,
      completed: 0,
      inProgress: 0,
      overdue: 0
    };
  }
};

/**
 * Check if a consultant belongs to a vendor
 * @param {Number} vendorId - Vendor ID
 * @param {Number} consultantId - Consultant user ID
 * @returns {Promise<Boolean>} - True if consultant belongs to vendor, false otherwise
 */
exports.isConsultantFromVendor = async (vendorId, consultantId) => {
  try {
    // Get vendor user ID first
    const vendorResult = await db.query(
      'SELECT user_id FROM vendors WHERE id = $1',
      [vendorId]
    );
    
    if (vendorResult.rows.length === 0) {
      return false;
    }
    
    const vendorUserId = vendorResult.rows[0].user_id;
    
    // Check if consultant works for this vendor
    const result = await db.query(
      'SELECT COUNT(*) FROM users WHERE id = $1 AND working_for = $2',
      [consultantId, vendorUserId]
    );
    
    return parseInt(result.rows[0].count) > 0;
  } catch (error) {
    console.error('Error in isConsultantFromVendor:', error);
    return false;
  }
};