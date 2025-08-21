import { getDb } from './db-connection.js';
import { sql } from 'drizzle-orm';

async function runPasswordResetMigration() {
  try {
    const db = getDb();
    
    console.log('Running password reset tokens migration...');
    
    // Create password reset tokens table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        token TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    
    // Create indexes for performance
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_email ON password_reset_tokens(email)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at)`);
    
    console.log('✓ Password reset tokens table created successfully');
    
    // Test the table by inserting and removing a test record
    const testToken = 'test-token-' + Date.now();
    await db.execute(sql`
      INSERT INTO password_reset_tokens (email, token, expires_at) 
      VALUES ('test@example.com', ${testToken}, NOW() + INTERVAL '1 hour')
    `);
    
    await db.execute(sql`DELETE FROM password_reset_tokens WHERE token = ${testToken}`);
    
    console.log('✓ Migration test completed successfully');
    
    return true;
  } catch (error) {
    console.error('Password reset migration failed:', error);
    throw error;
  }
}

export { runPasswordResetMigration };

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runPasswordResetMigration()
    .then(() => {
      console.log('Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}