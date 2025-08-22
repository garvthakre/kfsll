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
        team_members
      } = req.body;

      // Create transaction
      const client = await db.pool.connect();
      
      try {
        // Start transaction
        await client.query('BEGIN');

        // Create project
        const newProject = await ProjectModel.create({
          title,
          description,
          client_id,
          start_date,
          end_date,
          status,
          budget,
          manager_id: manager_id || req.user.id, // Default to current user if not specified
          department,
          priority
        });

        // Add team members if provided
        if (team_members && Array.isArray(team_members)) {
          for (const member of team_members) {
            await ProjectModel.addTeamMember(
              newProject.id, 
              member.user_id, 
              member.role || 'member'
            );
          }
        }

        // Log project creation
        await client.query(
          'INSERT INTO project_logs (project_id, user_id, action, description) VALUES ($1, $2, $3, $4)',
          [newProject.id, req.user.id, 'create', `Project "${title}" created`]
        );

        // Commit transaction
        await client.query('COMMIT');

        // Get updated project with team members
        const project = await ProjectModel.findById(newProject.id);
        project.team_members = await ProjectModel.getTeamMembers(newProject.id);

        return res.status(201).json({
          message: 'Project created successfully',
          project
        });
      } catch (err) {
        // Rollback transaction on error
        await client.query('ROLLBACK');
        throw err;
      } finally {
        // Release client
        client.release();
      }
    } catch (error) {
      console.error('Create project error:', error);
      return res.status(500).json({ message: 'Server error while creating project' });
    }
  },

  /**
   * Update a project
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

      // Check if user has permission to update the project
      if (
        req.user.role !== 'admin' && 
        existingProject.manager_id !== req.user.id
      ) {
        return res.status(403).json({
          message: 'You do not have permission to update this project'
        });
      }

      // Update project
      const updatedProject = await ProjectModel.update(projectId, req.body);

      // Log project update
      await db.query(
        'INSERT INTO project_logs (project_id, user_id, action, description) VALUES ($1, $2, $3, $4)',
        [projectId, req.user.id, 'update', `Project "${updatedProject.title}" updated`]
      );

      return res.status(200).json({
        message: 'Project updated successfully',
        project: updatedProject
      });
    } catch (error) {
      console.error('Update project error:', error);
      return res.status(500).json({ message: 'Server error while updating project' });
    }
  },

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