import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!db) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    const connectionString = process.env.DATABASE_URL;
    const client = postgres(connectionString);
    db = drizzle(client);
  }
  
  return db;
}

export function isDbConnected(): boolean {
  try {
    return !!process.env.DATABASE_URL && db !== null;
  } catch {
    return false;
  }
}