const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcrypt');
const fetch = require('node-fetch');
const User = require('./models/user.js');

const app = express();
const PORT = process.env.PORT || 10000;

app.set('trust proxy', 1); // Important for Render

// === Force HTTPS Redirect (for Render) ===
app.use((req, res, next) => {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    return res.redirect('https://' + req.headers.host + req.url);
  }
  next();
});

// === MONGO DB SETUP ===
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// === CORS SETUP ===
const allowedOrigins = ['https://jobsync-new.onrender.com', 'http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS not allowed for origin: ' + origin));
      }
    },
    credentials: true,
  })
);

// === MIDDLEWARE ===
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const MongoStore = require('connect-mongo');

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallbackSecret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
    }),
    cookie: {
      maxAge: 1000 * 60 * 60 * 24, // 1 day
      secure: true, // Set to true for HTTPS
      sameSite: 'lax',
    },
  })
);

// === RATE LIMITING ===
const emailRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  handler: (req, res) => {
    res.status(429).json({ success: false, message: 'Too many email requests. Try again later.' });
  },
});

const generalRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  handler: (req, res) => {
    res
      .status(429)
      .json({ success: false, message: 'Too many requests. Please try again shortly.' });
  },
});

app.use(generalRateLimit);

// === ROUTES ===
app.get('/', (req, res) => res.render('index.ejs'));
app.get('/login', (req, res) => res.render('login.ejs'));
app.get('/signup', (req, res) => res.render('signup.ejs'));

app.get('/user/:id', async (req, res) => {
  if (!req.session.user || req.session.user._id !== req.params.id) {
    return res.status(403).send('Unauthorized');
  }
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).send('User not found');
  res.render('user.ejs', { user });
});

app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();
    req.session.user = newUser;
    res.redirect(`/user/${newUser._id}`);
  } catch (err) {
    res.send(`<script>alert("Account already exists!"); window.location.href = "/login";</script>`);
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.send(
      `<script>alert("Invalid credentials!"); window.location.href = "/login";</script>`
    );
  }
  req.session.user = user;
  res.send(`
    <script>
      localStorage.setItem("username", "${user.name}");
      window.location.href = "/user/${user._id}";
    </script>
  `);
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

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

// === EMAIL HANDLER ===
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: { rejectUnauthorized: false },
});

app.post('/send-email', emailRateLimit, async (req, res) => {
  const { user_name, user_role, user_email, portfolio_link, message } = req.body;

  if (!user_name || !user_role || !user_email || !message) {
    return res.status(400).json({ success: false, message: 'All required fields must be filled.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(user_email)) {
    return res.status(400).json({ success: false, message: 'Invalid email address.' });
  }

  const mailOptions = {
    from: `"${user_name}" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    replyTo: user_email,
    subject: `New Contact Form Submission from ${user_name} - JobSync`,
    html: `<p><strong>Name:</strong> ${user_name}<br>
           <strong>Role:</strong> ${user_role}<br>
           <strong>Email:</strong> ${user_email}<br>
           <strong>Portfolio:</strong> ${portfolio_link || 'Not provided'}<br><br>
           <strong>Message:</strong><br>${message.replace(/\n/g, '<br>')}</p>`,
    text: `Name: ${user_name}\nRole: ${user_role}\nEmail: ${user_email}\nPortfolio: ${portfolio_link}\n\nMessage:\n${message}`,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent: ${info.messageId}`);
    res.json({ success: true, message: 'Email sent successfully!', messageId: info.messageId });
  } catch (error) {
    console.error('❌ Email error:', error);
    res.status(500).json({ success: false, message: 'Email sending failed.' });
  }
});

// === START SERVER ===
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
