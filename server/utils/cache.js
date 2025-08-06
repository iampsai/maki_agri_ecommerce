const Redis = require('redis');
const client = Redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', (err) => console.log('Redis Client Error', err));

async function connectRedis() {
    await client.connect();
}

connectRedis();

const cache = {
    set: async (key, value, expireIn = 3600) => {
        await client.set(key, JSON.stringify(value), {
            EX: expireIn
        });
    },
    get: async (key) => {
        const value = await client.get(key);
        return value ? JSON.parse(value) : null;
    },
    del: async (key) => {
        await client.del(key);
    }
};

module.exports = cache;
