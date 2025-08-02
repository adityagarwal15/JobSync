const express = require('express');
const {
  registerUserController,
  verificationController,
  loginController,
  logoutController,
  profileController,
  forgetPasswordController,
  resetPasswordController,
  resendVerificationController,
  dashboardController,
} = require('../controllers/auth.controller.js');
const {
  authenticateToken,
  requireVerification,
  redirectIfAuthenticated,
  optionalAuth,
} = require('../middleware/auth.middleware.js');
const { csrfProtection } = require('../middleware/csrf.middleware.js');

const authRouter = express.Router();

// Public routes (redirect to dashboard if already authenticated)
authRouter.get('/login', redirectIfAuthenticated, (req, res) => {
  res.render('login.ejs');
});

authRouter.get('/signup', redirectIfAuthenticated, (req, res) => {
  res.render('signup.ejs');
});

// Auth actions
authRouter.post('/signup', csrfProtection, registerUserController);
authRouter.post('/login', csrfProtection, loginController);
authRouter.get('/auth/verify/:token', verificationController);
authRouter.post('/forgot-password', csrfProtection, forgetPasswordController);

// Reset password routes
authRouter.get('/reset-password/:resetKey', (req, res) => {
  const { resetKey } = req.params;
  res.render('reset-password.ejs', { resetKey });
});

authRouter.post('/reset-password/:resetKey', csrfProtection, resetPasswordController);

// Protected routes (require authentication)
authRouter.get('/dashboard', authenticateToken, async (req, res) => {
  res.send('Coming soon!');
});
authRouter.get('/profile', authenticateToken, profileController);
authRouter.post('/logout', authenticateToken, csrfProtection, logoutController);
authRouter.post('/resend-verification', authenticateToken, csrfProtection, resendVerificationController);

module.exports = authRouter;
