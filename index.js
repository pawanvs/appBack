const express = require('express');
const dotenv = require('dotenv');
const fs = require('fs');
const https = require('https');
const apiRoutes = require('./routes/api');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 15000;

// Body parsing middleware
app.use(express.json());
app.use(express.text());

// Mount routes
app.use('/api', apiRoutes);

const key = fs.readFileSync(process.env.SSL_KEYFILE);
const cert = fs.readFileSync(process.env.SSL_CERTFILE);

// Create HTTPS server
const server = https.createServer({ key, cert }, app);

// Start HTTPS server
server.listen(PORT, () => {
  console.log(`🔒 HTTPS server running at https://localhost:${PORT}`);
});
