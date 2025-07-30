const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const mongoose = require('mongoose');
const flash = require('connect-flash');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const fetch = require('node-fetch');
const User = require('./models/user.js');
const Contact = require('./models/contact.js');
const authRouter = require('./routes/auth.routes.js');
const { optionalAuth } = require('./middleware/auth.middleware.js');

const app = express();
const PORT = process.env.PORT || 10000;

app.set('trust proxy', 1); // Important for Render

// === Force HTTPS Redirect (for Render) ===
if (process.env.NODE_ENV === "production") {
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https' && process.env.NODE_ENV === 'production') {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});
}

// ========== MONGO DB SETUP ==========
async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err);
  }
}
main();

// === CORS SETUP ===
const allowedOrigins = [
  'https://jobsync-new.onrender.com',
  'https://jobsyncc.netlify.app',
  'http://localhost:3000',
];

// ========== MIDDLEWARE ==========
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS not allowed for origin: ' + origin));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

// === MIDDLEWARE ===
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Session configuration with MongoStore and flash messages
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    },
  })
);

// Initialize flash middleware
app.use(flash());

// Make flash messages available to all views
app.use((req, res, next) => {
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.warning = req.flash('warning');
  res.locals.info = req.flash('info');
  next();
});

// === RATE LIMITING ===
const emailRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: {
    success: false,
    message: 'Too many email requests from this IP. Please try again in 15 minutes.',
    error: 'RATE_LIMIT_EXCEEDED',
  },
  handler: (req, res) => {
    console.log(`🚨 Email rate limit exceeded for IP: ${req.ip} at ${new Date().toISOString()}`);
    res.status(429).json({
      success: false,
      message: 'Too many email requests from this IP. Please try again in 15 minutes.',
      retryAfter: Math.round(15 * 60),
    });
  },
});

const generalRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again later.',
    error: 'GENERAL_RATE_LIMIT_EXCEEDED',
  },
  handler: (req, res) => {
    console.log(`⚠️ General rate limit exceeded for IP: ${req.ip} at ${new Date().toISOString()}`);
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP. Please try again later.',
    });
  },
});

app.use(generalRateLimit);

// ========== ROUTES ==========

// Homepage
app.get('/', optionalAuth, (req, res) => {
  res.render('index.ejs');
});

// Auth routes from auth.routes.js
app.use('/', authRouter);

// === PROXY EXTERNAL API TO BYPASS CORS ===
app.get('/api/totalusers', async (req, res) => {
  try {
    const response = await fetch('https://sc.ecombullet.com/api/dashboard/totalusers');
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('❌ External API fetch failed:', err);
    res.status(500).json({ error: 'Failed to fetch external data' });
  }
});

// ========== EMAIL ==========

// === EMAIL HANDLER ===
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true', // false for port 587, true for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
  rejectUnauthorized: false,
},
});

// Contact form submission

app.post('/send-email', emailRateLimit, async (req, res) => {
  console.log('📩 Incoming form submission:', req.body);

  const { user_name, user_role, user_email, portfolio_link, message } = req.body;

  if (!user_name || !user_role || !user_email || !message) {
    return res
      .status(400)
      .json({ success: false, message: 'Please fill in all required fields.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(user_email)) {
    return res
      .status(400)
      .json({ success: false, message: 'Please enter a valid email address.' });
  }

  try {
    // Save to MongoDB
    await Contact.create({
      userName: user_name,
      userRole: user_role,
      userEmail: user_email,
      portfolioLink: portfolio_link,
      message,
    });

    const mailOptions = {
      from: `"JobSync Contact Form" <${process.env.SMTP_SENDER}>`,
      to: process.env.SMTP_SENDER,
      replyTo: user_email,
      subject: `New Contact Form Submission from ${user_name} - JobSync`,
      html: `<p><strong>Name:</strong> ${user_name}<br>
             <strong>Role:</strong> ${user_role}<br>
             <strong>Email:</strong> ${user_email}<br>
             <strong>Portfolio:</strong> ${portfolio_link || 'Not provided'}<br><br>
             <strong>Message:</strong><br>${message.replace(/\n/g, '<br>')}</p>`,
      text: `Name: ${user_name}\nRole: ${user_role}\nEmail: ${user_email}\nPortfolio: ${portfolio_link}\n\nMessage:\n${message}`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent: ${info.messageId}`);

    res.json({ success: true, message: 'Email sent successfully!', messageId: info.messageId });
  } catch (error) {
    console.error('❌ Error sending email or saving to DB:', error);
    res.status(500).json({ success: false, message: 'Failed to send email.' });
  }
});


// === START SERVER ===
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});


// 404 handler - keep this as the last middleware
app.use((req, res, next) => {
  res.status(404).render('404'); // Use .sendFile if you're not using a template engine
});
