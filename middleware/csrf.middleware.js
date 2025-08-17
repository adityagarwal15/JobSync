const { doubleCsrf } = require("csrf-csrf");

// Double CSRF protection configuration
const doubleCsrfOptions = {
  getSecret: () => process.env.CSRF_SECRET || "your-secret-key-change-this-in-production",
  cookieName: "x-csrf-token",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 3600000, // 1 hour
  },
  size: 64,
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
  getTokenFromRequest: (req) => {
    // Check multiple possible locations for the token
    return (
      req.body._csrf ||
      req.query._csrf ||
      req.headers["x-csrf-token"] ||
      req.headers["x-xsrf-token"]
    );
  },
};

const { generateToken, doubleCsrfProtection } = doubleCsrf(doubleCsrfOptions);

// CSRF protection middleware (renamed from csrfProtection to match your current usage)
const csrfProtection = doubleCsrfProtection;

// Middleware to expose CSRF token to all templates
const exposeCsrfToken = (req, res, next) => {
  try {
    // Generate token and make it available to templates
    const token = generateToken(req, res);
    res.locals.csrfToken = token;
    
    // Also make it available as a function for compatibility
    req.csrfToken = () => token;
    
    next();
  } catch (error) {
    console.error('Error generating CSRF token:', error);
    res.locals.csrfToken = '';
    req.csrfToken = () => '';
    next();
  }
};

// CSRF error handler middleware
const csrfErrorHandler = (err, req, res, next) => {
  // Check if this is a CSRF error from csrf-csrf
  if (err.message && err.message.includes('CSRF')) {
    console.log('🚨 CSRF Token Error:', err.message);

    // More robust AJAX detection
    const isAjax =
      req.xhr ||
      (req.headers.accept && req.headers.accept.indexOf('json') > -1) ||
      (req.headers['content-type'] && req.headers['content-type'].indexOf('json') > -1) ||
      req.headers['x-requested-with'] === 'XMLHttpRequest';

    if (isAjax) {
      return res.status(403).json({
        success: false,
        message: 'Invalid security token. Please refresh the page and try again.',
        error: 'CSRF_TOKEN_INVALID',
      });
    }

    // Handle regular form submissions
    if (req.flash && typeof req.flash === 'function') {
      req.flash('error', 'Security token expired. Please refresh the page and try again.');
    }

    // Safer redirect handling
    const referer = req.get('Referer') || '/';
    return res.redirect(referer);
  }

  // Pass other errors to the default error handler
  next(err);
};

module.exports = {
  csrfProtection,
  exposeCsrfToken,
  csrfErrorHandler,
};