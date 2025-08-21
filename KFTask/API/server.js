//const express = require('express');
// const cors = require('cors');
// const helmet = require('helmet');
// const morgan = require('morgan');
// const path = require('path');
// const dotenv = require('dotenv');
// const swaggerUI = require('swagger-ui-express');
// const swaggerJsDoc = require('swagger-jsdoc');

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

// Import routes
// const authRoutes = require('./routes/auth.routes');
// const userRoutes = require('./routes/user.routes');
// const projectRoutes = require('./routes/project.routes');
// const taskRoutes = require('./routes/task.routes');
// const vendorRoutes = require('./routes/vendor.routes');
// const reportRoutes = require('./routes/report.routes');

import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import taskRoutes from './routes/task.routes.js';
import vendorRoutes from './routes/vendor.routes.js';
import reportRoutes from './routes/report.routes.js';


// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 7057;

// Swagger definition
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'KF Task Manager API',
      version: '1.0.0',
      description: 'API documentation for the KF Task Manager application',
      contact: {
        name: 'API Support',
        email: 'support@kf-taskmanager.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.js'], // Path to the API routes
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Documentation Route
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/reports', reportRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'UP', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {},
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API Documentation available at http://localhost:${PORT}/api-docs`);
});