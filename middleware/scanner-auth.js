// Utilities for generating and validating API keys
const crypto = require('crypto');

// Map scanner ID to API key
const keyMap = new Map();

// Generate a random API key
const generateApiKey = function() {
    return crypto.randomBytes(16).toString('hex');
}

const validateApiKey = function(req, res, next) {
    if (keyMap.has(req.body.id) && keyMap.get(req.body.id) == req.header('X-API-Key')) {
        next();
    } else {
        res.status(401).send('Unauthorized');
    }
}

module.exports = { generateApiKey, validateApiKey, keyMap };