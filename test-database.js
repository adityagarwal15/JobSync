/**
 * Database Test Script for JobSync
 * 
 * This script tests the database connection and basic CRUD operations
 * for all three main models: User, Job, and Application
 * 
 * @author JobSync Team
 * @version 1.0.0
 */

const { connectDB, disconnectDB } = require('./config/database');
const { User, Job, Application } = require('./models');

async function runTests() {
  try {
    console.log('🚀 Starting JobSync Database Tests...\n');

    // Connect to database
    await connectDB();

    // Test 1: Create a test user (job seeker)
    console.log('📝 Test 1: Creating test job seeker...');
    const testJobSeeker = new User({
      personal_info: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john.doe@example.com'
      },
      auth: {
        password: 'TestPassword123!',
        role: 'job_seeker'
      },
      location: {
        address: {
          city: 'San Francisco',
          state: 'CA',
          country: 'US'
        }
      },
      job_seeker_profile: {
        job_preferences: {
          desired_positions: ['Software Engineer', 'Frontend Developer'],
          employment_types: ['FULLTIME'],
          salary_expectations: {
            min_salary: 80000,
            max_salary: 120000,
            currency: 'USD',
            period: 'YEAR'
          }
        }
      }
    });

    await testJobSeeker.save();
    console.log('✅ Job seeker created successfully!');
    console.log(`   Name: ${testJobSeeker.full_name}`);
    console.log(`   Email: ${testJobSeeker.personal_info.email}`);
    console.log(`   Profile Completion: ${testJobSeeker.profile_completion_percentage}%\n`);

    // Test 2: Create a test user (recruiter)
    console.log('📝 Test 2: Creating test recruiter...');
    const testRecruiter = new User({
      personal_info: {
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane.smith@techcorp.com'
      },
      auth: {
        password: 'RecruiterPass123!',
        role: 'recruiter'
      },
      location: {
        address: {
          city: 'New York',
          state: 'NY',
          country: 'US'
        }
      },
      recruiter_profile: {
        company_info: {
          company_name: 'TechCorp Inc.',
          company_size: '201-500',
          industry: 'Technology',
          company_website: 'https://techcorp.com'
        },
        position: 'Senior Recruiter'
      }
    });

    await testRecruiter.save();
    console.log('✅ Recruiter created successfully!');
    console.log(`   Name: ${testRecruiter.full_name}`);
    console.log(`   Company: ${testRecruiter.recruiter_profile.company_info.company_name}`);
    console.log(`   Role: ${testRecruiter.auth.role}\n`);

    // Test 3: Create a test job
    console.log('📝 Test 3: Creating test job...');
    const testJob = new Job({
      job_title: 'Senior Frontend Developer',
      job_description: 'We are looking for a skilled Frontend Developer to join our team. You will be responsible for building user-facing web applications using React, TypeScript, and modern web technologies.',
      employer_name: 'TechCorp Inc.',
      employer_website: 'https://techcorp.com',
      employer_company_type: 'Enterprise',
      job_city: 'San Francisco',
      job_state: 'CA',
      job_country: 'US',
      job_employment_type: 'FULLTIME',
      job_is_remote: true,
      salary_range: {
        min_salary: 90000,
        max_salary: 130000,
        currency: 'USD',
        period: 'YEAR'
      },
      job_apply_link: 'https://techcorp.com/apply/frontend-dev-123',
      required_skills: ['React', 'TypeScript', 'JavaScript', 'CSS', 'HTML'],
      experience_requirements: {
        min_years: 3,
        max_years: 7,
        level: 'Senior Level'
      },
      posted_by: testRecruiter._id
    });

    await testJob.save();
    console.log('✅ Job created successfully!');
    console.log(`   Title: ${testJob.job_title}`);
    console.log(`   Company: ${testJob.employer_name}`);
    console.log(`   Location: ${testJob.location_string}`);
    console.log(`   Salary: ${testJob.salary_display}`);
    console.log(`   Days since posted: ${testJob.days_since_posted}\n`);

    // Test 4: Create a test application
    console.log('📝 Test 4: Creating test application...');
    const testApplication = new Application({
      job_id: testJob._id,
      applicant_id: testJobSeeker._id,
      application_data: {
        resume: {
          file_url: 'https://example.com/resume/john-doe.pdf',
          file_name: 'john-doe-resume.pdf'
        },
        cover_letter: {
          content: 'I am excited to apply for the Senior Frontend Developer position at TechCorp. With my experience in React and TypeScript, I believe I would be a great fit for your team.'
        }
      },
      timeline: [{
        status: 'applied',
        timestamp: new Date(),
        notes: 'Initial application submitted',
        automated: true
      }]
    });

    await testApplication.save();
    console.log('✅ Application created successfully!');
    console.log(`   Application Number: ${testApplication.application_number}`);
    console.log(`   Status: ${testApplication.status}`);
    console.log(`   Days since application: ${testApplication.days_since_application}\n`);

    // Test 5: Test queries and relationships
    console.log('📝 Test 5: Testing queries and relationships...');
    
    // Find jobs by keywords
    const foundJobs = await Job.findByKeywords(['React', 'Frontend'], { limit: 5 });
    console.log(`✅ Found ${foundJobs.length} jobs matching keywords`);

    // Get job seekers by skills
    const skillfulSeekers = await User.findJobSeekersBySkills(['React'], 5);
    console.log(`✅ Found ${skillfulSeekers.length} job seekers with React skills`);

    // Get applications for the job
    const jobApplications = await Application.findByJob(testJob._id, { limit: 10 });
    console.log(`✅ Found ${jobApplications.length} applications for the job`);

    // Test virtual fields
    console.log('\n📊 Virtual Fields Test:');
    console.log(`   Job seeker full name: ${testJobSeeker.full_name}`);
    console.log(`   Job seeker age: ${testJobSeeker.age || 'Not specified'}`);
    console.log(`   Job engagement rate: ${testJob.engagement_rate}%`);
    console.log(`   Application is active: ${testApplication.is_active}`);

    // Test 6: Update operations
    console.log('\n📝 Test 6: Testing update operations...');
    
    // Update job view count
    await testJob.incrementViewCount();
    await testJob.incrementViewCount();
    await testJob.incrementApplicationCount();
    console.log(`✅ Updated job metrics - Views: ${testJob.engagement_metrics.view_count}, Applications: ${testJob.engagement_metrics.application_count}`);

    // Update application status
    await testApplication.updateStatus('reviewing', 'Application is under review');
    console.log(`✅ Updated application status to: ${testApplication.status}`);

    // Test 7: Aggregation queries
    console.log('\n📝 Test 7: Testing aggregation queries...');
    
    const jobStats = await Job.getJobStats();
    console.log('✅ Job Statistics:', jobStats[0] || 'No data');

    const appStats = await Application.getApplicationStats();
    console.log('✅ Application Statistics:', appStats[0] || 'No data');

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('   ✅ Database connection');
    console.log('   ✅ User model (Job Seeker & Recruiter)');
    console.log('   ✅ Job model with advanced features');
    console.log('   ✅ Application model with status tracking');
    console.log('   ✅ Model relationships and references');
    console.log('   ✅ Query methods and filtering');
    console.log('   ✅ Virtual fields and computed properties');
    console.log('   ✅ Update operations and instance methods');
    console.log('   ✅ Aggregation and statistics');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    try {
      await User.deleteOne({ 'personal_info.email': 'john.doe@example.com' });
      await User.deleteOne({ 'personal_info.email': 'jane.smith@techcorp.com' });
      await Job.deleteOne({ job_title: 'Senior Frontend Developer' });
      await Application.deleteMany({ application_number: { $regex: /^APP-/ } });
      console.log('✅ Test data cleaned up');
    } catch (cleanupError) {
      console.error('❌ Cleanup failed:', cleanupError.message);
    }

    // Disconnect from database
    await disconnectDB();
    console.log('\n👋 Database tests completed and disconnected.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

module.exports = runTests;
