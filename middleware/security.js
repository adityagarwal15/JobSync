const helmet = require('helmet');
const hpp = require('hpp');


exports.securityMiddleware = (app) => {
    app.use(helmet({
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

// Helmet Configuration

// contentSecurityPolicy: false → Disabled to avoid blocking inline scripts/styles in EJS or frontend.
// noSniff: true → Prevents browsers from MIME type sniffing (protects against malicious file execution).
// frameguard: { action: 'sameorigin' } → Allows the app to be embedded in an <iframe> only from the same origin (prevents clickjacking).
// hidePoweredBy: true → Removes the X-Powered-By header to make it harder for attackers to know the server framework.
// referrerPolicy: { policy: "no-referrer" } → Ensures that the Referer header is not sent with requests (privacy protection).
// crossOriginEmbedderPolicy: false → Disabled to avoid blocking some cross-origin resources like fonts and iframes.
// crossOriginResourcePolicy: { policy: "cross-origin" } → Allows loading resources (images, fonts) from other origins.
// crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" } → Enables safe isolation but still allows popups from other origins.
