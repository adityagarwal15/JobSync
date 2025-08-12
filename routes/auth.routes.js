const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const { csrfProtection } = require('../middleware/csrf.middleware.js');

const {
  googleAuthController,
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

const authRouter = express.Router();

authRouter.get('/auth/google',passport.authenticate('google',{
  scope: ['email']
}));

authRouter.get('/auth/google/callback', passport.authenticate('google',{ failureRedirect: '/login' }),googleAuthController);

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
authRouter.get('/dashboard', authenticateToken, dashboardController);
authRouter.get('/profile', authenticateToken, profileController);
authRouter.post('/logout', authenticateToken, csrfProtection, logoutController);
authRouter.post('/resend-verification', csrfProtection, authenticateToken, resendVerificationController);

module.exports = authRouter;
