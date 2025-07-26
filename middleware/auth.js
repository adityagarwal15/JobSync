const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Authentication Middleware for JobSync
 * 
 * Provides JWT-based authentication and authorization
 * for protected routes in the application
 * 
 * @author JobSync Team
 * @version 1.0.0
 */

/**
 * Middleware to verify JWT token and authenticate user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies (if using cookie-based auth)
    else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
        error: 'MISSING_TOKEN'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');

    // Get user from database
    const user = await User.findById(decoded.userId).select('+auth.password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists.',
        error: 'USER_NOT_FOUND'
      });
    }

    // Check if user is active
    if (user.activity.account_status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Your account has been deactivated.',
        error: 'ACCOUNT_INACTIVE'
      });
    }

    // Check if user changed password after token was issued
    if (user.changedPasswordAfter(decoded.iat)) {
      return res.status(401).json({
        success: false,
        message: 'Password recently changed. Please log in again.',
        error: 'PASSWORD_CHANGED'
      });
    }

    // Grant access to protected route
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.',
        error: 'INVALID_TOKEN'
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired.',
        error: 'TOKEN_EXPIRED'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Authentication failed.',
      error: 'AUTH_ERROR'
    });
  }
};

/**
 * Middleware to authorize user based on roles
 * @param {...string} roles - Allowed roles
 * @returns {Function} Express middleware function
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        error: 'NOT_AUTHENTICATED'
      });
    }

    if (!roles.includes(req.user.auth.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`,
        error: 'INSUFFICIENT_PERMISSIONS'
      });
    }

    next();
  };
};

/**
 * Middleware for optional authentication (doesn't fail if no token)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');
        const user = await User.findById(decoded.userId);
        
        if (user && user.activity.account_status === 'active') {
          req.user = user;
        }
      } catch (err) {
        // Token invalid, but we continue without user
        console.log('Optional auth failed:', err.message);
      }
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * Middleware to check if user owns the resource
 * @param {string} resourceParam - Parameter name containing resource ID
 * @param {string} userField - Field name in resource that contains user ID
 * @returns {Function} Express middleware function
 */
const checkResourceOwnership = (resourceParam, userField = 'user_id') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
        error: 'NOT_AUTHENTICATED'
      });
    }

    const resourceId = req.params[resourceParam];
    const userId = req.user._id.toString();

    // Admin can access any resource
    if (req.user.auth.role === 'admin') {
      return next();
    }

    // For job-related resources, check if user is the poster
    if (userField === 'posted_by') {
      // This would need to be checked against the actual resource
      // Implementation depends on specific use case
      return next();
    }

    // For user-related resources, check if user owns the resource
    if (resourceId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only access your own resources.',
        error: 'RESOURCE_ACCESS_DENIED'
      });
    }

    next();
  };
};

/**
 * Middleware to rate limit authentication attempts
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const checkAccountLockout = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return next();
    }

    const user = await User.findOne({ 'personal_info.email': email }).select('+auth.login_attempts +auth.account_locked_until');
    
    if (user && user.auth.account_locked_until && user.auth.account_locked_until > Date.now()) {
      const lockTimeRemaining = Math.ceil((user.auth.account_locked_until - Date.now()) / (1000 * 60)); // minutes
      
      return res.status(423).json({
        success: false,
        message: `Account temporarily locked due to too many failed login attempts. Try again in ${lockTimeRemaining} minutes.`,
        error: 'ACCOUNT_LOCKED',
        lockTimeRemaining
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Generate JWT token for user
 * @param {string} userId - User ID
 * @param {string} role - User role
 * @returns {string} JWT token
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { 
      userId, 
      role,
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.JWT_SECRET || 'default-secret-key',
    { 
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

/**
 * Generate refresh token for user
 * @param {string} userId - User ID
 * @returns {string} Refresh token
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || 'refresh-secret-key',
    { 
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
    }
  );
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth,
  checkResourceOwnership,
  checkAccountLockout,
  generateToken,
  generateRefreshToken
};
