const validator = require('validator');
const { body, param, query, validationResult } = require('express-validator');

/**
 * Validation Middleware for JobSync API
 * 
 * Provides comprehensive validation for all API endpoints
 * using express-validator for robust input validation
 * 
 * @author JobSync Team
 * @version 1.0.0
 */

/**
 * Handle validation results
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages
    });
  }
  
  next();
};

// User Validation Rules
const validateUserRegistration = [
  body('personal_info.first_name')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('First name must be between 2 and 30 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces'),
    
  body('personal_info.last_name')
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Last name must be between 2 and 30 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces'),
    
  body('personal_info.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  body('auth.password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    
  body('auth.role')
    .isIn(['job_seeker', 'recruiter'])
    .withMessage('Role must be either job_seeker or recruiter'),
    
  body('personal_info.phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
    
  handleValidationErrors
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
    
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
    
  handleValidationErrors
];

const validateUserUpdate = [
  body('personal_info.first_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('First name must be between 2 and 30 characters'),
    
  body('personal_info.last_name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Last name must be between 2 and 30 characters'),
    
  body('personal_info.phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
    
  body('personal_info.profile_picture')
    .optional()
    .isURL()
    .withMessage('Profile picture must be a valid URL'),
    
  handleValidationErrors
];

// Job Validation Rules
const validateJobCreation = [
  body('job_title')
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Job title must be between 5 and 100 characters'),
    
  body('job_description')
    .trim()
    .isLength({ min: 50, max: 10000 })
    .withMessage('Job description must be between 50 and 10000 characters'),
    
  body('employer_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Employer name must be between 2 and 100 characters'),
    
  body('job_city')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Job city must be between 2 and 50 characters'),
    
  body('job_state')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Job state must be between 2 and 50 characters'),
    
  body('job_country')
    .optional()
    .trim()
    .isLength({ min: 2, max: 3 })
    .withMessage('Job country must be 2-3 character country code'),
    
  body('job_employment_type')
    .isIn(['FULLTIME', 'PARTTIME', 'CONTRACTOR', 'INTERN', 'TEMPORARY'])
    .withMessage('Employment type must be one of: FULLTIME, PARTTIME, CONTRACTOR, INTERN, TEMPORARY'),
    
  body('job_is_remote')
    .optional()
    .isBoolean()
    .withMessage('Remote flag must be true or false'),
    
  body('job_apply_link')
    .isURL()
    .withMessage('Apply link must be a valid URL'),
    
  body('salary_range.min_salary')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Minimum salary must be a positive number'),
    
  body('salary_range.max_salary')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Maximum salary must be a positive number'),
    
  body('salary_range.currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-letter currency code'),
    
  body('required_skills')
    .optional()
    .isArray()
    .withMessage('Required skills must be an array'),
    
  body('required_skills.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Each skill must be between 1 and 50 characters'),
    
  handleValidationErrors
];

const validateJobUpdate = [
  body('job_title')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Job title must be between 5 and 100 characters'),
    
  body('job_description')
    .optional()
    .trim()
    .isLength({ min: 50, max: 10000 })
    .withMessage('Job description must be between 50 and 10000 characters'),
    
  body('job_employment_type')
    .optional()
    .isIn(['FULLTIME', 'PARTTIME', 'CONTRACTOR', 'INTERN', 'TEMPORARY'])
    .withMessage('Employment type must be one of: FULLTIME, PARTTIME, CONTRACTOR, INTERN, TEMPORARY'),
    
  body('job_is_remote')
    .optional()
    .isBoolean()
    .withMessage('Remote flag must be true or false'),
    
  body('salary_range.min_salary')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Minimum salary must be a positive number'),
    
  body('salary_range.max_salary')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Maximum salary must be a positive number'),
    
  handleValidationErrors
];

// Application Validation Rules
const validateApplicationCreation = [
  body('job_id')
    .isMongoId()
    .withMessage('Job ID must be a valid MongoDB ObjectId'),
    
  body('application_data.resume.file_url')
    .isURL()
    .withMessage('Resume file URL must be a valid URL'),
    
  body('application_data.cover_letter.content')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Cover letter cannot exceed 5000 characters'),
    
  body('application_data.custom_responses')
    .optional()
    .isArray()
    .withMessage('Custom responses must be an array'),
    
  body('application_data.custom_responses.*.question')
    .optional()
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('Question must be between 1 and 500 characters'),
    
  body('application_data.custom_responses.*.answer')
    .optional()
    .trim()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Answer must be between 1 and 2000 characters'),
    
  handleValidationErrors
];

const validateApplicationStatusUpdate = [
  body('status')
    .isIn([
      'pending', 'reviewing', 'shortlisted', 'interviewed',
      'offer_extended', 'accepted', 'rejected', 'withdrawn', 'expired'
    ])
    .withMessage('Invalid application status'),
    
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes cannot exceed 1000 characters'),
    
  handleValidationErrors
];

// Query Parameter Validation
const validatePaginationQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
    
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
    
  handleValidationErrors
];

const validateJobSearchQuery = [
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
    
  query('location')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters'),
    
  query('employment_type')
    .optional()
    .isIn(['FULLTIME', 'PARTTIME', 'CONTRACTOR', 'INTERN', 'TEMPORARY'])
    .withMessage('Employment type must be one of: FULLTIME, PARTTIME, CONTRACTOR, INTERN, TEMPORARY'),
    
  query('is_remote')
    .optional()
    .isBoolean()
    .withMessage('Remote filter must be true or false'),
    
  query('salary_min')
    .optional()
    .isNumeric()
    .isFloat({ min: 0 })
    .withMessage('Minimum salary must be a positive number'),
    
  query('sort_by')
    .optional()
    .isIn(['posting_dates.posted_at', 'engagement_metrics.view_count', 'salary_range.min_salary'])
    .withMessage('Invalid sort field'),
    
  query('sort_order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc'),
    
  handleValidationErrors
];

// MongoDB ObjectId validation
const validateObjectId = (paramName) => [
  param(paramName)
    .isMongoId()
    .withMessage(`${paramName} must be a valid MongoDB ObjectId`),
  handleValidationErrors
];

// Custom validation functions
const validatePasswordStrength = (password) => {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[@$!%*?&]/.test(password);
  
  if (password.length < minLength) {
    return 'Password must be at least 8 characters long';
  }
  
  if (!hasUpperCase) {
    return 'Password must contain at least one uppercase letter';
  }
  
  if (!hasLowerCase) {
    return 'Password must contain at least one lowercase letter';
  }
  
  if (!hasNumbers) {
    return 'Password must contain at least one number';
  }
  
  if (!hasSpecialChar) {
    return 'Password must contain at least one special character (@$!%*?&)';
  }
  
  return true;
};

const validateFileUpload = (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files uploaded'
    });
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  const maxSize = 5 * 1024 * 1024; // 5MB

  for (let key in req.files) {
    const file = req.files[key];
    
    if (!allowedTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid file type. Allowed types: JPEG, PNG, PDF, DOC, DOCX'
      });
    }
    
    if (file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size: 5MB'
      });
    }
  }

  next();
};

module.exports = {
  handleValidationErrors,
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validateJobCreation,
  validateJobUpdate,
  validateApplicationCreation,
  validateApplicationStatusUpdate,
  validatePaginationQuery,
  validateJobSearchQuery,
  validateObjectId,
  validatePasswordStrength,
  validateFileUpload
};
