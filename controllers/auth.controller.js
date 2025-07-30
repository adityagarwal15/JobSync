const User = require('../models/user.js');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

dotenv.config(); //env

const registerUserController = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    if (!name || !email || !password) {
      req.flash('error', 'All fields are required!');
      return res.redirect('/signup');
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      req.flash('error', 'User already exists');
      return res.redirect('/signup');
    }

    const newUser = await User.create({
      name,
      email,
      password,
      role: role || 'user',
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
    req.flash('success', 'Account created successfully! Please check your email for verification.');
    res.redirect('/login');
  } catch (error) {
    console.log('Error registering the user: ', error);
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
      secure: true,
      sameSite: 'None',
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
  try {
    if (!email || !password) {
      req.flash('error', 'All fields are required!');
      return res.redirect('/login');
    }

    const user = await User.findOne({ email });
    if (!user) {
      req.flash('error', 'No account found with the provided email!');
      return res.redirect('/login');
    }

    const isMatched = await bcrypt.compare(password, user.password);
    console.log('ismatched value: ', isMatched);
    if (!isMatched) {
      req.flash('error', 'Email or password is incorrect!');
      return res.redirect('/login');
    }

    if (!user.isVerified) {
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
      secure: true,
      sameSite: 'None',
      maxAge: 24 * 60 * 60 * 1000,
    });

    req.flash('success', `Welcome back, ${user.name}!`);
    res.redirect('/');
  } catch (error) {
    console.log('Error logging the user: ', error);
    req.flash('error', 'Something went wrong during login!');
    return res.redirect('/login');
  }
};

const logoutController = async (req, res) => {
  try {
    res.cookie('token', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'None',
      maxAge: 0, // expire cookie
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
    console.log('user inside of dashboard controller: ', user);

    if (!user) {
      console.log('No user found in dashboard controller');
      req.flash('error', 'User data not found. Please login again.');
      return res.redirect('/login');
    }
    res.render('dashboard.ejs', { user });
  } catch (error) {
    console.log('Error loading dashboard: ', error);
    req.flash('error', 'Failed to load dashboard. Please try again later.');
    res.redirect('/login');
  }
};

module.exports = {
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
