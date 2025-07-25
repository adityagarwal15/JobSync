const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const nodemailer = require('nodemailer');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => console.log('MongoDB connected'));

// Contact Schema
const contactSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  role: { type: String },
  email: { type: String },
  portfolio: { type: String },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});
const Contact = mongoose.model('Contact', contactSchema);

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const MAIL_TO = process.env.MAIL_TO || process.env.MAIL_USER;

// Contact API route
app.post('/api/contact', async (req, res) => {
  const { fullName, role, email, portfolio, message } = req.body;
  // Input validation
  if (!fullName || !message) {
    return res.status(400).json({ success: false, message: 'Required fields missing.' });
  }
  // Save to MongoDB
  try {
    const contact = new Contact({ fullName, role, email, portfolio, message });
    await contact.save();
    // Send email (optional)
    try {
      await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: MAIL_TO,
        subject: 'New Contact Form Submission',
        text: `Name: ${fullName}\nRole: ${role || ''}\nEmail: ${email || ''}\nPortfolio: ${portfolio || ''}\nMessage: ${message}`,
      });
      console.log('Mail sent to', MAIL_TO);
    } catch (mailErr) {
      // Log but don't fail the request
      console.error('Mail error:', mailErr);
    }
    return res.json({ success: true, message: 'Contact form submitted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`)); 