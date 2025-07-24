const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');

// POST /api/contact
router.post('/', async (req, res) => {
  const { name, phone, email, message } = req.body;

  if (!name || !phone || !message) {
    return res.status(400).json({ success: false, msg: 'Required fields missing' });
  }

  try {
    const newContact = new Contact({ name, phone, email, message });
    await newContact.save();
    return res.status(200).json({ success: true, msg: 'Message received successfully!' });
  } catch (err) {
    console.error('Error saving contact:', err);
    return res.status(500).json({ success: false, msg: 'Internal server error' });
  }
});

module.exports = router;
