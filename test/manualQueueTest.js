const IORedis = require('ioredis');
const { Queue } = require('bullmq');
require('dotenv').config();

// Connect to Redis using the same credentials as your worker
const connection = new IORedis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT),
  password: process.env.REDIS_PASSWORD
});

const ingestQueue = new Queue('ingest', { connection });

async function run() {
  console.log('📤 Adding test job to queue...');

  await ingestQueue.add('write-to-mongo', {
    rows: [
      {
        'Call #': '99999',
        'Vehicle': 'Debug Sedan',
        'Reason': 'Testing',
        meta: {
          consoleType: 'debug',
          version: '9.9.9',
          clientTimestamp: Date.now(),
          receivedAt: new Date(),
          customer: 'testCustomer',
          branch: 'testBranch',
          clientMachineId: 'manual-script'
        }
      }
    ]
  });

  console.log('✅ Manual job added to queue');
  process.exit();
}

run();
