const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    company: {
      type: String,
      required: true,
    },
    location: {
      type: String,
      default: 'Remote',
    },
    description: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
      unique: true, // Prevent duplicate job postings
    },
    source: {
      type: String,
      default: 'Google Jobs API',
    },
    postedDate: {
      type: Date,
      default: Date.now,
    },
    salary: {
      type: String,
      default: 'Not specified',
    },
    jobType: {
      type: String,
      enum: [
        'full-time',
        'part-time',
        'contract',
        'internship',
        'remote',
        'daily',
        'weekly',
        'not-specified',
      ],
      default: 'not-specified',
    },
    skills: {
      type: [String],
      default: [],
    },
    category: {
      type: String,
      default: 'General',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    fetchedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better search performance
jobSchema.index({ title: 'text', company: 'text', description: 'text' });
jobSchema.index({ category: 1, isActive: 1 });
jobSchema.index({ postedDate: -1 });

const Job = mongoose.model('Job', jobSchema);
module.exports = Job;
