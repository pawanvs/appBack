const { Worker } = require('bullmq');
const IORedis = require('ioredis');
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');

dotenv.config();
console.log(`👷 Starting mongoWorker.js...`);

// ✅ Load and validate environment variables
const {
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD,
  MONGODB_URI,
  INGEST_QUEUE_NAME = 'ingest',
} = process.env;

if (!REDIS_HOST || !REDIS_PORT || !MONGODB_URI) {
  console.error('❌ Missing required environment variables.');
  console.error(`REDIS_HOST: ${REDIS_HOST}, REDIS_PORT: ${REDIS_PORT}, MONGODB_URI: ${MONGODB_URI}`);
  process.exit(1);
}

// ✅ Connect to Redis
const connection = new IORedis({
  host: REDIS_HOST,
  port: parseInt(REDIS_PORT),
  password: REDIS_PASSWORD,
  maxRetriesPerRequest: null,
});

connection.on('connect', () => {
  console.log(`🔌 Connected to Redis at ${REDIS_HOST}:${REDIS_PORT}`);
});
connection.on('error', (err) => {
  console.error('❌ Redis error:', err);
  process.exit(1);
});

// ✅ Connect to MongoDB and start worker
MongoClient.connect(MONGODB_URI)
  .then((client) => {
    const db = client.db();
    console.log('✅ Connected to MongoDB Atlas');

    const twbkCalls = db.collection('twbkCalls');
    const healthCheck = db.collection('healthCheck');

    const worker = new Worker(
      INGEST_QUEUE_NAME,
      async (job) => {
        try {
          const parsedData = job.data.rows;

          if (!Array.isArray(parsedData)) {
            console.warn('⚠️ Job does not contain a valid "rows" array:', job.data);
            return;
          }

          let count = 0;

          for (const row of parsedData) {
            const callId = row.callId?.trim() || row['Call #']?.trim();
            if (!callId) {
              console.warn('⚠️ Skipping row with no callId:', row);
              continue;
            }

            // ✅ If it's a health check job, only write to healthCheck
            if (row.status_check === true) {
              await healthCheck.insertOne({
                callId: callId,
                status: 'done',
                worker: 'mongoWorker',
                processedAt: new Date(),
                jobId: job.id,
              });
              console.log(`🧪 Health check record written for callId: ${callId}`);
              continue; // ✅ Skip writing to twbkCalls
            }

            // ✅ Normal job → write to main collection            
            await twbkCalls.updateOne(
              { call_id: callId },
              {
                $set: {
                  ...row,
                  call_id: callId,
                  updatedAt: new Date(),
                },
                $setOnInsert: {
                  createdAt: new Date(),
                },
              },
              { upsert: true }
            );

            count++;

          }

          console.log(`🎉 Job ${job.id} processed: ${count} row(s)`);
        } catch (err) {
          console.error(`❌ Job ${job.id} failed:`, err);
        }
      },
      { connection }
    );

    worker.on('completed', (job) => {
      console.log(`✅ Job ${job.id} completed`);
    });

    worker.on('failed', (job, err) => {
      console.error(`❌ Job ${job?.id} failed during processing:`, err);
    });

    console.log(`🧠 Worker initialized and listening on queue: ${INGEST_QUEUE_NAME}`);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  });
