// Job Dashboard Management System - Google Custom Search API Integration
class JobDashboard {
  constructor() {
    this.currentJobs = [];
    this.currentPage = 1;
    this.totalPages = 1;
    this.filters = {
      category: 'all',
      location: 'all',
      jobType: 'all',
      search: '',
    };
    this.isLoading = false;
    this.apiKey = null;
    this.engineId = null;
    this.init();
  }

  async init() {
    try {
      this.setupEventListeners();
      console.log('JobSync Dashboard initialized with Google Custom Search API integration');
    } catch (error) {
      console.error('Error initializing job dashboard:', error);
      this.showError('Failed to initialize dashboard');
    }
  }

  // Setup event listeners
  setupEventListeners() {
    const searchBtn = document.getElementById('btn-search');
    const searchInput = document.getElementById('search');
    const locationInput = document.getElementById('location');

    if (searchBtn) {
      searchBtn.addEventListener('click', () => this.handleSearch());
    }

    if (searchInput) {
      searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleSearch();
        }
      });
    }

    if (locationInput) {
      locationInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          this.handleSearch();
        }
      });
    }

    // Filter handlers
    document.querySelectorAll('.filter-pill').forEach((pill) => {
      pill.addEventListener('click', () => this.handleFilterClick(pill));
    });
  }

  // Handle search functionality
  async handleSearch() {
    const searchInput = document.getElementById('search');
    const locationInput = document.getElementById('location');

    if (!searchInput || !locationInput) return;

    const searchTerm = searchInput.value.trim() || 'software engineer';
    const location = locationInput.value.trim();

    this.filters.search = searchTerm;
    this.filters.location = location;

    await this.searchJobs(searchTerm, location);
  }

  // Handle filter selection
  handleFilterClick(filterElement) {
    const filterType = filterElement.dataset.filter;
    const filterValue = filterElement.dataset.value;

    // Toggle active state
    if (filterElement.classList.contains('active')) {
      filterElement.classList.remove('active');
      this.filters[filterType] = 'all';
    } else {
      // Remove other active filters of the same type
      document.querySelectorAll(`[data-filter="${filterType}"]`).forEach((el) => {
        el.classList.remove('active');
      });

      filterElement.classList.add('active');
      this.filters[filterType] = filterValue;
    }

    this.applyFilters();
  }

  // Apply filters to current search
  async applyFilters() {
    const searchTerm = this.filters.search || 'jobs';
    let enhancedSearchTerm = searchTerm;

    // Enhance search term with filters
    if (this.filters.category !== 'all') {
      enhancedSearchTerm = `${this.filters.category} ${searchTerm}`;
    }

    if (this.filters.jobType !== 'all') {
      enhancedSearchTerm += ` ${this.filters.jobType}`;
    }

    if (this.filters.location === 'remote') {
      enhancedSearchTerm += ' remote';
    }

    await this.searchJobs(
      enhancedSearchTerm,
      this.filters.location === 'all' ? '' : this.filters.location
    );
  }

  // Search jobs using Google Custom Search API
  async searchJobs(searchTerm, location = '') {
    if (this.isLoading) return;

    this.isLoading = true;
    this.showLoading(true);

    try {
      // Build search query
      let searchQuery = `${searchTerm} jobs`;
      if (location && location.trim() && location !== 'all') {
        searchQuery += ` in ${location.trim()}`;
      }

      // Use the proxy endpoint instead of direct Google API call
      const response = await fetch(
        `/api/google-search?q=${encodeURIComponent(searchQuery)}&num=10`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.items && data.items.length > 0) {
        const transformedJobs = this.transformGoogleResults(data.items, location);
        this.currentJobs = transformedJobs;
        this.renderJobs();
        this.showSuccess(`Found ${transformedJobs.length} job opportunities`);
      } else {
        this.currentJobs = [];
        this.renderJobs();
        this.showInfo('No jobs found for your search criteria');
      }
    } catch (error) {
      console.error('Error searching jobs:', error);
      this.showError('Failed to search jobs. Showing sample data.');
      this.showSampleJobs();
    } finally {
      this.isLoading = false;
      this.showLoading(false);
    }
  }

  // Transform Google Custom Search results to job format
  transformGoogleResults(items, searchLocation) {
    return items.map((item, index) => {
      const title = item.title;
      const company = this.extractCompanyName(item.displayLink, item.snippet);
      const location = this.extractLocation(item.snippet, searchLocation);
      const description = item.snippet;

      return {
        _id: `google_${index}`,
        title: title,
        company: company,
        location: location,
        description: description,
        url: item.link,
        source: item.displayLink || 'Job Board',
        postedDate: new Date().toISOString(),
        jobType: 'Not specified',
        skills: [],
        category: 'General',
      };
    });
  }

  // Extract company name from search results
  extractCompanyName(displayLink, snippet) {
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

  // Extract location from search results
  extractLocation(snippet, searchLocation) {
    if (searchLocation && searchLocation.trim() && searchLocation !== 'all') {
      return searchLocation.trim();
    }

    // Try to extract location from snippet
    const locationPatterns = [
      /in\s+([A-Z][a-zA-Z\s,]+)/,
      /([A-Z][a-zA-Z\s]+),\s*[A-Z]{2}/,
      /Remote/i,
    ];

    for (const pattern of locationPatterns) {
      const match = snippet.match(pattern);
      if (match) {
        return match[1] || match[0];
      }
    }

    return 'Location not specified';
  }

  // Show sample jobs when API is not available
  showSampleJobs() {
    this.currentJobs = [
      {
        _id: 'sample_1',
        title: 'Senior Software Engineer',
        company: 'TechCorp',
        location: 'San Francisco, CA',
        description:
          'Join our team as a Senior Software Engineer. Work on cutting-edge technologies and build scalable applications.',
        url: '#',
        source: 'Company Website',
        jobType: 'Full-time',
        skills: ['JavaScript', 'React', 'Node.js'],
        category: 'Engineering',
      },
      {
        _id: 'sample_2',
        title: 'Product Manager',
        company: 'InnovateCo',
        location: 'New York, NY',
        description:
          'Lead product strategy and roadmap for our flagship products. Drive cross-functional collaboration.',
        url: '#',
        source: 'LinkedIn',
        jobType: 'Full-time',
        skills: ['Product Strategy', 'Analytics', 'Leadership'],
        category: 'Product',
      },
      {
        _id: 'sample_3',
        title: 'UX Designer',
        company: 'DesignStudio',
        location: 'Remote',
        description:
          'Create exceptional user experiences for web and mobile applications. Collaborate with product teams.',
        url: '#',
        source: 'Indeed',
        jobType: 'Contract',
        skills: ['Figma', 'User Research', 'Prototyping'],
        category: 'Design',
      },
      {
        _id: 'sample_4',
        title: 'Data Scientist',
        company: 'DataTech',
        location: 'Seattle, WA',
        description:
          'Analyze large datasets to drive business insights. Build machine learning models and data pipelines.',
        url: '#',
        source: 'Glassdoor',
        jobType: 'Full-time',
        skills: ['Python', 'SQL', 'Machine Learning'],
        category: 'Data Science',
      },
      {
        _id: 'sample_5',
        title: 'Marketing Manager',
        company: 'GrowthCo',
        location: 'Austin, TX',
        description:
          'Drive marketing campaigns and growth initiatives. Work with cross-functional teams to achieve business goals.',
        url: '#',
        source: 'Monster',
        jobType: 'Full-time',
        skills: ['Digital Marketing', 'Analytics', 'Content Strategy'],
        category: 'Marketing',
      },
      {
        _id: 'sample_6',
        title: 'DevOps Engineer',
        company: 'CloudTech',
        location: 'Remote',
        description:
          'Manage cloud infrastructure and deployment pipelines. Ensure system reliability and scalability.',
        url: '#',
        source: 'AngelList',
        jobType: 'Full-time',
        skills: ['AWS', 'Docker', 'Kubernetes'],
        category: 'Engineering',
      },
      {
        _id: 'sample_7',
        title: 'Construction Project Manager',
        company: 'BuildCorp',
        location: 'Houston, TX',
        description:
          'Oversee construction projects from planning to completion. Coordinate with contractors, suppliers, and clients.',
        url: '#',
        source: 'ConstructionJobs',
        jobType: 'Full-time',
        skills: ['Project Management', 'Safety Protocols', 'Team Leadership'],
        category: 'Construction',
      },
      {
        _id: 'sample_8',
        title: 'Manufacturing Technician',
        company: 'Industrial Solutions',
        location: 'Detroit, MI',
        description:
          'Operate and maintain manufacturing equipment. Ensure quality control and safety standards.',
        url: '#',
        source: 'ManufacturingJobs',
        jobType: 'Full-time',
        skills: ['Equipment Operation', 'Quality Control', 'Safety Compliance'],
        category: 'Manufacturing',
      },
      {
        _id: 'sample_9',
        title: 'Truck Driver - Long Haul',
        company: 'TransportPro',
        location: 'Multiple Locations',
        description:
          'Transport goods across states with modern fleet. Excellent benefits and competitive pay.',
        url: '#',
        source: 'TruckingJobs',
        jobType: 'Full-time',
        skills: ['CDL License', 'Route Planning', 'Vehicle Maintenance'],
        category: 'Logistics',
      },
      {
        _id: 'sample_10',
        title: 'Certified Nursing Assistant',
        company: 'CareFirst Medical',
        location: 'Phoenix, AZ',
        description:
          'Provide compassionate care to patients. Work in a supportive healthcare environment.',
        url: '#',
        source: 'HealthcareJobs',
        jobType: 'Full-time',
        skills: ['Patient Care', 'Medical Assistance', 'Compassion'],
        category: 'Healthcare Support',
      },
      {
        _id: 'sample_11',
        title: 'Retail Store Manager',
        company: 'ShopSmart',
        location: 'Miami, FL',
        description:
          'Lead retail team to deliver excellent customer service. Manage inventory and daily operations.',
        url: '#',
        source: 'RetailCareers',
        jobType: 'Full-time',
        skills: ['Customer Service', 'Team Management', 'Inventory Management'],
        category: 'Retail',
      },
      {
        _id: 'sample_12',
        title: 'HVAC Technician',
        company: 'Climate Control Inc',
        location: 'Las Vegas, NV',
        description:
          'Install and repair heating, ventilation, and air conditioning systems. Competitive wages and benefits.',
        url: '#',
        source: 'TradeJobs',
        jobType: 'Full-time',
        skills: ['HVAC Systems', 'Troubleshooting', 'Customer Service'],
        category: 'Skilled Trades',
      },
    ];
    this.renderJobs();
  }

  // Render jobs list
  renderJobs() {
    const jobsContainer = document.getElementById('results-container');
    const jobsCount = document.getElementById('jobs-count');

    if (!jobsContainer || !jobsCount) return;

    if (this.currentJobs.length === 0) {
      jobsContainer.innerHTML = `
        <div class="empty-state">
          <i class="fas fa-search"></i>
          <h3>No opportunities found</h3>
          <p>Try searching with different keywords or adjust your filters</p>
        </div>
      `;
      jobsCount.textContent = 'No opportunities found';
      return;
    }

    const jobsHTML = this.currentJobs.map((job) => this.createJobCard(job)).join('');
    jobsContainer.innerHTML = jobsHTML;
    jobsCount.textContent = `${this.currentJobs.length} opportunities found`;
  }

  // Create individual job card (simplified for Google Custom Search API)
  createJobCard(job) {
    const tagTypes = ['featured', 'trending', 'urgent', ''];
    const tagTexts = ['Featured', 'Trending', 'Urgent', 'New'];
    const randomIndex = Math.floor(Math.random() * tagTypes.length);
    const tagType = tagTypes[randomIndex];
    const tagText = tagTexts[randomIndex];

    return `
      <div class="job-card" data-job-id="${job._id}">
        <div class="job-header">
          <div class="job-info">
            <h3>${this.escapeHtml(job.title)}</h3>
            <div class="job-company">${this.escapeHtml(job.company)}</div>
            <div class="job-location">
              <i class="fas fa-map-marker-alt"></i>
              ${this.escapeHtml(job.location)}
            </div>
          </div>
          ${tagText ? `<div class="job-tags"><span class="job-tag ${tagType}">${tagText}</span></div>` : ''}
        </div>
        
        <div class="job-description">
          ${this.truncateText(this.escapeHtml(job.description), 150)}
        </div>
        
        <div class="job-footer">
          <div class="job-source">
            <i class="fas fa-external-link-alt"></i>
            ${this.escapeHtml(job.source)}
          </div>
          <a href="${job.url}" target="_blank" rel="noopener noreferrer" class="apply-btn">
            Apply Now
          </a>
        </div>
      </div>
    `;
  }

  // Show loading state
  showLoading(show) {
    const loader = document.getElementById('loading');
    if (loader) {
      loader.style.display = show ? 'block' : 'none';
    }
  }

  // Utility functions
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
  }

  formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showInfo(message) {
    this.showNotification(message, 'info');
  }

  showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      color: white;
      font-weight: 500;
      z-index: 1000;
      max-width: 300px;
      background: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#17a2b8'};
      animation: slideIn 0.3s ease;
    `;

    // Add to page
    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.jobDashboard = new JobDashboard();
});
