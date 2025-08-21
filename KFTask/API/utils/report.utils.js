const db = require('../config/db');
const fs = require('fs');
const path = require('path');
const { Parser } = require('json2csv');
const Excel = require('exceljs');
const vendorUtils = require('./vendor.utils');

/**
 * Generate task report
 * @param {Object} req - Express request object with filters in query
 * @returns {Promise<Array>} - Array of tasks with project and assignee information
 */
exports.generateTaskReport = async (req) => {
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
      t.description,
      t.status AS task_status,
      t.priority,
      t.due_date,
      t.estimated_hours,
      t.actual_hours,
      t.created_at AS assigned_on,
      t.updated_at AS last_updated,
      u.first_name || ' ' || u.last_name AS assigned_to,
      cu.first_name || ' ' || cu.last_name AS created_by,
      p.id AS project_id,
      p.name AS project_name,
      p.status AS project_status
    FROM tasks t
    JOIN task_assignments ta ON t.id = ta.task_id
    JOIN users u ON ta.user_id = u.id
    LEFT JOIN users cu ON t.created_by = cu.id
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
  
  // Check permissions for non-admin users
  if (req.user.role !== 'admin') {
    if (req.user.role === 'vendor') {
      // Vendors can only see their consultants' tasks
      const vendorId = await vendorUtils.getVendorIdByUserId(req.user.id);
      if (!vendorId) {
        return [];
      }
      
      const consultantIds = await vendorUtils.getVendorConsultantIds(vendorId);
      if (consultantIds.length === 0) {
        return [];
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
  
  // Add order by
  query += ` ORDER BY p.name, t.due_date`;
  
  // Execute query
  const result = await db.query(query, queryParams);
  return result.rows;
};

/**
 * Generate user performance report
 * @param {Object} req - Express request object with filters in query
 * @returns {Promise<Array>} - Array of user performance data
 */
exports.generateUserPerformanceReport = async (req) => {
  const { 
    user_id,
    start_date,
    end_date
  } = req.query;
  
  // For vendor users, they can only see their consultants' performance
  if (req.user.role === 'vendor') {
    const vendorId = await vendorUtils.getVendorIdByUserId(req.user.id);
    
    if (!vendorId) {
      return [];
    }
    
    if (user_id) {
      // Check if this consultant belongs to the vendor
      const isFromVendor = await vendorUtils.isConsultantFromVendor(vendorId, user_id);
      
      if (!isFromVendor) {
        return [];
      }
    }
  }
  
  // Initialize query parameters array
  const queryParams = [];
  
  // Build base query for user performance
  let query = `
    SELECT 
      u.id AS user_id,
      u.first_name || ' ' || u.last_name AS user_name,
      u.role,
      u.department,
      u.position,
      COUNT(t.id) AS total_tasks,
      SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
      SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
      SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) AS pending_tasks,
      SUM(CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'completed' THEN 1 ELSE 0 END) AS overdue_tasks,
      ROUND(AVG(CASE WHEN t.status = 'completed' THEN 
        EXTRACT(EPOCH FROM (t.updated_at - t.created_at))/3600/24 
      ELSE NULL END), 2) AS avg_completion_days,
      SUM(COALESCE(du.hours_spent, 0)) AS total_hours_logged
    FROM users u
    LEFT JOIN task_assignments ta ON u.id = ta.user_id
    LEFT JOIN tasks t ON ta.task_id = t.id
    LEFT JOIN daily_updates du ON u.id = du.user_id AND t.id = du.task_id
    WHERE 1=1
  `;
  
  // Apply filters
  if (user_id) {
    queryParams.push(user_id);
    query += ` AND u.id = $${queryParams.length}`;
  } else if (req.user.role === 'vendor') {
    // For vendor users without specific user_id, get all their consultants
    const vendorId = await vendorUtils.getVendorIdByUserId(req.user.id);
    const consultantIds = await vendorUtils.getVendorConsultantIds(vendorId);
    
    if (consultantIds.length === 0) {
      return [];
    }
    
    queryParams.push(consultantIds);
    query += ` AND u.id = ANY($${queryParams.length})`;
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
    GROUP BY u.id, u.first_name, u.last_name, u.role, u.department, u.position
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
  
  return result.rows;
};

/**
 * Generate project status report
 * @param {Object} req - Express request object with filters in query
 * @returns {Promise<Array>} - Array of project status data
 */
exports.generateProjectStatusReport = async (req) => {
  const { project_id } = req.query;
  
  // Initialize query parameters array
  const queryParams = [];
  
  // Build base query for project status
  let query = `
    SELECT 
      p.id AS project_id,
      p.name AS project_name,
      p.description,
      p.status AS project_status,
      p.priority,
      p.start_date,
      p.end_date,
      p.created_at,
      p.updated_at,
      u.first_name || ' ' || u.last_name AS manager_name,
      p.client_name,
      p.budget,
      COUNT(t.id) AS total_tasks,
      SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
      SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
      SUM(CASE WHEN t.status = 'todo' THEN 1 ELSE 0 END) AS todo_tasks,
      SUM(CASE WHEN t.status = 'review' THEN 1 ELSE 0 END) AS review_tasks,
      SUM(CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'completed' THEN 1 ELSE 0 END) AS overdue_tasks,
      CASE 
        WHEN COUNT(t.id) = 0 THEN 0 
        ELSE ROUND((SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END)::float / COUNT(t.id)) * 100, 2)
      END AS completion_percentage
    FROM projects p
    LEFT JOIN users u ON p.manager_id = u.id
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
      return [];
    }
    
    // Get vendor company name
    const vendorResult = await db.query(
      'SELECT company_name FROM vendors WHERE id = $1',
      [vendorId]
    );
    
    if (vendorResult.rows.length === 0) {
      return [];
    }
    
    const companyName = vendorResult.rows[0].company_name;
    
    // Filter projects by vendor
    queryParams.push(`%Vendor - ${companyName}%`);
    query += ` AND p.project_type LIKE $${queryParams.length}`;
  }
  
  // Group and order by
  query += ` 
    GROUP BY p.id, p.name, p.description, p.status, p.priority, p.start_date, p.end_date, 
      p.created_at, p.updated_at, u.first_name, u.last_name, p.client_name, p.budget
    ORDER BY p.start_date DESC
  `;
  
  // Execute query
  const result = await db.query(query, queryParams);
  
  // For each project, get assigned team members
  for (const project of result.rows) {
    const teamQuery = `
      SELECT DISTINCT 
        u.id, 
        u.first_name || ' ' || u.last_name AS name, 
        u.role,
        COUNT(t.id) AS assigned_tasks,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks
      FROM users u
      JOIN task_assignments ta ON u.id = ta.user_id
      JOIN tasks t ON ta.task_id = t.id
      WHERE t.project_id = $1
      GROUP BY u.id, u.first_name, u.last_name, u.role
      ORDER BY u.role, u.first_name, u.last_name
    `;
    
    const teamResult = await db.query(teamQuery, [project.project_id]);
    project.team_members = teamResult.rows;
  }
  
  return result.rows;
};

/**
 * Generate vendor performance report
 * @param {Object} req - Express request object with filters in query
 * @returns {Promise<Array>} - Array of vendor performance data
 */
exports.generateVendorPerformanceReport = async (req) => {
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
      v.contact_person,
      v.contact_email,
      v.contact_phone,
      v.service_type,
      v.contract_start_date,
      v.contract_end_date,
      COUNT(DISTINCT p.id) AS total_projects,
      COUNT(DISTINCT c.id) AS total_consultants,
      COUNT(t.id) AS total_tasks,
      SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
      SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
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
    GROUP BY v.id, v.company_name, v.contact_person, v.contact_email, v.contact_phone, 
      v.service_type, v.contract_start_date, v.contract_end_date
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
        c.specialization,
        c.hourly_rate,
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
      GROUP BY u.id, u.first_name, u.last_name, c.specialization, c.hourly_rate
      ORDER BY u.first_name, u.last_name
    `;
    
    const consultantsResult = await db.query(consultantsQuery, consultantsParams);
    vendor.consultants = consultantsResult.rows;
    
    // Get projects for this vendor
    const projectsQuery = `
      SELECT 
        p.id,
        p.name,
        p.status,
        p.start_date,
        p.end_date,
        COUNT(t.id) AS total_tasks,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE p.project_type LIKE '%Vendor - ${vendor.company_name}%'
      GROUP BY p.id, p.name, p.status, p.start_date, p.end_date
      ORDER BY p.start_date DESC
    `;
    
    const projectsResult = await db.query(projectsQuery);
    vendor.projects = projectsResult.rows;
  }
  
  return result.rows;
};

/**
 * Generate user logs report
 * @param {Object} req - Express request object with filters in query
 * @returns {Promise<Array>} - Array of user logs data
 */
exports.generateUserLogsReport = async (req) => {
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
      u.id AS user_id,
      u.first_name || ' ' || u.last_name AS user_name,
      u.role,
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
  return result.rows;
};

/**
 * Export report data to a file (CSV or Excel)
 * @param {Array} data - Report data to export
 * @param {String} reportType - Type of report being exported
 * @param {String} format - Export format (csv or xlsx)
 * @returns {Promise<Object>} - Object containing file path and name
 */
exports.exportReportToFile = async (data, reportType, format = 'csv') => {
  // Create directory for exports if it doesn't exist
  const exportDir = path.join(__dirname, '../exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir);
  }
  
  // Create filename based on report type and timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${reportType}_report_${timestamp}.${format}`;
  const filepath = path.join(exportDir, filename);
  
  if (format === 'csv') {
    // Export as CSV
    const fields = Object.keys(data[0] || {});
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);
    
    fs.writeFileSync(filepath, csv);
  } else if (format === 'xlsx') {
    // Export as Excel
    const workbook = new Excel.Workbook();
    const worksheet = workbook.addWorksheet(reportType);
    
    // Add column headers
    if (data.length > 0) {
      worksheet.columns = Object.keys(data[0]).map(key => ({
        header: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
        key: key,
        width: 20
      }));
    }
    
    // Add rows
    worksheet.addRows(data);
    
    // Style the header row
    worksheet.getRow(1).font = { bold: true };
    
    await workbook.xlsx.writeFile(filepath);
  } else {
    throw new Error('Unsupported export format. Use csv or xlsx.');
  }
  
  return {
    file: filename,
    path: filepath
  };
};

/**
 * Format date for reports
 * @param {Date|String} date - Date to format
 * @returns {String} - Formatted date string (YYYY-MM-DD)
 */
exports.formatDate = (date) => {
  if (!date) return '';
  
  const d = new Date(date);
  return d.toISOString().split('T')[0];
};