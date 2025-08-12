const csrf = require('csurf');

// CSRF protection middleware
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 3600000,
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
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
