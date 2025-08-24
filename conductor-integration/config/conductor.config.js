import { ConductorWorker, orkesConductorClient } from '@io-orkes/conductor-javascript';
import dotenv from 'dotenv';

dotenv.config();

// Conductor configuration
export const conductorConfig = {
  serverUrl: process.env.CONDUCTOR_SERVER_URL || 'http://localhost:8080',
  keyId: process.env.CONDUCTOR_KEY_ID || '',
  keySecret: process.env.CONDUCTOR_KEY_SECRET || '',
  debug: process.env.NODE_ENV === 'development'
};

// Initialize Conductor client
export const conductorClient = orkesConductorClient({
  serverUrl: conductorConfig.serverUrl,
  keyId: conductorConfig.keyId,
  keySecret: conductorConfig.keySecret
});

// Worker configuration
export const workerConfig = {
  pollingIntervalMS: 1000,
  concurrency: 10,
  domain: 'naviq'
};

// Create worker instance
export const worker = new ConductorWorker({
  ...workerConfig,
  serverUrl: conductorConfig.serverUrl
});

export default {
  conductorConfig,
  conductorClient,
  worker,
  workerConfig
};
