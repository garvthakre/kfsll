import db from '../config/db.js';
import { logUserAction } from '../utils/audit.utils.js';
import {generateProjectStatusReport,generateTaskReport,generateUserLogsReport,generateUserPerformanceReport,generateVendorPerformanceReport,exportReportToFile } from '../utils/report.utils.js';
import  {getVendorConsultantIds,getVendorIdByUserId, isConsultantFromVendor }  from '../utils/vendor.utils.js';
import ProjectModel from '../models/project.model.js';

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
        db.query(countQuery, queryParams.slice(0, -2))  
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
 * Shows projects assigned to user with their tasks
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
export const getVendorPerformanceReport = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { project_id = 0, task_status = 0, page = 1, limit = 10 } = req.query;

    // Parse pagination parameters
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    // Get user's projects using the working model
    const userProjects = await ProjectModel.getMyProjects(userId);

    if (!userProjects || userProjects.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          tasks: [],
          pagination: {
            total: 0,
            page: pageNum,
            limit: limitNum,
            totalPages: 0,
            hasNextPage: false,
            hasPrevPage: false
          },
          filters_applied: {
            project_id: parseInt(project_id),
            task_status: task_status
          }
        }
      });
    }

    // Collect all tasks from all projects
    let allTasks = [];
    
    for (const project of userProjects) {
      // Apply project filter
      if (project_id && parseInt(project_id) !== 0) {
        if (parseInt(project_id) !== project.id) {
          continue;
        }
      }

      // Get all tasks for this project
      const projectTasks = await ProjectModel.getProjectTasks(project.id);

      // Transform tasks to match response format
      for (const task of projectTasks) {
        // Apply task status filter
        if (task_status && task_status !== '0') {
          if (task.status !== task_status) {
            continue;
          }
        }

        // Get task assignments
        const assignmentQuery = `
          SELECT 
            ta.assigned_at,
            u.id as assignee_id,
            u.first_name || ' ' || u.last_name as assignee_name
          FROM task_assignments ta
          LEFT JOIN users u ON ta.user_id = u.id
          WHERE ta.task_id = $1
          LIMIT 1
        `;
        const assignmentResult = await db.query(assignmentQuery, [task.id]);
        const assignment = assignmentResult.rows[0] || {};

        allTasks.push({
          id: task.id,
          task_title: task.title,
          assignee_id: assignment.assignee_id || null,
          project_title: project.title,
          project_id: project.id,
          assigned_user: assignment.assignee_name || 'Unassigned',
          created_on: task.created_at ? new Date(task.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null,
          completion_date: task.due_date ? new Date(task.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null,
          status: task.status === 'planning' ? 'planning' :
                  task.status === 'in_progress' ? 'In Progress' :
                  task.status === 'completed' ? 'Completed' :
                  task.status === 'on_hold' ? 'On Hold' :
                  task.status === 'cancelled' ? 'Cancelled' : 'Pending'
        });
      }
    }

    // Sort by created date descending
    allTasks.sort((a, b) => new Date(b.created_on) - new Date(a.created_on));

    // Calculate total and apply pagination
    const total = allTasks.length;
    const paginatedTasks = allTasks.slice(offset, offset + limitNum);

    // Log this report access
    await logUserAction(
      req.user.id,
      'Generated vendor performance report',
      `Generated vendor performance report with filters: project_id=${project_id || 'all'}, task_status=${task_status || 'all'}`
    );

    return res.status(200).json({
      success: true,
      data: {
        tasks: paginatedTasks,
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
          task_status: task_status
        }
      }
    });
  } catch (error) {
    console.error('Error in getVendorPerformanceReport:', error);
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
