const { Queue } = require('bullmq');
const IORedis = require('ioredis');

// ✅ Use Redis config from .env
const connection = new IORedis({
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT),
    password: process.env.REDIS_PASSWORD
  });
  
  const queueName = process.env.INGEST_QUEUE_NAME || 'ingest';  

  const ingestQueue = new Queue(queueName, {
  connection
});

module.exports = ingestQueue;
