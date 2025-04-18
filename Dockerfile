FROM node:20-slim

# Set working directory
WORKDIR /usr/src/app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the project
COPY . .
COPY certs/ ./certs/
COPY workers/mongoWorker.js ./mongoWorker.js

# Make the start script executable
RUN chmod +x ./start.sh

# Set environment variables
ENV NODE_ENV=production

# Launch both the Express server and worker
CMD ["./start.sh"]
