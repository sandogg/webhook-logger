// Load environment variables from .env file
require('dotenv').config();

// Import necessary modules
const express = require('express'); // Framework for handling HTTP requests
const bodyParser = require('body-parser'); // Middleware for parsing request bodies
const helmet = require('helmet'); // Adds security headers to requests
const { exec } = require('child_process'); // Executes system commands
const StatsD = require('node-statsd'); // Sends metrics to StatsD
const winston = require('winston'); // For logging
const { RateLimiterMemory } = require('rate-limiter-flexible'); // Rate limiting

// Initialize application
const app = express();
const port = process.env.PORT || 3000;

// Middleware setup
app.use(helmet()); // Add security headers
app.use(bodyParser.json()); // Parse JSON payloads
app.set('trust proxy', true); // Trust proxy headers

// Setup logging with rotating files
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.json(),
    transports: [
        new winston.transports.File({
            filename: 'webhook-logger.log',
            maxsize: 51 * 1024 * 1024, // 51MB
            maxFiles: 3, // Retain 3 logs
            tailable: true,
            zippedArchive: true // Compress old logs
        })
    ]
});

// Setup StatsD client for metrics
const statsDClient = new StatsD();

// Configure rate limiter
const rateLimiter = new RateLimiterMemory({
    points: 100, // Allow 100 requests
    duration: 60, // Per 60 seconds
});

const rateLimitMiddleware = (req, res, next) => {
    rateLimiter.consume(req.ip)
        .then(() => next()) // Allow request
        .catch(() => res.status(429).send('Too many requests - try again later')); // Block request
};
app.use(rateLimitMiddleware);

// Webhook POST endpoint
app.post('/bbyWebhook', (req, res) => {
    const payload = req.body; // Extract payload

    // Validate payload
    if (!payload || typeof payload !== 'object') {
        logger.error('Invalid payload received');
        return res.status(400).send('Invalid payload');
    }

    // Extract and sanitize vscl_logger key
    const vsclLoggerValue = payload.vscl_logger ? String(payload.vscl_logger) : 'undefined';
    const logMessage = `[vscl_users]: ${vsclLoggerValue}`;

    // Log to Linux system logger
    exec(`logger -t vscl_users "${logMessage}"`, (error) => {
        if (error) logger.error(`Logger error: ${error.message}`);
    });

    // Log metrics and details
    statsDClient.increment('webhook.requests');
    logger.info(logMessage);

    res.status(200).send('Webhook received');
});

// Start the server
app.listen(port, () => console.log(`Webhook listener running on port ${port}`));

