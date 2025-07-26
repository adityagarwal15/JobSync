const express = require('express');
const { Application, Job, User } = require('../models');
const { authenticate, authorize, checkResourceOwnership } = require('../middleware/auth');
const { 
  validateApplicationCreation, 
  validateApplicationStatusUpdate,
  validateObjectId,
  validatePaginationQuery
} = require('../middleware/validation');

const router = express.Router();

/**
 * Application Routes for JobSync API
 * 
 * Handles job applications, status tracking, interview scheduling,
 * and communication between job seekers and recruiters
 * 
 * @author JobSync Team
 * @version 1.0.0
 */

/**
 * @route   POST /api/applications
 * @desc    Create a new job application
 * @access  Private (Job Seekers)
 */
router.post('/', authenticate, authorize('job_seeker'), validateApplicationCreation, async (req, res) => {
  try {
    const { job_id, application_data, preferences } = req.body;

    // Check if job exists and is active
    const job = await Job.findOne({ 
      _id: job_id, 
      'platform_data.is_active': true 
    });
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found or no longer active',
        error: 'JOB_NOT_FOUND'
      });
    }

    // Check if user has already applied to this job
    const existingApplication = await Application.findOne({
      job_id,
      applicant_id: req.user._id
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already applied to this job',
        error: 'DUPLICATE_APPLICATION'
      });
    }

    // Create application
    const applicationData = {
      job_id,
      applicant_id: req.user._id,
      application_data: {
        ...application_data,
        resume: {
          ...application_data.resume,
          uploaded_at: new Date()
        }
      },
      preferences,
      timeline: [{
        status: 'applied',
        timestamp: new Date(),
        notes: 'Application submitted',
        automated: true
      }],
      applied_via: {
        platform: 'jobsync',
        ip_address: req.ip,
        user_agent: req.get('User-Agent')
      }
    };

    const application = new Application(applicationData);
    await application.save();

    // Update job application count
    await job.incrementApplicationCount();

    // Update user's total applications count
    await req.user.updateOne({ $inc: { 'activity.total_applications': 1 } });

    // Populate application with job and user details
    await application.populate('job_id', 'job_title employer_name job_city job_state');
    await application.populate('applicant_id', 'personal_info.first_name personal_info.last_name personal_info.email');

    res.status(201).json({
      success: true,
      message: 'Application submitted successfully',
      data: {
        application: application.toJSON()
      }
    });
  } catch (error) {
    console.error('Create application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: process.env.NODE_ENV === 'development' ? error.message : 'CREATE_APPLICATION_ERROR'
    });
  }
});

/**
 * @route   GET /api/applications
 * @desc    Get user's applications or applications for recruiter's jobs
 * @access  Private
 */
router.get('/', authenticate, validatePaginationQuery, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status = null,
      job_id = null
    } = req.query;

    let applications;
    let total;

    if (req.user.auth.role === 'job_seeker') {
      // Job seeker sees their own applications
      const options = { 
        status, 
        limit: parseInt(limit), 
        page: parseInt(page) 
      };
      
      applications = await Application.findByApplicant(req.user._id, options);
      total = await Application.countDocuments({ 
        applicant_id: req.user._id,
        ...(status && { status })
      });
    } else if (req.user.auth.role === 'recruiter') {
      // Recruiter sees applications for their jobs
      const recruiterJobs = await Job.find({ 
        posted_by: req.user._id,
        'platform_data.is_active': true
      }).select('_id');
      
      const jobIds = recruiterJobs.map(job => job._id);
      
      let query = { job_id: { $in: jobIds } };
      if (status) query.status = status;
      if (job_id) query.job_id = job_id;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      applications = await Application.find(query)
        .populate('job_id', 'job_title employer_name job_city job_state')
        .populate('applicant_id', 'personal_info.first_name personal_info.last_name personal_info.email personal_info.phone')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
        
      total = await Application.countDocuments(query);
    } else {
      // Admin sees all applications
      let query = {};
      if (status) query.status = status;
      if (job_id) query.job_id = job_id;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      applications = await Application.find(query)
        .populate('job_id', 'job_title employer_name job_city job_state')
        .populate('applicant_id', 'personal_info.first_name personal_info.last_name personal_info.email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));
        
      total = await Application.countDocuments(query);
    }

    res.json({
      success: true,
      message: 'Applications retrieved successfully',
      data: {
        applications: applications.map(app => app.toJSON()),
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / parseInt(limit)),
          total_applications: total,
          applications_per_page: parseInt(limit),
          has_next: parseInt(page) < Math.ceil(total / parseInt(limit)),
          has_prev: parseInt(page) > 1
        }
      }
    });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get applications',
      error: process.env.NODE_ENV === 'development' ? error.message : 'GET_APPLICATIONS_ERROR'
    });
  }
});

/**
 * @route   GET /api/applications/:id
 * @desc    Get application by ID
 * @access  Private (Application owner, Job poster, Admin)
 */
router.get('/:id', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job_id')
      .populate('applicant_id', '-auth.password');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
        error: 'APPLICATION_NOT_FOUND'
      });
    }

    // Check if user has permission to view this application
    const isApplicant = application.applicant_id._id.toString() === req.user._id.toString();
    const isJobPoster = application.job_id.posted_by?.toString() === req.user._id.toString();
    const isAdmin = req.user.auth.role === 'admin';

    if (!isApplicant && !isJobPoster && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        error: 'ACCESS_DENIED'
      });
    }

    res.json({
      success: true,
      message: 'Application retrieved successfully',
      data: {
        application: application.toJSON()
      }
    });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get application',
      error: process.env.NODE_ENV === 'development' ? error.message : 'GET_APPLICATION_ERROR'
    });
  }
});

/**
 * @route   PUT /api/applications/:id/status
 * @desc    Update application status
 * @access  Private (Recruiter/Admin for job)
 */
router.put('/:id/status', authenticate, validateObjectId('id'), validateApplicationStatusUpdate, async (req, res) => {
  try {
    const { status, notes } = req.body;

    const application = await Application.findById(req.params.id)
      .populate('job_id');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
        error: 'APPLICATION_NOT_FOUND'
      });
    }

    // Check if user has permission to update this application
    const isJobPoster = application.job_id.posted_by?.toString() === req.user._id.toString();
    const isAdmin = req.user.auth.role === 'admin';

    if (!isJobPoster && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the job poster can update application status',
        error: 'ACCESS_DENIED'
      });
    }

    await application.updateStatus(status, notes, req.user._id);

    res.json({
      success: true,
      message: 'Application status updated successfully',
      data: {
        application: application.toJSON()
      }
    });
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'UPDATE_STATUS_ERROR'
    });
  }
});

/**
 * @route   POST /api/applications/:id/schedule-interview
 * @desc    Schedule an interview for an application
 * @access  Private (Recruiter/Admin for job)
 */
router.post('/:id/schedule-interview', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const {
      type,
      scheduled_at,
      duration_minutes = 60,
      location,
      interviewer
    } = req.body;

    // Validate required fields
    if (!type || !scheduled_at) {
      return res.status(400).json({
        success: false,
        message: 'Interview type and scheduled time are required',
        error: 'MISSING_REQUIRED_FIELDS'
      });
    }

    const application = await Application.findById(req.params.id)
      .populate('job_id');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
        error: 'APPLICATION_NOT_FOUND'
      });
    }

    // Check permissions
    const isJobPoster = application.job_id.posted_by?.toString() === req.user._id.toString();
    const isAdmin = req.user.auth.role === 'admin';

    if (!isJobPoster && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the job poster can schedule interviews',
        error: 'ACCESS_DENIED'
      });
    }

    const interviewData = {
      type,
      scheduled_at: new Date(scheduled_at),
      duration_minutes,
      location,
      interviewer
    };

    await application.scheduleInterview(interviewData);

    res.json({
      success: true,
      message: 'Interview scheduled successfully',
      data: {
        application: application.toJSON()
      }
    });
  } catch (error) {
    console.error('Schedule interview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to schedule interview',
      error: process.env.NODE_ENV === 'development' ? error.message : 'SCHEDULE_INTERVIEW_ERROR'
    });
  }
});

/**
 * @route   POST /api/applications/:id/extend-offer
 * @desc    Extend a job offer to an applicant
 * @access  Private (Recruiter/Admin for job)
 */
router.post('/:id/extend-offer', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const {
      salary_offered,
      benefits = [],
      start_date,
      offer_expires_at
    } = req.body;

    const application = await Application.findById(req.params.id)
      .populate('job_id');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
        error: 'APPLICATION_NOT_FOUND'
      });
    }

    // Check permissions
    const isJobPoster = application.job_id.posted_by?.toString() === req.user._id.toString();
    const isAdmin = req.user.auth.role === 'admin';

    if (!isJobPoster && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only the job poster can extend offers',
        error: 'ACCESS_DENIED'
      });
    }

    const offerData = {
      salary_offered,
      benefits,
      start_date: start_date ? new Date(start_date) : null,
      offer_expires_at: offer_expires_at ? new Date(offer_expires_at) : null
    };

    await application.extendOffer(offerData);

    res.json({
      success: true,
      message: 'Job offer extended successfully',
      data: {
        application: application.toJSON()
      }
    });
  } catch (error) {
    console.error('Extend offer error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to extend job offer',
      error: process.env.NODE_ENV === 'development' ? error.message : 'EXTEND_OFFER_ERROR'
    });
  }
});

/**
 * @route   POST /api/applications/:id/withdraw
 * @desc    Withdraw application (by applicant)
 * @access  Private (Application owner)
 */
router.post('/:id/withdraw', authenticate, validateObjectId('id'), async (req, res) => {
  try {
    const { reason } = req.body;

    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
        error: 'APPLICATION_NOT_FOUND'
      });
    }

    // Check if user owns this application
    if (application.applicant_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only withdraw your own applications',
        error: 'ACCESS_DENIED'
      });
    }

    // Check if application can be withdrawn
    if (['accepted', 'rejected', 'withdrawn'].includes(application.status)) {
      return res.status(400).json({
        success: false,
        message: 'This application cannot be withdrawn',
        error: 'CANNOT_WITHDRAW'
      });
    }

    await application.withdraw(reason);

    res.json({
      success: true,
      message: 'Application withdrawn successfully',
      data: {
        application: application.toJSON()
      }
    });
  } catch (error) {
    console.error('Withdraw application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to withdraw application',
      error: process.env.NODE_ENV === 'development' ? error.message : 'WITHDRAW_APPLICATION_ERROR'
    });
  }
});

/**
 * @route   GET /api/applications/stats
 * @desc    Get application statistics
 * @access  Private (Admin/Recruiter)
 */
router.get('/stats', authenticate, authorize('admin', 'recruiter'), async (req, res) => {
  try {
    const { job_id } = req.query;
    
    let jobFilter = null;
    if (req.user.auth.role === 'recruiter') {
      // Recruiter can only see stats for their jobs
      const recruiterJobs = await Job.find({ 
        posted_by: req.user._id 
      }).select('_id');
      jobFilter = recruiterJobs.map(job => job._id);
    }

    let matchStage = {};
    if (job_id) {
      matchStage.job_id = mongoose.Types.ObjectId(job_id);
    } else if (jobFilter) {
      matchStage.job_id = { $in: jobFilter };
    }

    const stats = await Application.getApplicationStats(job_id);

    res.json({
      success: true,
      message: 'Application statistics retrieved successfully',
      data: {
        stats: stats[0] || {
          total_applications: 0,
          status_breakdown: []
        }
      }
    });
  } catch (error) {
    console.error('Get application stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get application statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'GET_STATS_ERROR'
    });
  }
});

/**
 * @route   GET /api/applications/job/:jobId
 * @desc    Get all applications for a specific job
 * @access  Private (Job poster/Admin)
 */
router.get('/job/:jobId', authenticate, validateObjectId('jobId'), validatePaginationQuery, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
        error: 'JOB_NOT_FOUND'
      });
    }

    // Check permissions
    const isJobPoster = job.posted_by?.toString() === req.user._id.toString();
    const isAdmin = req.user.auth.role === 'admin';

    if (!isJobPoster && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        error: 'ACCESS_DENIED'
      });
    }

    const options = {
      status: req.query.status,
      limit: parseInt(req.query.limit) || 20,
      page: parseInt(req.query.page) || 1
    };

    const applications = await Application.findByJob(req.params.jobId, options);
    const total = await Application.countDocuments({ 
      job_id: req.params.jobId,
      ...(options.status && { status: options.status })
    });

    res.json({
      success: true,
      message: 'Job applications retrieved successfully',
      data: {
        job: {
          _id: job._id,
          job_title: job.job_title,
          employer_name: job.employer_name
        },
        applications: applications.map(app => app.toJSON()),
        pagination: {
          current_page: options.page,
          total_pages: Math.ceil(total / options.limit),
          total_applications: total,
          applications_per_page: options.limit,
          has_next: options.page < Math.ceil(total / options.limit),
          has_prev: options.page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job applications',
      error: process.env.NODE_ENV === 'development' ? error.message : 'GET_JOB_APPLICATIONS_ERROR'
    });
  }
});

module.exports = router;
