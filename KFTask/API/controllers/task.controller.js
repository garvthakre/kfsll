// const { validationResult } = require('express-validator');
// const TaskModel = require('../models/task.model');
// const ProjectModel = require('../models/project.model');
// const db = require('../config/db');
import { validationResult } from 'express-validator';
import TaskModel from '../models/task.model.js';
import ProjectModel from '../models/project.model.js';
import db from '../config/db.js';

/**
 * Task Controller
 * Handles task management operations
 */
const TaskController = {
  /**
   * Get all tasks with pagination and filters
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - List of tasks
   */
  async getAllTasks(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      // Build filters object from query parameters
      const filters = {
        project_id: req.query.project_id ? parseInt(req.query.project_id) : null,
        assignee_id: req.query.assignee_id ? parseInt(req.query.assignee_id) : null,
        created_by: req.query.created_by ? parseInt(req.query.created_by) : null,
        status: req.query.status,
        priority: req.query.priority,
        due_date_start: req.query.due_date_start,
        due_date_end: req.query.due_date_end,
        search: req.query.search,
        sort_by: req.query.sort_by,
        sort_order: req.query.sort_order
      };

      // Handle multiple status values
      if (req.query.status && req.query.status.includes(',')) {
        filters.status = req.query.status.split(',');
      }

      // Handle multiple priority values
      if (req.query.priority && req.query.priority.includes(',')) {
        filters.priority = req.query.priority.split(',');
      }

      // Remove undefined filters
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined || filters[key] === null) {
          delete filters[key];
        }
      });

      const tasks = await TaskModel.findAll(limit, offset, filters);
      const total = await TaskModel.countTotal(filters);

      return res.status(200).json({
        tasks,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get all tasks error:', error);
      return res.status(500).json({ message: 'Server error while fetching tasks' });
    }
  },
  /**
 * Get all tasks assigned to or created by the current user  
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async getMyTasksWITHIDANDTITLES(req, res) {
  try {
    const userId = req.user.id;
   

 

    const  tasks  = await TaskModel.findAllByUserIDANDTITLES(userId );

    return res.status(200).json({
      tasks
     
    });
  } catch (error) {
    console.error('Get my tasks error:', error);
    return res.status(500).json({ message: 'Server error while fetching my tasks' });
  }
},

async getMyTasks(req, res) {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));  
    const offset = (pageNum - 1) * limitNum;

    const { tasks, total } = await TaskModel.findAllByUser(userId, limitNum, offset);

    return res.status(200).json({
      tasks,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      }
    });
  } catch (error) {
    console.error('Get my tasks error:', error);
    return res.status(500).json({ message: 'Server error while fetching my tasks' });
  }
}


,
/**
 * Get all tasks (id and title only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async getAllTaskIdsAndTitles(req, res) {
  try {
    const tasks = await TaskModel.getAllTaskIdsAndTitles();
    return res.status(200).json({ tasks });
  } catch (error) {
    console.error('Get all task IDs and titles error:', error);
    return res.status(500).json({ message: 'Server error while fetching tasks' });
  }
}
,
 
  /**
   * Create a new task
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - New task details
   */
  async createTask(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        title,
        
        project_id,
        assignee_id,
       status,
        
        due_date,
       
      } = req.body;
       let taskStatus = status || 'new';
      // Check if project exists
      if (project_id) {
        const project = await ProjectModel.findById(project_id);
        if (!project) {
          return res.status(400).json({ message: 'Project not found' });
        }
        //  taskStatus = project.status;
      }

      // Create task
      const newTask = await TaskModel.create({
        title,
        
        project_id,
        assignee_id,
        status: taskStatus,
    
        due_date,
       
        created_by: req.user.id
      });

      // Log task creation
      await db.query(
        'INSERT INTO task_logs (task_id, user_id, action  ) VALUES ($1, $2, $3  )',
        [newTask.id, req.user.id, 'create' ]
      );

      return res.status(201).json({
        message: 'Task created successfully',
        task: newTask
      });
    } catch (error) {
      console.error('Create task error:', error);
      return res.status(500).json({ message: 'Server error while creating task' });
    }
  },

  /**
   * Update a task
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Updated task details
   */
  async updateTask(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const taskId = parseInt(req.params.id);
      
      // Check if task exists
      const existingTask = await TaskModel.findById(taskId);
      if (!existingTask) {
        return res.status(404).json({ message: 'Task not found' });
      }

      // Check if user has permission to update the task
      const isAdmin = req.user.role === 'admin';
      const isManager = req.user.role === 'manager';
      const isCreator = existingTask.created_by === req.user.id;
      const isAssignee = existingTask.assignee_id === req.user.id;
      
      if (!isAdmin && !isManager && !isCreator && !isAssignee) {
        return res.status(403).json({
          message: 'You do not have permission to update this task'
        });
      }

      // Update task
      const updatedTask = await TaskModel.update(taskId, req.body);

      // Log task update
      await db.query(
        'INSERT INTO task_logs (task_id, user_id, action, description) VALUES ($1, $2, $3, $4)',
        [taskId, req.user.id, 'update', `Task "${updatedTask.title}" updated`]
      );

      return res.status(200).json({
        message: 'Task updated successfully',
        task: updatedTask
      });
    } catch (error) {
      console.error('Update task error:', error);
      return res.status(500).json({ message: 'Server error while updating task' });
    }
  },

  /**
   * Delete a task
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Success message
   */
  async deleteTask(req, res) {
    try {
      const taskId = parseInt(req.params.id);

      // Check if task exists
      const task = await TaskModel.findById(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      // Check if user has permission to delete the task
      const isAdmin = req.user.role === 'admin';
      const isManager = req.user.role === 'manager';
      const isCreator = task.created_by === req.user.id;
      
      if (!isAdmin && !isManager && !isCreator) {
        return res.status(403).json({
          message: 'You do not have permission to delete this task'
        });
      }

      // Delete task
      await TaskModel.delete(taskId);

      return res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
      console.error('Delete task error:', error);
      return res.status(500).json({ message: 'Server error while deleting task' });
    }
  },
/// Updated portions of TaskController with verification changes

/**
 * Add daily update to task
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - New daily update details
 */
async addDailyUpdate(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const taskId = parseInt(req.params.id);
    const { content, update_date, status } = req.body;

    // Check if task exists
    const task = await TaskModel.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Determine the correct status based on input
    let dailyUpdateStatus = status;
    if (status === 'completed') {
      dailyUpdateStatus = 'completed_not_verified'; // Mark as completed but not verified
    }

    // Add daily update
    const dailyUpdate = await TaskModel.addDailyUpdate({
      task_id: taskId,
      user_id: req.user.id,
      content,
      update_date,
      status: dailyUpdateStatus
    });

    // Update task status if daily update status changed (but not to completed)
    if (status && status !== 'completed') {
      await db.query(
        'UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [status, taskId]
      );
    }

    // Get user details for response
    const { rows } = await db.query(
      'SELECT first_name || \' \' || last_name as user_name, profile_image FROM users WHERE id = $1',
      [req.user.id]
    );
    
    dailyUpdate.user_name = rows[0].user_name;
    dailyUpdate.profile_image = rows[0].profile_image;

    // Log daily update activity
    const logDescription = status === 'completed' 
      ? 'Added daily update - task marked completed (pending verification)'
      : `Added daily update - task status updated to ${status}`;

    await db.query(
      'INSERT INTO task_logs (task_id, user_id, action, description) VALUES ($1, $2, $3, $4)',
      [taskId, req.user.id, 'daily_update', logDescription]
    );

    return res.status(201).json({
      message: 'Daily update added successfully',
      daily_update: dailyUpdate,
      task_status_updated: status && status !== 'completed'
    });
  } catch (error) {
    console.error('Add daily update error:', error);
    return res.status(500).json({ message: 'Server error while adding daily update' });
  }
},

/**
 * Get all tasks with daily updates and filters
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - List of tasks with daily updates
 */
async getAllTasksWithDailyUpdates(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Build filters object from query parameters
    const filters = {
      task_id: req.query.task_id ? parseInt(req.query.task_id) : null,
      project_id: req.query.project_id ? parseInt(req.query.project_id) : null,
      created_by: req.query.created_by ? parseInt(req.query.created_by) : null,
      update_date_start: req.query.update_date_start,
      update_date_end: req.query.update_date_end
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined || filters[key] === null) {
        delete filters[key];
      }
    });

    const tasks = await TaskModel.findAllWithDailyUpdates(limit, offset, filters);
    const total = await TaskModel.countTotalWithDailyUpdates(filters);

    return res.status(200).json({
      tasks,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get all tasks with daily updates error:', error);
    return res.status(500).json({ message: 'Server error while fetching tasks with daily updates' });
  }
},

/**
 * Get tasks pending verification by vendor
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - List of tasks pending verification
 */
async getTasksPendingVerification(req, res) {
  try {
    const vendorUserId = req.user.id;

    // Verify user is a vendor
    if (req.user.role !== 'vendor') {
      return res.status(403).json({
        message: 'Access denied. Only vendors can access this resource.'
      });
    }

    const query = `
      SELECT 
        du.*,
        t.title AS task_title,
        u.first_name || ' ' || u.last_name AS assignee_name
      FROM daily_updates du
      JOIN tasks t ON du.task_id = t.id
      JOIN users u ON t.assignee_id = u.id
      WHERE du.status = 'completed_not_verified'
        AND t.created_by = $1   -- only tasks created by this vendor
      ORDER BY du.created_at DESC
    `;

    const { rows } = await db.query(query, [vendorUserId]);

    // if (rows.length === 0) {
    //   return res.status(404).json({
    //     message: 'No tasks pending verification for this vendor',
    //     tasks: []
    //   });
    // }

    return res.status(200).json({
      message: 'Tasks pending verification retrieved successfully',
      tasks: rows
    });
  } catch (error) {
    console.error('Get tasks pending verification error:', error);
    return res.status(500).json({
      message: 'Server error while fetching tasks pending verification'
    });
  }
}
,

/**
 * Verify task completion by vendor
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Verification result
 */
async verifyTaskCompletion(req, res) {
  try {
    const taskId = parseInt(req.params.id);
    const { verified, feedback, rating } = req.body;
    const vendorUserId = req.user.id;

    // Verify user is a vendor
    // if (req.user.role !== 'vendor') {
    //   return res.status(403).json({ 
    //     message: 'Access denied. Only vendors can verify task completion.' 
    //   });
    // }

    // Validate required fields
    if (typeof verified !== 'boolean') {
      return res.status(400).json({ 
        message: 'Verification status (verified) is required and must be boolean' 
      });
    }

    // Check if task exists and get assignee details
    const taskQuery = `
      SELECT t.*, u.working_for, u.first_name || ' ' || u.last_name as assignee_name
      FROM tasks t
      JOIN users u ON t.assignee_id = u.id
      WHERE t.id = $1
    `;
    
    const { rows: taskRows } = await db.query(taskQuery, [taskId]);
    
    if (taskRows.length === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const task = taskRows[0];

    // // Check if vendor has permission to verify this task
    // if (task.working_for !== vendorUserId) {
    //   return res.status(403).json({ 
    //     message: 'You do not have permission to verify this task' 
    //   });
    // }

    // Get the latest completed_not_verified daily update for this task
    const dailyUpdateQuery = `
      SELECT * FROM daily_updates 
      WHERE task_id = $1 AND status = 'completed_not_verified'
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    const { rows: updateRows } = await db.query(dailyUpdateQuery, [taskId]);
    
    if (updateRows.length === 0) {
      return res.status(400).json({ 
        message: 'No pending verification found for this task' 
      });
    }

    if (verified) {
      // Update daily update status to completed_verified
      await db.query(
        'UPDATE daily_updates SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['completed_verified', updateRows[0].id]
      );

      // Update task status to completed and set rating if provided
      if (rating !== undefined && rating !== null) {
        await db.query(
          'UPDATE tasks SET status = $1, rating = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
          ['completed', rating, taskId]
        );
      } else {
        await db.query(
          'UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['completed', taskId]
        );
      }

      // Log verification activity
      await db.query(
        'INSERT INTO task_logs (task_id, user_id, action, description) VALUES ($1, $2, $3, $4)',
        [taskId, vendorUserId, 'verify_completed', `Task completion verified and approved${rating ? ' with rating: ' + rating : ''}${feedback ? ': ' + feedback : ''}`]
      );
    } else {
      // Reset daily update status to in_progress
      await db.query(
        'UPDATE daily_updates SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['in_progress', updateRows[0].id]
      );

      // Reset task status to in_progress (rating stays unchanged)
      await db.query(
        'UPDATE tasks SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['in_progress', taskId]
      );

      // Log rejection activity
      await db.query(
        'INSERT INTO task_logs (task_id, user_id, action, description) VALUES ($1, $2, $3, $4)',
        [taskId, vendorUserId, 'verify_rejected', `Task completion rejected${feedback ? ': ' + feedback : ''}`]
      );
    }

    return res.status(200).json({
      message: verified ? 'Task completion verified successfully' : 'Task completion rejected',
      task_id: taskId,
      verified,
      feedback: feedback || null,
      rating: verified && rating ? rating : null
    });

  } catch (error) {
    console.error('Verify task completion error:', error);
    return res.status(500).json({ 
      message: 'Server error while verifying task completion' 
    });
  }
},
 

/**
 * Get daily updates for task
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - List of daily updates
 */
async getDailyUpdates(req, res) {
  try {
    const taskId = parseInt(req.params.id);
    
    // Check if task exists
    const task = await TaskModel.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const dailyUpdates = await TaskModel.getDailyUpdates(taskId, limit, offset);

    return res.status(200).json({ daily_updates: dailyUpdates });
  } catch (error) {
    console.error('Get daily updates error:', error);
    return res.status(500).json({ message: 'Server error while fetching daily updates' });
  }
},
 

// Replace the existing getTaskById method in TaskController with this updated version:

/**
 * Get task by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Task details
 */
async getTaskById(req, res) {
    try {
      const taskId = parseInt(req.params.id);
      
      const task = await TaskModel.findById(taskId);
      
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      // Get feedback (comments) for task
      const feedback = await TaskModel.getComments(taskId);
      task.feedback = feedback;

      // Get time entries for task
      const timeEntries = await TaskModel.getTimeEntries(taskId);
      task.time_entries = timeEntries;

      // Get daily updates for task
      const dailyUpdates = await TaskModel.getDailyUpdates(taskId);
      task.daily_updates = dailyUpdates;

      return res.status(200).json({ task });
    } catch (error) {
      console.error('Get task by ID error:', error);
      return res.status(500).json({ message: 'Server error while fetching task' });
    }
  },
 
 
/**
 * Add feedback to task
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - New feedback details
 */
async addFeedback(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const taskId = parseInt(req.params.id);
    const { content } = req.body;

    // Check if task exists
    const task = await TaskModel.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Add feedback
    const feedback = await TaskModel.addComment({
      task_id: taskId,
      user_id: req.user.id,
      content
    });

    // Get user details for response
    const { rows } = await db.query(
      'SELECT first_name || \' \' || last_name as user_name, profile_image FROM users WHERE id = $1',
      [req.user.id]
    );
    
    feedback.user_name = rows[0].user_name;
    feedback.profile_image = rows[0].profile_image;

    // Log feedback activity
    await db.query(
      'INSERT INTO task_logs (task_id, user_id, action, description) VALUES ($1, $2, $3, $4)',
      [taskId, req.user.id, 'feedback', 'Added feedback to task']
    );

    return res.status(201).json({
      message: 'Feedback added successfully',
      feedback
    });
  } catch (error) {
    console.error('Add feedback error:', error);
    return res.status(500).json({ message: 'Server error while adding feedback' });
  }
},

// Replace the existing getComments method with this (renamed to getFeedback):
/**
 * Get feedback for task
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - List of feedback
 */
async getFeedback(req, res) {
  try {
    const taskId = parseInt(req.params.id);
    
    // Check if task exists
    const task = await TaskModel.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    const feedback = await TaskModel.getComments(taskId, limit, offset);

    return res.status(200).json({ feedback });
  } catch (error) {
    console.error('Get feedback error:', error);
    return res.status(500).json({ message: 'Server error while fetching feedback' });
  }
},
  /**
   * Add comment to task
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - New comment details
   */
  async addComment(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const taskId = parseInt(req.params.id);
      const { content } = req.body;

      // Check if task exists
      const task = await TaskModel.findById(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      // Add comment
      const comment = await TaskModel.addComment({
        task_id: taskId,
        user_id: req.user.id,
        content
      });

      // Get user details for response
      const { rows } = await db.query(
        'SELECT first_name || \' \' || last_name as user_name, profile_image FROM users WHERE id = $1',
        [req.user.id]
      );
      
      comment.user_name = rows[0].user_name;
      comment.profile_image = rows[0].profile_image;

      // Log comment activity
      await db.query(
        'INSERT INTO task_logs (task_id, user_id, action, description) VALUES ($1, $2, $3, $4)',
        [taskId, req.user.id, 'comment', 'Added a comment to task']
      );

      return res.status(201).json({
        message: 'Comment added successfully',
        comment
      });
    } catch (error) {
      console.error('Add comment error:', error);
      return res.status(500).json({ message: 'Server error while adding comment' });
    }
  },

  /**
   * Get comments for task
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - List of comments
   */
  async getComments(req, res) {
    try {
      const taskId = parseInt(req.params.id);
      
      // Check if task exists
      const task = await TaskModel.findById(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const comments = await TaskModel.getComments(taskId, limit, offset);

      return res.status(200).json({ comments });
    } catch (error) {
      console.error('Get comments error:', error);
      return res.status(500).json({ message: 'Server error while fetching comments' });
    }
  },

  /**
   * Track time on task
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Time entry details
   */
  async trackTime(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const taskId = parseInt(req.params.id);
      const { hours, minutes, description, work_date } = req.body;

      // Check if task exists
      const task = await TaskModel.findById(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      // Add time entry
      const timeEntry = await TaskModel.trackTime({
        task_id: taskId,
        user_id: req.user.id,
        hours: parseFloat(hours) || 0,
        minutes: parseInt(minutes) || 0,
        description,
        work_date
      });

      // Get user details for response
      const { rows } = await db.query(
        'SELECT first_name || \' \' || last_name as user_name FROM users WHERE id = $1',
        [req.user.id]
      );
      
      timeEntry.user_name = rows[0].user_name;

      // Log time tracking activity
      await db.query(
        'INSERT INTO task_logs (task_id, user_id, action, description) VALUES ($1, $2, $3, $4)',
        [taskId, req.user.id, 'time_track', `Logged ${hours} hours and ${minutes} minutes on task`]
      );

      return res.status(201).json({
        message: 'Time tracked successfully',
        time_entry: timeEntry
      });
    } catch (error) {
      console.error('Track time error:', error);
      return res.status(500).json({ message: 'Server error while tracking time' });
    }
  },

  /**
   * Get time entries for task
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - List of time entries
   */
  async getTimeEntries(req, res) {
    try {
      const taskId = parseInt(req.params.id);
      
      // Check if task exists
      const task = await TaskModel.findById(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      const timeEntries = await TaskModel.getTimeEntries(taskId);

      return res.status(200).json({ time_entries: timeEntries });
    } catch (error) {
      console.error('Get time entries error:', error);
      return res.status(500).json({ message: 'Server error while fetching time entries' });
    }
  },

  /**
   * Get task statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Task statistics
   */
  async getTaskStats(req, res) {
    try {
      const projectId = req.query.project_id ? parseInt(req.query.project_id) : null;
      const stats = await TaskModel.getTaskStats(projectId);
      return res.status(200).json({ stats });
    } catch (error) {
      console.error('Get task stats error:', error);
      return res.status(500).json({ message: 'Server error while fetching task statistics' });
    }
  },

  /**
   * Get overdue tasks
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - List of overdue tasks
   */
  async getOverdueTasks(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 10;
      const tasks = await TaskModel.getOverdueTasks(limit);
      return res.status(200).json({ tasks });
    } catch (error) {
      console.error('Get overdue tasks error:', error);
      return res.status(500).json({ message: 'Server error while fetching overdue tasks' });
    }
  },

  /**
   * Get upcoming tasks
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - List of upcoming tasks
   */
  async getUpcomingTasks(req, res) {
    try {
      const days = parseInt(req.query.days) || 7;
      const limit = parseInt(req.query.limit) || 10;
      const tasks = await TaskModel.getUpcomingTasks(days, limit);
      return res.status(200).json({ tasks });
    } catch (error) {
      console.error('Get upcoming tasks error:', error);
      return res.status(500).json({ message: 'Server error while fetching upcoming tasks' });
    }
  }
};

 export default  TaskController;