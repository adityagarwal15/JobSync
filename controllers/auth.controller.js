const User = require('../models/user.js');
const Job = require('../models/job.js');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const jobFetcher = require('../services/jobFetcher.js');

dotenv.config(); //env

const googleAuthController = async (req, res) => {
  try {
    const user = req.user;

    const tkn = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: '24h',
      }
    );

    res.cookie('token', tkn, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    req.flash('success', `Welcome back, ${user.name}!`);
    res.redirect('/');
  } catch (error) {
    console.error('Google Auth Callback Error:', error);
    req.flash('error', 'Authentication failed. Please try again.');
    return res.redirect('/login');
  }
    
  }

const registerUserController = async (req, res) => {
  const { name, email, password, role } = req.body;
  
  // Check if this is an AJAX request
  const isAjax = req.xhr || 
                 (req.headers.accept && req.headers.accept.indexOf('json') > -1) ||
                 (req.headers['content-type'] && req.headers['content-type'].indexOf('json') > -1) ||
                 req.headers['x-requested-with'] === 'XMLHttpRequest';
  
  try {
    if (!name || !email || !password) {
      if (isAjax) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required!',
          error: 'MISSING_FIELDS'
        });
      }
      req.flash('error', 'All fields are required!');
      return res.redirect('/signup');
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (isAjax) {
        return res.status(400).json({
          success: false,
          message: 'User already exists',
          error: 'USER_EXISTS'
        });
      }
      req.flash('error', 'User already exists');
      return res.redirect('/signup');
    }

    const newUser = await User.create({
      name,
      email,
      password,
      role: 'user',
    });

    if (!newUser) {
      req.flash('error', 'Something went wrong!');
      return res.redirect('/signup');
    }

    const token = crypto.randomBytes(32).toString('hex');
    newUser.verificationToken = token;
    await newUser.save();

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3',
      },
      requireTLS: true,
    });

    console.log('SMTP: ', process.env.SMTP_USER);
    console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
    const mailOptions = {
      from: `JobSync ${process.env.SMTP_SENDER}`,
      to: newUser.email,
      subject: 'Verify Your Email',
      html: `<h2>Welcome to JobSync, ${newUser.name}!</h2>
             <p>Please click the link below to verify your email:</p>
             <a href="${process.env.FRONTEND_URL}/auth/verify/${token}" style="display: inline-block; padding: 10px 20px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
             <p>This link will expire in 24 hours.</p>
             <p>If you didn't request this verification, please ignore this email.</p>`,
    };

    await transporter.sendMail(mailOptions);
    
    if (isAjax) {
      return res.status(201).json({
        success: true,
        message: 'Account created successfully! Please check your email for verification.',
        userId: newUser._id
      });
    }
    
    req.flash('success', 'Account created successfully! Please check your email for verification.');
    res.redirect('/login');
  } catch (error) {
    console.log('Error registering the user: ', error);
    
    if (isAjax) {
      return res.status(500).json({
        success: false,
        message: 'Something went wrong! Please try again.',
        error: 'REGISTRATION_FAILED'
      });
    }
    
    req.flash('error', 'Something went wrong! Please try again.');
    return res.redirect('/signup');
  }
};

const verificationController = async (req, res) => {
  const { token } = req.params;
  try {
    if (!token) {
      req.flash('error', 'Token expired!');
      return res.redirect('/login');
    }

    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      req.flash('error', 'Invalid verification link!');
      return res.redirect('/login');
    }

    user.isVerified = true;
    user.verificationToken = null;
    await user.save();

    const tkn = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: '24h',
      }
    );

    res.cookie('token', tkn, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    req.flash('success', 'Email verified successfully! Welcome to JobSync.');
    res.redirect('/');
  } catch (error) {
    console.log('Error verifying the user: ', error);
    req.flash('error', 'Something went wrong during verification!');
    return res.redirect('/login');
  }
};

const loginController = async (req, res) => {
  const { email, password } = req.body;
  
  // Check if this is an AJAX request
  const isAjax = req.xhr || 
                 (req.headers.accept && req.headers.accept.indexOf('json') > -1) ||
                 (req.headers['content-type'] && req.headers['content-type'].indexOf('json') > -1) ||
                 req.headers['x-requested-with'] === 'XMLHttpRequest';
  
  try {
    if (!email || !password) {
      if (isAjax) {
        return res.status(400).json({
          success: false,
          message: 'All fields are required!',
          error: 'MISSING_FIELDS'
        });
      }
      req.flash('error', 'All fields are required!');
      return res.redirect('/login');
    }

    const user = await User.findOne({ email });
    if (!user) {
      if (isAjax) {
        return res.status(400).json({
          success: false,
          message: 'No account found with the provided email!',
          error: 'USER_NOT_FOUND'
        });
      }
      req.flash('error', 'No account found with the provided email!');
      return res.redirect('/login');
    }

    // Check if user has a password (could be null for OAuth users)
    if (!user.password) {
      if (isAjax) {
        return res.status(400).json({
          success: false,
          message: 'This account does not have a password set. Try logging in with Google.',
          error: 'NO_PASSWORD_SET'
        });
      }
      req.flash('error', 'This account does not have a password set. Try logging in with Google.');
      return res.redirect('/login');
    }
    
    const isMatched = await bcrypt.compare(password, user.password);
    console.log('ismatched value: ', isMatched);
    if (!isMatched) {
      if (isAjax) {
        return res.status(400).json({
          success: false,
          message: 'Email or password is incorrect!',
          error: 'INVALID_CREDENTIALS'
        });
      }
      req.flash('error', 'Email or password is incorrect!');
      return res.redirect('/login');
    }

    if (!user.isVerified) {
      if (isAjax) {
        return res.status(400).json({
          success: false,
          message: 'Please verify your email before logging in!',
          error: 'EMAIL_NOT_VERIFIED'
        });
      }
      req.flash('warning', 'Please verify your email before logging in!');
      return res.redirect('/login');
    }

    const tkn = jwt.sign(
      { id: user._id, name: user.name, email: user.email },
      process.env.JWT_SECRET,
      {
        expiresIn: '24h',
      }
    );

    res.cookie('token', tkn, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    if (isAjax) {
      return res.status(200).json({
        success: true,
        message: `Welcome back, ${user.name}!`,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          isVerified: user.isVerified
        }
      });
    }

    req.flash('success', `Welcome back, ${user.name}!`);
    res.redirect('/');
  } catch (error) {
    console.log('Error logging the user: ', error);
    
    if (isAjax) {
      return res.status(500).json({
        success: false,
        message: 'Something went wrong during login!',
        error: 'LOGIN_FAILED'
      });
    }
    
    req.flash('error', 'Something went wrong during login!');
    return res.redirect('/login');
  }
};

const logoutController = async (req, res) => {
  try {
    res.cookie('token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 0,
    });

    req.flash('info', 'You have been logged out successfully.');
    res.redirect('/');
  } catch (error) {
    console.log('Error logging out the user: ', error);
    req.flash('error', 'Something went wrong during logout!');
    return res.redirect('/dashboard');
  }
};

const profileController = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) {
      req.flash('error', 'Please login to view your profile!');
      return res.redirect('/login');
    }

    // Fix: Use findById with just the ID string, not an object
    const user = await User.findById(userId).select('-password');
    if (!user) {
      req.flash('error', 'User profile not found!');
      return res.redirect('/login');
    }

    res.render('profile.ejs', { user });
  } catch (error) {
    console.log('Error fetching the user profile!', error);
    req.flash('error', 'Something went wrong while loading your profile!');
    return res.redirect('/');
  }
};

const forgetPasswordController = async (req, res) => {
  const { email } = req.body;
  try {
    if (!email) {
      req.flash('error', 'Email is required!');
      return res.redirect('/login');
    }

    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'No account found with this email address');
      return res.redirect('/login');
    }

    const token = crypto.randomBytes(32).toString('hex');

    user.resetPasswordToken = token;
    user.resetPasswordExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3',
      },
      requireTLS: true,
    });

    console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
    const mailOptions = {
      from: `JobSync ${process.env.SMTP_SENDER}`,
      to: user.email,
      subject: 'Reset Your Password',
      html: `<h2>Password Reset Request</h2>
             <p>Hello ${user.name},</p>
             <p>We received a request to reset your password. Please click the link below to reset your password:</p>
             <a href="${process.env.FRONTEND_URL}/reset-password/${token}" style="display: inline-block; padding: 10px 20px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
             <p>This link will expire in 10 minutes.</p>
             <p>If you didn't request this password reset, please ignore this email.</p>`,
    };

    await transporter.sendMail(mailOptions);
    req.flash('success', 'Password reset email sent! Please check your email.');
    res.redirect('/login');
  } catch (error) {
    console.log('Error inside of forgot pass controller: ', error);
    req.flash('error', 'Something went wrong! Please try again.');
    return res.redirect('/login');
  }
};

const resetPasswordController = async (req, res) => {
  const { password } = req.body;
  const { resetKey } = req.params;
  try {
    if (!password) {
      req.flash('error', 'Password is required!');
      return res.redirect('/login');
    }

    const user = await User.findOne({
      resetPasswordToken: resetKey,
      resetPasswordExpiry: { $gt: Date.now() },
    });

    if (!user) {
      req.flash('error', 'Reset token expired or invalid! Please try again.');
      return res.redirect('/login');
    }

    user.password = password;
    user.resetPasswordToken = null;
    user.resetPasswordExpiry = null;
    await user.save();

    req.flash('success', 'Password reset successful! You can now login with your new password.');
    res.redirect('/login');
  } catch (error) {
    console.log('Error resetting the password: ', error);
    req.flash('error', 'Something went wrong! Please try again.');
    return res.redirect('/login');
  }
};

const resendVerificationController = async (req, res) => {
  try {
    const userId = req.userId;

    if (!userId) {
      req.flash('error', 'Please login first');
      return res.redirect('/login');
    }

    const user = await User.findById(userId);

    if (!user) {
      req.flash('error', 'User not found');
      return res.redirect('/login');
    }

    if (user.isVerified) {
      req.flash('info', 'Email is already verified');
      return res.redirect('/');
    }

    // Generate new verification token
    const token = crypto.randomBytes(32).toString('hex');
    user.verificationToken = token;
    await user.save();

    // Send verification email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3',
      },
      requireTLS: true,
    });

    console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
    const mailOptions = {
      from: `JobSync ${process.env.SMTP_SENDER}`,
      to: user.email,
      subject: 'Verify Your Email - JobSync',
      html: `<h2>Welcome to JobSync, ${user.name}!</h2>
             <p>Please click the link below to verify your email:</p>
             <a href="${process.env.FRONTEND_URL}/auth/verify/${token}" style="display: inline-block; padding: 10px 20px; background-color: #3B82F6; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
             <p>This link will expire in 24 hours.</p>
             <p>If you didn't request this verification, please ignore this email.</p>`,
    };

    await transporter.sendMail(mailOptions);

    req.flash('success', 'Verification email sent successfully! Please check your email.');
    res.redirect('/dashboard');
  } catch (error) {
    console.log('Error resending verification email: ', error);
    req.flash('error', 'Failed to send verification email. Please try again later.');
    return res.redirect('/dashboard');
  }
};

//future implementation
const dashboardController = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      console.log('No user found in dashboard controller');
      req.flash('error', 'User data not found. Please login again.');
      return res.redirect('/login');
    }

    // Get fresh job statistics for dashboard
    const jobStats = await getJobStats();

    res.render('dashboard.ejs', {
      jobStats: jobStats,
      user: user,
    });
  } catch (error) {
    console.log('Error loading dashboard: ', error);
    req.flash('error', 'Failed to load dashboard. Please try again later.');
    res.redirect('/login');
  }
};

// Helper function to get job statistics
async function getJobStats() {
  try {
    const totalJobs = await Job.countDocuments({ isActive: true });
    const recentJobs = await Job.countDocuments({
      isActive: true,
      fetchedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    });

    const jobsByCategory = await Job.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    const jobsBySource = await Job.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    return {
      totalJobs,
      recentJobs,
      categories: jobsByCategory,
      sources: jobsBySource,
      lastUpdated: await Job.findOne({ isActive: true }, {}, { sort: { fetchedAt: -1 } })
        ?.fetchedAt,
    };
  } catch (error) {
    console.error('Error getting job stats:', error);
    return {
      totalJobs: 0,
      recentJobs: 0,
      categories: [],
      sources: [],
      lastUpdated: null,
    };
  }
}

module.exports = {
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
};
