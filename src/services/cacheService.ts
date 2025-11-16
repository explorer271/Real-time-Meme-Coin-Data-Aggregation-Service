import IORedis from 'ioredis';

const redisUrl = 'redis://localhost:6379';
const cacheService = new IORedis(redisUrl);

cacheService.on('connect', () => console.log('Connected to Redis'));
cacheService.on('error', (err) => console.error('Redis connection error', err));

export default cacheService;