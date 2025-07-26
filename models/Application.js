const mongoose = require('mongoose');

/**
 * Application Schema for JobSync Platform
 * 
 * Tracks job applications with comprehensive status management,
 * application timeline, and communication history
 * 
 * @author JobSync Team
 * @version 1.0.0
 */

const applicationSchema = new mongoose.Schema({
  // Core References
  job_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: [true, 'Job ID is required'],
    index: true
  },
  applicant_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Applicant ID is required'],
    index: true
  },

  // Application Status
  status: {
    type: String,
    required: [true, 'Application status is required'],
    enum: {
      values: [
        'pending',
        'reviewing',
        'shortlisted',
        'interviewed',
        'offer_extended',
        'accepted',
        'rejected',
        'withdrawn',
        'expired'
      ],
      message: 'Invalid application status'
    },
    default: 'pending',
    index: true
  },

  // Application Data
  application_data: {
    resume: {
      file_url: {
        type: String,
        required: [true, 'Resume file URL is required']
      },
      file_name: String,
      file_size: Number, // in bytes
      uploaded_at: {
        type: Date,
        default: Date.now
      }
    },
    cover_letter: {
      content: {
        type: String,
        maxlength: [5000, 'Cover letter cannot exceed 5000 characters']
      },
      is_template: {
        type: Boolean,
        default: false
      }
    },
    additional_documents: [{
      name: String,
      url: String,
      type: {
        type: String,
        enum: ['portfolio', 'certificate', 'recommendation', 'other']
      },
      uploaded_at: {
        type: Date,
        default: Date.now
      }
    }],
    custom_responses: [{
      question: String,
      answer: String,
      question_type: {
        type: String,
        enum: ['text', 'multiple_choice', 'file_upload', 'boolean']
      }
    }]
  },

  // Timeline and Status History
  timeline: [{
    status: {
      type: String,
      enum: [
        'applied',
        'viewed_by_recruiter',
        'reviewing',
        'shortlisted',
        'interview_scheduled',
        'interviewed',
        'offer_extended',
        'offer_accepted',
        'offer_rejected',
        'application_rejected',
        'application_withdrawn'
      ],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now,
      required: true
    },
    notes: String,
    updated_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    automated: {
      type: Boolean,
      default: false
    }
  }],

  // Interview Information
  interview_details: {
    scheduled_interviews: [{
      type: {
        type: String,
        enum: ['phone', 'video', 'onsite', 'technical', 'hr', 'panel'],
        required: true
      },
      scheduled_at: {
        type: Date,
        required: true
      },
      duration_minutes: {
        type: Number,
        min: 15,
        max: 480, // 8 hours max
        default: 60
      },
      location: String, // Physical address or video link
      interviewer: {
        name: String,
        email: String,
        title: String
      },
      status: {
        type: String,
        enum: ['scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show'],
        default: 'scheduled'
      },
      feedback: {
        rating: {
          type: Number,
          min: 1,
          max: 10
        },
        comments: String,
        strengths: [String],
        areas_for_improvement: [String],
        recommendation: {
          type: String,
          enum: ['hire', 'reject', 'proceed_next_round', 'hold']
        }
      },
      created_at: {
        type: Date,
        default: Date.now
      }
    }],
    overall_interview_feedback: {
      overall_rating: {
        type: Number,
        min: 1,
        max: 10
      },
      technical_score: {
        type: Number,
        min: 1,
        max: 10
      },
      cultural_fit_score: {
        type: Number,
        min: 1,
        max: 10
      },
      communication_score: {
        type: Number,
        min: 1,
        max: 10
      },
      final_recommendation: {
        type: String,
        enum: ['hire', 'reject', 'hold']
      },
      summary_comments: String
    }
  },

  // Offer Information
  offer_details: {
    salary_offered: {
      amount: Number,
      currency: {
        type: String,
        default: 'USD'
      },
      period: {
        type: String,
        enum: ['HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR'],
        default: 'YEAR'
      }
    },
    benefits: [String],
    start_date: Date,
    offer_letter_url: String,
    offer_extended_at: Date,
    offer_expires_at: Date,
    negotiation_history: [{
      round: Number,
      offered_by: {
        type: String,
        enum: ['employer', 'candidate']
      },
      details: {
        salary: Number,
        benefits: [String],
        start_date: Date,
        other_terms: String
      },
      response: {
        type: String,
        enum: ['accepted', 'rejected', 'counter_offer']
      },
      timestamp: {
        type: Date,
        default: Date.now
      }
    }]
  },

  // Communication History
  communications: [{
    type: {
      type: String,
      enum: ['email', 'phone', 'message', 'meeting', 'automated'],
      required: true
    },
    direction: {
      type: String,
      enum: ['inbound', 'outbound'],
      required: true
    },
    subject: String,
    content: String,
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    read_at: Date,
    replied_at: Date
  }],

  // Application Metrics
  metrics: {
    time_to_first_response: Number, // in hours
    time_to_decision: Number, // in hours
    total_communication_count: {
      type: Number,
      default: 0
    },
    application_source: {
      type: String,
      enum: ['direct', 'job_board', 'referral', 'social_media', 'company_website'],
      default: 'direct'
    },
    referral_info: {
      referred_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      referral_code: String
    }
  },

  // Preferences and Settings
  preferences: {
    communication_preference: {
      type: String,
      enum: ['email', 'phone', 'text', 'platform'],
      default: 'email'
    },
    availability: {
      days: [String], // ['monday', 'tuesday', etc.]
      time_slots: [{
        start_time: String, // '09:00'
        end_time: String    // '17:00'
      }],
      timezone: {
        type: String,
        default: 'UTC'
      }
    }
  },

  // Additional Information
  notes: {
    applicant_notes: String, // Notes from the applicant
    recruiter_notes: String, // Internal notes from recruiter
    internal_tags: [String]  // Tags for internal organization
  },

  // System Fields
  application_number: {
    type: String,
    unique: true,
    index: true
  },
  applied_via: {
    platform: {
      type: String,
      enum: ['jobsync', 'external_link', 'api'],
      default: 'jobsync'
    },
    ip_address: String,
    user_agent: String
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound indexes for efficient queries
applicationSchema.index({ job_id: 1, applicant_id: 1 }, { unique: true });
applicationSchema.index({ job_id: 1, status: 1 });
applicationSchema.index({ applicant_id: 1, status: 1 });
applicationSchema.index({ status: 1, createdAt: -1 });
applicationSchema.index({ 'timeline.timestamp': -1 });
applicationSchema.index({ application_number: 1 });

// Virtual fields
applicationSchema.virtual('current_stage').get(function() {
  if (this.timeline && this.timeline.length > 0) {
    return this.timeline[this.timeline.length - 1].status;
  }
  return 'applied';
});

applicationSchema.virtual('days_since_application').get(function() {
  const now = new Date();
  const applied = this.createdAt;
  const diffTime = Math.abs(now - applied);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

applicationSchema.virtual('is_active').get(function() {
  const inactiveStatuses = ['accepted', 'rejected', 'withdrawn', 'expired'];
  return !inactiveStatuses.includes(this.status);
});

applicationSchema.virtual('next_interview').get(function() {
  if (this.interview_details && this.interview_details.scheduled_interviews) {
    const upcoming = this.interview_details.scheduled_interviews
      .filter(interview => 
        interview.status === 'scheduled' && 
        new Date(interview.scheduled_at) > new Date()
      )
      .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));
    
    return upcoming.length > 0 ? upcoming[0] : null;
  }
  return null;
});

applicationSchema.virtual('offer_status').get(function() {
  if (this.offer_details && this.offer_details.offer_extended_at) {
    const now = new Date();
    if (this.offer_details.offer_expires_at && now > this.offer_details.offer_expires_at) {
      return 'expired';
    }
    if (this.status === 'accepted') {
      return 'accepted';
    }
    if (this.status === 'rejected') {
      return 'rejected';
    }
    return 'pending';
  }
  return 'not_extended';
});

// Instance Methods
applicationSchema.methods.updateStatus = function(newStatus, notes = '', updatedBy = null) {
  this.status = newStatus;
  
  this.timeline.push({
    status: newStatus,
    timestamp: new Date(),
    notes: notes,
    updated_by: updatedBy,
    automated: !updatedBy
  });

  return this.save();
};

applicationSchema.methods.scheduleInterview = function(interviewData) {
  if (!this.interview_details) {
    this.interview_details = { scheduled_interviews: [] };
  }
  
  this.interview_details.scheduled_interviews.push({
    ...interviewData,
    created_at: new Date()
  });

  // Update status if not already in interview stage
  if (!['interviewed', 'offer_extended', 'accepted'].includes(this.status)) {
    return this.updateStatus('shortlisted', 'Interview scheduled');
  }
  
  return this.save();
};

applicationSchema.methods.extendOffer = function(offerData) {
  this.offer_details = {
    ...offerData,
    offer_extended_at: new Date()
  };
  
  return this.updateStatus('offer_extended', 'Job offer extended');
};

applicationSchema.methods.addCommunication = function(communicationData) {
  this.communications.push({
    ...communicationData,
    timestamp: new Date()
  });
  
  this.metrics.total_communication_count += 1;
  
  return this.save();
};

applicationSchema.methods.withdraw = function(reason = '') {
  return this.updateStatus('withdrawn', reason ? `Withdrawn: ${reason}` : 'Application withdrawn by candidate');
};

applicationSchema.methods.reject = function(reason = '', rejectedBy = null) {
  return this.updateStatus('rejected', reason ? `Rejected: ${reason}` : 'Application rejected', rejectedBy);
};

// Static Methods
applicationSchema.statics.findByJob = function(jobId, options = {}) {
  const { status = null, limit = 20, page = 1 } = options;
  const skip = (page - 1) * limit;
  
  let query = { job_id: jobId };
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('applicant_id', 'personal_info.first_name personal_info.last_name personal_info.email')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

applicationSchema.statics.findByApplicant = function(applicantId, options = {}) {
  const { status = null, limit = 20, page = 1 } = options;
  const skip = (page - 1) * limit;
  
  let query = { applicant_id: applicantId };
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('job_id', 'job_title employer_name job_city job_state')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

applicationSchema.statics.getApplicationStats = function(jobId = null) {
  let matchStage = {};
  if (jobId) {
    matchStage.job_id = mongoose.Types.ObjectId(jobId);
  }
  
  return this.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        avg_days_since_application: {
          $avg: {
            $divide: [
              { $subtract: [new Date(), '$createdAt'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      }
    },
    {
      $group: {
        _id: null,
        total_applications: { $sum: '$count' },
        status_breakdown: {
          $push: {
            status: '$_id',
            count: '$count',
            avg_days: '$avg_days_since_application'
          }
        }
      }
    }
  ]);
};

applicationSchema.statics.getRecentApplications = function(days = 7, limit = 50) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.find({
    createdAt: { $gte: cutoffDate }
  })
  .populate('job_id', 'job_title employer_name')
  .populate('applicant_id', 'personal_info.first_name personal_info.last_name personal_info.email')
  .sort({ createdAt: -1 })
  .limit(limit);
};

applicationSchema.statics.findPendingApplications = function(limit = 100) {
  return this.find({
    status: { $in: ['pending', 'reviewing'] }
  })
  .populate('job_id', 'job_title employer_name')
  .populate('applicant_id', 'personal_info.first_name personal_info.last_name personal_info.email')
  .sort({ createdAt: 1 }) // Oldest first
  .limit(limit);
};

// Pre-save middleware to generate application number
applicationSchema.pre('save', async function(next) {
  if (this.isNew && !this.application_number) {
    const count = await this.constructor.countDocuments();
    const year = new Date().getFullYear();
    this.application_number = `APP-${year}-${String(count + 1).padStart(6, '0')}`;
  }
  
  // Calculate time to first response if status changed to reviewing
  if (this.isModified('status') && this.status === 'reviewing' && !this.metrics.time_to_first_response) {
    const now = new Date();
    const applied = this.createdAt;
    this.metrics.time_to_first_response = Math.round((now - applied) / (1000 * 60 * 60)); // hours
  }
  
  // Calculate time to decision if application is finalized
  if (this.isModified('status') && ['accepted', 'rejected'].includes(this.status) && !this.metrics.time_to_decision) {
    const now = new Date();
    const applied = this.createdAt;
    this.metrics.time_to_decision = Math.round((now - applied) / (1000 * 60 * 60)); // hours
  }
  
  next();
});

const Application = mongoose.model('Application', applicationSchema);

module.exports = Application;
