const helemt = require('helmet');
const hpp = require('hpp');


exports.securityMiddleware = (app) => {
    
    app.use(helemt({
        contentSecurityPolicy: false,
        noSniff: true,
        frameguard: { action: 'sameorigin' },
        hidePoweredBy: true,
        referrerPolicy: { policy: "no-referrer" },
        crossOriginEmbedderPolicy: false,
        crossOriginResourcePolicy: { policy: "cross-origin" },
        crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    }))

    app.use(hpp());
}
