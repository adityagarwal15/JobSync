const express = require("express");
const nodemailer = require("nodemailer");
const path = require("path");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

require("dotenv").config();
const mongoose = require("mongoose");
const flash = require("connect-flash");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const MongoStore = require("connect-mongo");


// ✅ node-fetch dynamic import fix for Node.js v20+
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const Contact = require("./models/contact.js");
const Job = require("./models/job.js");
const authRouter = require("./routes/auth.routes.js");
const { optionalAuth } = require("./middleware/auth.middleware.js");
const jobFetcher = require("./services/jobFetcher.js");
const jobRouter = require("./routes/jobAPI.routes.js");
const searchRouter = require("./routes/searchAPI.routes.js");
const passport = require("passport");
require("./utils/passport.js");

const app = express();
const PORT = process.env.PORT || 10000;

app.set("trust proxy", 1); // Important for Render

// === Force HTTPS Redirect (for Render) ===
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.headers["x-forwarded-proto"] !== "https" && process.env.NODE_ENV === "production") {
      return res.redirect("https://" + req.headers.host + req.url);
    }
    next();
  });
}

// ========== MONGO DB SETUP ==========
async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
}
main();

// === CORS SETUP ===
const allowedOrigins = [
  "https://jobsync-new.onrender.com",
  "https://jobsyncc.netlify.app",
  "http://localhost:5000",
];

// ========== MIDDLEWARE ==========
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed for origin: " + origin));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token", "X-Requested-With"],
    exposedHeaders: ["Set-Cookie"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

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
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Initialize flash middleware
app.use(flash());

// Import CSRF middleware
const {
  csrfProtection,
  exposeCsrfToken,
  csrfErrorHandler,
  tokenStore,
} = require("./middleware/csrf.middleware.js");

// Apply CSRF protection selectively
const csrfMiddleware = (req, res, next) => {
  console.log("🔒 Global CSRF middleware checking:", req.path, req.method);

  // Skip CSRF for safe methods (GET, HEAD, OPTIONS)
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    console.log("🔒 Skipping CSRF for safe method:", req.method, req.path);
    return next();
  }

  // Skip CSRF for API routes and send-email (handled separately)
  if (req.path.startsWith("/api/") || req.path === "/send-email") {
    console.log("🔒 Skipping CSRF for:", req.path);
    return next();
  }

  console.log("🔒 Applying CSRF protection to:", req.path);
  return csrfProtection(req, res, next);
};

app.use(csrfMiddleware);

// Make flash messages available to all views
app.use((req, res, next) => {
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  res.locals.warning = req.flash("warning");
  res.locals.info = req.flash("info");
  next();
});

// Apply CSRF token exposure middleware
app.use(exposeCsrfToken);

// Apply CSRF error handler
app.use(csrfErrorHandler);

// === CSRF TOKEN ENDPOINTS ===
// Generate new CSRF token (for explicit requests)
app.get("/csrf-token", (req, res) => {
  try {
    // Generate a simple but secure CSRF token
    const token =
      Math.random().toString(36).substring(2) +
      Date.now().toString(36) +
      Math.random().toString(36).substring(2);

    console.log(
      "🔐 Generating NEW CSRF token for explicit request from:",
      req.get("Origin") || "Unknown origin"
    );

    // Store the token in our token store for validation
    tokenStore.set(token, {
      createdAt: Date.now(),
      origin: req.get("Origin") || "Unknown",
      userAgent: req.get("User-Agent"),
    });

    // Set the token in a cookie for the client
    const cookieOptions = {
      httpOnly: false, // Allow JavaScript access for testing
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 3600000, // 1 hour
      path: "/",
    };

    res.cookie("_csrf", token, cookieOptions);

    console.log("🔐 NEW CSRF token generated and cookie set:", token.substring(0, 20) + "...");
    console.log("🔐 Tokens in store:", tokenStore.size);

    res.json({
      csrfToken: token,
      message: "CSRF token generated successfully",
      timestamp: new Date().toISOString(),
      cookieSet: true,
    });
  } catch (error) {
    console.error("❌ Error generating CSRF token:", error);
    res.status(500).json({
      error: "Failed to generate CSRF token",
      message: error.message,
    });
  }
});

// Get current CSRF token (returns existing token from locals/cookie)
app.get("/csrf-token/current", (req, res) => {
  try {
    // Return the token that was auto-generated by the middleware
    const token = res.locals.csrfToken || req.cookies._csrf;

    if (token) {
      console.log("🔐 Returning current CSRF token:", token.substring(0, 20) + "...");
      res.json({
        csrfToken: token,
        message: "Current CSRF token retrieved",
        timestamp: new Date().toISOString(),
        source: res.locals.csrfToken ? "middleware" : "cookie",
      });
    } else {
      res.status(404).json({
        error: "No CSRF token found",
        message: "Please refresh the page to get a CSRF token",
      });
    }
  } catch (error) {
    console.error("❌ Error retrieving current CSRF token:", error);
    res.status(500).json({
      error: "Failed to retrieve CSRF token",
      message: error.message,
    });
  }
});

// Test CSRF protection endpoint
app.post("/test-csrf", (req, res) => {
  console.log("🧪 Test CSRF endpoint hit");
  console.log("🧪 Request headers:", req.headers);
  console.log("🧪 Request body:", req.body);
  console.log("🧪 Request cookies:", req.cookies);

  res.json({
    success: true,
    message: "CSRF protection working!",
    receivedToken: req.body._csrf,
    cookieToken: req.cookies._csrf,
    headers: req.headers,
    timestamp: new Date().toISOString(),
  });
});

// Test CSRF protection WITHOUT token (should fail)
app.post("/test-csrf-no-token", (req, res) => {
  console.log(
    "🧪 Test CSRF NO TOKEN endpoint hit - this should not happen if CSRF protection works"
  );
  console.log("🚨 CSRF middleware should have blocked this request!");
  console.log("🚨 Request path:", req.path);
  console.log("🚨 Request method:", req.method);
  console.log("🚨 CSRF token in body:", req.body._csrf ? "PRESENT" : "MISSING");
  console.log("🚨 CSRF token in cookies:", req.cookies._csrf ? "PRESENT" : "MISSING");
  console.log("🚨 CSRF token in headers:", req.headers["x-csrf-token"] ? "PRESENT" : "MISSING");

  res.json({
    success: false,
    message: "This should not be reachable without CSRF token",
    timestamp: new Date().toISOString(),
  });
});

// === RATE LIMITING ===
const emailRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
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
  windowMs: 60 * 1000,
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
app.get("/", optionalAuth, (req, res) => {
  res.render("index.ejs");
});

app.use("/", authRouter);
app.use("/api/jobs", jobRouter);
app.use("/api/search", searchRouter);

// === PROXY EXTERNAL API TO BYPASS CORS ===
app.get("/api/totalusers", async (req, res) => {
  try {
    const response = await fetch("https://sc.ecombullet.com/api/dashboard/totalusers");
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error("❌ External API fetch failed:", err);
    res.status(500).json({ error: "Failed to fetch external data" });
  }
});

// Proxy for Google Custom Search API
app.get("/api/google-search", async (req, res) => {
  try {
    const { q, num = 10, start = 1 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    const apiKey = process.env.GOOGLE_CLOUD_SEARCH_API;
    const engineId = process.env.GOOGLE_SEARCH_ENGINE_API;

    if (!apiKey || !engineId) {
      return res.status(500).json({ error: "Google API credentials not configured" });
    }

    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${engineId}&q=${encodeURIComponent(q)}&num=${num}&start=${start}`;

    console.log(`Proxying Google search for: "${q}"`);

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Google API Error: ${response.status} ${response.statusText}`);
      console.error(`Error Details: ${errorText}`);
      return res.status(response.status).json({
        error: `Google API Error: ${response.status} ${response.statusText}`,
        details: errorText,
      });
    }

    const data = await response.json();

    if (data.error) {
      console.error("Google API returned error:", data.error);
      return res.status(400).json({ error: data.error });
    }

    res.json(data);
  } catch (err) {
    console.error("Google search proxy failed:", err);
    res.status(500).json({ error: "Failed to proxy Google search request" });
  }
});

// ========== EMAIL ==========
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

// Email route with rate limiting only (CSRF excluded in middleware)
app.post("/send-email", emailRateLimit, async (req, res) => {
  console.log("📩 Incoming form submission:", req.body);

  const { user_name, user_role, user_email, portfolio_link, message } = req.body;

  if (!user_name || !user_role || !user_email || !message) {
    return res.status(400).json({ success: false, message: "Please fill in all required fields." });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(user_email)) {
    return res.status(400).json({ success: false, message: "Please enter a valid email address." });
  }

  try {
    await Contact.create({
      userName: user_name,
      userRole: user_role,
      userEmail: user_email,
      portfolioLink: portfolio_link || "undefined",
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
             <strong>Portfolio:</strong> ${portfolio_link}<br><br>
             <strong>Message:</strong><br>${message.replace(/\n/g, "<br>")}</p>`,
      text: `Name: ${user_name}\nRole: ${user_role}\nEmail: ${user_email}\nPortfolio: ${portfolio_link}\n\nMessage:\n${message}`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent: ${info.messageId}`);

    res.json({ success: true, message: "Email sent successfully!", messageId: info.messageId });
  } catch (error) {
    console.error("❌ Error sending email or saving to DB:", error);
    res.status(500).json({ success: false, message: "Failed to send email." });
  }
});

// === START SERVER ===
app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);

  try {
    const jobCount = await Job.countDocuments({ isActive: true });
    const shouldRunInitialFetch = jobCount < 10;

    console.log(`📊 Current active jobs in database: ${jobCount}`);

    if (shouldRunInitialFetch) {
      console.log("🔄 Database has few jobs, running initial fetch...");
      await jobFetcher.init(true);
    } else {
      console.log("✅ Database has sufficient jobs, only scheduling cron job...");
      await jobFetcher.init(false);
    }

    console.log("Job Fetcher Service started successfully");
  } catch (error) {
    console.error("Failed to start Job Fetcher Service:", error);
  }
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).render("404");
});
