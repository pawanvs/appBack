const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI); // clean and simple

let db;

async function connectToMongo() {
  if (!db) {
    await client.connect();
    db = client.db(); // Uses "da2" from the URI
    console.log('✅ Connected to MongoDB Atlas');
  }
  return db;
}

module.exports = connectToMongo;
