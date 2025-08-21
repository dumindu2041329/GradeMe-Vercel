import { getDb } from './db-connection.js';
import { users, students } from '../shared/schema.js';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

const db = getDb();

export async function setupInitialData() {
  try {
    // First, ensure the password column exists in the students table
    try {
      await db.execute(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='password') THEN
            ALTER TABLE students ADD COLUMN password TEXT;
          END IF;
        END $$;
      `);
    } catch (error) {
      // Password column setup failed, continuing...
    }
    
    // Only create initial users if environment variables are set
    const initialAdminEmail = process.env.INITIAL_ADMIN_EMAIL;
    const initialAdminPassword = process.env.INITIAL_ADMIN_PASSWORD;
    const initialAdminName = process.env.INITIAL_ADMIN_NAME || 'Administrator';
    
    if (initialAdminEmail && initialAdminPassword) {
      // Check if admin user already exists
      const existingAdmin = await db.select().from(users).where(eq(users.email, initialAdminEmail)).limit(1);
      
      if (existingAdmin.length === 0) {
        // Create admin user with secure password from environment
        const hashedPassword = await bcrypt.hash(initialAdminPassword, 10);
        await db.insert(users).values({
          email: initialAdminEmail,
          password: hashedPassword,
          name: initialAdminName,
          role: 'admin',
          isAdmin: true,
          profileImage: null,
          studentId: null,
          emailNotifications: true,
          emailExamResults: true,
          emailUpcomingExams: true
        });
        console.log(`Initial admin user created: ${initialAdminEmail}`);
      }
    } else {
      // Check if any admin exists
      const adminCount = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
      if (adminCount.length === 0) {
        console.warn('\n⚠️  WARNING: No admin users exist and no initial admin credentials are configured!');
        console.warn('To create an initial admin user, set the following environment variables:');
        console.warn('  INITIAL_ADMIN_EMAIL - The email address for the admin');
        console.warn('  INITIAL_ADMIN_PASSWORD - A strong password for the admin');
        console.warn('  INITIAL_ADMIN_NAME (optional) - The display name for the admin\n');
      }
    }
    
    // Optional: Create initial student if configured
    const initialStudentEmail = process.env.INITIAL_STUDENT_EMAIL;
    const initialStudentPassword = process.env.INITIAL_STUDENT_PASSWORD;
    
    if (initialStudentEmail && initialStudentPassword) {
      let studentRecord = await db.select().from(students).where(eq(students.email, initialStudentEmail)).limit(1);
      
      if (studentRecord.length === 0) {
        // Create sample student with secure password from environment
        const hashedPassword = await bcrypt.hash(initialStudentPassword, 10);
        const newStudent = await db.insert(students).values({
          name: process.env.INITIAL_STUDENT_NAME || 'Sample Student',
          email: initialStudentEmail,
          password: hashedPassword,
          class: process.env.INITIAL_STUDENT_CLASS || '12th Grade',
          enrollmentDate: new Date(),
          phone: process.env.INITIAL_STUDENT_PHONE || '000-000-0000',
          address: process.env.INITIAL_STUDENT_ADDRESS || 'Not specified',
          dateOfBirth: new Date('2005-01-15'),
          guardianName: process.env.INITIAL_STUDENT_GUARDIAN || 'Guardian Name',
          guardianPhone: process.env.INITIAL_STUDENT_GUARDIAN_PHONE || '000-000-0000',
          profileImage: null
        }).returning();
        
        studentRecord = newStudent;
        
        // Also create a student user entry in the users table
        const existingStudentUser = await db.select().from(users).where(eq(users.email, initialStudentEmail)).limit(1);
        
        if (existingStudentUser.length === 0) {
          await db.insert(users).values({
            email: initialStudentEmail,
            password: hashedPassword,
            name: process.env.INITIAL_STUDENT_NAME || 'Sample Student',
            role: 'student',
            isAdmin: false,
            profileImage: null,
            studentId: studentRecord[0].id,
            emailNotifications: true,
            emailExamResults: true,
            emailUpcomingExams: true
          });
        }
        
        console.log(`Initial student user created: ${initialStudentEmail}`);
      }
    }
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}