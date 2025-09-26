// const { validationResult } = require('express-validator');
// const ProjectModel = require('../models/project.model');
// const db = require('../config/db');
import { validationResult } from 'express-validator';
import ProjectModel from '../models/project.model.js';
import db from '../config/db.js';

/**
 * Project Controller
 * Handles project management operations
 */
const ProjectController = {
  /**
   * Get all projects with pagination and filters
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - List of projects
   */
  async getAllProjects(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const offset = (page - 1) * limit;

      // Build filters object from query parameters
      const filters = {
        status: req.query.status,
        department: req.query.department,
        manager_id: req.query.manager_id ? parseInt(req.query.manager_id) : null,
        client_id: req.query.client_id ? parseInt(req.query.client_id) : null,
        priority: req.query.priority,
        project_type: req.query.project_type, // Added project_type filter
        search: req.query.search,
        sort_by: req.query.sort_by,
        sort_order: req.query.sort_order
      };

      // Remove undefined filters
      Object.keys(filters).forEach(key => {
        if (filters[key] === undefined || filters[key] === null) {
          delete filters[key];
        }
      });

      const projects = await ProjectModel.findAll(limit, offset, filters);
      const total = await ProjectModel.countTotal(filters);

      return res.status(200).json({
        projects,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      console.error('Get all projects error:', error);
      return res.status(500).json({ message: 'Server error while fetching projects' });
    }
  },
async getAllProjectIdsAndTitles(req, res) {
  try {
    const projects = await ProjectModel.getAllProjectIdsAndTitles();
    return res.status(200).json({ projects });
  } catch (error) {
    console.error('Get all project IDs and titles error:', error);
    return res.status(500).json({ message: 'Server error while fetching projects' });
  }
}
,
  /**
   * Get project by ID
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Project details
   */
  async getProjectById(req, res) {
    try {
      const projectId = parseInt(req.params.id);
      
      const project = await ProjectModel.findById(projectId);
      
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Get team members for project
      const teamMembers = await ProjectModel.getTeamMembers(projectId);
      project.team_members = teamMembers;

      return res.status(200).json({ project });
    } catch (error) {
      console.error('Get project by ID error:', error);
      return res.status(500).json({ message: 'Server error while fetching project' });
    }
  },

  /**
   * Create a new project
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - New project details
   */
/**
 * Create a new project
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - New project details
 */
async createProject(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

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
      project_type,
    } = req.body;

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Ensure proper NULL handling
      const safeProjectType = project_type ?? null;

      const newProject = await ProjectModel.create({
        title,
        description,
        client_id,
        start_date,
        end_date,
        status,
        budget,
        manager_id: manager_id || req.user.id,
        department,
        priority,
        project_type: safeProjectType,
      });

      await client.query(
        'INSERT INTO project_logs (project_id, user_id, action, description) VALUES ($1, $2, $3, $4)',
        [newProject.id, req.user.id, 'create', `Project "${title}" created`]
      );

      await client.query('COMMIT');

      const project = await ProjectModel.findById(newProject.id);

      return res.status(201).json({
        message: 'Project created successfully',
        project,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Create project error:', error);
    return res.status(500).json({ message: 'Server error while creating project' });
  }
},
/**
 * Get projects made by current user or assigned to current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object  
 * @returns {Object} - List of user's projects with id, title, start_date, end_date
 */
async getMyProjects(req, res) {
  try {
    const userId = req.user.id;
    const projects = await ProjectModel.getMyProjects(userId);
    return res.status(200).json({ projects });
  } catch (error) {
    console.error('Get my projects error:', error);
    return res.status(500).json({ message: 'Server error while fetching your projects' });
  }
},

/**
 * Get all tasks for a specific project
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - List of project tasks
 */
async getProjectTasks(req, res) {
  try {
    const projectId = parseInt(req.params.id);
   

    // Check if project exists
    const project = await ProjectModel.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

 

    // Get tasks for the project
    const tasks = await ProjectModel.getProjectTasks(projectId);
 

    return res.status(200).json({
      project: {
        id: project.id,
        title: project.title,
        status: project.status,
        manager_name: project.manager_name
      },
      tasks
  
    });
  } catch (error) {
    console.error('Get project tasks error:', error);
    return res.status(500).json({ message: 'Server error while fetching project tasks' });
  }
},


/**
 * Update a project (Simplified version - similar to create)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - Updated project details
 */
async updateProject(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const projectId = parseInt(req.params.id);

    // Check if project exists
    const existingProject = await ProjectModel.findById(projectId);
    if (!existingProject) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check permission: only admin or manager
    if (req.user.role !== 'admin' && existingProject.manager_id !== req.user.id) {
      return res.status(403).json({ message: 'You do not have permission to update this project' });
    }

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
      project_type
    } = req.body;

    // Use a transaction
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      // Update project with direct values (no COALESCE)
      const updatedProject = await ProjectModel.update(projectId, {
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
        project_type
      });

      // Log project update
      await client.query(
        'INSERT INTO project_logs (project_id, user_id, action, description) VALUES ($1, $2, $3, $4)',
        [projectId, req.user.id, 'update', `Project "${updatedProject.title}" updated`]
      );

      await client.query('COMMIT');

      // Get updated project with all details
      const project = await ProjectModel.findById(projectId);

      return res.status(200).json({
        message: 'Project updated successfully',
        project
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Update project error:', error);
    return res.status(500).json({ message: 'Server error while updating project' });
  }
}
,

  /**
   * Delete a project
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Success message
   */
  async deleteProject(req, res) {
    try {
      const projectId = parseInt(req.params.id);

      // Check if project exists
      const project = await ProjectModel.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Only admin or the project manager can delete the project
      if (
        req.user.role !== 'admin' && 
        project.manager_id !== req.user.id
      ) {
        return res.status(403).json({
          message: 'You do not have permission to delete this project'
        });
      }

      // Delete project
      await ProjectModel.delete(projectId);

      return res.status(200).json({ message: 'Project deleted successfully' });
    } catch (error) {
      console.error('Delete project error:', error);
      return res.status(500).json({ message: 'Server error while deleting project' });
    }
  },

  /**
   * Add team member to project
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Team member details
   */
  async addTeamMember(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const projectId = parseInt(req.params.id);
      const { user_id, role } = req.body;

      // Check if project exists
      const project = await ProjectModel.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Only admin or the project manager can add team members
      if (
        req.user.role !== 'admin' && 
        project.manager_id !== req.user.id
      ) {
        return res.status(403).json({
          message: 'You do not have permission to modify project team'
        });
      }

      // Add team member
      const teamMember = await ProjectModel.addTeamMember(
        projectId, 
        user_id, 
        role || 'member'
      );

      // Log team member addition
      await db.query(
        'INSERT INTO project_logs (project_id, user_id, action, description) VALUES ($1, $2, $3, $4)',
        [projectId, req.user.id, 'add_team_member', `Team member (${user_id}) added to project`]
      );

      return res.status(200).json({
        message: 'Team member added successfully',
        team_member: teamMember
      });
    } catch (error) {
      console.error('Add team member error:', error);
      return res.status(500).json({ message: 'Server error while adding team member' });
    }
  },

  /**
   * Remove team member from project
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Success message
   */
  async removeTeamMember(req, res) {
    try {
      const projectId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);

      // Check if project exists
      const project = await ProjectModel.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: 'Project not found' });
      }

      // Only admin or the project manager can remove team members
      if (
        req.user.role !== 'admin' && 
        project.manager_id !== req.user.id
      ) {
        return res.status(403).json({
          message: 'You do not have permission to modify project team'
        });
      }

      // Remove team member
      const success = await ProjectModel.removeTeamMember(projectId, userId);
      
      if (!success) {
        return res.status(404).json({ message: 'Team member not found in project' });
      }

      // Log team member removal
      await db.query(
        'INSERT INTO project_logs (project_id, user_id, action, description) VALUES ($1, $2, $3, $4)',
        [projectId, req.user.id, 'remove_team_member', `Team member (${userId}) removed from project`]
      );

      return res.status(200).json({ message: 'Team member removed successfully' });
    } catch (error) {
      console.error('Remove team member error:', error);
      return res.status(500).json({ message: 'Server error while removing team member' });
    }
  },
  /**
 * Get all available project types
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - List of project types
 */
  async getProjectTypes(req, res) {
  try {
    const projectTypes = [
      'internal',
      'client_project', 
      'research',
      'web_development',
      'mobile_app',
      'consulting',
      'design',
      'data_analysis',
      'infrastructure',
      'marketing',
      'maintenance',
      'training'
    ];

    return res.status(200).json({
      project_types: projectTypes
    });
  } catch (error) {
    console.error('Get project types error:', error);
    return res.status(500).json({ message: 'Server error while fetching project types' });
  }
},
/**
 * Get all available project statuses
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - List of project statuses
 */
async getProjectStatuses(req, res) {
  try {
    const projectStatuses = [
      'planning',
      'in_progress',
      'on_hold',
      'completed',
      'cancelled'
    ];

    return res.status(200).json({
      project_statuses: projectStatuses,
      total: projectStatuses.length
    });
  } catch (error) {
    console.error('Get project statuses error:', error);
    return res.status(500).json({ message: 'Server error while fetching project statuses' });
  }
},

/**
 * Get all available project priorities
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} - List of project priorities
 */
async getProjectPriorities(req, res) {
  try {
    const projectPriorities = [
      'low',
      'medium',
      'high',
      'urgent'
    ];

    return res.status(200).json({
      project_priorities: projectPriorities,
      total: projectPriorities.length
    });
  } catch (error) {
    console.error('Get project priorities error:', error);
    return res.status(500).json({ message: 'Server error while fetching project priorities' });
  }
},
  /**
   * Get project statistics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @returns {Object} - Project statistics
   */
  async getProjectStats(req, res) {
    try {
      const stats = await ProjectModel.getProjectStats();
      return res.status(200).json({ stats });
    } catch (error) {
      console.error('Get project stats error:', error);
      return res.status(500).json({ message: 'Server error while fetching project statistics' });
    }
  }
};

export default ProjectController;