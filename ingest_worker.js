const { Worker } = require('bullmq');
require('dotenv').config();
const IORedis = require('ioredis');

// Log startup
console.log("🧠 ingest_worker.js starting...");

// Handle fatal errors
process.on('uncaughtException', (err) => {
  console.error('🔥 Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 Unhandled Rejection:', reason);
  process.exit(1);
});

// Redis connection setup
const redisHost = process.env.REDIS_HOST;
const redisPort = parseInt(process.env.REDIS_PORT || "6379");
const redisPassword = process.env.REDIS_PASSWORD;

if (!redisHost) {
  console.error("❌ REDIS_HOST is not defined in .env");
  process.exit(1);
}

const connection = new IORedis({
  host: redisHost,
  port: redisPort,
  password: redisPassword,
  maxRetriesPerRequest: null
});

connection.on('connect', () => {
  console.log(`🔌 Connected to Redis at ${redisHost}:${redisPort}`);
});

connection.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
  process.exit(1);
});

// Worker setup
const queueName = process.env.INGEST_QUEUE_NAME || 'ingest';

const worker = new Worker(
  queueName,
  async (job) => {
    console.log(`📥 [${queueName}] Job received:`, job.id);
    console.log('📦 Payload:', job.data);
    // TODO: implement actual job logic
  },
  { connection }
);

console.log(`✅ Worker initialized for queue: ${queueName}`);

worker.on('completed', (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on('failed', (job, err) => {
  console.error(`❌ Job ${job.id} failed:`, err);
});
