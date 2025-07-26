const express = require("express");
const nodemailer = require("nodemailer");
const path = require("path");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
require("dotenv").config();
const mongoose = require('mongoose');
const session = require("express-session");
const bcrypt = require("bcrypt");
const User = require("./models/user.js");

const app = express();
const PORT = process.env.PORT || 8080;

// ========== MONGO DB SETUP ==========
main().catch(err => console.log(err));
async function main() {
  await mongoose.connect('mongodb://127.0.0.1:27017/jobSync');
}

// ========== MIDDLEWARE ==========
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "https://jobsyncc.netlify.app"
  ],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public"))); // for serving public assets

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(
  session({
    secret: "thisshouldbeabettersecret",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
  })
);

// ========== RATE LIMITING ==========
const emailRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many email requests from this IP. Please try again in 15 minutes.",
    error: "RATE_LIMIT_EXCEEDED",
  },
  handler: (req, res) => {
    console.log(`🚨 Email rate limit exceeded for IP: ${req.ip} at ${new Date().toISOString()}`);
    res.status(429).json({
      success: false,
      message: "Too many email requests from this IP. Please try again in 15 minutes.",
      retryAfter: Math.round(15 * 60),
    });
  },
});

const generalRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again later.",
    error: "GENERAL_RATE_LIMIT_EXCEEDED",
  },
  handler: (req, res) => {
    console.log(`⚠️ General rate limit exceeded for IP: ${req.ip} at ${new Date().toISOString()}`);
    res.status(429).json({
      success: false,
      message: "Too many requests from this IP. Please try again later.",
    });
  },
});

app.use(generalRateLimit);

// ========== ROUTES ==========

// Homepage
app.get("/", (req, res) => {
  res.render("index.ejs");
});

// Auth pages
app.get("/login", (req, res) => res.render("login.ejs"));
app.get("/signup", (req, res) => res.render("signup.ejs"));

// User dashboard
app.get("/user/:id", async (req, res) => {
  if (!req.session.user || req.session.user._id !== req.params.id) {
    return res.status(403).send("Unauthorized");
  }
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send("User not found");
    res.render("user.ejs", { user });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// Signup
app.post("/signup", async (req, res) => {
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

// Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.send(`<script>alert("Invalid credentials!"); window.location.href = "/login";</script>`);
    }
    req.session.user = user;
    res.send(`
      <script>
        localStorage.setItem("username", "${user.name}");
        window.location.href = "/user/${user._id}";
      </script>
    `);
  } catch (err) {
    res.status(500).send("Server error");
  }
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: { rejectUnauthorized: false },
});

// Contact form submission
app.post("/send-email", emailRateLimit, async (req, res) => {
  try {
    const { user_name, user_role, user_email, portfolio_link, message } = req.body;
    if (!user_name || !user_role || !user_email || !message) {
      return res.status(400).json({ success: false, message: "Please fill in all required fields." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user_email)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address." });
    }

    const mailOptions = {
      from: `"${user_name}" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      replyTo: user_email,
      subject: `New Contact Form Submission from ${user_name} - JobSync`,
      html: `<p><strong>Name:</strong> ${user_name}<br>
             <strong>Role:</strong> ${user_role}<br>
             <strong>Email:</strong> ${user_email}<br>
             <strong>Portfolio:</strong> ${portfolio_link || "Not provided"}<br><br>
             <strong>Message:</strong><br>${message.replace(/\n/g, "<br>")}</p>`,
      text: `Name: ${user_name}\nRole: ${user_role}\nEmail: ${user_email}\nPortfolio: ${portfolio_link}\n\nMessage:\n${message}`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent: ${info.messageId}`);
    res.json({ success: true, message: "Email sent successfully!", messageId: info.messageId });
  } catch (error) {
    console.error("❌ Error sending email:", error);
    res.status(500).json({ success: false, message: "Failed to send email." });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
