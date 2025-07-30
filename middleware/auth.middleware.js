const jwt = require('jsonwebtoken');
const User = require('../models/user.js');

const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      req.flash('error', 'Please login to access this page.');
      return res.redirect('/login');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      req.flash('error', 'User not found. Please login again.');
      return res.redirect('/login');
    }

    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    console.log('JWT Authentication Error:', error);
    req.flash('error', 'Invalid session. Please login again.');
    return res.redirect('/login');
  }
};

const requireVerification = (req, res, next) => {
  if (!req.user.isVerified) {
    req.flash('warning', 'Please verify your email to access this feature.');
    return res.redirect('/profile');
  }
  next();
};

const redirectIfAuthenticated = (req, res, next) => {
  const token = req.cookies.token;

  if (token) {
    try {
      jwt.verify(token, process.env.JWT_SECRET);
      return res.redirect('/dashboard');
    } catch (error) {
      // Token is invalid, continue to login/signup
    }
  }
  next();
};

const optionalAuth = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');

      if (user) {
        req.user = user;
        req.userId = user._id;
        res.locals.user = user;
      }
    }
    next();
  } catch (error) {
    // If token is invalid, just continue without user info
    next();
  }
};

module.exports = {
  authenticateToken,
  requireVerification,
  redirectIfAuthenticated,
  optionalAuth,
};
