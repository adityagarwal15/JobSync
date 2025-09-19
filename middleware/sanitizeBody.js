const sanitizeHtml = require('sanitize-html');


const sanitizeOptions = {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard',
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
};


exports.sanitizeBody = (skipFields = []) => {
    return (req, res, next) => {
        if (req.body && typeof req.body === 'object') {
            Object.keys(req.body).forEach((key) => {
                if (skipFields.includes(key)) return;

                if (typeof req.body[key] === 'string') {
                    req.body[key] = sanitizeHtml(req.body[key], sanitizeOptions).trim();
                }
            });
        }
        next();
    };
}