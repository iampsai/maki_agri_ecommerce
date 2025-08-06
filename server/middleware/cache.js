const cache = require('../utils/cache');

const apiCache = async (req, res, next) => {
    if (req.method !== 'GET') {
        return next();
    }

    const key = `api-cache:${req.originalUrl}`;
    try {
        const cachedResponse = await cache.get(key);
        if (cachedResponse) {
            return res.json(cachedResponse);
        }
        
        // Store original res.json to intercept the response
        const originalJson = res.json;
        res.json = function(data) {
            cache.set(key, data, 300); // Cache for 5 minutes
            return originalJson.call(this, data);
        };
        
        next();
    } catch (error) {
        console.error('Cache middleware error:', error);
        next();
    }
};

module.exports = apiCache;
