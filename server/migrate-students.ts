import { getDb } from './db-connection.js';
import { users, students } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

/**
 * One-time migration to ensure all existing students have corresponding user records
 */
export async function migrateStudentsToUsers() {
  const db = getDb();
  
  try {
    // Get all students
    const allStudents = await db.select().from(students);
    console.log(`Found ${allStudents.length} students to check for user records`);
    
    let created = 0;
    
    for (const student of allStudents) {
      // Check if user record already exists by studentId or email
      const existingUserByStudentId = await db.select()
        .from(users)
        .where(eq(users.studentId, student.id))
        .limit(1);
        
      const existingUserByEmail = await db.select()
        .from(users)
        .where(eq(users.email, student.email))
        .limit(1);
      
      if (existingUserByStudentId.length === 0 && existingUserByEmail.length === 0) {
        // Create user record for this student
        const userData = {
          name: student.name,
          email: student.email,
          password: student.password, // Password should already be hashed
          role: 'student' as const,
          studentId: student.id,
          emailNotifications: true,
          smsNotifications: false,
          emailExamResults: true,
          emailUpcomingExams: true,
          smsExamResults: false,
          smsUpcomingExams: false,
          profileImage: student.profileImage
        };
        
        await db.insert(users).values(userData);
        created++;
        console.log(`Created user record for student: ${student.name} (${student.email})`);
      } else if (existingUserByEmail.length > 0 && existingUserByStudentId.length === 0) {
        // Update existing user to link with student ID
        await db.update(users)
          .set({ studentId: student.id })
          .where(eq(users.email, student.email));
        console.log(`Linked existing user to student: ${student.name} (${student.email})`);
      }
    }
    
    console.log(`Migration complete. Created ${created} user records.`);
    return { success: true, created };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error };
  }
}