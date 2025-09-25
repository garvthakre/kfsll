// const db = require('../config/db');
import db from '../config/db.js';
/**
 * Project Model
 * Handles database operations for the projects table
 */
const ProjectModel = {
  /**
   * Create a new project
   * @param {Object} projectData - Project information
   * @returns {Promise<Object>} - New project object
   */
/**
 * Create a new project
 * @param {Object} projectData - Project information
 * @returns {Promise<Object>} - New project object
 */
async create(projectData) {
  const {
    title,
    description,
    client_id,  // Added client_id
    start_date,
    end_date,
    status,
    budget,
    manager_id,
    department,
    priority,
    project_type
  } = projectData;

  const query = `
    INSERT INTO projects 
    (title, description, client_id, start_date, end_date, status, budget, manager_id, department, priority, project_type)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *
  `;

  const values = [
    title,
    description,
    client_id || null,   
    start_date,
    end_date,
    status || 'planning',
    budget || 0,
    manager_id,
    department,
    priority || 'medium',
    project_type
  ];

  const { rows } = await db.query(query, values);
  return rows[0];
},
/**
 * Get projects made by user or assigned to user (id, title, dates only)
 * @param {number} userId - User ID
 * @returns {Promise<Array>} - Array of projects with id, title, start_date, end_date
 */
async getMyProjects(userId) {
  const query = `
    SELECT DISTINCT p.id, p.title, p.start_date, p.end_date
    FROM projects p
    LEFT JOIN project_team_members ptm ON p.id = ptm.project_id
    WHERE p.manager_id = $1 OR p.client_id = $1
    ORDER BY p.id ASC
  `;
  const { rows } = await db.query(query, [userId]);
  return rows;
},

/**
 * Get all tasks for a specific project
 * @param {number} projectId - Project ID
 * @param {number} limit - Number of results per page
 * @param {number} offset - Pagination offset
 * @param {Object} filters - Filtering options
 * @returns {Promise<Array>} - Array of tasks
 */
async getProjectTasks(projectId ) {
  const query = `
    SELECT 
      t.id,
      t.title,
      t.due_date,
      t.created_at,
      t.updated_at
    FROM tasks t
    WHERE t.project_id = $1
    ORDER BY t.id ASC
  `;
  
  const queryParams = [projectId];
   

  const { rows } = await db.query(query, queryParams);
  return rows;
},

/**
 * Count total tasks for a project
 * @param {number} projectId - Project ID
 * @param {Object} filters - Filtering options
 * @returns {Promise<number>} - Total task count
 */
async countProjectTasks(projectId, filters = {}) {
  let query = 'SELECT COUNT(*) FROM tasks t WHERE t.project_id = $1';
  const queryParams = [projectId];
  let paramIndex = 2;

  // Add filters to query
  if (filters.status) {
    query += ` AND t.status = $${paramIndex}`;
    queryParams.push(filters.status);
    paramIndex++;
  }

  if (filters.assignee_id) {
    query += ` AND t.assignee_id = $${paramIndex}`;
    queryParams.push(filters.assignee_id);
    paramIndex++;
  }

  if (filters.priority) {
    query += ` AND t.priority = $${paramIndex}`;
    queryParams.push(filters.priority);
    paramIndex++;
  }

  const { rows } = await db.query(query, queryParams);
  return parseInt(rows[0].count);
},


/**
 * Get all projects with only id and title (name), no filters or pagination
 * @returns {Promise<Array>} - Array of projects with id and title
 */
async getAllProjectIdsAndTitles() {
  const query = `
    SELECT id, title
    FROM projects
    ORDER BY id ASC
  `;
  const { rows } = await db.query(query);
  return rows;
}
,
  /**
   * Get a project by ID
   * @param {number} id - Project ID
   * @returns {Promise<Object>} - Project object
   */
  async findById(id) {
    const query = `
      SELECT p.*, 
        u.first_name || ' ' || u.last_name as manager_name,
       c.first_name || ' ' || c.last_name as client_name,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'completed') as completed_tasks
      FROM projects p
      LEFT JOIN users u ON p.manager_id = u.id
      LEFT JOIN users c ON p.client_id = c.id
      WHERE p.id = $1
    `;
    
    const { rows } = await db.query(query, [id]);
    return rows[0];
  },

  /**
   * Get all projects with pagination
   * @param {number} limit - Number of results per page
   * @param {number} offset - Pagination offset
   * @param {Object} filters - Filtering options
   * @returns {Promise<Array>} - Array of projects
   */
  async findAll(limit = 10, offset = 0, filters = {}) {
    let query = `
      SELECT p.*, 
        u.first_name || ' ' || u.last_name as manager_name,
        c.first_name || ' ' || c.last_name as client_name,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks t WHERE t.project_id = p.id AND t.status = 'completed') as completed_tasks
      FROM projects p
      LEFT JOIN users u ON p.manager_id = u.id
       LEFT JOIN users c ON p.client_id = c.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramIndex = 1;

    // Add filters to query
    if (filters.status) {
      query += ` AND p.status = $${paramIndex}`;
      queryParams.push(filters.status);
      paramIndex++;
    }

    if (filters.department) {
      query += ` AND p.department = $${paramIndex}`;
      queryParams.push(filters.department);
      paramIndex++;
    }

    if (filters.manager_id) {
      query += ` AND p.manager_id = $${paramIndex}`;
      queryParams.push(filters.manager_id);
      paramIndex++;
    }

    if (filters.client_id) {
      query += ` AND p.client_id = $${paramIndex}`;
      queryParams.push(filters.client_id);
      paramIndex++;
    }

    if (filters.priority) {
      query += ` AND p.priority = $${paramIndex}`;
      queryParams.push(filters.priority);
      paramIndex++;
    }

    // Added project_type filter
    if (filters.project_type) {
      query += ` AND p.project_type = $${paramIndex}`;
      queryParams.push(filters.project_type);
      paramIndex++;
    }

    // Add search term filter
    if (filters.search) {
      query += ` AND (
        p.title ILIKE $${paramIndex} OR
        p.description ILIKE $${paramIndex} OR
        c.name ILIKE $${paramIndex} OR
        u.first_name ILIKE $${paramIndex} OR
        u.last_name ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Add sorting
    if (filters.sort_by) {
      const sortField = filters.sort_by.replace(/[^a-zA-Z0-9_.]/g, '');
      const sortOrder = filters.sort_order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      query += ` ORDER BY ${sortField} ${sortOrder}`;
    } else {
      query += ' ORDER BY p.created_at DESC';
    }

    // Add pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const { rows } = await db.query(query, queryParams);
    return rows;
  },

  /**
   * Update project information
   * @param {number} id - Project ID
   * @param {Object} projectData - Project information to update
   * @returns {Promise<Object>} - Updated project object
   */
  async update(id, projectData) {
    const {
      title,
      description,
      client_id,
      start_date,
      end_date,
      status,
      budget,
      manager_id,
      department,
      priority,
      project_type // Added project_type
    } = projectData;

    const query = `
      UPDATE projects
      SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        client_id = COALESCE($3, client_id),
        start_date = COALESCE($4, start_date),
        end_date = COALESCE($5, end_date),
        status = COALESCE($6, status),
        budget = COALESCE($7, budget),
        manager_id = COALESCE($8, manager_id),
        department = COALESCE($9, department),
        priority = COALESCE($10, priority),
        project_type = COALESCE($11, project_type),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $12
      RETURNING *
    `;

    const values = [
      title,
      description,
      client_id,
      start_date,
      end_date,
      status,
      budget,
      manager_id,
      department,
      priority,
      project_type, // Added project_type
      id
    ];

    const { rows } = await db.query(query, values);
    return rows[0];
  },

  /**
   * Delete a project
   * @param {number} id - Project ID
   * @returns {Promise<boolean>} - Success status
   */
  async delete(id) {
    const query = 'DELETE FROM projects WHERE id = $1';
    const { rowCount } = await db.query(query, [id]);
    return rowCount > 0;
  },

  /**
   * Count total projects
   * @param {Object} filters - Filtering options
   * @returns {Promise<number>} - Total project count
   */
  async countTotal(filters = {}) {
    let query = 'SELECT COUNT(*) FROM projects p WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    // Add filters to query
    if (filters.status) {
      query += ` AND p.status = $${paramIndex}`;
      queryParams.push(filters.status);
      paramIndex++;
    }

    if (filters.department) {
      query += ` AND p.department = $${paramIndex}`;
      queryParams.push(filters.department);
      paramIndex++;
    }

    if (filters.manager_id) {
      query += ` AND p.manager_id = $${paramIndex}`;
      queryParams.push(filters.manager_id);
      paramIndex++;
    }

    if (filters.client_id) {
      query += ` AND p.client_id = $${paramIndex}`;
      queryParams.push(filters.client_id);
      paramIndex++;
    }

    if (filters.priority) {
      query += ` AND p.priority = $${paramIndex}`;
      queryParams.push(filters.priority);
      paramIndex++;
    }

    // Added project_type filter
    if (filters.project_type) {
      query += ` AND p.project_type = $${paramIndex}`;
      queryParams.push(filters.project_type);
      paramIndex++;
    }

    // Add search term filter
    if (filters.search) {
      query += ` AND (
        p.title ILIKE $${paramIndex} OR
        p.description ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${filters.search}%`);
    }

    const { rows } = await db.query(query, queryParams);
    return parseInt(rows[0].count);
  },

  /**
   * Add a team member to a project
   * @param {number} projectId - Project ID
   * @param {number} userId - User ID
   * @param {string} role - Team member role in project
   * @returns {Promise<Object>} - Project team member object
   */
  async addTeamMember(projectId, userId, role) {
    const query = `
      INSERT INTO project_team_members (project_id, user_id, role)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const { rows } = await db.query(query, [projectId, userId, role]);
    return rows[0];
  },

  /**
   * Remove a team member from a project
   * @param {number} projectId - Project ID
   * @param {number} userId - User ID
   * @returns {Promise<boolean>} - Success status
   */
  async removeTeamMember(projectId, userId) {
    const query = 'DELETE FROM project_team_members WHERE project_id = $1 AND user_id = $2';
    const { rowCount } = await db.query(query, [projectId, userId]);
    return rowCount > 0;
  },

  /**
   * Get team members for a project
   * @param {number} projectId - Project ID
   * @returns {Promise<Array>} - Array of team members
   */
  async getTeamMembers(projectId) {
    const query = `
      SELECT 
        ptm.user_id,
        ptm.role as project_role,
        ptm.joined_at,
        u.first_name,
        u.last_name,
        u.email,
        u.department,
        u.position,
        u.profile_image
      FROM project_team_members ptm
      JOIN users u ON ptm.user_id = u.id
      WHERE ptm.project_id = $1
      ORDER BY ptm.joined_at ASC
    `;
    
    const { rows } = await db.query(query, [projectId]);
    return rows;
  },

  /**
   * Get project statistics by status
   * @returns {Promise<Array>} - Array of projects grouped by status
   */
  async getProjectStats() {
    const query = `
      SELECT 
        status,
        COUNT(*) as count,
        AVG(
          CASE 
            WHEN end_date IS NOT NULL AND start_date IS NOT NULL 
            THEN (end_date - start_date)
            ELSE NULL
          END
        ) as avg_duration
      FROM projects
      GROUP BY status
      ORDER BY count DESC
    `;
    
    const { rows } = await db.query(query);
    return rows;
  }
};
export default ProjectModel;