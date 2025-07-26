/**
 * Routes Index - Central routing configuration
 * 
 * This file sets up all API routes and provides
 * a centralized way to manage route registration
 * 
 * @author JobSync Team
 * @version 1.0.0
 */

const express = require('express');
const userRoutes = require('./users');
const jobRoutes = require('./jobs');
const applicationRoutes = require('./applications');

const router = express.Router();

// API versioning and route registration
router.use('/users', userRoutes);
router.use('/jobs', jobRoutes);
router.use('/applications', applicationRoutes);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'JobSync API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    status: 'healthy'
  });
});

// API info endpoint
router.get('/info', (req, res) => {
  res.json({
    success: true,
    message: 'JobSync API Information',
    data: {
      name: 'JobSync API',
      version: '1.0.0',
      description: 'AI-powered job platform with comprehensive user and job management',
      features: [
        'User Authentication & Authorization',
        'Job Posting & Management',
        'Application Tracking System',
        'AI-powered Job Recommendations',
        'Advanced Search & Filtering',
        'Real-time Analytics'
      ],
      endpoints: {
        users: '/api/users',
        jobs: '/api/jobs',
        applications: '/api/applications'
      },
      documentation: {
        postman_collection: '/api/docs/postman',
        swagger: '/api/docs/swagger'
      }
    }
  });
});

// 404 handler for undefined routes
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    error: 'ROUTE_NOT_FOUND',
    available_routes: [
      'GET /api/health',
      'GET /api/info',
      'POST /api/users/register',
      'POST /api/users/login',
      'GET /api/users/profile',
      'GET /api/jobs',
      'GET /api/jobs/featured',
      'GET /api/jobs/trending',
      'POST /api/applications'
    ]
  });
});

module.exports = router;
