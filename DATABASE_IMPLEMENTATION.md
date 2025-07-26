# 🗄️ Database Implementation - JobSync

## What's This All About?

Hey there! 👋 This is our database setup for JobSync - think of it as the brain that remembers everything about users, jobs, and applications. We've built it using MongoDB (a really flexible database) that can handle everything from a small startup to a massive job platform.

The cool thing? We've got three main "buckets" of information that work together seamlessly - users (both job hunters and companies), jobs (with smart AI features), and applications (tracking every step of the hiring process).

## 🏗️ How Everything Fits Together

### The Three Main Parts

1. **Users** - Everyone using our platform (job seekers hunting for their dream job, and recruiters looking for great talent)
2. **Jobs** - All the job postings with smart AI that helps match people to the right opportunities
3. **Applications** - The complete story of each application, from "hey, I'm interested" to "you're hired!"

### What We Built With

- **Database**: MongoDB Atlas (for live site) / Local MongoDB (for testing)
- **ODM**: Mongoose (makes talking to MongoDB super easy)
- **Security**: JWT tokens + bcryptjs (keeping everything secure)
- **Validation**: express-validator + Mongoose (making sure data is clean)
- **API**: RESTful endpoints (clean, predictable URLs)

## 📋 The Building Blocks

### 🧑‍💼 User Model (The People)

**File**: `models/User.js`

**What makes it special**:
- Works for both job seekers and companies posting jobs
- Super secure login system (we hash passwords, never store them plain)
- Detailed profiles that actually help with job matching
- Tracks how active users are and what they're interested in
- Location services (find jobs near you!)
- Privacy controls (you decide what others can see)

**What information we store**:
```javascript
{
  personal_info: { /* Basic stuff like name, email, photo */ },
  auth: { /* Login details, super secure */ },
  location: { /* Where you are, where you want to work */ },
  job_seeker_profile: { /* Your resume, what jobs you want */ },
  recruiter_profile: { /* Company info, what roles you're hiring for */ },
  activity: { /* How often you use the platform */ },
  preferences: { /* Email settings, privacy choices */ }
}
```

### 💼 Job Model (The Opportunities)

**File**: `models/Job.js`

**What makes it awesome**:
- AI that reads job descriptions and figures out what skills are really needed
- Smart analytics that show how popular each job is
- Location and salary info that actually makes sense
- Works with external job boards (we can import jobs from anywhere)
- Smart scoring system that helps match the right people to the right jobs

**What we track for each job**:
```javascript
{
  /* Basic job info - title, description, company */
  job_title, job_description, employer_name,
  
  /* Where the job is */
  location: { job_city, job_state, job_country, coordinates },
  
  /* Job details */
  employment: { job_employment_type, job_is_remote },
  salary_range: { min_salary, max_salary, currency, period },
  
  /* What they're looking for */
  requirements: { experience_requirements, required_skills, education_requirements },
  
  /* AI magic - smart keyword extraction */
  ai_extracted_keywords: [{ keyword, relevance_score, category }],
  
  /* How popular is this job? */
  engagement_metrics: { view_count, application_count, save_count },
  
  /* Platform settings */
  platform_data: { is_featured, is_active, quality_score }
}
```

### 📝 Application Model (The Journey)

**File**: `models/Application.js`

**Why it's powerful**:
- Tracks every step from application to hire (or rejection)
- Handles interview scheduling and feedback
- Keeps a timeline of everything that happened
- Manages job offers and negotiations
- Stores all communications in one place

**The complete application story**:
```javascript
{
  /* Who applied to what job */
  job_id, applicant_id, status,
  
  /* What they submitted */
  application_data: { resume, cover_letter, additional_documents },
  
  /* The complete timeline */
  timeline: [{ status, timestamp, notes, updated_by }],
  
  /* Interview scheduling and feedback */
  interview_details: { scheduled_interviews, overall_feedback },
  
  /* Job offer details */
  offer_details: { salary_offered, benefits, negotiation_history },
  
  /* All messages and calls */
  communications: [{ type, content, sender, timestamp }],
  
  /* Analytics - how long did things take? */
  metrics: { time_to_response, source, referral_info }
}
```

## 🚀 How to Use Our API

### Getting Started with Authentication

```
POST   /api/users/register          # Create your account
POST   /api/users/login             # Sign in
GET    /api/users/profile           # See your profile
PUT    /api/users/profile           # Update your info
GET    /api/users/:id               # Check out someone's public profile
GET    /api/users                   # Browse users (if you're a recruiter)
DELETE /api/users/profile           # Delete your account
POST   /api/users/logout            # Sign out
```

### Finding and Managing Jobs

```
GET    /api/jobs                    # Browse all jobs (with filters)
GET    /api/jobs/featured           # See the featured jobs
GET    /api/jobs/trending           # What's hot right now
GET    /api/jobs/recommendations    # Jobs picked just for you
GET    /api/jobs/recent             # Fresh job postings
GET    /api/jobs/search             # Advanced search with filters
GET    /api/jobs/stats              # Analytics for recruiters
GET    /api/jobs/:id                # Get details for one job
POST   /api/jobs                    # Post a new job (recruiters only)
PUT    /api/jobs/:id                # Update your job posting
DELETE /api/jobs/:id                # Remove your job posting
POST   /api/jobs/bulk-import        # Import lots of jobs at once (admin)
```

### Handling Applications

```
POST   /api/applications                    # Apply for a job
GET    /api/applications                    # See all your applications
GET    /api/applications/:id               # Check one application
PUT    /api/applications/:id/status        # Update status (recruiters)
POST   /api/applications/:id/schedule-interview # Set up an interview
POST   /api/applications/:id/extend-offer  # Make a job offer
POST   /api/applications/:id/withdraw      # Cancel your application
GET    /api/applications/stats             # Application analytics
GET    /api/applications/job/:jobId        # All applications for one job
```

## 🔧 Getting Everything Set Up

### 1. Configure Your Environment

First, create your own `.env` file (this keeps your secrets safe):

```bash
# Copy our example file
cp .env.example .env

# Then edit it with your own details
# The important stuff you need:
MONGODB_URI=mongodb://localhost:27017/jobsync  # Your database
JWT_SECRET=your-super-secret-jwt-key           # Keep this secret!
EMAIL_USER=your-email@gmail.com                # For sending emails
EMAIL_PASS=your-app-password                   # Gmail app password
```

### 2. Install All the Good Stuff

```bash
npm install
```

### 3. Choose Your Database Adventure

**Option A: Keep it Simple (Local MongoDB)**
```bash
# Install MongoDB on your computer
# Start it up
mongod

# That's it! Your app will use mongodb://localhost:27017/jobsync
```

**Option B: Go Pro (MongoDB Atlas - We Recommend This!)**
1. Sign up at [MongoDB Atlas](https://www.mongodb.com/atlas) (it's free!)
2. Create a new cluster (they'll walk you through it)
3. Get your connection string (looks scary but it's just a URL)
4. Put it in your `.env` file as `MONGODB_URI`

### 4. Make Sure Everything Works

```bash
# Test your database connection
npm run test:db

# This cool script will:
# ✅ Connect to your database
# ✅ Create some sample users, jobs, and applications
# ✅ Test all the relationships and features
# ✅ Clean up afterwards (no mess left behind!)
```

### 5. Fire It Up!

```bash
# For development (auto-restarts when you change code)
npm run dev

# For production (stable and fast)
npm start
```

## 📊 Cool Database Features

### Smart Searching

**Find Jobs by Skills**:
```javascript
// Look for React and Frontend jobs in San Francisco
const jobs = await Job.findByKeywords(['React', 'Frontend'], {
  location: 'San Francisco',
  employmentType: 'FULLTIME',
  salaryMin: 80000,
  limit: 10
});
```

**Find Developers by Skills**:
```javascript
// Find JavaScript and Node.js developers
const developers = await User.findJobSeekersBySkills(['JavaScript', 'Node.js'], 20);
```

**Get Application Insights**:
```javascript
// See how applications are doing for a job
const stats = await Application.getApplicationStats(jobId);
// Returns: total applications, status breakdown, average response times
```

### Magic Fields (Computed Automatically)

**User Magic**:
- `full_name` - We combine first and last name for you
- `age` - Calculated from birthday (if you shared it)
- `profile_completion_percentage` - Shows how complete your profile is
- `is_job_seeker` / `is_recruiter` - Easy role checking

**Job Magic**:
- `days_since_posted` - How fresh is this job?
- `location_string` - Nice formatted location
- `salary_display` - Pretty salary range with currency
- `engagement_rate` - How many views turn into applications

**Application Magic**:
- `current_stage` - What's the latest status?
- `days_since_application` - How long have you been waiting?
- `is_active` - Is this application still in play?

### Automatic Background Tasks

**Things that happen automatically**:
- Passwords get hashed securely (we never store plain passwords)
- Application numbers get generated (like APP-2025-000001)
- Job quality scores get calculated based on completeness
- Timestamps get updated when things change

**Helpful Methods You Can Use**:
- User: `updateLastLogin()`, `incrementProfileViews()`
- Job: `incrementViewCount()`, `updateRecommendationScore()`
- Application: `updateStatus()`, `scheduleInterview()`, `extendOffer()`

## 🔒 How We Keep Everything Secure

### User Authentication
- JWT tokens for secure login sessions
- Military-grade password hashing with bcrypt
- Account gets locked after too many wrong password attempts
- Different access levels (job seekers, recruiters, admins)

### Data Protection
- Every input gets validated before saving
- Email addresses must be real emails
- Passwords must be strong (we check!)
- File uploads are restricted to safe types only

### Privacy First
- You control who sees your profile
- Choose what contact info to share
- Option to anonymize your data

## 🎯 The Smart AI Stuff

### How We Recommend Perfect Jobs

Our recommendation engine is pretty clever! Here's how it scores each job for you:

1. **Job Title Match (40% of score)** - If the job title matches your skills, that's huge!
2. **AI Keyword Match (30% of score)** - Our AI reads job descriptions and matches them to your skills
3. **Required Skills Match (20% of score)** - Direct match between what they want and what you have
4. **Job Description Match (5% of score)** - Looks at the full description for matches
5. **Fresh & Popular Bonus (5% of score)** - New jobs and popular ones get a small boost

### Where AI Helps Out

- **Smart Skill Extraction**: AI reads job descriptions and figures out what skills are really needed
- **Resume Analysis**: Automatically pulls skills from uploaded resumes
- **Perfect Matches**: Machine learning finds jobs you'll actually love
- **Quality Checking**: AI scores job postings to show the best ones first

## 📈 Analytics That Actually Matter

### What Users Can See
- How many people viewed their profile
- Success rate of their applications
- What search terms bring results
- When they're most active on the platform

### What Recruiters Get
- How many people saw their job posting
- Application conversion rates (views → applications)
- How long it takes to fill positions
- Where their best candidates come from

### Application Insights
- Track every step of the hiring process
- See how long each stage typically takes
- Interview success rates
- Offer acceptance rates

## 🔄 Working with Existing Data

Don't worry if you already have data in an old format! We've got you covered:

- **Automatic Conversion**: Old data formats get converted automatically
- **Migration Scripts**: Easy tools to upgrade existing data
- **API Versions**: Support for both old and new API calls
- **Smooth Transition**: Move from old to new without breaking anything

## 🧪 Testing Everything

### Test Your Database
```bash
npm run test:db
```

This will check:
- Can we create users, jobs, and applications?
- Do all the relationships work correctly?
- Are the queries fast enough?
- Do the magic fields calculate correctly?
- Does everything clean up properly?

### Test the API
```bash
# Quick health check
curl -X GET http://localhost:3000/api/health

# See what endpoints are available
curl -X GET http://localhost:3000/api/info
```

## 🚀 Making Everything Lightning Fast

### Smart Database Indexes
- Combined indexes for complex searches
- Text indexes for full-text search
- Location indexes for "jobs near me"
- Unique indexes to prevent duplicates

### Query Optimization
- Pagination so large lists load quickly
- Smart field selection (only get what you need)
- Aggregation pipelines for complex analytics
- Connection pooling for handling lots of users

### Ready for Scale
- Redis caching integration ready to go
- Query result caching for popular searches
- Session management for logged-in users
- Rate limiting to prevent abuse

## 📚 Helpful Resources

- [Mongoose Guide](https://mongoosejs.com/docs/) - Everything about our database tool
- [MongoDB Atlas Setup](https://www.mongodb.com/docs/atlas/getting-started/) - Free cloud database
- [Express.js Docs](https://expressjs.com/) - Our web framework
- [JWT Explained](https://jwt.io/introduction) - How our authentication works

## 🤝 Want to Contribute?

We'd love your help! Here's how to jump in following GSSoC 2025 guidelines:

1. **Fork & Clone** this repository
2. **Create your feature branch**: `git checkout -b feature/awesome-database-improvement`
3. **Make your changes** following our coding style
4. **Test everything**: `npm run test:db`
5. **Commit your work**: `git commit -m "feat: add awesome database feature"`
6. **Create a Pull Request** with a clear description of what you built

---

**Made with ❤️ for GSSoC 2025 by real humans who care about great code**
