const express = require('express');
const { Job } = require('../models');
const jobService = require('../services/jobService');
const { authenticate, authorize, optionalAuth } = require('../middleware/auth');
const { 
  validateJobCreation, 
  validateJobUpdate,
  validateObjectId,
  validatePaginationQuery,
  validateJobSearchQuery
} = require('../middleware/validation');

const router = express.Router();

/**
 * Job Routes for JobSync API
 * 
 * Handles job posting, searching, filtering, and management
 * Integrates with the existing jobService for business logic
 * 
 * @author JobSync Team
 * @version 1.0.0
 */

/**
 * @route   GET /api/jobs
 * @desc    Get all jobs with filtering and pagination
 * @access  Public
 */
router.get('/', validatePaginationQuery, validateJobSearchQuery, async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      location: req.query.location,
      employmentType: req.query.employment_type,
      isRemote: req.query.is_remote === 'true' ? true : req.query.is_remote === 'false' ? false : null,
      salaryMin: req.query.salary_min ? parseInt(req.query.salary_min) : null,
      search: req.query.search,
      sortBy: req.query.sort_by || 'posting_dates.posted_at',
      sortOrder: req.query.sort_order || 'desc'
    };

    const result = await jobService.getAllJobs(options);

    res.json({
      success: true,
      message: 'Jobs retrieved successfully',
      data: result
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get jobs',
      error: process.env.NODE_ENV === 'development' ? error.message : 'GET_JOBS_ERROR'
    });
  }
});

/**
 * @route   GET /api/jobs/featured
 * @desc    Get featured jobs
 * @access  Public
 */
router.get('/featured', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const jobs = await jobService.getFeaturedJobs(limit);

    res.json({
      success: true,
      message: 'Featured jobs retrieved successfully',
      data: {
        jobs,
        total: jobs.length
      }
    });
  } catch (error) {
    console.error('Get featured jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get featured jobs',
      error: process.env.NODE_ENV === 'development' ? error.message : 'GET_FEATURED_JOBS_ERROR'
    });
  }
});

/**
 * @route   GET /api/jobs/trending
 * @desc    Get trending jobs based on engagement
 * @access  Public
 */
router.get('/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const jobs = await jobService.getTrendingJobs(limit);

    res.json({
      success: true,
      message: 'Trending jobs retrieved successfully',
      data: {
        jobs,
        total: jobs.length
      }
    });
  } catch (error) {
    console.error('Get trending jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get trending jobs',
      error: process.env.NODE_ENV === 'development' ? error.message : 'GET_TRENDING_JOBS_ERROR'
    });
  }
});

/**
 * @route   GET /api/jobs/recommendations
 * @desc    Get job recommendations based on user profile or keywords
 * @access  Private (Job Seekers)
 */
router.get('/recommendations', authenticate, authorize('job_seeker'), async (req, res) => {
  try {
    const user = req.user;
    let keywords = [];

    // Extract keywords from query parameter
    if (req.query.keywords) {
      keywords = req.query.keywords.split(',').map(k => k.trim());
    } 
    // Extract keywords from user's resume/profile
    else if (user.job_seeker_profile?.resume?.parsed_data?.skills) {
      keywords = user.job_seeker_profile.resume.parsed_data.skills;
    }
    // Use desired positions as keywords
    else if (user.job_seeker_profile?.job_preferences?.desired_positions) {
      keywords = user.job_seeker_profile.job_preferences.desired_positions;
    }

    if (keywords.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No keywords available for recommendations. Please update your profile or provide keywords.',
        error: 'NO_KEYWORDS'
      });
    }

    const options = {
      limit: parseInt(req.query.limit) || 10,
      location: req.query.location || user.job_seeker_profile?.job_preferences?.preferred_locations?.[0],
      employmentType: req.query.employment_type,
      isRemote: req.query.is_remote,
      salaryMin: req.query.salary_min || user.job_seeker_profile?.job_preferences?.salary_expectations?.min_salary,
      page: parseInt(req.query.page) || 1
    };

    const recommendations = await jobService.getJobRecommendations(keywords, options);

    res.json({
      success: true,
      message: 'Job recommendations retrieved successfully',
      data: {
        jobs: recommendations,
        keywords_used: keywords,
        total: recommendations.length
      }
    });
  } catch (error) {
    console.error('Get recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job recommendations',
      error: process.env.NODE_ENV === 'development' ? error.message : 'GET_RECOMMENDATIONS_ERROR'
    });
  }
});

/**
 * @route   GET /api/jobs/recent
 * @desc    Get recently posted jobs
 * @access  Public
 */
router.get('/recent', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const limit = parseInt(req.query.limit) || 20;
    
    const jobs = await Job.getRecentJobs(days, limit);

    res.json({
      success: true,
      message: `Jobs posted in the last ${days} days retrieved successfully`,
      data: {
        jobs: jobs.map(job => job.toJSON()),
        total: jobs.length,
        days_filter: days
      }
    });
  } catch (error) {
    console.error('Get recent jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recent jobs',
      error: process.env.NODE_ENV === 'development' ? error.message : 'GET_RECENT_JOBS_ERROR'
    });
  }
});

/**
 * @route   GET /api/jobs/search
 * @desc    Advanced job search with multiple filters
 * @access  Public
 */
router.get('/search', validateJobSearchQuery, async (req, res) => {
  try {
    const {
      keywords,
      location,
      employment_type,
      is_remote,
      salary_min,
      salary_max,
      company,
      posted_within,
      experience_level,
      education_level
    } = req.query;

    const keywordArray = keywords ? keywords.split(',').map(k => k.trim()) : [];
    
    let query = { 'platform_data.is_active': true };
    
    // Keyword search
    if (keywordArray.length > 0) {
      query.$or = [
        { job_title: { $regex: keywordArray.join('|'), $options: 'i' } },
        { job_description: { $regex: keywordArray.join('|'), $options: 'i' } },
        { required_skills: { $in: keywordArray } },
        { 'ai_extracted_keywords.keyword': { $in: keywordArray } }
      ];
    }

    // Location filter
    if (location) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { job_city: { $regex: location, $options: 'i' } },
          { job_state: { $regex: location, $options: 'i' } }
        ]
      });
    }

    // Company filter
    if (company) {
      query.employer_name = { $regex: company, $options: 'i' };
    }

    // Employment type filter
    if (employment_type) {
      query.job_employment_type = employment_type;
    }

    // Remote work filter
    if (is_remote !== undefined) {
      query.job_is_remote = is_remote === 'true';
    }

    // Salary filters
    if (salary_min) {
      query['salary_range.min_salary'] = { $gte: parseInt(salary_min) };
    }
    if (salary_max) {
      query['salary_range.max_salary'] = { $lte: parseInt(salary_max) };
    }

    // Posted within filter
    if (posted_within) {
      const days = parseInt(posted_within);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      query['posting_dates.posted_at'] = { $gte: cutoffDate };
    }

    // Experience level filter
    if (experience_level) {
      query['experience_requirements.level'] = experience_level;
    }

    // Education level filter
    if (education_level) {
      query['education_requirements.min_degree'] = education_level;
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const sortBy = req.query.sort_by || 'posting_dates.posted_at';
    const sortOrder = req.query.sort_order === 'asc' ? 1 : -1;
    const sortOption = {};
    sortOption[sortBy] = sortOrder;

    const [jobs, total] = await Promise.all([
      Job.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limit),
      Job.countDocuments(query)
    ]);

    res.json({
      success: true,
      message: 'Job search completed successfully',
      data: {
        jobs: jobs.map(job => job.toJSON()),
        pagination: {
          current_page: page,
          total_pages: Math.ceil(total / limit),
          total_jobs: total,
          jobs_per_page: limit,
          has_next: page < Math.ceil(total / limit),
          has_prev: page > 1
        },
        search_criteria: {
          keywords: keywordArray,
          location,
          employment_type,
          is_remote: is_remote === 'true',
          salary_range: { min: salary_min, max: salary_max },
          company,
          posted_within,
          experience_level,
          education_level
        }
      }
    });
  } catch (error) {
    console.error('Job search error:', error);
    res.status(500).json({
      success: false,
      message: 'Job search failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'SEARCH_ERROR'
    });
  }
});

/**
 * @route   GET /api/jobs/stats
 * @desc    Get job statistics and analytics
 * @access  Private (Admin/Recruiter)
 */
router.get('/stats', authenticate, authorize('admin', 'recruiter'), async (req, res) => {
  try {
    const stats = await Job.getJobStats();

    res.json({
      success: true,
      message: 'Job statistics retrieved successfully',
      data: {
        stats: stats[0] || {
          total_jobs: 0,
          avg_views: 0,
          avg_applications: 0,
          total_views: 0,
          total_applications: 0
        }
      }
    });
  } catch (error) {
    console.error('Get job stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'GET_STATS_ERROR'
    });
  }
});

/**
 * @route   GET /api/jobs/:id
 * @desc    Get job by ID and track view
 * @access  Public
 */
router.get('/:id', validateObjectId('id'), optionalAuth, async (req, res) => {
  try {
    const job = await jobService.getJobById(req.params.id);

    res.json({
      success: true,
      message: 'Job retrieved successfully',
      data: {
        job
      }
    });
  } catch (error) {
    console.error('Get job error:', error);
    
    if (error.message === 'Job not found') {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
        error: 'JOB_NOT_FOUND'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to get job',
      error: process.env.NODE_ENV === 'development' ? error.message : 'GET_JOB_ERROR'
    });
  }
});

/**
 * @route   POST /api/jobs
 * @desc    Create a new job posting
 * @access  Private (Recruiter/Admin)
 */
router.post('/', authenticate, authorize('recruiter', 'admin'), validateJobCreation, async (req, res) => {
  try {
    const jobData = {
      ...req.body,
      posted_by: req.user._id
    };

    const job = await jobService.createJob(jobData);

    // Increment user's total jobs posted
    await req.user.updateOne({ $inc: { 'activity.total_jobs_posted': 1 } });

    res.status(201).json({
      success: true,
      message: 'Job posted successfully',
      data: {
        job
      }
    });
  } catch (error) {
    console.error('Create job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create job',
      error: process.env.NODE_ENV === 'development' ? error.message : 'CREATE_JOB_ERROR'
    });
  }
});

/**
 * @route   PUT /api/jobs/:id
 * @desc    Update job posting
 * @access  Private (Recruiter/Admin - owner only)
 */
router.put('/:id', authenticate, authorize('recruiter', 'admin'), validateObjectId('id'), validateJobUpdate, async (req, res) => {
  try {
    // Check if user owns the job or is admin
    const existingJob = await Job.findById(req.params.id);
    if (!existingJob) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
        error: 'JOB_NOT_FOUND'
      });
    }

    if (req.user.auth.role !== 'admin' && existingJob.posted_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own job postings',
        error: 'ACCESS_DENIED'
      });
    }

    const job = await jobService.updateJob(req.params.id, req.body);

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: {
        job
      }
    });
  } catch (error) {
    console.error('Update job error:', error);
    
    if (error.message === 'Job not found') {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
        error: 'JOB_NOT_FOUND'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update job',
      error: process.env.NODE_ENV === 'development' ? error.message : 'UPDATE_JOB_ERROR'
    });
  }
});

/**
 * @route   DELETE /api/jobs/:id
 * @desc    Delete (deactivate) job posting
 * @access  Private (Recruiter/Admin - owner only)
 */
router.delete('/:id', authenticate, authorize('recruiter', 'admin'), validateObjectId('id'), async (req, res) => {
  try {
    // Check if user owns the job or is admin
    const existingJob = await Job.findById(req.params.id);
    if (!existingJob) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
        error: 'JOB_NOT_FOUND'
      });
    }

    if (req.user.auth.role !== 'admin' && existingJob.posted_by.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own job postings',
        error: 'ACCESS_DENIED'
      });
    }

    const result = await jobService.deleteJob(req.params.id);

    res.json({
      success: true,
      message: result.message,
      data: {
        job: result.job
      }
    });
  } catch (error) {
    console.error('Delete job error:', error);
    
    if (error.message === 'Job not found') {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
        error: 'JOB_NOT_FOUND'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to delete job',
      error: process.env.NODE_ENV === 'development' ? error.message : 'DELETE_JOB_ERROR'
    });
  }
});

/**
 * @route   POST /api/jobs/bulk-import
 * @desc    Bulk import jobs from external APIs
 * @access  Private (Admin only)
 */
router.post('/bulk-import', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { jobs } = req.body;
    
    if (!jobs || !Array.isArray(jobs) || jobs.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Jobs array is required and must not be empty',
        error: 'INVALID_INPUT'
      });
    }

    const result = await jobService.bulkImportJobs(jobs);

    res.json({
      success: true,
      message: 'Bulk import completed',
      data: result
    });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({
      success: false,
      message: 'Bulk import failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'BULK_IMPORT_ERROR'
    });
  }
});

module.exports = router;
