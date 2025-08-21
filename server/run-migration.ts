import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function runMigration() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  const connectionString = process.env.DATABASE_URL;
  const client = postgres(connectionString);
  const db = drizzle(client);

  try {
    console.log('Running RLS migration...');
    
    // Read the migration file
    const migrationSQL = readFileSync(join(process.cwd(), 'migrations', '0001_add_rls_policies.sql'), 'utf8');
    
    // Split by statement separator and execute each statement
    const statements = migrationSQL.split('-->').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      const cleanStatement = statement.replace(/statement-breakpoint/g, '').trim();
      if (cleanStatement) {
        try {
          await client.unsafe(cleanStatement);
          console.log('✓ Executed statement successfully');
        } catch (error: any) {
          // Skip errors for already existing policies
          if (error.message.includes('already exists') || error.message.includes('does not exist')) {
            console.log('⚠ Skipping:', error.message);
          } else {
            throw error;
          }
        }
      }
    }
    
    console.log('✅ RLS migration completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

runMigration().catch(console.error);