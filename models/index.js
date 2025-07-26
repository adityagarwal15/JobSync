/**
 * Models Index - Central export point for all database models
 * 
 * This file provides a convenient way to import all models
 * and ensures consistent model registration across the application
 * 
 * @author JobSync Team
 * @version 1.0.0
 */

const User = require('./User');
const Job = require('./Job');
const Application = require('./Application');

module.exports = {
  User,
  Job,
  Application
};
