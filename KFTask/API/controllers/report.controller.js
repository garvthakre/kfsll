import db from '../config/db.js';
import { logUserAction } from '../utils/audit.utils.js';
import {generateProjectStatusReport,generateTaskReport,generateUserLogsReport,generateUserPerformanceReport,generateVendorPerformanceReport,exportReportToFile } from '../utils/report.utils.js';
import  {getVendorConsultantIds,getVendorIdByUserId, isConsultantFromVendor }  from '../utils/vendor.utils.js';

/**
 * Helper function to create pagination metadata
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} totalCount - Total number of items
 * @returns {Object} Pagination metadata
 */
const createPaginationMeta = (page, limit, totalCount) => {
  const totalPages = Math.ceil(totalCount / limit);
  return {
    current_page: page,
    total_pages: totalPages,
    total_items: totalCount,
    items_per_page: limit,
    has_next: page < totalPages,
    has_previous: page > 1
  };
};

/**
 * Get task report with filtering options and pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const getTaskReport = async (req, res, next) => {
  try {
    const { 
      project_id,
      user_id,
      status,
      start_date,
      end_date,
      page = 1,
      limit = 20
    } = req.query;
    
    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;
    
    // Initialize query parameters array
    const queryParams = [];
    
    // Build base query for counting total items
    let countQuery = `
      SELECT COUNT(DISTINCT t.id) as total
      FROM tasks t
      JOIN task_assignments ta ON t.id = ta.task_id
      JOIN users u ON ta.user_id = u.id
      JOIN projects p ON t.project_id = p.id
      WHERE 1=1
    `;
    
    // Build base query for data
    let query = `
      SELECT 
        t.id AS task_id,
        t.title AS task_title,
        t.status AS task_status,
        t.due_date,
        t.created_at AS assigned_on,
        u.first_name || ' ' || u.last_name AS assigned_to,
        p.title AS project_name
      FROM tasks t
      JOIN task_assignments ta ON t.id = ta.task_id
      JOIN users u ON ta.user_id = u.id
      JOIN projects p ON t.project_id = p.id
      WHERE 1=1
    `;
    
    // Apply filters to both queries (skip if 0 or 'all')
    if (project_id && project_id !== '0' && project_id !== 'all') {
      queryParams.push(project_id);
      const filterClause = ` AND t.project_id = $${queryParams.length}`;
      query += filterClause;
      countQuery += filterClause;
    }
    
    if (user_id && user_id !== '0' && user_id !== 'all') {
      queryParams.push(user_id);
      const filterClause = ` AND ta.user_id = $${queryParams.length}`;
      query += filterClause;
      countQuery += filterClause;
    }
    
    if (status && status !== 'all' && status !== '0') {
      queryParams.push(status);
      const filterClause = ` AND t.status = ${queryParams.length}`;
      query += filterClause;
      countQuery += filterClause;
    }
    
    if (start_date) {
      queryParams.push(start_date);
      const filterClause = ` AND t.created_at >= $${queryParams.length}::date`;
      query += filterClause;
      countQuery += filterClause;
    }
    
    if (end_date) {
      queryParams.push(end_date);
      const filterClause = ` AND t.created_at <= $${queryParams.length}::date`;
      query += filterClause;
      countQuery += filterClause;
    }
    
    // Check permissions for non-admin users
    if (req.user.role !== 'admin') {
      if (req.user.role === 'vendor') {
        // Vendors can only see their consultants' tasks
        const vendorId = await getVendorIdByUserId(req.user.id);
        if (!vendorId) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to access this report'
          });
        }
        
        const consultantIds = await getVendorConsultantIds(vendorId);
        if (consultantIds.length === 0) {
          // No consultants found, return empty result
          return res.status(200).json({
            success: true,
            data: [],
            pagination: createPaginationMeta(pageNum, limitNum, 0),
            message: 'No tasks found for your consultants'
          });
        }
        
        // Add filter for vendor's consultants
        queryParams.push(consultantIds);
        const vendorFilterClause = ` AND ta.user_id = ANY($${queryParams.length})`;
        query += vendorFilterClause;
        countQuery += vendorFilterClause;
      } else {
        // Regular users can only see their own tasks
        queryParams.push(req.user.id);
        const userFilterClause = ` AND ta.user_id = $${queryParams.length}`;
        query += userFilterClause;
        countQuery += userFilterClause;
      }
    }
    
    // Get total count
    const countResult = await db.query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].total);
    
    // Add order by, limit and offset to main query
    query += ` ORDER BY p.title, t.due_date`;
    queryParams.push(limitNum, offset);
    query += ` LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`;
    
    // Execute main query
    const result = await db.query(query, queryParams);
    
    // Create pagination metadata
    const pagination = createPaginationMeta(pageNum, limitNum, totalCount);
    
    // Log this report access
    await logUserAction(
      req.user.id, 
      'Generated task report', 
      `Generated task report with filters: ${JSON.stringify(req.query)}`
    );
    
    res.status(200).json({
      success: true,
      data: result.rows,
      pagination,
      filters: req.query
    });
  } catch (error) {
    next(error);
  }
};

 
/**
 * Get user performance report with pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const getUserPerformanceReport = async (req, res, next) => {
  try {
      const userId = req.user.id;
      const { 
        project_id = 0, 
        assignee_id = 0, 
        status = 0,
        page = 1, 
        limit = 10 
      } = req.query;
  
      const pageNum = Math.max(1, parseInt(page));
      const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
      const offset = (pageNum - 1) * limitNum;
  
      // Build WHERE conditions
      let whereConditions = ['t.created_by = $1'];
      let queryParams = [userId];
      let paramIndex = 2;
  
      // Add project filter  
      if (project_id && parseInt(project_id) !== 0) {
        whereConditions.push(`t.project_id = $${paramIndex}`);
        queryParams.push(parseInt(project_id));
        paramIndex++;
      }
  
      // Add assignee filter  
      if (assignee_id && parseInt(assignee_id) !== 0) {
        whereConditions.push(`t.assignee_id = $${paramIndex}`);
        queryParams.push(parseInt(assignee_id));
        paramIndex++;
      }
  
      // Add status filter  
      if (status && status !== '0') {
        whereConditions.push(`t.status = $${paramIndex}`);
        queryParams.push(status);
        paramIndex++;
      }
  
      const whereClause = whereConditions.join(' AND ');
  
      // Main query for tasks
      const tasksQuery = `
        SELECT 
          t.id,
          t.title as task_title,
           t.assignee_id as assignee_id,
          p.title as project_title,
          p.id as project_id,
          COALESCE(u.first_name || ' ' || u.last_name, 'Unassigned') as assigned_user,

          TO_CHAR(t.created_at, 'DD-Mon-YYYY') as created_on,
          TO_CHAR(t.due_date, 'DD-Mon-YYYY') as completion_date,
          CASE 
            WHEN t.status = 'planning' THEN 'planning'
            WHEN t.status = 'in_progress' THEN 'In Progress'
            WHEN t.status = 'completed' THEN 'Completed'
      
            WHEN t.status = 'on_hold' THEN 'On Hold'
            WHEN t.status = 'cancelled' THEN 'Cancelled'
            ELSE 'Pending'
          END as status
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        LEFT JOIN users u ON t.assignee_id = u.id
        WHERE ${whereClause}
        ORDER BY t.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
  
      queryParams.push(limitNum, offset);
  
      // Count query for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM tasks t
        WHERE ${whereClause}
      `;
  
      const [tasksResult, countResult] = await Promise.all([
        db.query(tasksQuery, queryParams),
        db.query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset for count
      ]);
  
      const tasks = tasksResult.rows;
      const total = parseInt(countResult.rows[0].total);
  
      return res.status(200).json({
        success: true,
        data: {
          tasks,
          pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum),
            hasNextPage: pageNum < Math.ceil(total / limitNum),
            hasPrevPage: pageNum > 1
          },
          filters_applied: {
            project_id: parseInt(project_id),
            assignee_id: parseInt(assignee_id),
            status: status
          }
        }
      });
    } catch (error) {
      console.error('Get my created tasks error:', error);
      return res.status(500).json({ 
        success: false,
        message: 'Server error while fetching created tasks' 
      });
    }
};


/**
 * Get project status report with pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const getProjectStatusReport = async (req, res, next) => {
  try {
    const { 
      project_id,
      page = 1,
      limit = 20
    } = req.query;
    
    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;
    
    // Initialize query parameters array
    const queryParams = [];
    
    // Build base query for counting
    let countQuery = `
      SELECT COUNT(DISTINCT p.id) as total
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE 1=1
    `;
    
    // Build base query for project status
    let query = `
      SELECT 
        p.id AS project_id,
        p.title AS project_name,
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
          ELSE ROUND((SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END)::numeric / COUNT(t.id)) * 100, 2)
        END AS completion_percentage
      FROM projects p
      LEFT JOIN tasks t ON p.id = t.project_id
      WHERE 1=1
    `;
    
    // Apply project_id filter if provided (skip if 0 or 'all')
    if (project_id && project_id !== '0' && project_id !== 'all') {
      queryParams.push(project_id);
      const filterClause = ` AND p.id = $${queryParams.length}`;
      query += filterClause;
      countQuery += filterClause;
    }
    
    // For vendor users, restrict to their own projects
    if (req.user.role === 'vendor') {
      const vendorId = await getVendorIdByUserId(req.user.id);
      
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
      const vendorFilterClause = ` AND p.project_type LIKE $${queryParams.length}`;
      query += vendorFilterClause;
      countQuery += vendorFilterClause;
    }
    
    // Get total count
    const countResult = await db.query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].total);
    
    // Group, order by and add pagination to main query
    query += ` 
      GROUP BY p.id, p.title, p.status, p.start_date, p.end_date
      ORDER BY p.start_date DESC
    `;
    
    queryParams.push(limitNum, offset);
    query += ` LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`;
    
    // Execute query
    const result = await db.query(query, queryParams);
    
    // For each project, get assigned team members (limited to avoid performance issues)
    for (const project of result.rows) {
      const teamQuery = `
        SELECT DISTINCT u.id, u.first_name, u.last_name, u.first_name || ' ' || u.last_name AS name, u.role
        FROM users u
        JOIN task_assignments ta ON u.id = ta.user_id
        JOIN tasks t ON ta.task_id = t.id
        WHERE t.project_id = $1
        ORDER BY u.role, u.first_name, u.last_name
        LIMIT 20
      `;
      
      const teamResult = await db.query(teamQuery, [project.project_id]);
      project.team_members = teamResult.rows;
    }
    
    // Create pagination metadata
    const pagination = createPaginationMeta(pageNum, limitNum, totalCount);
    
    // Log this report access
    await logUserAction(
      req.user.id, 
      'Generated project status report', 
      `Generated project status report with filters: ${JSON.stringify(req.query)}`
    );
    
    res.status(200).json({
      success: true,
      data: result.rows,
      pagination,
      filters: req.query
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get vendor performance report with filtering and pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const getVendorPerformanceReport = async (req, res, next) => {
  try {
    const { 
      vendor_id,
      consultant_id,
      start_date,
      end_date,
      task_status,
      page = 1,
      limit = 20
    } = req.query;
    
    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;
    
    // Initialize query parameters array
    const queryParams = [];
    
    // Build base query for counting
    let countQuery = `
      SELECT COUNT(DISTINCT v.id) as total
      FROM vendors v
      LEFT JOIN users u ON v.user_id = u.id
      LEFT JOIN projects p ON p.project_type LIKE '%Vendor - ' || v.company_name || '%'
      LEFT JOIN users c ON c.working_for = v.user_id
      LEFT JOIN consultants con ON con.user_id = c.id
      LEFT JOIN task_assignments ta ON c.id = ta.user_id
      LEFT JOIN tasks t ON ta.task_id = t.id
      WHERE 1=1
    `;
    
    // Build base query for vendor performance
    let query = `
      SELECT 
        v.id AS vendor_id,
        v.company_name,
        COUNT(DISTINCT p.id) AS total_projects,
        COUNT(DISTINCT c.id) AS total_consultants,
        COUNT(t.id) AS total_tasks,
        SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
        SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
        SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END) AS pending_tasks,
        SUM(CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'completed' THEN 1 ELSE 0 END) AS overdue_tasks,
        CASE 
          WHEN COUNT(t.id) = 0 THEN 0 
          ELSE ROUND((SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END)::numeric / COUNT(t.id)) * 100, 2)
        END AS completion_rate,
        ROUND(AVG(CASE WHEN t.status = 'completed' THEN 
          EXTRACT(EPOCH FROM (t.updated_at - t.created_at))/3600/24 
        ELSE NULL END), 2) AS avg_completion_days,
        ROUND(AVG(CASE WHEN t.due_date IS NOT NULL AND t.status = 'completed' THEN 
          EXTRACT(EPOCH FROM (t.due_date - t.updated_at))/3600/24 
        ELSE NULL END), 2) AS avg_days_before_due
      FROM vendors v
      LEFT JOIN users u ON v.user_id = u.id
      LEFT JOIN projects p ON p.project_type LIKE '%Vendor - ' || v.company_name || '%'
      LEFT JOIN users c ON c.working_for = v.user_id
    
      LEFT JOIN task_assignments ta ON c.id = ta.user_id
      LEFT JOIN tasks t ON ta.task_id = t.id
      WHERE 1=1
    `;
    
    // Apply vendor filter (skip if 0 or 'all')
    if (vendor_id && vendor_id !== '0' && vendor_id !== 'all') {
      queryParams.push(vendor_id);
      const filterClause = ` AND v.id = $${queryParams.length}`;
      query += filterClause;
      countQuery += filterClause;
    }
    
    // Apply consultant filter (skip if 0 or 'all')
    if (consultant_id && consultant_id !== '0' && consultant_id !== 'all') {
      queryParams.push(consultant_id);
      const filterClause = ` AND c.id = $${queryParams.length}`;
      query += filterClause;
      countQuery += filterClause;
    }
    
    // Apply date filters
    if (start_date) {
      queryParams.push(start_date);
      const filterClause = ` AND (t.created_at >= $${queryParams.length}::date OR t.created_at IS NULL)`;
      query += filterClause;
      countQuery += filterClause;
    }
    
    if (end_date) {
      queryParams.push(end_date);
      const filterClause = ` AND (t.created_at <= $${queryParams.length}::date OR t.created_at IS NULL)`;
      query += filterClause;
      countQuery += filterClause;
    }
    
    // Apply task status filter (skip if 'all')
    if (task_status && task_status !== 'all') {
      const statusArray = task_status.split(',').map(status => status.trim());
      const statusPlaceholders = statusArray.map((_, index) => `$${queryParams.length + index + 1}`).join(',');
      queryParams.push(...statusArray);
      const statusFilterClause = ` AND (t.status IN (${statusPlaceholders}) OR t.status IS NULL)`;
      query += statusFilterClause;
      countQuery += statusFilterClause;
    }
    
    // Get total count
    const countResult = await db.query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].total);
    
    // Group, order by and add pagination to main query
    query += ` 
      GROUP BY v.id, v.company_name
      ORDER BY v.company_name
    `;
    
    queryParams.push(limitNum, offset);
    query += ` LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`;
    
    // Execute main query
    const result = await db.query(query, queryParams);
    
    // For each vendor, get their consultants performance with the same filters
    for (const vendor of result.rows) {
      let consultantsQuery = `
        SELECT 
          u.id AS user_id,
          u.first_name || ' ' || u.last_name AS user_name,
          u.email,
          
          COUNT(t.id) AS total_tasks,
          SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
          SUM(CASE WHEN t.status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
          SUM(CASE WHEN t.status = 'pending' THEN 1 ELSE 0 END) AS pending_tasks,
          SUM(CASE WHEN t.due_date < CURRENT_DATE AND t.status != 'completed' THEN 1 ELSE 0 END) AS overdue_tasks,
          CASE 
            WHEN COUNT(t.id) = 0 THEN 0 
            ELSE ROUND((SUM(CASE WHEN t.status = 'completed' THEN 1 ELSE 0 END)::numeric / COUNT(t.id)) * 100, 2)
          END AS completion_rate,
          ROUND(AVG(CASE WHEN t.status = 'completed' THEN 
            EXTRACT(EPOCH FROM (t.updated_at - t.created_at))/3600/24 
          ELSE NULL END), 2) AS avg_completion_days
        FROM users u
        JOIN consultants c ON u.id = c.user_id
        JOIN vendors v ON u.working_for = v.user_id
        LEFT JOIN task_assignments ta ON u.id = ta.user_id
        LEFT JOIN tasks t ON ta.task_id = t.id
        WHERE v.id = $1
      `;
      
      const consultantsParams = [vendor.vendor_id];
      
      // Apply consultant filter for individual consultant data (skip if 0 or 'all')
      if (consultant_id && consultant_id !== '0' && consultant_id !== 'all') {
        consultantsParams.push(consultant_id);
        consultantsQuery += ` AND u.id = $${consultantsParams.length}`;
      }
      
      // Apply date filters
      if (start_date) {
        consultantsParams.push(start_date);
        consultantsQuery += ` AND (t.created_at >= $${consultantsParams.length}::date OR t.created_at IS NULL)`;
      }
      
      if (end_date) {
        consultantsParams.push(end_date);
        consultantsQuery += ` AND (t.created_at <= $${consultantsParams.length}::date OR t.created_at IS NULL)`;
      }
      
      // Apply task status filter (skip if 'all')
      if (task_status && task_status !== 'all') {
        const statusArray = task_status.split(',').map(status => status.trim());
        const statusPlaceholders = statusArray.map((_, index) => `$${consultantsParams.length + index + 1}`).join(',');
        consultantsParams.push(...statusArray);
        consultantsQuery += ` AND (t.status IN (${statusPlaceholders}) OR t.status IS NULL)`;
      }
      
      consultantsQuery += `
        GROUP BY u.id, u.first_name, u.last_name, u.email, c.specialization
        ORDER BY u.first_name, u.last_name
        LIMIT 50
      `;
      
      const consultantsResult = await db.query(consultantsQuery, consultantsParams);
      vendor.consultants = consultantsResult.rows;
    }
    
    // Calculate summary statistics (based on current page, not all data)
    const summary = {
      total_vendors: totalCount,
      total_consultants: result.rows.reduce((sum, vendor) => sum + parseInt(vendor.total_consultants || 0), 0),
      total_tasks: result.rows.reduce((sum, vendor) => sum + parseInt(vendor.total_tasks || 0), 0),
      total_completed_tasks: result.rows.reduce((sum, vendor) => sum + parseInt(vendor.completed_tasks || 0), 0),
      total_overdue_tasks: result.rows.reduce((sum, vendor) => sum + parseInt(vendor.overdue_tasks || 0), 0),
      overall_completion_rate: result.rows.length > 0 ? 
        Math.round((result.rows.reduce((sum, vendor) => sum + parseFloat(vendor.completion_rate || 0), 0) / result.rows.length) * 100) / 100 : 0
    };
    
    // Create pagination metadata
    const pagination = createPaginationMeta(pageNum, limitNum, totalCount);
    
    // Log this report access
    await logUserAction(
      req.user.id, 
      'Generated vendor performance report', 
      `Generated vendor performance report with filters: ${JSON.stringify(req.query)}`
    );
    
    res.status(200).json({
      success: true,
      data: result.rows,
      pagination,
      summary,
      filters: req.query,
      generated_at: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error generating vendor performance report:', error);
    next(error);
  }
};

/**
 * Export report to CSV/Excel
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const exportReport = async (req, res, next) => {
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
    
    // For exports, we typically want all data, not paginated
    // Create a modified request object with the filters in query and no pagination
    const modifiedReq = {
      ...req,
      query: { ...filters, limit: 10000 } // Set high limit for export
    };
    
    // Get the report data based on the report type
    let reportData;
    switch (report_type) {
      case 'tasks':
        reportData = await generateTaskReport(modifiedReq);
        break;
      case 'user-performance':
        reportData = await generateUserPerformanceReport(modifiedReq);
        break;
      case 'project-status':
        reportData = await generateProjectStatusReport(modifiedReq);
        break;
      case 'vendor-performance':
        reportData = await generateVendorPerformanceReport(modifiedReq);
        break;
      case 'user-logs':
        reportData = await generateUserLogsReport(modifiedReq);
        break;
    }
    
    // Export the report
    const exportResult = await exportReportToFile(reportData, report_type, format);
    
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
 * Get user logs report with pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const getUserLogsReport = async (req, res, next) => {
  try {
    const { user_id, action, page = 1, limit = 20 } = req.query;

    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Initialize query parameters array
    let queryParams = [];

    // Build base query for counting
    let countQuery = `
      SELECT COUNT(*) as total
      FROM user_logs ul
      INNER JOIN users u ON ul.user_id = u.id
      WHERE u.role = 'employee'
    `;

    // Build base query for user logs
    let query = `
      SELECT 
        ul.id AS log_id,
        COALESCE(u.first_name || ' ' || u.last_name, 'Unknown User') AS user_name,
        ul.action,
        ul.description,
        ul.created_at,
        ul.ip_address,
        ul.user_id
      FROM user_logs ul
      INNER JOIN users u ON ul.user_id = u.id
      WHERE u.role = 'employee'
    `;

    // Apply filters
    if (user_id && user_id !== '0' && user_id !== 'all' && user_id.trim() !== '') {
      queryParams.push(parseInt(user_id));
      const filterClause = ` AND ul.user_id = $${queryParams.length}`;
      query += filterClause;
      countQuery += filterClause;
    }

    if (action && action !== 'all' && action !== '0' && action.trim() !== '') {
      queryParams.push(`%${action.trim()}%`);
      const filterClause = ` AND ul.action ILIKE $${queryParams.length}`;
      query += filterClause;
      countQuery += filterClause;
    }

    // Get total count
    const countResult = await db.query(countQuery, queryParams);
    const totalCount = parseInt(countResult.rows[0].total);

    // Add order by and pagination to main query
    query += ` ORDER BY ul.created_at DESC`;
    queryParams.push(limitNum, offset);
    query += ` LIMIT $${queryParams.length - 1} OFFSET $${queryParams.length}`;

    // Execute query
    const result = await db.query(query, queryParams);

    // Create pagination metadata
    const pagination = createPaginationMeta(pageNum, limitNum, totalCount);

    // Log this report access
    await logUserAction(
      req.user.id, 
      'Generated employee user logs report', 
      `Generated employee user logs report with filters: ${JSON.stringify(req.query)}`
    );

    res.status(200).json({
      success: true,
      data: result.rows,
      pagination,
      filters: req.query
    });
  } catch (error) {
    console.error('Error in getUserLogsReport:', error);
    next(error);
  }
};
