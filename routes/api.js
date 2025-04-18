const express = require('express');
const router = express.Router();
const connectToMongo = require('../db/db');
const authMiddleware = require('../middleware/auth');
const { parseTowbookData } = require('../parsers/towbookParser');
const ingestQueue = require('../queues/ingestQueue');
const { randomUUID } = require('crypto');

// Apply auth middleware to all routes in this file
router.use(authMiddleware);

// Health check route
router.get('/status', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'AppBack' });
});

router.get('/worker-status', (req, res) => {
  res.json({ worker: 'ingest', status: 'online' });
});

router.post('/ignest-worker-status', async (req, res) => {
  try {
    // Generate a unique callId using timestamp + UUID
    const timestamp = Date.now();
    const uniqueCallId = `test-call-${timestamp}-${randomUUID()}`;

    const testJob = {
      rows: [
        {
          callId: uniqueCallId,
          result: '✅ Success',
          status_check: true
        }
      ]
    };

    await ingestQueue.add('test-job', testJob);
    console.log(`🚀 Queued test job with callId: ${uniqueCallId}`);
    res.status(202).json({ message: 'Test job queued', callId: uniqueCallId });
  } catch (err) {
    console.error('❌ Failed to queue test job:', err);
    res.status(500).json({ error: 'Failed to enqueue job' });
  }
});

// GET route for basic testing/debugging (optional)
router.get('/ingest2', (req, res) => {
  const text = req.query.text;
  console.log('🔵 GET /api/ingest received:', text);
  res.status(200).json({ message: 'Hello from the Dockerized API!' });
});

router.get('/', (req, res) => {
  res.send('Hello from appBack!');
});

// POST route to handle ingest from Power Automate or other clients
router.post('/ingest', async (req, res) => {
  const {
    ctype: consoleType,
    pkv: version,
    clid: clientMachineId,
    cust: customer,
    br: branch,
    ts: clientTimestamp
  } = req.query;

  const rawText = req.body;
  const parsedData = parseTowbookData(rawText);

  const enrichedRows = parsedData.map(row => ({
    ...row,
    meta: {
      consoleType,
      version,
      clientTimestamp: Number(clientTimestamp),
      receivedAt: new Date(),
      customer,
      branch,
      clientMachineId
    }
  }));

  try {
    await ingestQueue.add('write-to-mongo', {
      rows: enrichedRows
    });
	console.log('📤 Job added to queue');
	
    res.status(202).json({ status: 'queued', count: enrichedRows.length });
	console.log('🔵 POST /api/ingest received with jobs:', enrichedRows.length);
  } catch (err) {
    console.error('❌ Queue Error:', err);
    res.status(500).json({ error: 'Failed to queue ingest job' });
  }
});

router.post('/verificationResult', async (req, res) => {
  const result = req.body;
  const verificationId = result.gdslt || result.verificationId;

  try {
    const db = await connectToMongo();
    const collection = db.collection('callVerifications');

    await collection.updateOne(
      { _id: verificationId },
      {
        $set: {
          responsePayload: result,
          status: 'completed',
          updatedAt: new Date()
        }
      },
      { upsert: true } // ✅ allow creation if missing
    );

    res.status(200).json({ received: true });
  } catch (err) {
    console.error('❌ Webhook error:', err);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});



module.exports = router;
