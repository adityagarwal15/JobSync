const express = require('express');
const { optionalAuth } = require('../middleware/auth.middleware.js');
const Job = require('../models/job.js');
const dotenv = require('dotenv');

dotenv.config();

const router = express.Router();

// Get database statistics
router.get('/jobs/stats', async (req, res) => {
  try {
    const totalJobs = await Job.countDocuments();
    const latestJob = await Job.findOne().sort({ datePosted: -1 });

    res.json({
      success: true,
      data: {
        totalJobs,
        lastUpdated: latestJob ? latestJob.datePosted : new Date(),
      },
    });
  } catch (error) {
    console.error('Error fetching job stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch database statistics',
    });
  }
});

// Search jobs in local database
router.get('/jobs', async (req, res) => {
  try {
    const { q: searchQuery, location, limit = 10, page = 1 } = req.query;

    console.log('Searching local database for:', {
      query: searchQuery,
      location: location,
      limit: limit,
      page: page,
    });

    // Build search criteria
    const searchCriteria = { isActive: true };

    // Add text search if query provided
    if (searchQuery && searchQuery.trim()) {
      const searchRegex = new RegExp(searchQuery.trim(), 'i');
      searchCriteria.$or = [
        { title: searchRegex },
        { company: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { skills: { $in: [searchRegex] } },
      ];
    }

    // Add location filter if provided
    if (location && location.trim()) {
      const locationRegex = new RegExp(location.trim(), 'i');
      searchCriteria.location = locationRegex;
    }

    // Pagination setup
    const resultsLimit = Math.min(Math.max(1, parseInt(limit) || 10), 20); // Max 20 per request
    const skip = Math.max(0, (parseInt(page) || 1) - 1) * resultsLimit;

    // Execute search query
    const [jobs, totalCount] = await Promise.all([
      Job.find(searchCriteria)
        .sort({ fetchedAt: -1, postedDate: -1 }) // Most recent first
        .skip(skip)
        .limit(resultsLimit)
        .lean()
        .exec(),
      Job.countDocuments(searchCriteria),
    ]);

    console.log(`Found ${jobs.length} jobs out of ${totalCount} total matches`);

    // If no results found in local database, try external API
    if (jobs.length === 0 && (searchQuery || location)) {
      console.log('No local results found, trying external API...');

      try {
        // Call external API internally
        const externalResponse = await fetchExternalJobs(searchQuery, location, limit, page);

        if (externalResponse.success && externalResponse.jobs.length > 0) {
          console.log(`Found ${externalResponse.jobs.length} jobs from external API`);
          return res.json({
            ...externalResponse,
            source: 'external',
            fallback: true,
            message: 'Results from external job search (no local matches found)',
          });
        }
      } catch (externalError) {
        console.error('❌ External API fallback failed:', externalError.message);

        // If it's a rate limit error, provide a helpful message
        if (
          externalError.message.includes('429') ||
          externalError.message.includes('Too Many Requests')
        ) {
          return res.json({
            success: true,
            jobs: [],
            totalResults: 0,
            searchQuery: searchQuery || 'all jobs',
            source: 'local',
            message:
              'No results found in local database. External search temporarily unavailable due to rate limits. Please try a different search term or try again later.',
            rateLimited: true,
            pagination: {
              currentPage: parseInt(page) || 1,
              resultsPerPage: resultsLimit,
              hasNext: false,
              hasPrev: false,
              totalPages: 0,
              totalResults: 0,
            },
          });
        }
        // Continue with empty local results for other errors
      }
    }

    // Transform jobs to frontend format
    const transformedJobs = jobs.map((job) => ({
      title: job.title,
      company: job.company,
      location: job.location,
      description: job.description,
      url: job.url,
      source: job.source,
      jobType: job.jobType,
      skills: job.skills || [],
      category: job.category,
      postedDate: job.postedDate,
      salary: job.salary,
    }));

    // Calculate pagination info
    const currentPage = parseInt(page) || 1;
    const hasNext = skip + resultsLimit < totalCount;
    const hasPrev = currentPage > 1;

    res.json({
      success: true,
      jobs: transformedJobs,
      totalResults: totalCount,
      searchQuery: searchQuery || 'all jobs',
      source: 'local',
      pagination: {
        currentPage: currentPage,
        resultsPerPage: resultsLimit,
        hasNext: hasNext,
        hasPrev: hasPrev,
        totalPages: Math.ceil(totalCount / resultsLimit),
        totalResults: totalCount,
      },
    });
  } catch (error) {
    console.error('❌ Error searching local database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search jobs from database',
      message: error.message,
    });
  }
});

// Get database statistics
router.get('/stats', optionalAuth, async (req, res) => {
  try {
    const [totalJobs, activeJobs, recentJobs, categoriesCount, topCategories] = await Promise.all([
      Job.countDocuments(),
      Job.countDocuments({ isActive: true }),
      Job.countDocuments({
        isActive: true,
        fetchedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      }),
      Job.distinct('category', { isActive: true }),
      Job.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ]);

    res.json({
      success: true,
      stats: {
        totalJobs,
        activeJobs,
        recentJobs,
        totalCategories: categoriesCount.length,
        topCategories: topCategories.map((cat) => ({
          category: cat._id,
          count: cat.count,
        })),
      },
    });
  } catch (error) {
    console.error('❌ Error fetching database stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch database statistics',
    });
  }
});

// External API search when local database has no results
router.get('/jobs/external', async (req, res) => {
  try {
    const { q: searchQuery, location, limit = 10, page = 1 } = req.query;

    console.log('Searching external API for:', {
      query: searchQuery,
      location: location,
      limit: limit,
      page: page,
    });

    const apiKey = process.env.GOOGLE_CLOUD_SEARCH_API;
    const engineId = process.env.GOOGLE_SEARCH_ENGINE_API;

    if (!apiKey || !engineId) {
      return res.status(503).json({
        success: false,
        error: 'External job search service is currently unavailable',
        message: 'Google API credentials not configured',
      });
    }

    // Build search term
    let searchTerm = searchQuery || 'jobs';
    if (location && location.trim()) {
      searchTerm += ` ${location.trim()}`;
    }
    searchTerm += ' jobs';

    const startIndex = ((parseInt(page) || 1) - 1) * parseInt(limit) + 1;
    const query = encodeURIComponent(searchTerm);
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${engineId}&q=${query}&start=${startIndex}&num=${limit}`;


    const response = await fetch(url);

    if (!response.ok) {
      console.error(`❌ External API Error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({
        success: false,
        error: 'External search service error',
        message: 'Unable to fetch jobs from external API',
      });
    }

    const data = await response.json();

    if (data.error) {
      console.error('Google API Error:', data.error);
      return res.status(400).json({
        success: false,
        error: 'External API error',
        message: data.error.message || 'Google API error',
      });
    }

    if (!data.items || data.items.length === 0) {
      return res.json({
        success: true,
        jobs: [],
        totalResults: 0,
        searchQuery: searchQuery,
        source: 'external',
        pagination: {
          currentPage: parseInt(page) || 1,
          resultsPerPage: parseInt(limit),
          hasNext: false,
          hasPrev: false,
          totalPages: 0,
          totalResults: 0,
        },
      });
    }

    // Parse and transform the external API results
    const transformedJobs = data.items.map((item) => ({
      title: cleanTitle(item.title),
      company: extractCompanyName(item.displayLink, item.snippet),
      location: extractLocation(item.snippet) || location || 'Remote',
      description: item.snippet || 'No description available',
      url: item.link,
      source: getSource(item.link),
      jobType: extractJobType(item.snippet, item.title),
      skills: extractSkills(item.snippet, item.title),
      category: searchQuery || 'general',
      postedDate: new Date(),
    }));

    console.log(`Found ${transformedJobs.length} jobs from external API`);

    // Calculate pagination
    const totalResults = parseInt(data.searchInformation?.totalResults) || transformedJobs.length;
    const currentPage = parseInt(page) || 1;
    const resultsPerPage = parseInt(limit);
    const hasNext = startIndex + resultsPerPage <= totalResults;
    const hasPrev = currentPage > 1;

    res.json({
      success: true,
      jobs: transformedJobs,
      totalResults: totalResults,
      searchQuery: searchQuery,
      source: 'external',
      pagination: {
        currentPage: currentPage,
        resultsPerPage: resultsPerPage,
        hasNext: hasNext,
        hasPrev: hasPrev,
        totalPages: Math.ceil(totalResults / resultsPerPage),
        totalResults: totalResults,
      },
    });
  } catch (error) {
    console.error('❌ Error in external job search:', error);
    res.status(500).json({
      success: false,
      error: 'External search failed',
      message: error.message,
    });
  }
});

// Helper function to fetch jobs from external API
async function fetchExternalJobs(searchQuery, location, limit = 10, page = 1) {
  const apiKey = process.env.GOOGLE_CLOUD_SEARCH_API;
  const engineId = process.env.GOOGLE_SEARCH_ENGINE_API;

  if (!apiKey || !engineId) {
    throw new Error('Google API credentials not configured');
  }

  // Build search term
  let searchTerm = searchQuery || 'jobs';
  if (location && location.trim()) {
    searchTerm += ` ${location.trim()}`;
  }
  searchTerm += ' jobs';

  const startIndex = ((parseInt(page) || 1) - 1) * parseInt(limit) + 1;
  const query = encodeURIComponent(searchTerm);
  const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${engineId}&q=${query}&start=${startIndex}&num=${limit}`;


  const response = await fetch(url);

  if (!response.ok) {
    // If rate limited, try mock data as last resort
    if (response.status === 429) {
      console.log('API rate limited, generating mock results...');
      return generateMockJobs(searchQuery, location, limit, page);
    }
    throw new Error(`External API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error.message || 'Google API error');
  }

  if (!data.items || data.items.length === 0) {
    return {
      success: true,
      jobs: [],
      totalResults: 0,
      searchQuery: searchQuery,
      pagination: {
        currentPage: parseInt(page) || 1,
        resultsPerPage: parseInt(limit),
        hasNext: false,
        hasPrev: false,
        totalPages: 0,
        totalResults: 0,
      },
    };
  }

  // Parse and transform the external API results
  const transformedJobs = data.items.map((item) => ({
    title: cleanTitle(item.title),
    company: extractCompanyName(item.displayLink, item.snippet),
    location: extractLocation(item.snippet) || location || 'Remote',
    description: item.snippet || 'No description available',
    url: item.link,
    source: getSource(item.link),
    jobType: extractJobType(item.snippet, item.title),
    skills: extractSkills(item.snippet, item.title),
    category: searchQuery || 'general',
    postedDate: new Date(),
  }));

  // Calculate pagination
  const totalResults = parseInt(data.searchInformation?.totalResults) || transformedJobs.length;
  const currentPage = parseInt(page) || 1;
  const resultsPerPage = parseInt(limit);
  const hasNext = startIndex + resultsPerPage <= totalResults;
  const hasPrev = currentPage > 1;

  return {
    success: true,
    jobs: transformedJobs,
    totalResults: totalResults,
    searchQuery: searchQuery,
    pagination: {
      currentPage: currentPage,
      resultsPerPage: resultsPerPage,
      hasNext: hasNext,
      hasPrev: hasPrev,
      totalPages: Math.ceil(totalResults / resultsPerPage),
      totalResults: totalResults,
    },
  };
}

// Helper function to generate mock jobs when external API fails
function generateMockJobs(searchQuery, location, limit = 10, page = 1) {
  const mockJobTemplates = [
    {
      title: `${searchQuery || 'Software'} Developer`,
      company: 'TechCorp Solutions',
      description: `We are looking for a skilled ${searchQuery || 'software'} developer to join our dynamic team. Great opportunity for career growth.`,
      jobType: 'full-time',
      skills: ['JavaScript', 'React', 'Node.js'],
      category: 'engineering',
    },
    {
      title: `Senior ${searchQuery || 'Software'} Engineer`,
      company: 'InnovateTech',
      description: `Senior position available for ${searchQuery || 'software'} engineering role. Competitive salary and benefits package.`,
      jobType: 'full-time',
      skills: ['Python', 'AWS', 'Docker'],
      category: 'engineering',
    },
    {
      title: `${searchQuery || 'Technical'} Specialist`,
      company: 'Global Systems Ltd',
      description: `Join our team as a ${searchQuery || 'technical'} specialist. Remote work options available.`,
      jobType: 'contract',
      skills: ['Communication', 'Problem Solving'],
      category: 'technical',
    },
  ];

  const jobs = mockJobTemplates.slice(0, parseInt(limit)).map((template, index) => ({
    ...template,
    location: location || 'Remote',
    url: `https://example-jobs.com/job-${index + 1}`,
    source: 'JobSearch Demo',
    postedDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random date within last week
  }));

  return {
    success: true,
    jobs: jobs,
    totalResults: jobs.length,
    searchQuery: searchQuery,
    mock: true,
    pagination: {
      currentPage: parseInt(page) || 1,
      resultsPerPage: parseInt(limit),
      hasNext: false,
      hasPrev: false,
      totalPages: 1,
      totalResults: jobs.length,
    },
  };
}

// Helper function to extract company name (keeping for potential future use)
function extractCompanyName(displayLink, snippet) {
  // Try to extract company from domain
  if (displayLink) {
    const domain = displayLink.split('.')[0];
    const commonJobSites = ['indeed', 'linkedin', 'glassdoor', 'monster', 'naukri', 'shine'];
    if (!commonJobSites.includes(domain.toLowerCase())) {
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    }
  }

  // Try to extract from snippet
  const companyPatterns = [
    /at\s+([A-Z][a-zA-Z\s&]+)/,
    /join\s+([A-Z][a-zA-Z\s&]+)/,
    /([A-Z][a-zA-Z\s&]+)\s+is\s+hiring/,
  ];

  for (const pattern of companyPatterns) {
    const match = snippet.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return 'Company';
}

// Helper function to extract location
function extractLocation(snippet) {
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
function extractJobType(snippet, title) {
  const text = (snippet + ' ' + title).toLowerCase();

  if (text.includes('full-time') || text.includes('full time')) return 'full-time';
  if (text.includes('part-time') || text.includes('part time')) return 'part-time';
  if (text.includes('contract') || text.includes('contractor')) return 'contract';
  if (text.includes('intern') || text.includes('internship')) return 'internship';
  if (text.includes('remote')) return 'remote';

  return 'not-specified';
}

// Helper function to extract skills
function extractSkills(snippet, title) {
  const text = (snippet + ' ' + title).toLowerCase();

  const skills = [
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
    'php',
    'ruby',
    'c++',
    'manual labor',
    'customer service',
    'communication',
    'management',
  ];

  return skills.filter((skill) => text.includes(skill));
}

// Helper function to clean job title
function cleanTitle(title) {
  return title
    .replace(/\s*-\s*.*$/, '') // Remove everything after first dash
    .replace(/\s*\|\s*.*$/, '') // Remove everything after first pipe
    .trim()
    .substring(0, 150);
}

// Helper function to get source from URL
function getSource(url) {
  if (url.includes('linkedin.com')) return 'LinkedIn';
  if (url.includes('indeed.com')) return 'Indeed';
  if (url.includes('glassdoor.com')) return 'Glassdoor';
  if (url.includes('naukri.com')) return 'Naukri';
  if (url.includes('shine.com')) return 'Shine';
  if (url.includes('monster.com')) return 'Monster';
  if (url.includes('timejobs.com')) return 'TimesJobs';
  return 'Job Portal';
}

module.exports = router;
