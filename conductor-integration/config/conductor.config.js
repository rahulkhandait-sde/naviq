import { TaskRunner, orkesConductorClient } from '@io-orkes/conductor-javascript';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

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

// Create task runner instance (will be initialized later)
export let taskRunner = null;

// Function to initialize task runner
export function initializeTaskRunner() {
  taskRunner = new TaskRunner({
    serverUrl: conductorConfig.serverUrl,
    keyId: conductorConfig.keyId,
    keySecret: conductorConfig.keySecret,
    options: {
      pollingIntervalMs: workerConfig.pollingIntervalMS,
      concurrency: workerConfig.concurrency
    }
  });
  return taskRunner;
}

export default {
  conductorConfig,
  conductorClient,
  taskRunner,
  workerConfig,
  initializeTaskRunner
};
