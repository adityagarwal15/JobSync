const express = require('express');
const { User } = require('../models');
const { authenticate, authorize, generateToken, checkAccountLockout } = require('../middleware/auth');
const { 
  validateUserRegistration, 
  validateUserLogin, 
  validateUserUpdate,
  validateObjectId,
  validatePaginationQuery
} = require('../middleware/validation');

const router = express.Router();

/**
 * User Routes for JobSync API
 * 
 * Handles user authentication, registration, profile management,
 * and user-related operations for both job seekers and recruiters
 * 
 * @author JobSync Team
 * @version 1.0.0
 */

/**
 * @route   POST /api/users/register
 * @desc    Register a new user (job seeker or recruiter)
 * @access  Public
 */
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { personal_info, auth, location, job_seeker_profile, recruiter_profile } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ 'personal_info.email': personal_info.email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists',
        error: 'USER_EXISTS'
      });
    }

    // Create user data object
    const userData = {
      personal_info,
      auth,
      location,
      preferences: {
        email_notifications: {
          job_alerts: true,
          application_updates: true,
          marketing_emails: false,
          weekly_digest: true
        },
        privacy_settings: {
          profile_visibility: 'registered_users',
          show_contact_info: false
        }
      }
    };

    // Add role-specific profile data
    if (auth.role === 'job_seeker' && job_seeker_profile) {
      userData.job_seeker_profile = job_seeker_profile;
    } else if (auth.role === 'recruiter' && recruiter_profile) {
      userData.recruiter_profile = recruiter_profile;
    }

    // Create new user
    const user = new User(userData);
    await user.save();

    // Generate JWT token
    const token = generateToken(user._id, user.auth.role);

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.auth.password;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'REGISTRATION_ERROR'
    });
  }
});

/**
 * @route   POST /api/users/login
 * @desc    Authenticate user and return token
 * @access  Public
 */
router.post('/login', checkAccountLockout, validateUserLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with password field included
    const user = await User.findOne({ 'personal_info.email': email }).select('+auth.password +auth.login_attempts +auth.account_locked_until');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Check if account is locked
    if (user.auth.account_locked_until && user.auth.account_locked_until > Date.now()) {
      return res.status(423).json({
        success: false,
        message: 'Account temporarily locked due to too many failed login attempts',
        error: 'ACCOUNT_LOCKED'
      });
    }

    // Verify password
    const isPasswordCorrect = await user.correctPassword(password);
    
    if (!isPasswordCorrect) {
      // Increment failed login attempts
      user.auth.login_attempts = (user.auth.login_attempts || 0) + 1;
      
      // Lock account after 5 failed attempts
      if (user.auth.login_attempts >= 5) {
        user.auth.account_locked_until = Date.now() + 15 * 60 * 1000; // 15 minutes
        user.auth.login_attempts = 0;
      }
      
      await user.save();
      
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Reset login attempts on successful login
    user.auth.login_attempts = 0;
    user.auth.account_locked_until = undefined;
    await user.updateLastLogin();

    // Generate JWT token
    const token = generateToken(user._id, user.auth.role);

    // Remove sensitive data from response
    const userResponse = user.toJSON();
    delete userResponse.auth.password;
    delete userResponse.auth.login_attempts;
    delete userResponse.auth.account_locked_until;

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userResponse,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'LOGIN_ERROR'
    });
  }
});

/**
 * @route   GET /api/users/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    const userResponse = user.toJSON();
    delete userResponse.auth.password;

    res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: {
        user: userResponse
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'PROFILE_ERROR'
    });
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update current user's profile
 * @access  Private
 */
router.put('/profile', authenticate, validateUserUpdate, async (req, res) => {
  try {
    const updates = req.body;
    
    // Remove sensitive fields that shouldn't be updated via this route
    delete updates.auth;
    delete updates._id;
    delete updates.createdAt;
    delete updates.updatedAt;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { 
        new: true, 
        runValidators: true,
        context: 'query'
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    const userResponse = user.toJSON();
    delete userResponse.auth.password;

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: userResponse
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'UPDATE_ERROR'
    });
  }
});

/**
 * @route   GET /api/users/:id
 * @desc    Get user profile by ID (public info only)
 * @access  Public
 */
router.get('/:id', validateObjectId('id'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user || user.activity.account_status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    // Return only public information
    const publicProfile = {
      _id: user._id,
      full_name: user.full_name,
      personal_info: {
        first_name: user.personal_info.first_name,
        last_name: user.personal_info.last_name,
        profile_picture: user.personal_info.profile_picture
      },
      auth: {
        role: user.auth.role
      },
      location: user.preferences.privacy_settings.show_contact_info ? user.location : {
        address: {
          city: user.location.address?.city,
          state: user.location.address?.state,
          country: user.location.address?.country
        }
      },
      profile_completion_percentage: user.profile_completion_percentage,
      createdAt: user.createdAt
    };

    // Add role-specific public information
    if (user.auth.role === 'job_seeker' && user.job_seeker_profile) {
      publicProfile.job_seeker_profile = {
        job_preferences: {
          desired_positions: user.job_seeker_profile.job_preferences?.desired_positions,
          employment_types: user.job_seeker_profile.job_preferences?.employment_types,
          remote_work_preference: user.job_seeker_profile.job_preferences?.remote_work_preference
        },
        portfolio: user.job_seeker_profile.portfolio
      };
    } else if (user.auth.role === 'recruiter' && user.recruiter_profile) {
      publicProfile.recruiter_profile = {
        company_info: {
          company_name: user.recruiter_profile.company_info?.company_name,
          company_size: user.recruiter_profile.company_info?.company_size,
          industry: user.recruiter_profile.company_info?.industry,
          company_website: user.recruiter_profile.company_info?.company_website,
          company_logo: user.recruiter_profile.company_info?.company_logo
        },
        position: user.recruiter_profile.position
      };
    }

    // Increment profile views
    await user.incrementProfileViews();

    res.json({
      success: true,
      message: 'User profile retrieved successfully',
      data: {
        user: publicProfile
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user profile',
      error: process.env.NODE_ENV === 'development' ? error.message : 'GET_USER_ERROR'
    });
  }
});

/**
 * @route   GET /api/users
 * @desc    Get list of users (for admin or recruitment purposes)
 * @access  Private (Admin/Recruiter)
 */
router.get('/', authenticate, authorize('admin', 'recruiter'), validatePaginationQuery, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role = null,
      location = null,
      skills = null,
      company = null
    } = req.query;

    const skip = (page - 1) * limit;
    let query = { 'activity.account_status': 'active' };

    // Apply filters
    if (role) {
      query['auth.role'] = role;
    }

    if (location) {
      query.$or = [
        { 'location.address.city': { $regex: location, $options: 'i' } },
        { 'location.address.state': { $regex: location, $options: 'i' } }
      ];
    }

    if (skills && role === 'job_seeker') {
      const skillsArray = skills.split(',').map(skill => skill.trim());
      query['job_seeker_profile.resume.parsed_data.skills'] = { $in: skillsArray };
    }

    if (company && role === 'recruiter') {
      query['recruiter_profile.company_info.company_name'] = { $regex: company, $options: 'i' };
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-auth.password -auth.login_attempts -auth.account_locked_until')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users,
        pagination: {
          current_page: parseInt(page),
          total_pages: Math.ceil(total / limit),
          total_users: total,
          users_per_page: parseInt(limit),
          has_next: page < Math.ceil(total / limit),
          has_prev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get users',
      error: process.env.NODE_ENV === 'development' ? error.message : 'GET_USERS_ERROR'
    });
  }
});

/**
 * @route   DELETE /api/users/profile
 * @desc    Deactivate user account
 * @access  Private
 */
router.delete('/profile', authenticate, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { 'activity.account_status': 'deleted' },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        error: 'USER_NOT_FOUND'
      });
    }

    res.json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to deactivate account',
      error: process.env.NODE_ENV === 'development' ? error.message : 'DELETE_ERROR'
    });
  }
});

/**
 * @route   POST /api/users/logout
 * @desc    Logout user (client-side token removal)
 * @access  Private
 */
router.post('/logout', authenticate, async (req, res) => {
  try {
    // Update last active time
    await User.findByIdAndUpdate(req.user._id, {
      'activity.last_active': new Date()
    });

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'LOGOUT_ERROR'
    });
  }
});

module.exports = router;
