const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const validator = require('validator');

/**
 * User Schema for JobSync Platform
 * 
 * This handles everyone who uses our platform - job seekers looking for their next opportunity
 * and recruiters hunting for great talent. We've packed it with features like secure login,
 * detailed profiles, and smart privacy controls.
 * 
 * @author JobSync Team - Built by humans, for humans
 * @version 1.0.0
 */

const userSchema = new mongoose.Schema({
  // Basic Information - the stuff everyone needs to know about you
  personal_info: {
    first_name: {
      type: String,
      required: [true, 'We need your first name to get started'],
      trim: true,
      minlength: [2, 'First name should be at least 2 characters'],
      maxlength: [30, 'That\'s a pretty long first name! Keep it under 30 characters']
    },
    last_name: {
      type: String,
      required: [true, 'Last name helps us identify you'],
      trim: true,
      minlength: [2, 'Last name should be at least 2 characters'],
      maxlength: [30, 'That\'s a long last name! Keep it under 30 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is how we\'ll keep in touch'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please enter a valid email address'],
      index: true
    },
    phone: {
      type: String,
      validate: {
        validator: function(v) {
          return !v || validator.isMobilePhone(v);
        },
        message: 'Please provide a valid phone number'
      }
    },
    date_of_birth: {
      type: Date,
      validate: {
        validator: function(v) {
          return !v || v < new Date();
        },
        message: 'Date of birth cannot be in the future'
      }
    },
    profile_picture: {
      type: String,
      validate: [validator.isURL, 'Please provide a valid URL for profile picture']
    }
  },

  // Authentication - keeping your account secure
  auth: {
    password: {
      type: String,
      required: [true, 'You need a password to keep your account safe'],
      minlength: [8, 'Password should be at least 8 characters for security'],
      select: false // We never send passwords back in responses
    },
    role: {
      type: String,
      required: [true, 'Are you looking for jobs or posting them?'],
      enum: {
        values: ['job_seeker', 'recruiter', 'admin'],
        message: 'Please choose: job_seeker, recruiter, or admin'
      },
      default: 'job_seeker'
    },
    is_verified: {
      type: Boolean,
      default: false
    },
    verification_token: String,
    password_reset_token: String,
    password_reset_expires: Date,
    last_login: Date,
    login_attempts: {
      type: Number,
      default: 0
    },
    account_locked_until: Date
  },

  // Location Information
  location: {
    address: {
      street: String,
      city: String,
      state: String,
      country: {
        type: String,
        default: 'US'
      },
      postal_code: String
    },
    coordinates: {
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
    timezone: {
      type: String,
      default: 'UTC'
    }
  },

  // Job Seeker Specific Fields
  job_seeker_profile: {
    resume: {
      file_url: String,
      file_name: String,
      uploaded_at: Date,
      parsed_data: {
        skills: [String],
        experience_years: Number,
        education: [{
          degree: String,
          institution: String,
          graduation_year: Number,
          gpa: Number
        }],
        work_experience: [{
          company: String,
          position: String,
          start_date: Date,
          end_date: Date,
          description: String,
          is_current: Boolean
        }],
        certifications: [{
          name: String,
          issuer: String,
          issue_date: Date,
          expiry_date: Date,
          credential_id: String
        }]
      }
    },
    job_preferences: {
      desired_positions: [String],
      preferred_locations: [String],
      employment_types: [{
        type: String,
        enum: ['FULLTIME', 'PARTTIME', 'CONTRACTOR', 'INTERN', 'TEMPORARY']
      }],
      salary_expectations: {
        min_salary: Number,
        max_salary: Number,
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
      remote_work_preference: {
        type: String,
        enum: ['remote_only', 'hybrid', 'onsite', 'no_preference'],
        default: 'no_preference'
      },
      willing_to_relocate: {
        type: Boolean,
        default: false
      }
    },
    portfolio: {
      website_url: String,
      github_url: String,
      linkedin_url: String,
      other_links: [{
        platform: String,
        url: String
      }]
    }
  },

  // Recruiter Specific Fields
  recruiter_profile: {
    company_info: {
      company_name: {
        type: String,
        required: function() {
          return this.auth.role === 'recruiter';
        }
      },
      company_size: {
        type: String,
        enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
      },
      industry: String,
      company_website: String,
      company_description: String,
      company_logo: String
    },
    position: String,
    department: String,
    hiring_permissions: {
      can_post_jobs: {
        type: Boolean,
        default: true
      },
      can_view_applications: {
        type: Boolean,
        default: true
      },
      can_schedule_interviews: {
        type: Boolean,
        default: false
      }
    }
  },

  // Activity and Engagement
  activity: {
    profile_views: {
      type: Number,
      default: 0
    },
    last_active: {
      type: Date,
      default: Date.now
    },
    total_applications: {
      type: Number,
      default: 0
    },
    total_jobs_posted: {
      type: Number,
      default: 0
    },
    account_status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'deleted'],
      default: 'active'
    }
  },

  // Preferences and Settings
  preferences: {
    email_notifications: {
      job_alerts: {
        type: Boolean,
        default: true
      },
      application_updates: {
        type: Boolean,
        default: true
      },
      marketing_emails: {
        type: Boolean,
        default: false
      },
      weekly_digest: {
        type: Boolean,
        default: true
      }
    },
    privacy_settings: {
      profile_visibility: {
        type: String,
        enum: ['public', 'registered_users', 'recruiters_only', 'private'],
        default: 'registered_users'
      },
      show_contact_info: {
        type: Boolean,
        default: false
      }
    },
    language: {
      type: String,
      default: 'en'
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'auto'
    }
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
userSchema.index({ 'personal_info.email': 1 });
userSchema.index({ 'auth.role': 1 });
userSchema.index({ 'activity.account_status': 1 });
userSchema.index({ 'location.address.city': 1, 'location.address.state': 1 });
userSchema.index({ 'job_seeker_profile.job_preferences.desired_positions': 1 });
userSchema.index({ 'recruiter_profile.company_info.company_name': 1 });

// Virtual fields
userSchema.virtual('full_name').get(function() {
  return `${this.personal_info.first_name} ${this.personal_info.last_name}`;
});

userSchema.virtual('age').get(function() {
  if (this.personal_info.date_of_birth) {
    const today = new Date();
    const birthDate = new Date(this.personal_info.date_of_birth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
  return null;
});

userSchema.virtual('is_job_seeker').get(function() {
  return this.auth.role === 'job_seeker';
});

userSchema.virtual('is_recruiter').get(function() {
  return this.auth.role === 'recruiter';
});

userSchema.virtual('profile_completion_percentage').get(function() {
  let completed = 0;
  let total = 10;

  if (this.personal_info.first_name) completed++;
  if (this.personal_info.last_name) completed++;
  if (this.personal_info.email) completed++;
  if (this.personal_info.phone) completed++;
  if (this.personal_info.profile_picture) completed++;
  if (this.location.address.city) completed++;

  if (this.is_job_seeker) {
    if (this.job_seeker_profile.resume.file_url) completed++;
    if (this.job_seeker_profile.job_preferences.desired_positions.length > 0) completed++;
    if (this.job_seeker_profile.portfolio.linkedin_url) completed++;
    if (this.job_seeker_profile.job_preferences.salary_expectations.min_salary) completed++;
  } else if (this.is_recruiter) {
    if (this.recruiter_profile.company_info.company_name) completed++;
    if (this.recruiter_profile.company_info.industry) completed++;
    if (this.recruiter_profile.position) completed++;
    if (this.recruiter_profile.company_info.company_website) completed++;
  }

  return Math.round((completed / total) * 100);
});

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('auth.password')) return next();

  try {
    // Hash the password with cost of 12
    const hashedPassword = await bcrypt.hash(this.auth.password, 12);
    this.auth.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});

// Instance method to check password
userSchema.methods.correctPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.auth.password);
};

// Instance method to check if password was changed after JWT was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.auth.password_changed_at) {
    const changedTimestamp = parseInt(
      this.auth.password_changed_at.getTime() / 1000,
      10
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Instance method to update last login
userSchema.methods.updateLastLogin = function() {
  this.auth.last_login = new Date();
  this.activity.last_active = new Date();
  return this.save();
};

// Instance method to increment profile views
userSchema.methods.incrementProfileViews = function() {
  this.activity.profile_views += 1;
  return this.save();
};

// Static method to find users by location
userSchema.statics.findByLocation = function(city, state, limit = 10) {
  return this.find({
    'location.address.city': new RegExp(city, 'i'),
    'location.address.state': new RegExp(state, 'i'),
    'activity.account_status': 'active'
  }).limit(limit);
};

// Static method to find job seekers by skills
userSchema.statics.findJobSeekersBySkills = function(skills, limit = 10) {
  return this.find({
    'auth.role': 'job_seeker',
    'job_seeker_profile.resume.parsed_data.skills': { $in: skills },
    'activity.account_status': 'active'
  }).limit(limit);
};

// Static method to find recruiters by company
userSchema.statics.findRecruitersByCompany = function(companyName) {
  return this.find({
    'auth.role': 'recruiter',
    'recruiter_profile.company_info.company_name': new RegExp(companyName, 'i'),
    'activity.account_status': 'active'
  });
};

const User = mongoose.model('User', userSchema);

module.exports = User;
