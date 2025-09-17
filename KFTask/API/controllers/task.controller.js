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

      // Get comments for task
      const comments = await TaskModel.getComments(taskId);
      task.comments = comments;

      // Get time entries for task
      const timeEntries = await TaskModel.getTimeEntries(taskId);
      task.time_entries = timeEntries;

      return res.status(200).json({ task });
    } catch (error) {
      console.error('Get task by ID error:', error);
      return res.status(500).json({ message: 'Server error while fetching task' });
    }
  },

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
        description,
        project_id,
        assignee_id,
       
        priority,
        due_date,
        estimated_hours
      } = req.body;

      // Check if project exists
      if (project_id) {
        const project = await ProjectModel.findById(project_id);
        if (!project) {
          return res.status(400).json({ message: 'Project not found' });
        }
      }

      // Create task
      const newTask = await TaskModel.create({
        title,
        description,
        project_id,
        assignee_id,
        
        priority,
        due_date,
        estimated_hours,
        created_by: req.user.id
      });

      // Log task creation
      await db.query(
        'INSERT INTO task_logs (task_id, user_id, action, description) VALUES ($1, $2, $3, $4)',
        [newTask.id, req.user.id, 'create', `Task "${title}" created`]
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