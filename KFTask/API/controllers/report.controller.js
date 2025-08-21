const db = require('../config/db');
const { logUserAction } = require('../utils/audit.utils');
const reportUtils = require('../utils/report.utils');
const vendorUtils = require('../utils/vendor.utils');

/**
 * Get task report with filtering options
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getTaskReport = async (req, res, next) => {
  try {
    const { 
      project_id,
      user_id,
      status,
      start_date,
      end_date
    } = req.query;
    
    // Initialize query parameters array
    const queryParams = [];
    
    // Build base query
    let query = `
      SELECT 
        t.id AS task_id,
        t.title AS task_title,
        t.status AS task_status,
        t.due_date,
        t.created_at AS assigned_on,
        u.first_name || ' ' || u.last_name AS assigned_to,
        p.name AS project_name
      FROM tasks t
      JOIN task_assignments ta ON t.id = ta.task_id
      JOIN users u ON ta.user_id = u.id
      JOIN projects p ON t.project_id = p.id
      WHERE 1=1
    `;
    
    // Apply filters
    if (project_id) {
      queryParams.push(project_id);
      query += ` AND t.project_id = $${queryParams.length}`;
    }
    
    if (user_id) {
      queryParams.push(user_id);
      query += ` AND ta.user_id = $${queryParams.length}`;
    }
    
    if (status) {
      queryParams.push(status);
      query += ` AND t.status = $${queryParams.length}`;
    }
    
    if (start_date) {
      queryParams.push(start_date);
      query += ` AND t.created_at >= $${queryParams.length}::date`;
    }
    
    if (end_date) {
      queryParams.push(end_date);
      query += ` AND t.created_at <= $${queryParams.length}::date`;
    }
    
    // Add order by
    query += ` ORDER BY p.name, t.due_date`;
    
    // Check permissions for non-admin users
    if (req.user.role !== 'admin') {
      if (req.user.role === 'vendor') {
        // Vendors can only see their consultants' tasks
        const vendorId = await vendorUtils.getVendorIdByUserId(req.user.id);
        if (!vendorId) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to access this report'
          });
        }
        
        const consultantIds = await vendorUtils.getVendorConsultantIds(vendorId);
        if (consultantIds.length === 0) {
          // No consultants found, return empty result
          return res.status(200).json({
            success: true,
            data: [],
            message: 'No tasks found for your consultants'
          });
        }
        
        // Add filter for vendor's consultants
        queryParams.push(consultantIds);
        query += ` AND ta.user_id = ANY($${queryParams.length})`;
      } else {
        // Regular users can only see their own tasks
        queryParams.push(req.user.id);
        query += ` AND ta.user_id = $${queryParams.length}`;
      }
    }
    
    // Execute query
    const result = await db.query(query, queryParams);
    
    // Log this report access
    await logUserAction(
      req.user.id, 
      'Generated task report', 
      `Generated task report with filters: ${JSON.stringify(req.query)}`
    );
    
    res.status(200).json({
      success: true,
      data: result.rows,
      filters: req.query
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user performance report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getUserPerformanceReport = async (req, res, next) => {
  try {
    const { 
      user_id,
      start_date,
      end_date
    } = req.query;
    
    // For vendor users, they can only see their consultants' performance
    if (req.user.role === 'vendor') {
      const vendorId = await vendorUtils.getVendorIdByUserId(req.user.id);
      
      if (!vendorId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this report'
        });
      }
      
      if (user_id) {
        // Check if this consultant belongs to the vendor
        const isFromVendor = await vendorUtils.isConsultantFromVendor(vendorId, user_id);
        
        if (!isFromVendor) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to view this user\'s performance'
          });
        }
      }
    }
    
    // Required user_id filter for non-admin users
    if (!user_id && req.user.role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'User ID filter is required'
      });
    }
    
    // Initialize query parameters array
    const queryParams = [];
    
    // Build base query for user performance
    let query = `
      SELECT 
        u.id AS user_id,
        u.first_name || ' ' || u.last_name AS user_name,
        COUNT(t.id) AS total_tasks,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
        SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
        SUM(CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'completed' THEN 1 ELSE 0 END) AS overdue_tasks,
        ROUND(AVG(CASE WHEN t.status = 'completed' THEN 
          EXTRACT(EPOCH FROM (t.updated_at - t.created_at))/3600/24 
        ELSE NULL END), 2) AS avg_completion_days
      FROM users u
      LEFT JOIN task_assignments ta ON u.id = ta.user_id
      LEFT JOIN tasks t ON ta.task_id = t.id
      WHERE 1=1
    `;
    
    // Apply filters
    if (user_id) {
      queryParams.push(user_id);
      query += ` AND u.id = $${queryParams.length}`;
    }
    
    if (start_date) {
      queryParams.push(start_date);
      query += ` AND (t.created_at >= $${queryParams.length}::date OR t.created_at IS NULL)`;
    }
    
    if (end_date) {
      queryParams.push(end_date);
      query += ` AND (t.created_at <= $${queryParams.length}::date OR t.created_at IS NULL)`;
    }
    
    // Group and order by
    query += ` 
      GROUP BY u.id, u.first_name, u.last_name
      ORDER BY u.first_name, u.last_name
    `;
    
    // Execute query
    const result = await db.query(query, queryParams);
    
    // Add daily updates for more detailed performance metrics
    for (const user of result.rows) {
      if (user.user_id) {
        // Build query params for daily updates
        const updateQueryParams = [user.user_id];
        
        let updatesQuery = `
          SELECT 
            DATE(update_date) AS date,
            SUM(hours_spent) AS hours,
            COUNT(DISTINCT task_id) AS tasks_worked_on
          FROM daily_updates
          WHERE user_id = $1
        `;
        
        if (start_date) {
          updateQueryParams.push(start_date);
          updatesQuery += ` AND update_date >= $${updateQueryParams.length}::date`;
        }
        
        if (end_date) {
          updateQueryParams.push(end_date);
          updatesQuery += ` AND update_date <= $${updateQueryParams.length}::date`;
        }
        
        updatesQuery += ` 
          GROUP BY DATE(update_date)
          ORDER BY DATE(update_date)
        `;
        
        const updatesResult = await db.query(updatesQuery, updateQueryParams);
        user.daily_updates = updatesResult.rows;
        
        // Calculate additional metrics
        user.total_hours = updatesResult.rows.reduce((sum, day) => sum + parseFloat(day.hours || 0), 0);
        user.avg_daily_hours = user.total_hours / Math.max(updatesResult.rows.length, 1);
      }
    }
    
    // Log this report access
    await logUserAction(
      req.user.id, 
      'Generated user performance report', 
      `Generated user performance report with filters: ${JSON.stringify(req.query)}`
    );
    
    res.status(200).json({
      success: true,
      data: result.rows,
      filters: req.query
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get project status report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getProjectStatusReport = async (req, res, next) => {
  try {
    const { project_id } = req.query;
    
    // Initialize query parameters array
    const queryParams = [];
    
    // Build base query for project status
    let query = `
      SELECT 
        p.id AS project_id,
        p.name AS project_name,
        p.status AS project_status,
        p.start_date,
        p.end_date,
        COUNT(t.id) AS total_tasks,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
        SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
        SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) AS todo_tasks,
        SUM(CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'completed' THEN 1 ELSE 0 END) AS overdue_tasks,
        CASE 
          WHEN COUNT(t.id) = 0 THEN 0 
          ELSE ROUND((SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END)::float / COUNT(t.id)) * 100, 2)
        END AS completion_percentage
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE 1=1
    `;
    
    // Apply project_id filter if provided
    if (project_id) {
      queryParams.push(project_id);
      query += ` AND p.id = $${queryParams.length}`;
    }
    
    // For vendor users, restrict to their own projects
    if (req.user.role === 'vendor') {
      const vendorId = await vendorUtils.getVendorIdByUserId(req.user.id);
      
      if (!vendorId) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to access this report'
        });
      }
      
      // Get vendor company name
      const vendorResult = await db.query(
        'SELECT company_name FROM vendors WHERE id = $1',
        [vendorId]
      );
      
      if (vendorResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Vendor not found'
        });
      }
      
      const companyName = vendorResult.rows[0].company_name;
      
      // Filter projects by vendor
      queryParams.push(`%Vendor - ${companyName}%`);
      query += ` AND p.project_type LIKE $${queryParams.length}`;
    }
    
    // Group and order by
    query += ` 
      GROUP BY p.id, p.name, p.status, p.start_date, p.end_date
      ORDER BY p.start_date DESC
    `;
    
    // Execute query
    const result = await db.query(query, queryParams);
    
    // For each project, get assigned team members
    for (const project of result.rows) {
      const teamQuery = `
        SELECT DISTINCT u.id, u.first_name || ' ' || u.last_name AS name, u.role
        FROM users u
        JOIN task_assignments ta ON u.id = ta.user_id
        JOIN tasks t ON ta.task_id = t.id
        WHERE t.project_id = $1
        ORDER BY u.role, u.first_name, u.last_name
      `;
      
      const teamResult = await db.query(teamQuery, [project.project_id]);
      project.team_members = teamResult.rows;
    }
    
    // Log this report access
    await logUserAction(
      req.user.id, 
      'Generated project status report', 
      `Generated project status report with filters: ${JSON.stringify(req.query)}`
    );
    
    res.status(200).json({
      success: true,
      data: result.rows,
      filters: req.query
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get vendor performance report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getVendorPerformanceReport = async (req, res, next) => {
  try {
    const { 
      vendor_id,
      start_date,
      end_date
    } = req.query;
    
    // Initialize query parameters array
    const queryParams = [];
    
    // Build base query for vendor performance
    let query = `
      SELECT 
        v.id AS vendor_id,
        v.company_name,
        COUNT(DISTINCT p.id) AS total_projects,
        COUNT(DISTINCT c.id) AS total_consultants,
        COUNT(t.id) AS total_tasks,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
        SUM(CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'completed' THEN 1 ELSE 0 END) AS overdue_tasks,
        CASE 
          WHEN COUNT(t.id) = 0 THEN 0 
          ELSE ROUND((SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END)::float / COUNT(t.id)) * 100, 2)
        END AS completion_rate,
        ROUND(AVG(CASE WHEN t.status = 'completed' THEN 
          EXTRACT(EPOCH FROM (t.updated_at - t.created_at))/3600/24 
        ELSE NULL END), 2) AS avg_completion_days
      FROM vendors v
      LEFT JOIN users u ON v.user_id = u.id
      LEFT JOIN projects p ON p.project_type LIKE '%Vendor - ' || v.company_name || '%'
      LEFT JOIN users c ON c.working_for = v.user_id
      LEFT JOIN consultants con ON con.user_id = c.id
      LEFT JOIN task_assignments ta ON c.id = ta.user_id
      LEFT JOIN tasks t ON ta.task_id = t.id
      WHERE 1=1
    `;
    
    // Apply filters
    if (vendor_id) {
      queryParams.push(vendor_id);
      query += ` AND v.id = $${queryParams.length}`;
    }
    
    if (start_date) {
      queryParams.push(start_date);
      query += ` AND (t.created_at >= $${queryParams.length}::date OR t.created_at IS NULL)`;
    }
    
    if (end_date) {
      queryParams.push(end_date);
      query += ` AND (t.created_at <= $${queryParams.length}::date OR t.created_at IS NULL)`;
    }
    
    // Group and order by
    query += ` 
      GROUP BY v.id, v.company_name
      ORDER BY v.company_name
    `;
    
    // Execute query
    const result = await db.query(query, queryParams);
    
    // For each vendor, get their consultants performance
    for (const vendor of result.rows) {
      const consultantsQuery = `
        SELECT 
          u.id AS user_id,
          u.first_name || ' ' || u.last_name AS user_name,
          COUNT(t.id) AS total_tasks,
          SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
          SUM(CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'completed' THEN 1 ELSE 0 END) AS overdue_tasks
        FROM users u
        JOIN consultants c ON u.id = c.user_id
        JOIN vendors v ON u.working_for = v.user_id
        LEFT JOIN task_assignments ta ON u.id = ta.user_id
        LEFT JOIN tasks t ON ta.task_id = t.id
        WHERE v.id = $1
      `;
      
      const consultantsParams = [vendor.vendor_id];
      
      if (start_date) {
        consultantsParams.push(start_date);
        consultantsQuery += ` AND (t.created_at >= $${consultantsParams.length}::date OR t.created_at IS NULL)`;
      }
      
      if (end_date) {
        consultantsParams.push(end_date);
        consultantsQuery += ` AND (t.created_at <= $${consultantsParams.length}::date OR t.created_at IS NULL)`;
      }
      
      consultantsQuery += `
        GROUP BY u.id, u.first_name, u.last_name
        ORDER BY u.first_name, u.last_name
      `;
      
      const consultantsResult = await db.query(consultantsQuery, consultantsParams);
      vendor.consultants = consultantsResult.rows;
    }
    
    // Log this report access
    await logUserAction(
      req.user.id, 
      'Generated vendor performance report', 
      `Generated vendor performance report with filters: ${JSON.stringify(req.query)}`
    );
    
    res.status(200).json({
      success: true,
      data: result.rows,
      filters: req.query
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Export report to CSV/Excel
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.exportReport = async (req, res, next) => {
  try {
    const { report_type, filters = {}, format = 'csv' } = req.body;
    
    if (!report_type) {
      return res.status(400).json({
        success: false,
        message: 'Report type is required'
      });
    }
    
    if (!['tasks', 'user-performance', 'project-status', 'vendor-performance', 'user-logs'].includes(report_type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid report type'
      });
    }
    
    // Create a modified request object with the filters in query
    const modifiedReq = {
      ...req,
      query: filters
    };
    
    // Get the report data based on the report type
    let reportData;
    switch (report_type) {
      case 'tasks':
        reportData = await reportUtils.generateTaskReport(modifiedReq);
        break;
      case 'user-performance':
        reportData = await reportUtils.generateUserPerformanceReport(modifiedReq);
        break;
      case 'project-status':
        reportData = await reportUtils.generateProjectStatusReport(modifiedReq);
        break;
      case 'vendor-performance':
        reportData = await reportUtils.generateVendorPerformanceReport(modifiedReq);
        break;
      case 'user-logs':
        reportData = await reportUtils.generateUserLogsReport(modifiedReq);
        break;
    }
    
    // Export the report
    const exportResult = await reportUtils.exportReportToFile(reportData, report_type, format);
    
    // Log this report export
    await logUserAction(
      req.user.id, 
      `Exported ${report_type} report`, 
      `Exported ${report_type} report as ${format} with filters: ${JSON.stringify(filters)}`
    );
    
    res.status(200).json({
      success: true,
      file: exportResult.file,
      message: `Report exported as ${format} successfully`
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user logs report
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
exports.getUserLogsReport = async (req, res, next) => {
  try {
    const { 
      user_id,
      start_date,
      end_date,
      action
    } = req.query;
    
    // Initialize query parameters array
    const queryParams = [];
    
    // Build base query for user logs
    let query = `
      SELECT 
        ul.id AS log_id,
        u.first_name || ' ' || u.last_name AS user_name,
        ul.action,
        ul.description,
        ul.created_at,
        ul.ip_address
      FROM user_logs ul
      JOIN users u ON ul.user_id = u.id
      WHERE 1=1
    `;
    
    // Apply filters
    if (user_id) {
      queryParams.push(user_id);
      query += ` AND ul.user_id = $${queryParams.length}`;
    }
    
    if (action) {
      queryParams.push(`%${action}%`);
      query += ` AND ul.action LIKE $${queryParams.length}`;
    }
    
    if (start_date) {
      queryParams.push(start_date);
      query += ` AND ul.created_at >= $${queryParams.length}::date`;
    }
    
    if (end_date) {
      queryParams.push(end_date);
      query += ` AND ul.created_at <= ($${queryParams.length}::date + INTERVAL '1 day')`;
    }
    
    // Order by created_at desc
    query += ` ORDER BY ul.created_at DESC`;
    
    // Execute query
    const result = await db.query(query, queryParams);
    
    // Log this report access
    await logUserAction(
      req.user.id, 
      'Generated user logs report', 
      `Generated user logs report with filters: ${JSON.stringify(req.query)}`
    );
    
    res.status(200).json({
      success: true,
      data: result.rows,
      filters: req.query
    });
  } catch (error) {
    next(error);
  }
};