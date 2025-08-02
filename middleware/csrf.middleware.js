// middleware/csrf.middleware.js
// CSRF protection middleware for Express using csurf

const csrf = require('csurf');

// CSRF protection middleware
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
});

// Middleware to expose CSRF token to all templates
const exposeCsrfToken = (req, res, next) => {
  res.locals.csrfToken = req.csrfToken ? req.csrfToken() : '';
  next();
};

// CSRF error handler middleware
const csrfErrorHandler = (err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    // CSRF token validation failed
    console.log('🚨 CSRF Token Error:', err.message);
    
    // Handle AJAX requests
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(403).json({
        success: false,
        message: 'Invalid security token. Please refresh the page and try again.',
        error: 'CSRF_TOKEN_INVALID'
      });
    }
    
    // Handle regular form submissions
    req.flash('error', 'Security token expired. Please refresh the page and try again.');
    return res.redirect('back');
  }
  
  // Pass other errors to the default error handler
  next(err);
};

module.exports = {
  csrfProtection,
  exposeCsrfToken,
  csrfErrorHandler
};
