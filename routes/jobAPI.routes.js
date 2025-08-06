const express = require('express');
const { optionalAuth } = require('../middleware/auth.middleware.js');
const jobFetcher = require('../services/jobFetcher.js');
const Job = require('../models/job.js');

const jobRouter = express.Router();

// Get jobs with filters
jobRouter.get('/', async (req, res) => {
  try {
    const filters = {
      category: req.query.category,
      location: req.query.location,
      jobType: req.query.jobType,
      search: req.query.search,
      page: req.query.page || 1,
      limit: req.query.limit || 20,
    };

    const result = await jobFetcher.getJobs(filters);
    // console.log("result inside of jobAPI(/api/jobs) route: ",result);
    res.json({
      success: true,
      data: result.jobs,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('Error fetching jobs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch jobs',
      error: error.message,
    });
  }
});

// Get job categories
jobRouter.get('/categories', async (req, res) => {
  try {
    const categories = await Job.distinct('category', { isActive: true });
    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
    });
  }
});

// Get job locations
jobRouter.get('/locations', async (req, res) => {
  try {
    const locations = await Job.distinct('location', { isActive: true });
    res.json({
      success: true,
      data: locations,
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch locations',
    });
  }
});

// Get job fetcher status
jobRouter.get('/status', optionalAuth, async (req, res) => {
  try {
    const status = jobFetcher.getStatus();
    const jobCount = await Job.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: {
        ...status,
        totalJobs: jobCount,
      },
    });
  } catch (error) {
    console.error('Error fetching status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch status',
    });
  }
});

// Manual job fetch trigger
jobRouter.post('/fetch', optionalAuth, async (req, res) => {
  try {
    jobFetcher.manualFetch();
    res.json({
      success: true,
      message: 'Job fetch process started',
    });
  } catch (error) {
    console.error('Error triggering manual fetch:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger job fetch',
    });
  }
});

module.exports = jobRouter;
