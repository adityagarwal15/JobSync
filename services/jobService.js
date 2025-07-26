const Job = require('../models/Job');

/**
 * JobService - Business logic layer for job operations
 * 
 * This service handles all job-related operations including:
 * - Job CRUD operations with the new schema structure
 * - Advanced search and filtering capabilities
 * - Enhanced recommendation algorithm
 * - Analytics and engagement tracking
 * - External API integration and data transformation
 * 
 * @class JobService
 * @version 2.0.0
 */
class JobService {
  
  /**
   * Create a new job posting with validation and data transformation
   * @param {Object} jobData - Job data object (supports both old and new formats)
   * @returns {Promise<Object>} Created job with virtual fields populated
   */
  async createJob(jobData) {
    try {
      // Transform legacy field names to new structure if needed
      const transformedData = this.transformJobData(jobData);
      
      const job = new Job(transformedData);
      const savedJob = await job.save();
      
      // Return job with virtual fields populated
      return savedJob.toJSON();
    } catch (error) {
      throw new Error(`Failed to create job: ${error.message}`);
    }
  }

  /**
   * Get intelligent job recommendations based on resume keywords
   * Uses enhanced matching algorithm with multiple scoring factors
   * @param {Array} keywords - Keywords extracted from resume
   * @param {Object} options - Search and filtering options
   * @returns {Promise<Array>} Array of recommended jobs with scores
   */
  async getJobRecommendations(keywords, options = {}) {
    try {
      const {
        limit = 10,
        location = null,
        employmentType = null,
        isRemote = null,
        salaryMin = null,
        page = 1
      } = options;

      const skip = (page - 1) * limit;
      
      const searchOptions = {
        limit,
        skip,
        location,
        employmentType,
        isRemote,
        salaryMin,
        sortBy: 'recommendation_data.score'
      };

      // Get jobs matching keywords using the new static method
      const jobs = await Job.findByKeywords(keywords, searchOptions);
      
      // Calculate and update recommendation scores
      const jobsWithScores = await Promise.all(
        jobs.map(async (job) => {
          const score = this.calculateAdvancedRecommendationScore(keywords, job);
          await job.updateRecommendationScore(score);
          return job.toJSON(); // Include virtual fields
        })
      );

      // Sort by recommendation score (highest first)
      return jobsWithScores.sort((a, b) => 
        (b.recommendation_data?.score || 0) - (a.recommendation_data?.score || 0)
      );
    } catch (error) {
      throw new Error(`Failed to get job recommendations: ${error.message}`);
    }
  }

  /**
   * Advanced recommendation scoring algorithm
   * @param {Array} resumeKeywords - Keywords from resume
   * @param {Object} job - Job document
   * @returns {Number} Recommendation score (0-100)
   */
  calculateAdvancedRecommendationScore(resumeKeywords, job) {
    let score = 0;
    const maxScore = 100;
    
    // Normalize keywords for comparison
    const normalizedResumeKeywords = resumeKeywords.map(k => k.toLowerCase());
    const jobTitle = job.job_title.toLowerCase();
    const jobDescription = job.job_description ? job.job_description.toLowerCase() : '';
    
    // Extract AI keywords with their relevance scores
    const aiKeywords = job.ai_extracted_keywords || [];
    const skillKeywords = job.required_skills || [];
    
    // 1. Job Title Matching (40% weight - highest priority)
    const titleMatches = normalizedResumeKeywords.filter(keyword => 
      jobTitle.includes(keyword)
    ).length;
    score += Math.min((titleMatches / normalizedResumeKeywords.length) * 40, 40);

    // 2. AI-extracted Keywords Matching (30% weight)
    let aiScore = 0;
    normalizedResumeKeywords.forEach(keyword => {
      const aiMatch = aiKeywords.find(ai => ai.keyword === keyword);
      if (aiMatch) {
        aiScore += aiMatch.relevance_score * 5; // Max 5 points per match
      }
    });
    score += Math.min(aiScore, 30);

    // 3. Required Skills Matching (20% weight)
    const skillMatches = normalizedResumeKeywords.filter(keyword => 
      skillKeywords.some(skill => skill.toLowerCase().includes(keyword))
    ).length;
    score += Math.min((skillMatches / normalizedResumeKeywords.length) * 20, 20);

    // 4. Job Description Matching (5% weight)
    const descriptionMatches = normalizedResumeKeywords.filter(keyword => 
      jobDescription.includes(keyword)
    ).length;
    score += Math.min((descriptionMatches / normalizedResumeKeywords.length) * 5, 5);

    // 5. Recency and Engagement Bonus (5% weight)
    const daysSincePosted = job.days_since_posted || 0;
    const viewCount = job.engagement_metrics?.view_count || 0;
    
    // Recency bonus
    if (daysSincePosted <= 3) {
      score += 3; // Very recent
    } else if (daysSincePosted <= 7) {
      score += 2; // Recent
    } else if (daysSincePosted <= 14) {
      score += 1; // Somewhat recent
    }
    
    // Popularity bonus (but cap it to avoid bias toward old popular jobs)
    if (viewCount > 100) {
      score += 1;
    } else if (viewCount > 50) {
      score += 0.5;
    }

    return Math.round(Math.min(score, maxScore));
  }

  /**
   * Transform legacy job data to new schema format
   * @param {Object} jobData - Job data in old or mixed format
   * @returns {Object} Transformed job data
   */
  transformJobData(jobData) {
    const transformed = { ...jobData };
    
    // Transform salary fields if in old format
    if (jobData.job_min_salary || jobData.job_max_salary || jobData.job_salary_currency) {
      transformed.salary_range = {
        min_salary: jobData.job_min_salary,
        max_salary: jobData.job_max_salary,
        currency: jobData.job_salary_currency || 'USD',
        period: jobData.job_salary_period || 'YEAR'
      };
      
      // Remove old fields
      delete transformed.job_min_salary;
      delete transformed.job_max_salary;
      delete transformed.job_salary_currency;
      delete transformed.job_salary_period;
    }
    
    // Transform coordinates if in old format
    if (jobData.job_latitude || jobData.job_longitude) {
      transformed.job_coordinates = {
        latitude: jobData.job_latitude,
        longitude: jobData.job_longitude
      };
      
      delete transformed.job_latitude;
      delete transformed.job_longitude;
    }
    
    // Transform platform fields if in old format
    if (jobData.is_featured !== undefined || jobData.is_active !== undefined) {
      transformed.platform_data = {
        is_featured: jobData.is_featured || false,
        is_active: jobData.is_active !== undefined ? jobData.is_active : true,
        is_verified: jobData.is_verified || false
      };
      
      delete transformed.is_featured;
      delete transformed.is_active;
      delete transformed.is_verified;
    }
    
    // Transform engagement metrics if in old format
    if (jobData.view_count !== undefined || jobData.application_count !== undefined) {
      transformed.engagement_metrics = {
        view_count: jobData.view_count || 0,
        application_count: jobData.application_count || 0,
        save_count: jobData.save_count || 0,
        share_count: jobData.share_count || 0
      };
      
      delete transformed.view_count;
      delete transformed.application_count;
      delete transformed.save_count;
      delete transformed.share_count;
    }
    
    return transformed;
  }

  /**
   * Get all jobs with enhanced pagination and filtering
   * @param {Object} options - Pagination and filter options
   * @returns {Promise<Object>} Jobs with pagination info and metadata
   */
  async getAllJobs(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        location = null,
        employmentType = null,
        isRemote = null,
        salaryMin = null,
        search = null,
        sortBy = 'posting_dates.posted_at',
        sortOrder = 'desc'
      } = options;

      const skip = (page - 1) * limit;
      let query = { 'platform_data.is_active': true };

      // Apply filters using new field structure
      if (location) {
        query.$or = [
          { job_city: { $regex: location, $options: 'i' } },
          { job_state: { $regex: location, $options: 'i' } },
          { job_country: { $regex: location, $options: 'i' } }
        ];
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

      if (search) {
        query.$text = { $search: search };
      }

      const sortOption = {};
      sortOption[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const [jobs, total] = await Promise.all([
        Job.find(query)
          .sort(sortOption)
          .skip(skip)
          .limit(limit),
        Job.countDocuments(query)
      ]);

      return {
        jobs: jobs.map(job => job.toJSON()),
        pagination: {
          current_page: page,
          total_pages: Math.ceil(total / limit),
          total_jobs: total,
          jobs_per_page: limit,
          has_next: page < Math.ceil(total / limit),
          has_prev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to get jobs: ${error.message}`);
    }
  }

  /**
   * Get job by ID and track engagement
   * @param {String} jobId - Job ID
   * @returns {Promise<Object>} Job object with virtual fields
   */
  async getJobById(jobId) {
    try {
      const job = await Job.findById(jobId);
      if (!job || !job.platform_data?.is_active) {
        throw new Error('Job not found');
      }
      
      // Increment view count for analytics
      await job.incrementViewCount();
      
      return job.toJSON();
    } catch (error) {
      throw new Error(`Failed to get job: ${error.message}`);
    }
  }

  /**
   * Get featured jobs using new schema
   * @param {Number} limit - Number of jobs to return
   * @returns {Promise<Array>} Array of featured jobs
   */
  async getFeaturedJobs(limit = 5) {
    try {
      const jobs = await Job.getFeaturedJobs(limit);
      return jobs.map(job => job.toJSON());
    } catch (error) {
      throw new Error(`Failed to get featured jobs: ${error.message}`);
    }
  }

  /**
   * Get trending jobs with enhanced analytics
   * @param {Number} limit - Number of jobs to return
   * @returns {Promise<Array>} Array of trending jobs
   */
  async getTrendingJobs(limit = 10) {
    try {
      const jobs = await Job.getTrendingJobs(limit);
      return jobs.map(job => job.toJSON());
    } catch (error) {
      throw new Error(`Failed to get trending jobs: ${error.message}`);
    }
  }

  /**
   * Update job with data transformation
   * @param {String} jobId - Job ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated job
   */
  async updateJob(jobId, updateData) {
    try {
      const transformedData = this.transformJobData(updateData);
      
      const job = await Job.findByIdAndUpdate(
        jobId,
        transformedData,
        { new: true, runValidators: true }
      );
      
      if (!job) {
        throw new Error('Job not found');
      }
      
      return job.toJSON();
    } catch (error) {
      throw new Error(`Failed to update job: ${error.message}`);
    }
  }

  /**
   * Soft delete job (mark as inactive)
   * @param {String} jobId - Job ID
   * @returns {Promise<Object>} Result of deletion
   */
  async deleteJob(jobId) {
    try {
      const job = await Job.findByIdAndUpdate(
        jobId,
        { 'platform_data.is_active': false },
        { new: true }
      );
      
      if (!job) {
        throw new Error('Job not found');
      }
      
      return { 
        message: 'Job deactivated successfully', 
        job: job.toJSON() 
      };
    } catch (error) {
      throw new Error(`Failed to delete job: ${error.message}`);
    }
  }

  /**
   * Bulk import jobs from external APIs
   * @param {Array} jobsData - Array of job data from external API
   * @returns {Promise<Object>} Import results
   */
  async bulkImportJobs(jobsData) {
    try {
      const results = {
        imported: 0,
        updated: 0,
        skipped: 0,
        errors: []
      };

      for (const jobData of jobsData) {
        try {
          const existingJob = await Job.findOne({ 
            external_job_id: jobData.job_id || jobData.job_apply_link 
          });

          const transformedData = this.transformExternalJobData(jobData);
          
          if (existingJob) {
            Object.assign(existingJob, transformedData);
            await existingJob.save();
            results.updated++;
          } else {
            const job = new Job(transformedData);
            await job.save();
            results.imported++;
          }
        } catch (error) {
          results.errors.push({
            job_title: jobData.job_title || 'Unknown',
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to bulk import jobs: ${error.message}`);
    }
  }

  /**
   * Transform external API job data to new schema format
   * @param {Object} externalJobData - Job data from external API
   * @returns {Object} Transformed job data
   */
  transformExternalJobData(externalJobData) {
    return {
      job_title: externalJobData.job_title,
      job_description: externalJobData.job_description,
      employer_name: externalJobData.employer_name,
      employer_logo: externalJobData.employer_logo,
      employer_website: externalJobData.employer_website,
      employer_company_type: this.normalizeCompanyType(externalJobData.employer_company_type),
      
      job_city: externalJobData.job_city,
      job_state: externalJobData.job_state,
      job_country: externalJobData.job_country?.toUpperCase(),
      job_coordinates: {
        latitude: externalJobData.job_latitude,
        longitude: externalJobData.job_longitude
      },
      
      job_employment_type: this.normalizeEmploymentType(externalJobData.job_employment_type),
      job_is_remote: externalJobData.job_is_remote || false,
      
      job_salary: externalJobData.job_salary,
      salary_range: {
        min_salary: externalJobData.job_min_salary,
        max_salary: externalJobData.job_max_salary,
        currency: externalJobData.job_salary_currency || 'USD',
        period: externalJobData.job_salary_period || 'YEAR'
      },
      
      job_apply_link: externalJobData.job_apply_link,
      job_apply_is_direct: externalJobData.job_apply_is_direct || false,
      job_apply_quality_score: externalJobData.job_apply_quality_score,
      
      posting_dates: {
        posted_at: externalJobData.job_posted_at_timestamp ? 
          new Date(externalJobData.job_posted_at_timestamp * 1000) : new Date(),
        posted_at_utc: externalJobData.job_posted_at_datetime_utc ? 
          new Date(externalJobData.job_posted_at_datetime_utc) : new Date(),
        expires_at: externalJobData.job_offer_expiration_datetime_utc ? 
          new Date(externalJobData.job_offer_expiration_datetime_utc) : null
      },
      
      job_publisher: externalJobData.job_publisher,
      external_job_id: externalJobData.job_id,
      external_links: {
        google_jobs: externalJobData.job_google_link
      },
      
      industry_info: {
        naics_code: externalJobData.job_naics_code,
        naics_name: externalJobData.job_naics_name
      },
      
      experience_requirements: externalJobData.job_required_experience || {},
      required_skills: externalJobData.job_required_skills || [],
      education_requirements: externalJobData.job_required_education || {},
      
      platform_data: {
        is_featured: false,
        is_active: true,
        is_verified: false
      }
    };
  }

  /**
   * Normalize company type to valid enum values
   * @param {String} companyType - Raw company type
   * @returns {String} Normalized company type
   */
  normalizeCompanyType(companyType) {
    if (!companyType) return 'Other';
    
    const type = companyType.toLowerCase();
    if (type.includes('startup')) return 'Startup';
    if (type.includes('enterprise') || type.includes('large')) return 'Enterprise';
    if (type.includes('government') || type.includes('public')) return 'Government';
    if (type.includes('nonprofit') || type.includes('non-profit')) return 'Non-profit';
    if (type.includes('agency')) return 'Agency';
    
    return 'Other';
  }

  /**
   * Normalize employment type to match schema enum
   * @param {String} employmentType - Raw employment type
   * @returns {String} Normalized employment type
   */
  normalizeEmploymentType(employmentType) {
    if (!employmentType) return 'FULLTIME';
    
    const type = employmentType.toUpperCase();
    const validTypes = ['FULLTIME', 'PARTTIME', 'CONTRACTOR', 'INTERN', 'TEMPORARY'];
    
    if (validTypes.includes(type)) return type;
    if (type.includes('FULL')) return 'FULLTIME';
    if (type.includes('PART')) return 'PARTTIME';
    if (type.includes('CONTRACT')) return 'CONTRACTOR';
    if (type.includes('INTERN')) return 'INTERN';
    if (type.includes('TEMP')) return 'TEMPORARY';
    
    return 'FULLTIME';
  }
}

module.exports = new JobService();
