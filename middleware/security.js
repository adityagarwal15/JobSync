const helmet = require('helmet');
const hpp = require('hpp');

exports.securityMiddleware = (app) => {
  app.use(
    helmet({
      contentSecurityPolicy: false, 
      crossOriginEmbedderPolicy: false, 
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false, 
      hidePoweredBy: true,
      referrerPolicy: { policy: 'no-referrer' },
    })
  );

  app.use(hpp());
};
