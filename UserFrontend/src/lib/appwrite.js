import { Client, Account, Databases, ID } from 'appwrite';

// Initialize Appwrite client
const client = new Client();

client
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

// Initialize services
export const account = new Account(client);
export const databases = new Databases(client);

// Helper functions
export const appwriteConfig = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT,
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID,
  databaseId: import.meta.env.VITE_APPWRITE_DATABASE || 'naviq-db',
  userCollectionId: import.meta.env.VITE_APPWRITE_USER_COLLECTION || 'users',
};

// Connection test function
export const testConnection = async () => {
  try {
    await account.get();
    return { success: true };
  } catch (error) {
    console.warn('Appwrite connection test failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Export for debugging
if (import.meta.env.DEV) {
  console.log('Appwrite Config:', {
    endpoint: appwriteConfig.endpoint,
    projectId: appwriteConfig.projectId,
    currentOrigin: window.location.origin
  });
}

export { ID };
export default client;
