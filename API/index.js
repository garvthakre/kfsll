import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import https from 'https';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import swaggerJSDoc from 'swagger-jsdoc';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import companyRoutes from './routes/companyRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import personnelRoutes from './routes/personnelRoutes.js';
import achievementRoutes from './routes/achievementsRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import articleRoutes from './routes/articleRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import connectionRoutes from './routes/connectionRoutes.js';
import searchRoutes from './routes/searchRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import masterRoutes from './routes/masterRoutes.js';
import businessRoutes from './routes/businessRoutes.js'; // Fixed typo

dotenv.config();
const app = express();

const certificate = fs.readFileSync('./security/knowforthonline.crt');
const ca = fs.readFileSync('./security/knowforthonline.ca-bundle');
const privatekey = fs.readFileSync('./security/knowforthonline.key');

// Create the credentials object
const credentials = {
  key: privatekey,
  ca: ca,
  cert: certificate,
 };

// Swagger configuration
const swaggerSpec = swaggerJSDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Connect B2B API',
      version: '1.0.0',
      description: 'API docs for Connect B2B backend',
    },
    servers: [
      {
        url: 'https://knowforth.online:7056/api',
        description: 'API for Connect B2B',
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
  },
  apis: ['./routes/*.js'],  
});

// Middleware
app.use(cors());

app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/address', addressRoutes);
app.use('/api/personnel', personnelRoutes);
app.use('/api/achievement', achievementRoutes);
app.use('/api/project', projectRoutes);
app.use('/api/article', articleRoutes);
app.use('/api/message', messageRoutes);
app.use('/api/connection', connectionRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/sub', subscriptionRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/master', masterRoutes);
// app.use('/api/business', businessRoutes);  

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Connect B2B Backend API is running!' });
});

const PORT = process.env.PORT || 7056;
https.createServer(credentials, app).listen(PORT,'0.0.0.0', () => {
//app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger docs: https://localhost:${PORT}/api-docs`);
});