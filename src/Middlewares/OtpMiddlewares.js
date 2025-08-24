const rateLimit = require("express-rate-limit");

const otpLimiter = rateLimit({
    windowMs: 2 * 60 * 1000, // 2 minutes
    max: 1,                  // 1 request per window per IP
    message: { error: "Too many requests, please try again after 2 minutes" }
});

module.exports = {
    otpLimiter
};
