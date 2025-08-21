const db = require('../config/db');

/**
 * Task Model
 * Handles database operations for the tasks table
 */
const TaskModel = {
  /**
   * Create a new task
   * @param {Object} taskData - Task information
   * @returns {Promise<Object>} - New task object
   */
  async create(taskData) {
    const {
      title,
      description,
      project_id,
      assignee_id,
      status,
      priority,
      due_date,
      estimated_hours,
      created_by
    } = taskData;

    const query = `
      INSERT INTO tasks 
      (title, description, project_id, assignee_id, status, priority, due_date, estimated_hours, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      title,
      description,
      project_id,
      assignee_id,
      status || 'to_do',
      priority || 'medium',
      due_date,
      estimated_hours || 0,
      created_by
    ];

    const { rows } = await db.query(query, values);
    return rows[0];
  },

  /**
   * Find task by ID
   * @param {number} id - Task ID
   * @returns {Promise<Object>} - Task object
   */
  async findById(id) {
    const query = `
      SELECT t.*,
        p.title as project_title,
        a.first_name || ' ' || a.last_name as assignee_name,
        c.first_name || ' ' || c.last_name as creator_name,
        (SELECT COUNT(*) FROM task_comments WHERE task_id = t.id) as comment_count
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users a ON t.assignee_id = a.id
      LEFT JOIN users c ON t.created_by = c.id
      WHERE t.id = $1
    `;
    
    const { rows } = await db.query(query, [id]);
    return rows[0];
  },

  /**
   * Get all tasks with pagination and filters
   * @param {number} limit - Number of results per page
   * @param {number} offset - Pagination offset
   * @param {Object} filters - Filtering options
   * @returns {Promise<Array>} - Array of tasks
   */
  async findAll(limit = 10, offset = 0, filters = {}) {
    let query = `
      SELECT t.*,
        p.title as project_title,
        a.first_name || ' ' || a.last_name as assignee_name,
        c.first_name || ' ' || c.last_name as creator_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users a ON t.assignee_id = a.id
      LEFT JOIN users c ON t.created_by = c.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    let paramIndex = 1;

    // Add filters to query
    if (filters.project_id) {
      query += ` AND t.project_id = $${paramIndex}`;
      queryParams.push(filters.project_id);
      paramIndex++;
    }

    if (filters.assignee_id) {
      query += ` AND t.assignee_id = $${paramIndex}`;
      queryParams.push(filters.assignee_id);
      paramIndex++;
    }

    if (filters.created_by) {
      query += ` AND t.created_by = $${paramIndex}`;
      queryParams.push(filters.created_by);
      paramIndex++;
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        const placeholders = filters.status.map((_, idx) => `$${paramIndex + idx}`).join(', ');
        query += ` AND t.status IN (${placeholders})`;
        queryParams.push(...filters.status);
        paramIndex += filters.status.length;
      } else {
        query += ` AND t.status = $${paramIndex}`;
        queryParams.push(filters.status);
        paramIndex++;
      }
    }

    if (filters.priority) {
      if (Array.isArray(filters.priority)) {
        const placeholders = filters.priority.map((_, idx) => `$${paramIndex + idx}`).join(', ');
        query += ` AND t.priority IN (${placeholders})`;
        queryParams.push(...filters.priority);
        paramIndex += filters.priority.length;
      } else {
        query += ` AND t.priority = $${paramIndex}`;
        queryParams.push(filters.priority);
        paramIndex++;
      }
    }

    if (filters.due_date_start) {
      query += ` AND t.due_date >= $${paramIndex}`;
      queryParams.push(filters.due_date_start);
      paramIndex++;
    }

    if (filters.due_date_end) {
      query += ` AND t.due_date <= $${paramIndex}`;
      queryParams.push(filters.due_date_end);
      paramIndex++;
    }

    // Add search term filter
    if (filters.search) {
      query += ` AND (
        t.title ILIKE $${paramIndex} OR
        t.description ILIKE $${paramIndex} OR
        p.title ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Add sorting
    if (filters.sort_by) {
      const sortField = filters.sort_by.replace(/[^a-zA-Z0-9_.]/g, '');
      const sortOrder = filters.sort_order?.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
      query += ` ORDER BY t.${sortField} ${sortOrder}`;
    } else {
      query += ' ORDER BY t.due_date ASC';
    }

    // Add pagination
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(limit, offset);

    const { rows } = await db.query(query, queryParams);
    return rows;
  },

  /**
   * Update task information
   * @param {number} id - Task ID
   * @param {Object} taskData - Task information to update
   * @returns {Promise<Object>} - Updated task object
   */
  async update(id, taskData) {
    const {
      title,
      description,
      project_id,
      assignee_id,
      status,
      priority,
      due_date,
      estimated_hours,
      actual_hours
    } = taskData;

    const query = `
      UPDATE tasks
      SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        project_id = COALESCE($3, project_id),
        assignee_id = COALESCE($4, assignee_id),
        status = COALESCE($5, status),
        priority = COALESCE($6, priority),
        due_date = COALESCE($7, due_date),
        estimated_hours = COALESCE($8, estimated_hours),
        actual_hours = COALESCE($9, actual_hours),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $10
      RETURNING *
    `;

    const values = [
      title,
      description,
      project_id,
      assignee_id,
      status,
      priority,
      due_date,
      estimated_hours,
      actual_hours,
      id
    ];

    const { rows } = await db.query(query, values);
    return rows[0];
  },

  /**
   * Delete a task
   * @param {number} id - Task ID
   * @returns {Promise<boolean>} - Success status
   */
  async delete(id) {
    const query = 'DELETE FROM tasks WHERE id = $1';
    const { rowCount } = await db.query(query, [id]);
    return rowCount > 0;
  },

  /**
   * Count total tasks
   * @param {Object} filters - Filtering options
   * @returns {Promise<number>} - Total task count
   */
  async countTotal(filters = {}) {
    let query = 'SELECT COUNT(*) FROM tasks t WHERE 1=1';
    const queryParams = [];
    let paramIndex = 1;

    // Add filters to query
    if (filters.project_id) {
      query += ` AND t.project_id = $${paramIndex}`;
      queryParams.push(filters.project_id);
      paramIndex++;
    }

    if (filters.assignee_id) {
      query += ` AND t.assignee_id = $${paramIndex}`;
      queryParams.push(filters.assignee_id);
      paramIndex++;
    }

    if (filters.created_by) {
      query += ` AND t.created_by = $${paramIndex}`;
      queryParams.push(filters.created_by);
      paramIndex++;
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        const placeholders = filters.status.map((_, idx) => `$${paramIndex + idx}`).join(', ');
        query += ` AND t.status IN (${placeholders})`;
        queryParams.push(...filters.status);
        paramIndex += filters.status.length;
      } else {
        query += ` AND t.status = $${paramIndex}`;
        queryParams.push(filters.status);
        paramIndex++;
      }
    }

    if (filters.priority) {
      if (Array.isArray(filters.priority)) {
        const placeholders = filters.priority.map((_, idx) => `$${paramIndex + idx}`).join(', ');
        query += ` AND t.priority IN (${placeholders})`;
        queryParams.push(...filters.priority);
        paramIndex += filters.priority.length;
      } else {
        query += ` AND t.priority = $${paramIndex}`;
        queryParams.push(filters.priority);
        paramIndex++;
      }
    }

    if (filters.due_date_start) {
      query += ` AND t.due_date >= $${paramIndex}`;
      queryParams.push(filters.due_date_start);
      paramIndex++;
    }

    if (filters.due_date_end) {
      query += ` AND t.due_date <= $${paramIndex}`;
      queryParams.push(filters.due_date_end);
      paramIndex++;
    }

    // Add search term filter
    if (filters.search) {
      query += ` AND (
        t.title ILIKE $${paramIndex} OR
        t.description ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${filters.search}%`);
    }

    const { rows } = await db.query(query, queryParams);
    return parseInt(rows[0].count);
  },

  /**
   * Add a comment to a task
   * @param {Object} commentData - Comment data
   * @returns {Promise<Object>} - New comment object
   */
  async addComment(commentData) {
    const { task_id, user_id, content } = commentData;

    const query = `
      INSERT INTO task_comments (task_id, user_id, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const { rows } = await db.query(query, [task_id, user_id, content]);
    return rows[0];
  },

  /**
   * Get comments for a task
   * @param {number} taskId - Task ID
   * @param {number} limit - Number of comments to return
   * @param {number} offset - Pagination offset
   * @returns {Promise<Array>} - Array of comments
   */
  async getComments(taskId, limit = 50, offset = 0) {
    const query = `
      SELECT 
        tc.*,
        u.first_name || ' ' || u.last_name as user_name,
        u.profile_image
      FROM task_comments tc
      JOIN users u ON tc.user_id = u.id
      WHERE tc.task_id = $1
      ORDER BY tc.created_at DESC
      LIMIT $2 OFFSET $3
    `;

    const { rows } = await db.query(query, [taskId, limit, offset]);
    return rows;
  },

  /**
   * Get task statistics by status
   * @param {number} projectId - Optional project ID to filter by
   * @returns {Promise<Array>} - Array of tasks grouped by status
   */
  async getTaskStats(projectId = null) {
    let query = `
      SELECT 
        status,
        COUNT(*) as count
      FROM tasks
    `;

    const queryParams = [];
    if (projectId) {
      query += ' WHERE project_id = $1';
      queryParams.push(projectId);
    }

    query += ' GROUP BY status ORDER BY count DESC';
    
    const { rows } = await db.query(query, queryParams);
    return rows;
  },

  /**
   * Track time spent on a task
   * @param {Object} timeData - Time tracking data
   * @returns {Promise<Object>} - Time entry object
   */
  async trackTime(timeData) {
    const { task_id, user_id, hours, minutes, description, work_date } = timeData;

    const query = `
      INSERT INTO task_time_entries (task_id, user_id, hours, minutes, description, work_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      task_id,
      user_id,
      hours || 0,
      minutes || 0,
      description,
      work_date || new Date()
    ];

    const { rows } = await db.query(query, values);
    
    // Update the actual hours on the task
    const total_hours = hours + (minutes / 60);
    await db.query(
      'UPDATE tasks SET actual_hours = COALESCE(actual_hours, 0) + $1 WHERE id = $2',
      [total_hours, task_id]
    );
    
    return rows[0];
  },

  /**
   * Get time entries for a task
   * @param {number} taskId - Task ID
   * @returns {Promise<Array>} - Array of time entries
   */
  async getTimeEntries(taskId) {
    const query = `
      SELECT 
        tte.*,
        u.first_name || ' ' || u.last_name as user_name
      FROM task_time_entries tte
      JOIN users u ON tte.user_id = u.id
      WHERE tte.task_id = $1
      ORDER BY tte.work_date DESC
    `;

    const { rows } = await db.query(query, [taskId]);
    return rows;
  },

  /**
   * Get overdue tasks
   * @param {number} limit - Number of tasks to return
   * @returns {Promise<Array>} - Array of overdue tasks
   */
  async getOverdueTasks(limit = 10) {
    const query = `
      SELECT t.*,
        p.title as project_title,
        a.first_name || ' ' || a.last_name as assignee_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users a ON t.assignee_id = a.id
      WHERE t.due_date < CURRENT_DATE AND t.status NOT IN ('completed', 'cancelled')
      ORDER BY t.due_date ASC
      LIMIT $1
    `;

    const { rows } = await db.query(query, [limit]);
    return rows;
  },

  /**
   * Get upcoming tasks due soon
   * @param {number} days - Number of days to look ahead
   * @param {number} limit - Number of tasks to return
   * @returns {Promise<Array>} - Array of upcoming tasks
   */
  async getUpcomingTasks(days = 7, limit = 10) {
    const query = `
      SELECT t.*,
        p.title as project_title,
        a.first_name || ' ' || a.last_name as assignee_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN users a ON t.assignee_id = a.id
      WHERE 
        t.due_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + interval '${days} days')
        AND t.status NOT IN ('completed', 'cancelled')
      ORDER BY t.due_date ASC
      LIMIT $1
    `;

    const { rows } = await db.query(query, [limit]);
    return rows;
  }
};

module.exports = TaskModel;