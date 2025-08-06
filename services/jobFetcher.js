const cron = require('node-cron');
const Job = require('../models/job.js');
const dotenv = require('dotenv');

dotenv.config();

// Use built-in fetch for Node.js 18+
const fetch = globalThis.fetch;

class JobFetcherService {
  constructor() {
    this.isRunning = false;
    this.lastRun = null;
    this.jobCategories = [
      // Blue Collar / Manual Labor Jobs
      'construction worker',
      'house maid',
      'security guard',
      'delivery boy',
      'cook',
      'painter',
      'electrician',
      'plumber',
      'driver',
      'gardener',
      'cleaner',
      'warehouse helper',
      'factory worker',
      'carpenter',
      'mason',
      'auto rickshaw driver',
      'nanny',
      'watchman',
      'ac technician',
      'mobile repair technician',
      'bike mechanic',
      'barber',
      'tailor',
      'laundry worker',
      'software developer',
      'web developer',
      'data scientist',
    ];
  }

  // Initialize the cron job
  init(runImmediately = false) {
    console.log('Initializing Job Fetcher Service...');

    // Get cron configuration from environment variables
    const cronSchedule = process.env.CRON_SCHEDULE || '0 2 * * *';
    const cronTimezone = process.env.CRON_TIMEZONE || 'Asia/Kolkata';

    // Run according to the configured schedule
    cron.schedule(
      cronSchedule,
      async () => {
        console.log('Cron job triggered - Fetching fresh job listings...');
        await this.fetchAndStoreJobs();
      },
      {
        scheduled: true,
        timezone: cronTimezone,
      }
    );

    // Schedule a weekly detailed cleanup (Sundays at 3:00 AM)
    cron.schedule(
      '0 3 * * 0',
      async () => {
        console.log('Weekly cleanup job triggered...');
        await this.performWeeklyMaintenance();
      },
      {
        scheduled: true,
        timezone: cronTimezone,
      }
    );

    // Only run immediately if explicitly requested
    if (runImmediately) {
      console.log('Running initial job fetch...');
      this.fetchAndStoreJobs();
    }

    console.log('Job Fetcher Service initialized successfully');
    console.log(`Next scheduled run: ${cronSchedule} (${cronTimezone} timezone)`);
    console.log('Weekly maintenance: Sundays at 3:00 AM');
    console.log(`Current time: ${new Date().toLocaleString('en-IN', { timeZone: cronTimezone })}`);
  }

  // Main function to fetch and store jobs
  async fetchAndStoreJobs() {
    if (this.isRunning) {
      console.log('Job fetching already in progress, skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      console.log('Starting job fetch process...');

      // Clear old jobs (older than configured days)
      await this.cleanupOldJobs();

      let totalJobsFetched = 0;
      let totalJobsSaved = 0;
      let failedCategories = [];

      // Fetch jobs for each category
      for (const category of this.jobCategories) {
        try {
          console.log(`Fetching jobs for category: ${category}`);
          const jobs = await this.fetchJobsFromAPI(category);

          if (jobs && jobs.length > 0) {
            const savedCount = await this.saveJobsToDB(jobs, category);
            totalJobsFetched += jobs.length;
            totalJobsSaved += savedCount;
            console.log(
              `✅ Category ${category}: Fetched ${jobs.length}, Saved ${savedCount} new jobs`
            );
          } else {
            console.log(`No jobs found for category: ${category}`);
          }

          // Add delay between API calls to avoid rate limiting
          await this.delay(2000);
        } catch (error) {
          console.error(`❌ Error fetching jobs for category ${category}:`, error.message);
          failedCategories.push(category);
        }
      }

      // Update metrics
      this.lastRun = new Date();
      const duration = (Date.now() - startTime) / 1000;

      console.log('Job fetch completed!');
      console.log(
        `Results: Fetched ${totalJobsFetched}, Saved ${totalJobsSaved}, Duration: ${duration}s`
      );

      if (failedCategories.length > 0) {
        console.log(`Failed categories: ${failedCategories.join(', ')}`);
      }
    } catch (error) {
      console.error('❌ Error in job fetching process:', error);
    } finally {
      this.isRunning = false;
    }
  }

  // Fetch jobs from Google Custom Search API
  async fetchJobsFromAPI(searchTerm) {
    try {
      const apiKey = process.env.GOOGLE_CLOUD_SEARCH_API;
      const engineId = process.env.GOOGLE_SEARCH_ENGINE_API;

      if (!apiKey || !engineId) {
        console.log(`Google API credentials not configured, using mock data for: ${searchTerm}`);
        return this.generateMockJobs(searchTerm);
      }

      console.log(`Making API call for: ${searchTerm}`);

      // Try multiple search strategies - adapted for blue collar jobs
      const searchStrategies = [
        `${searchTerm} jobs`,
        `${searchTerm} vacancy`,
        `${searchTerm} hiring`,
        `"${searchTerm}" job openings`,
        `${searchTerm} work opportunity`,
      ];

      let allResults = [];

      for (let i = 0; i < searchStrategies.length && allResults.length < 10; i++) {
        const query = encodeURIComponent(searchStrategies[i]);
        const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${engineId}&q=${query}&num=10`;

        const response = await fetch(url);

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            `API Response Error (Strategy ${i + 1}): ${response.status} ${response.statusText}`
          );
          console.error(`Error Details: ${errorText}`);
          continue;
        }

        const data = await response.json();
        console.log(`API Response for ${searchTerm} (Strategy ${i + 1}):`, {
          totalResults: data.searchInformation?.totalResults || 0,
          itemsFound: data.items?.length || 0,
          hasError: !!data.error,
          searchQuery: searchStrategies[i],
        });

        if (data.error) {
          console.error(`Google API Error (Strategy ${i + 1}):`, data.error);
          continue;
        }

        if (data.items && data.items.length > 0) {
          allResults.push(...data.items);
          console.log(
            `Found ${data.items.length} results from API for: ${searchTerm} (Strategy ${i + 1})`
          );
          break; // Stop after first successful strategy
        }

        // Add delay between API calls to avoid rate limiting
        await this.delay(1000);
      }

      if (allResults.length === 0) {
        console.log(`No results from any API strategy for ${searchTerm}, generating mock data`);
        return this.generateMockJobs(searchTerm);
      }

      console.log(`Total API results found for ${searchTerm}: ${allResults.length}`);
      // Parse and structure the job data
      return allResults.slice(0, 10).map((item) => this.parseJobItem(item, searchTerm));
    } catch (error) {
      console.error(`Error fetching jobs for ${searchTerm}:`, error.message);
      console.log(`Falling back to mock data for: ${searchTerm}`);
      return this.generateMockJobs(searchTerm);
    }
  }

  // Generate mock jobs when API is not available
  generateMockJobs(category) {
    // Different company types for different job categories
    const blueCollarCompanies = [
      'HomeCare Services',
      'QuickFix Solutions',
      'SecureGuard Agency',
      'FastTrack Delivery',
      'BuildRight Contractors',
      'CleanPro Services',
      'CityRide Transport',
      'FreshFood Restaurant',
      'GreenThumb Landscaping',
      'SafeWatch Security',
      'ExpressMove Logistics',
      'SkillCraft Workshop',
    ];

    const techCompanies = [
      'TechCorp',
      'InnovateLabs',
      'StartupX',
      'DigitalSolutions',
      'CodeCraft',
      'DevCompany',
    ];

    // Indian cities and areas for blue collar jobs
    const indianLocations = [
      'Andheri, Mumbai',
      'Sector 15, Noida',
      'Koramangala, Bangalore',
      'T. Nagar, Chennai',
      'Banjara Hills, Hyderabad',
      'Connaught Place, Delhi',
      'Salt Lake, Kolkata',
      'Hadapsar, Pune',
      'Whitefield, Bangalore',
      'Viman Nagar, Pune',
      'Thane, Mumbai',
      'Sector 18, Gurgaon',
      'Electronic City, Bangalore',
      'Malviya Nagar, Delhi',
      'Jubilee Hills, Hyderabad',
    ];

    const usLocations = [
      'New York, NY',
      'San Francisco, CA',
      'Austin, TX',
      'Seattle, WA',
      'Remote',
      'Boston, MA',
    ];

    // Job types for blue collar vs tech jobs
    const blueCollarJobTypes = ['daily', 'weekly', 'contract', 'part-time'];
    const techJobTypes = ['full-time', 'part-time', 'contract', 'remote'];

    const skillsMap = {
      'construction worker': [
        'Manual Labor',
        'Safety Protocols',
        'Tool Handling',
        'Physical Fitness',
      ],
      'house maid': ['Cleaning', 'Organization', 'Housekeeping', 'Time Management'],
      'security guard': ['Security Protocols', 'Surveillance', 'Communication', 'Alert Monitoring'],
      'delivery boy': ['Vehicle Operation', 'Navigation', 'Customer Service', 'Time Management'],
      cook: ['Indian Cuisine', 'Food Safety', 'Kitchen Management', 'Recipe Following'],
      painter: ['Wall Painting', 'Color Mixing', 'Surface Preparation', 'Tool Maintenance'],
      electrician: [
        'Electrical Wiring',
        'Safety Protocols',
        'Circuit Installation',
        'Troubleshooting',
      ],
      plumber: ['Pipe Installation', 'Leak Repair', 'Drainage Systems', 'Tool Usage'],
      driver: ['Safe Driving', 'Route Knowledge', 'Vehicle Maintenance', 'Customer Service'],
      gardener: ['Plant Care', 'Landscaping', 'Irrigation', 'Garden Maintenance'],
      cleaner: ['Deep Cleaning', 'Sanitation', 'Equipment Operation', 'Chemical Safety'],
      'warehouse helper': [
        'Loading/Unloading',
        'Inventory Management',
        'Physical Fitness',
        'Safety',
      ],
      'factory worker': [
        'Assembly Line',
        'Quality Control',
        'Machine Operation',
        'Safety Protocols',
      ],
      carpenter: ['Wood Working', 'Furniture Making', 'Tool Usage', 'Measurement'],
      mason: ['Brick Laying', 'Cement Work', 'Construction', 'Measurement'],
      'auto rickshaw driver': [
        'Three Wheeler Driving',
        'Route Knowledge',
        'Customer Service',
        'Vehicle Maintenance',
      ],
      nanny: ['Child Care', 'Safety Awareness', 'Activity Planning', 'Communication'],
      watchman: ['Night Security', 'Patrol Duties', 'Emergency Response', 'Vigilance'],
      'ac technician': [
        'AC Installation',
        'Repair Work',
        'Technical Knowledge',
        'Customer Service',
      ],
      'mobile repair technician': [
        'Mobile Repair',
        'Component Replacement',
        'Diagnosis',
        'Customer Service',
      ],
      'bike mechanic': ['Two Wheeler Repair', 'Engine Knowledge', 'Tool Usage', 'Customer Service'],
      barber: ['Hair Cutting', 'Styling', 'Customer Service', 'Hygiene'],
      tailor: ['Stitching', 'Measurement', 'Pattern Making', 'Customer Service'],
      'laundry worker': ['Washing', 'Ironing', 'Stain Removal', 'Customer Service'],
      'software developer': ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL'],
      'web developer': ['HTML', 'CSS', 'JavaScript', 'React', 'Vue.js', 'Angular'],
      'data scientist': ['Python', 'R', 'SQL', 'Machine Learning', 'TensorFlow', 'Pandas'],
    };

    // Determine if this is a blue collar or tech job
    const isBlueCollar = !['software developer', 'web developer', 'data scientist'].includes(
      category
    );

    const companies = isBlueCollar ? blueCollarCompanies : techCompanies;
    const locations = isBlueCollar ? indianLocations : usLocations;
    const jobTypes = isBlueCollar ? blueCollarJobTypes : techJobTypes;

    const mockJobs = [];
    const numJobs = Math.floor(Math.random() * 8) + 3; 

    for (let i = 0; i < numJobs; i++) {
      const company = companies[Math.floor(Math.random() * companies.length)];
      const location = locations[Math.floor(Math.random() * locations.length)];
      const jobType = jobTypes[Math.floor(Math.random() * jobTypes.length)];
      const skills = skillsMap[category] || ['Basic Skills', 'Communication'];
      const selectedSkills = skills.slice(0, Math.floor(Math.random() * 3) + 2);

      // Generate different descriptions for blue collar vs tech jobs
      let description;
      if (isBlueCollar) {
        const wageInfo = this.generateWageInfo(category, jobType);
        description = `We are hiring a reliable ${category} to join our team at ${company}. ${wageInfo}. The ideal candidate should have experience with ${selectedSkills.join(', ')} and be hardworking and dependable. ${this.getJobSpecificRequirements(category)}`;
      } else {
        description = `We are looking for a talented ${category} to join our team at ${company}. You will work on exciting projects and contribute to innovative solutions. The ideal candidate should have experience with ${selectedSkills.join(', ')} and be passionate about technology.`;
      }

      mockJobs.push({
        title: `${this.capitalizeWords(category)} - ${company}`,
        company: company,
        location: location,
        description: description,
        url: `https://example-jobs.com/jobs/${company.toLowerCase().replace(/\s+/g, '-')}-${category.replace(/\s+/g, '-')}-${i + 1}`,
        source: isBlueCollar ? 'Local Agency' : 'TechJobs',
        jobType: jobType,
        skills: selectedSkills,
        category: category,
        postedDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last 7 days
        fetchedAt: new Date(),
        isActive: true,
      });
    }

    return mockJobs;
  }

  // Generate wage information for blue collar jobs
  generateWageInfo(category, jobType) {
    const wageRanges = {
      daily: {
        'construction worker': '₹500-800 per day',
        'house maid': '₹300-500 per day',
        'security guard': '₹400-600 per day',
        'delivery boy': '₹400-700 per day',
        cook: '₹400-800 per day',
        painter: '₹600-1000 per day',
        electrician: '₹800-1200 per day',
        plumber: '₹700-1100 per day',
        driver: '₹500-800 per day',
        gardener: '₹300-500 per day',
        cleaner: '₹300-500 per day',
        'warehouse helper': '₹400-600 per day',
        'factory worker': '₹400-700 per day',
        carpenter: '₹700-1200 per day',
        mason: '₹600-1000 per day',
      },
      weekly: {
        'construction worker': '₹3000-5000 per week',
        'house maid': '₹2000-3500 per week',
        'security guard': '₹2500-4000 per week',
        'delivery boy': '₹2500-4500 per week',
        cook: '₹2500-5000 per week',
      },
      contract: {
        'construction worker': '₹15000-25000 per month',
        'security guard': '₹12000-20000 per month',
        cook: '₹12000-25000 per month',
        driver: '₹15000-25000 per month',
      },
    };

    const categoryWages = wageRanges[jobType];
    if (categoryWages && categoryWages[category]) {
      return `Salary: ${categoryWages[category]}`;
    }

    // Default wages based on job type
    const defaultWages = {
      daily: '₹400-800 per day',
      weekly: '₹2500-4500 per week',
      contract: '₹12000-25000 per month',
      'part-time': '₹8000-15000 per month',
    };

    return `Salary: ${defaultWages[jobType] || 'Negotiable'}`;
  }

  // Get job-specific requirements
  getJobSpecificRequirements(category) {
    const requirements = {
      'construction worker': 'Safety gear will be provided. Physical fitness required.',
      'house maid': 'References required. Flexible working hours.',
      'security guard': 'Basic training will be provided. Night shifts available.',
      'delivery boy': 'Own vehicle preferred. Smartphone required.',
      cook: 'Knowledge of local cuisine preferred. Accommodation may be available.',
      painter: 'Own tools preferred but not mandatory.',
      electrician: 'Valid electrical license required. Safety certification preferred.',
      plumber: 'Own tools preferred. Emergency call availability.',
      driver: 'Valid driving license required. Clean driving record.',
      gardener: 'Plant care experience needed. Weekend work required.',
      cleaner: 'Flexible timing. Health checkup may be required.',
      'warehouse helper': 'Physical fitness required. Day and night shifts available.',
      'factory worker': 'Basic technical skills preferred. Training provided.',
      carpenter: 'Experience with modern tools preferred.',
      mason: '2+ years experience required.',
      'auto rickshaw driver': 'Own vehicle preferred. Knowledge of city routes.',
      nanny: 'Previous experience with children required.',
      watchman: 'Night shift work. Alert and reliable person needed.',
      'ac technician': 'Technical training certificate preferred.',
      'mobile repair technician': 'Knowledge of smartphone repair required.',
      'bike mechanic': 'Experience with all brands preferred.',
      barber: 'Modern hair cutting skills required.',
      tailor: 'Knowledge of modern stitching techniques preferred.',
      'laundry worker': 'Experience with dry cleaning preferred.',
    };

    return requirements[category] || 'Experience preferred but not mandatory.';
  }

  // Helper function to capitalize words
  capitalizeWords(str) {
    return str.replace(/\b\w/g, (l) => l.toUpperCase());
  }

  // Parse individual job item from API response
  parseJobItem(item, category) {
    // Extract company name from snippet or title
    const company = this.extractCompany(item.snippet, item.title);

    // Extract location if available
    const location = this.extractLocation(item.snippet) || 'Remote';

    // Extract job type
    const jobType = this.extractJobType(item.snippet, item.title);

    // Extract skills/technologies
    const skills = this.extractSkills(item.snippet, item.title);

    return {
      title: this.cleanTitle(item.title),
      company: company,
      location: location,
      description: item.snippet || 'No description available',
      url: item.link,
      source: this.getSource(item.link),
      jobType: jobType,
      skills: skills,
      category: category,
      postedDate: new Date(),
      fetchedAt: new Date(),
      isActive: true,
    };
  }

  // Helper function to extract company name
  extractCompany(snippet, title) {
    // Common patterns for company names
    const companyPatterns = [
      /at ([A-Z][a-zA-Z\s&.]+)/,
      /by ([A-Z][a-zA-Z\s&.]+)/,
      /- ([A-Z][a-zA-Z\s&.]+)/,
      /\| ([A-Z][a-zA-Z\s&.]+)/,
    ];

    for (const pattern of companyPatterns) {
      const match = snippet.match(pattern) || title.match(pattern);
      if (match && match[1]) {
        return match[1].trim().replace(/\s+/g, ' ').substring(0, 100);
      }
    }

    return 'Company Not Specified';
  }

  // Helper function to extract location
  extractLocation(snippet) {
    const locationPatterns = [
      /in ([A-Z][a-zA-Z\s,]+(?:, [A-Z]{2})?)/,
      /- ([A-Z][a-zA-Z\s,]+(?:, [A-Z]{2})?)/,
      /(Remote|Hybrid|On-site)/i,
    ];

    for (const pattern of locationPatterns) {
      const match = snippet.match(pattern);
      if (match && match[1]) {
        return match[1].trim().substring(0, 100);
      }
    }

    return null;
  }

  // Helper function to extract job type
  extractJobType(snippet, title) {
    const text = (snippet + ' ' + title).toLowerCase();

    // Blue collar job types
    if (text.includes('daily wage') || text.includes('daily pay')) return 'daily';
    if (text.includes('weekly') || text.includes('weekly payment')) return 'weekly';
    if (text.includes('contract') || text.includes('contractor')) return 'contract';
    if (text.includes('part-time') || text.includes('part time')) return 'part-time';

    // Tech job types
    if (text.includes('full-time') || text.includes('full time')) return 'full-time';
    if (text.includes('intern') || text.includes('internship')) return 'internship';
    if (text.includes('remote')) return 'remote';

    return 'not-specified';
  }

  // Helper function to extract skills
  extractSkills(snippet, title) {
    const text = (snippet + ' ' + title).toLowerCase();

    // Blue collar skill keywords
    const blueCollarSkills = [
      'manual labor',
      'physical fitness',
      'safety protocols',
      'tool handling',
      'cleaning',
      'housekeeping',
      'organization',
      'time management',
      'security',
      'surveillance',
      'communication',
      'customer service',
      'driving',
      'navigation',
      'vehicle maintenance',
      'delivery',
      'cooking',
      'food safety',
      'kitchen management',
      'indian cuisine',
      'painting',
      'color mixing',
      'surface preparation',
      'wall painting',
      'electrical',
      'wiring',
      'circuit installation',
      'troubleshooting',
      'plumbing',
      'pipe installation',
      'leak repair',
      'drainage',
      'gardening',
      'plant care',
      'landscaping',
      'irrigation',
      'construction',
      'brick laying',
      'cement work',
      'carpentry',
      'wood working',
      'furniture making',
      'measurement',
      'child care',
      'safety awareness',
      'activity planning',
      'repair work',
      'technical knowledge',
      'diagnosis',
      'hair cutting',
      'styling',
      'hygiene',
      'stitching',
      'washing',
      'ironing',
      'stain removal',
    ];

    // Tech skill keywords
    const techSkills = [
      'javascript',
      'python',
      'java',
      'react',
      'node.js',
      'angular',
      'vue',
      'html',
      'css',
      'sql',
      'mongodb',
      'postgresql',
      'aws',
      'docker',
      'kubernetes',
      'git',
      'agile',
      'scrum',
      'machine learning',
      'ai',
    ];

    const allSkills = [...blueCollarSkills, ...techSkills];
    return allSkills.filter((skill) => text.includes(skill));
  }

  // Helper function to clean job title
  cleanTitle(title) {
    return title
      .replace(/\s*-\s*.*$/, '') // Remove everything after first dash
      .replace(/\s*\|\s*.*$/, '') // Remove everything after first pipe
      .trim()
      .substring(0, 150);
  }

  // Helper function to get source from URL
  getSource(url) {
    if (url.includes('linkedin.com')) return 'LinkedIn';
    if (url.includes('indeed.com')) return 'Indeed';
    if (url.includes('glassdoor.com')) return 'Glassdoor';
    if (url.includes('naukri.com')) return 'Naukri';
    if (url.includes('shine.com')) return 'Shine';
    if (url.includes('monster.com')) return 'Monster';
    if (url.includes('timejobs.com')) return 'TimesJobs';
    if (url.includes('quikr.com')) return 'Quikr';
    if (url.includes('olx.in')) return 'OLX';
    return 'Job Portal';
  }

  // Save jobs to database
  async saveJobsToDB(jobs, category) {
    let savedCount = 0;

    for (const jobData of jobs) {
      try {
        // Check if job already exists (by URL)
        const existingJob = await Job.findOne({ url: jobData.url });

        if (!existingJob) {
          await Job.create(jobData);
          savedCount++;
        } else {
          // Update existing job data
          await Job.findOneAndUpdate(
            { url: jobData.url },
            {
              ...jobData,
              fetchedAt: new Date(),
              isActive: true,
            }
          );
        }
      } catch (error) {
        if (error.code !== 11000) {
          // Ignore duplicate key errors
          console.error('Error saving job:', error.message);
        }
      }
    }

    return savedCount;
  }

  // Clean up old jobs
  async cleanupOldJobs() {
    try {
      const cleanupDays = parseInt(process.env.JOB_CLEANUP_DAYS) || 7;
      const cleanupDate = new Date(Date.now() - cleanupDays * 24 * 60 * 60 * 1000);

      const result = await Job.deleteMany({
        fetchedAt: { $lt: cleanupDate },
        isActive: true,
      });

      if (result.deletedCount > 0) {
        console.log(
          `🧹 Cleaned up ${result.deletedCount} old job listings (older than ${cleanupDays} days)`
        );
      }
    } catch (error) {
      console.error('Error cleaning up old jobs:', error);
    }
  }

  // Perform weekly maintenance tasks
  async performWeeklyMaintenance() {
    try {
      console.log('🔧 Starting weekly maintenance...');

      // Remove duplicate jobs and perform basic cleanup
      await this.cleanupOldJobs();

      // Get basic statistics
      const totalJobs = await Job.countDocuments({ isActive: true });
      console.log(`Current active jobs: ${totalJobs}`);

      console.log('Weekly maintenance completed');
    } catch (error) {
      console.error('❌ Error during weekly maintenance:', error);
    }
  }

  // Get jobs for frontend
  async getJobs(filters = {}) {
    try {
      const { category, location, jobType, search, page = 1, limit = 20 } = filters;

      const query = { isActive: true };

      // Apply filters
      if (category && category !== 'all') {
        query.category = { $regex: category, $options: 'i' };
      }

      if (location && location !== 'all') {
        query.location = { $regex: location, $options: 'i' };
      }

      if (jobType && jobType !== 'all') {
        query.jobType = jobType;
      }

      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { company: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      const skip = (page - 1) * limit;

      const jobs = await Job.find(query)
        .sort({ postedDate: -1, fetchedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();

      const total = await Job.countDocuments(query);

      return {
        jobs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error('Error fetching jobs:', error);
      return { jobs: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
    }
  }

  // Get service status
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastRun: this.lastRun,
      categories: this.jobCategories.length,
    };
  }

  // Manual trigger for testing
  async manualFetch() {
    console.log('Manual job fetch triggered');
    await this.fetchAndStoreJobs();
  }

  // Utility function for delays
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

module.exports = new JobFetcherService();
