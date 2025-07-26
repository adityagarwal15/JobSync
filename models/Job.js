const mongoose = require('mongoose');

/**
 * Job Schema for JobSync Platform
 * 
 * Comprehensive job posting model with advanced features including:
 * - AI-powered keyword extraction and matching
 * - Enhanced analytics and engagement tracking
 * - Geographic and salary information
 * - Application tracking and recommendations
 * 
 * @author JobSync Team
 * @version 2.0.0
 */

const jobSchema = new mongoose.Schema({
  // Basic Job Information
  job_title: {
    type: String,
    required: [true, 'Job title is required'],
    trim: true,
    maxlength: [100, 'Job title cannot exceed 100 characters'],
    index: true
  },
  job_description: {
    type: String,
    required: [true, 'Job description is required'],
    maxlength: [10000, 'Job description cannot exceed 10000 characters']
  },
  
  // Employer Information
  employer_name: {
    type: String,
    required: [true, 'Employer name is required'],
    trim: true,
    maxlength: [100, 'Employer name cannot exceed 100 characters'],
    index: true
  },
  employer_logo: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Employer logo must be a valid URL'
    }
  },
  employer_website: {
    type: String,
    validate: {
      validator: function(v) {
        return !v || /^https?:\/\/.+/.test(v);
      },
      message: 'Employer website must be a valid URL'
    }
  },
  employer_company_type: {
    type: String,
    enum: ['Startup', 'Enterprise', 'Government', 'Non-profit', 'Agency', 'Other'],
    default: 'Other'
  },

  // Location Information
  job_city: {
    type: String,
    required: [true, 'Job city is required'],
    trim: true,
    index: true
  },
  job_state: {
    type: String,
    required: [true, 'Job state is required'],
    trim: true,
    index: true
  },
  job_country: {
    type: String,
    required: [true, 'Job country is required'],
    default: 'US',
    uppercase: true
  },
  job_coordinates: {
    latitude: {
      type: Number,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      min: -180,
      max: 180
    }
  },

  // Job Details
  job_employment_type: {
    type: String,
    required: [true, 'Employment type is required'],
    enum: {
      values: ['FULLTIME', 'PARTTIME', 'CONTRACTOR', 'INTERN', 'TEMPORARY'],
      message: 'Employment type must be one of: FULLTIME, PARTTIME, CONTRACTOR, INTERN, TEMPORARY'
    },
    index: true
  },
  job_is_remote: {
    type: Boolean,
    default: false,
    index: true
  },

  // Salary Information
  job_salary: {
    type: String,
    maxlength: [50, 'Job salary cannot exceed 50 characters']
  },
  salary_range: {
    min_salary: {
      type: Number,
      min: [0, 'Minimum salary cannot be negative']
    },
    max_salary: {
      type: Number,
      min: [0, 'Maximum salary cannot be negative'],
      validate: {
        validator: function(v) {
          return !this.salary_range.min_salary || v >= this.salary_range.min_salary;
        },
        message: 'Maximum salary must be greater than or equal to minimum salary'
      }
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
      maxlength: [3, 'Currency code must be 3 characters']
    },
    period: {
      type: String,
      enum: ['HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR'],
      default: 'YEAR'
    }
  },

  // Application Information
  job_apply_link: {
    type: String,
    required: [true, 'Job apply link is required'],
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+/.test(v);
      },
      message: 'Job apply link must be a valid URL'
    }
  },
  job_apply_is_direct: {
    type: Boolean,
    default: false
  },
  job_apply_quality_score: {
    type: Number,
    min: 0,
    max: 100
  },

  // Posting Dates
  posting_dates: {
    posted_at: {
      type: Date,
      required: [true, 'Posted date is required'],
      default: Date.now,
      index: true
    },
    posted_at_utc: {
      type: Date,
      required: [true, 'Posted UTC date is required'],
      default: Date.now
    },
    expires_at: {
      type: Date,
      validate: {
        validator: function(v) {
          return !v || v > this.posting_dates.posted_at;
        },
        message: 'Expiry date must be after posting date'
      }
    }
  },

  // External References
  job_publisher: {
    type: String,
    maxlength: [100, 'Job publisher cannot exceed 100 characters']
  },
  external_job_id: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  external_links: {
    google_jobs: String,
    linkedin: String,
    indeed: String,
    other: [String]
  },

  // Industry Information
  industry_info: {
    naics_code: String,
    naics_name: String,
    industry_category: String
  },

  // Requirements and Skills
  experience_requirements: {
    min_years: {
      type: Number,
      min: 0,
      max: 50
    },
    max_years: {
      type: Number,
      min: 0,
      max: 50
    },
    level: {
      type: String,
      enum: ['Entry Level', 'Mid Level', 'Senior Level', 'Executive', 'Internship']
    }
  },
  required_skills: [{
    type: String,
    trim: true,
    maxlength: [50, 'Skill name cannot exceed 50 characters']
  }],
  education_requirements: {
    min_degree: {
      type: String,
      enum: ['High School', 'Associate', 'Bachelor', 'Master', 'PhD', 'Professional']
    },
    preferred_degree: {
      type: String,
      enum: ['High School', 'Associate', 'Bachelor', 'Master', 'PhD', 'Professional']
    },
    field_of_study: [String]
  },

  // AI-Enhanced Features
  ai_extracted_keywords: [{
    keyword: {
      type: String,
      required: true
    },
    relevance_score: {
      type: Number,
      min: 0,
      max: 1,
      required: true
    },
    category: {
      type: String,
      enum: ['skill', 'tool', 'technology', 'qualification', 'industry', 'other']
    }
  }],

  // Recommendation Data
  recommendation_data: {
    score: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    last_calculated: {
      type: Date,
      default: Date.now
    },
    factors: {
      title_match: Number,
      skill_match: Number,
      location_match: Number,
      experience_match: Number,
      salary_match: Number
    }
  },

  // Engagement Metrics
  engagement_metrics: {
    view_count: {
      type: Number,
      default: 0,
      min: 0
    },
    application_count: {
      type: Number,
      default: 0,
      min: 0
    },
    save_count: {
      type: Number,
      default: 0,
      min: 0
    },
    share_count: {
      type: Number,
      default: 0,
      min: 0
    },
    click_through_rate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    }
  },

  // Platform Data
  platform_data: {
    is_featured: {
      type: Boolean,
      default: false,
      index: true
    },
    is_active: {
      type: Boolean,
      default: true,
      index: true
    },
    is_verified: {
      type: Boolean,
      default: false
    },
    quality_score: {
      type: Number,
      min: 0,
      max: 100,
      default: 50
    },
    source: {
      type: String,
      enum: ['internal', 'api_import', 'web_scraping', 'partner'],
      default: 'internal'
    }
  },

  // Owner Information (for internal job postings)
  posted_by: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    validate: {
      validator: function(v) {
        return !v || mongoose.Types.ObjectId.isValid(v);
      },
      message: 'Posted by must be a valid user ID'
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for optimized queries
jobSchema.index({ job_title: 'text', job_description: 'text' });
jobSchema.index({ job_city: 1, job_state: 1, job_country: 1 });
jobSchema.index({ job_employment_type: 1, job_is_remote: 1 });
jobSchema.index({ 'salary_range.min_salary': 1, 'salary_range.max_salary': 1 });
jobSchema.index({ 'posting_dates.posted_at': -1 });
jobSchema.index({ 'platform_data.is_active': 1, 'platform_data.is_featured': 1 });
jobSchema.index({ 'engagement_metrics.view_count': -1 });
jobSchema.index({ 'recommendation_data.score': -1 });
jobSchema.index({ required_skills: 1 });
jobSchema.index({ employer_name: 1 });

// Compound indexes for complex queries
jobSchema.index({ 
  'platform_data.is_active': 1, 
  job_city: 1, 
  job_employment_type: 1,
  'posting_dates.posted_at': -1 
});

// Virtual fields
jobSchema.virtual('days_since_posted').get(function() {
  const now = new Date();
  const posted = this.posting_dates.posted_at;
  const diffTime = Math.abs(now - posted);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

jobSchema.virtual('is_expired').get(function() {
  if (!this.posting_dates.expires_at) return false;
  return new Date() > this.posting_dates.expires_at;
});

jobSchema.virtual('location_string').get(function() {
  return `${this.job_city}, ${this.job_state}, ${this.job_country}`;
});

jobSchema.virtual('salary_display').get(function() {
  if (this.salary_range && this.salary_range.min_salary && this.salary_range.max_salary) {
    return `${this.salary_range.currency} ${this.salary_range.min_salary.toLocaleString()} - ${this.salary_range.max_salary.toLocaleString()} per ${this.salary_range.period.toLowerCase()}`;
  } else if (this.job_salary) {
    return this.job_salary;
  }
  return 'Not specified';
});

jobSchema.virtual('engagement_rate').get(function() {
  const views = this.engagement_metrics.view_count;
  const applications = this.engagement_metrics.application_count;
  return views > 0 ? Math.round((applications / views) * 100) : 0;
});

// Instance Methods
jobSchema.methods.incrementViewCount = function() {
  this.engagement_metrics.view_count += 1;
  return this.save();
};

jobSchema.methods.incrementApplicationCount = function() {
  this.engagement_metrics.application_count += 1;
  return this.save();
};

jobSchema.methods.incrementSaveCount = function() {
  this.engagement_metrics.save_count += 1;
  return this.save();
};

jobSchema.methods.incrementShareCount = function() {
  this.engagement_metrics.share_count += 1;
  return this.save();
};

jobSchema.methods.updateRecommendationScore = function(score, factors = {}) {
  this.recommendation_data.score = score;
  this.recommendation_data.last_calculated = new Date();
  if (Object.keys(factors).length > 0) {
    this.recommendation_data.factors = { ...this.recommendation_data.factors, ...factors };
  }
  return this.save();
};

jobSchema.methods.addAIKeywords = function(keywords) {
  this.ai_extracted_keywords = keywords.map(keyword => ({
    keyword: keyword.keyword,
    relevance_score: keyword.relevance_score,
    category: keyword.category || 'other'
  }));
  return this.save();
};

// Static Methods
jobSchema.statics.findByKeywords = function(keywords, options = {}) {
  const {
    limit = 10,
    skip = 0,
    location = null,
    employmentType = null,
    isRemote = null,
    salaryMin = null,
    sortBy = 'posting_dates.posted_at'
  } = options;

  let query = { 'platform_data.is_active': true };
  
  // Keyword search
  if (keywords && keywords.length > 0) {
    query.$or = [
      { job_title: { $regex: keywords.join('|'), $options: 'i' } },
      { job_description: { $regex: keywords.join('|'), $options: 'i' } },
      { required_skills: { $in: keywords } },
      { 'ai_extracted_keywords.keyword': { $in: keywords } }
    ];
  }
  
  // Additional filters
  if (location) {
    query.$and = query.$and || [];
    query.$and.push({
      $or: [
        { job_city: { $regex: location, $options: 'i' } },
        { job_state: { $regex: location, $options: 'i' } }
      ]
    });
  }
  
  if (employmentType) {
    query.job_employment_type = employmentType;
  }
  
  if (isRemote !== null) {
    query.job_is_remote = isRemote;
  }
  
  if (salaryMin) {
    query['salary_range.min_salary'] = { $gte: salaryMin };
  }

  const sortOption = {};
  sortOption[sortBy] = -1;

  return this.find(query)
    .sort(sortOption)
    .skip(skip)
    .limit(limit);
};

jobSchema.statics.getFeaturedJobs = function(limit = 5) {
  return this.find({
    'platform_data.is_featured': true,
    'platform_data.is_active': true
  })
  .sort({ 'posting_dates.posted_at': -1 })
  .limit(limit);
};

jobSchema.statics.getTrendingJobs = function(limit = 10) {
  return this.find({
    'platform_data.is_active': true
  })
  .sort({ 
    'engagement_metrics.view_count': -1,
    'engagement_metrics.application_count': -1,
    'posting_dates.posted_at': -1
  })
  .limit(limit);
};

jobSchema.statics.getJobsByEmployer = function(employerName, limit = 10) {
  return this.find({
    employer_name: new RegExp(employerName, 'i'),
    'platform_data.is_active': true
  })
  .sort({ 'posting_dates.posted_at': -1 })
  .limit(limit);
};

jobSchema.statics.getJobsByLocation = function(city, state, limit = 10) {
  return this.find({
    job_city: new RegExp(city, 'i'),
    job_state: new RegExp(state, 'i'),
    'platform_data.is_active': true
  })
  .sort({ 'posting_dates.posted_at': -1 })
  .limit(limit);
};

jobSchema.statics.getRecentJobs = function(days = 7, limit = 20) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);
  
  return this.find({
    'posting_dates.posted_at': { $gte: cutoffDate },
    'platform_data.is_active': true
  })
  .sort({ 'posting_dates.posted_at': -1 })
  .limit(limit);
};

jobSchema.statics.getJobStats = function() {
  return this.aggregate([
    { $match: { 'platform_data.is_active': true } },
    {
      $group: {
        _id: null,
        total_jobs: { $sum: 1 },
        avg_views: { $avg: '$engagement_metrics.view_count' },
        avg_applications: { $avg: '$engagement_metrics.application_count' },
        total_views: { $sum: '$engagement_metrics.view_count' },
        total_applications: { $sum: '$engagement_metrics.application_count' }
      }
    }
  ]);
};

// Pre-save middleware
jobSchema.pre('save', function(next) {
  // Update quality score based on completeness
  let score = 50; // Base score
  
  if (this.job_description && this.job_description.length > 100) score += 10;
  if (this.required_skills && this.required_skills.length > 0) score += 10;
  if (this.salary_range && this.salary_range.min_salary) score += 10;
  if (this.employer_logo) score += 5;
  if (this.employer_website) score += 5;
  if (this.experience_requirements && this.experience_requirements.level) score += 5;
  if (this.education_requirements && this.education_requirements.min_degree) score += 5;
  
  this.platform_data.quality_score = Math.min(score, 100);
  
  next();
});

const Job = mongoose.model('Job', jobSchema);

module.exports = Job;
