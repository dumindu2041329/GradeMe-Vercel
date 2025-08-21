import { getDb } from './db-connection';
import fs from 'fs';
import path from 'path';

export async function createTablesIfNotExist() {
  const db = getDb();
  
  try {
    console.log('Checking if database tables exist...');
    
    // Check if tables exist by trying to query a small result
    const tableCheck = await db.execute(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      ) as users_exists,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'students'
      ) as students_exists,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'exams'
      ) as exams_exists,
      EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'results'
      ) as results_exists;
    `);
    
    const tableExists = tableCheck[0];
    const allTablesExist = tableExists.users_exists && 
                          tableExists.students_exists && 
                          tableExists.exams_exists && 
                          tableExists.results_exists;
    
    if (!allTablesExist) {
      console.log('Some tables are missing. Creating tables...');
      
      // Read and execute the complete database schema migration
      const migrationPath = path.join(process.cwd(), 'migrations', '0003_complete_database_schema.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Split by statement separator and execute each
      const statements = migrationSQL.split('--> statement-breakpoint');
      
      for (const statement of statements) {
        const trimmedStatement = statement.trim();
        if (trimmedStatement) {
          try {
            await db.execute(trimmedStatement);
          } catch (error: any) {
            // Ignore errors for existing objects
            if (!error.message?.includes('already exists') && 
                !error.message?.includes('duplicate_object')) {
              console.error('Error executing statement:', error.message);
            }
          }
        }
      }
      
      console.log('✓ Database tables created successfully');
    } else {
      console.log('✓ All database tables already exist');
    }
    
  } catch (error) {
    console.error('Error checking/creating tables:', error);
    throw error;
  }
}