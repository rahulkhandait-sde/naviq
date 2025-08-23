import { configDotenv } from 'dotenv';
configDotenv()
import { Client, Storage, ID } from 'node-appwrite';
export const client = new Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT) 
        .setProject(process.env.APPWRITE_PROJECT_ID)

const storage = new Storage(client);
export {  storage, ID };