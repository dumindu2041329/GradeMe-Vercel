import { getDb } from './db-connection.js';
import { exams } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import { paperFileStorage } from './paper-file-storage.js';

/**
 * Manual synchronization utility to fix exam total marks
 * This ensures exam table matches the sum of question marks
 */
export async function forceExamMarkSync(examId: number): Promise<boolean> {
  try {
    const db = getDb();
    
    // Get the current paper data
    const paper = await paperFileStorage.getPaperByExamId(examId);
    
    if (!paper || !paper.questions) {
      console.log(`No paper or questions found for exam ${examId}`);
      // Set to 0 if no questions exist
      await db.update(exams)
        .set({ totalMarks: 0 })
        .where(eq(exams.id, examId));
      return true;
    }
    
    // Calculate correct total marks
    const correctTotalMarks = paper.questions.reduce((sum, q) => sum + q.marks, 0);
    
    // Update exam table
    const result = await db.update(exams)
      .set({ totalMarks: correctTotalMarks })
      .where(eq(exams.id, examId))
      .returning();
    
    if (result.length > 0) {
      console.log(`🔧 MANUAL SYNC: Exam ${examId} - Questions: ${paper.questions.length}, Total marks: ${correctTotalMarks}`);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error in manual sync for exam ${examId}:`, error);
    return false;
  }
}

/**
 * Sync all exams to ensure consistency
 */
export async function syncAllExamMarks(): Promise<void> {
  try {
    const db = getDb();
    
    // Get all exams
    const allExams = await db.select().from(exams);
    
    console.log(`🔧 Starting manual sync for ${allExams.length} exams...`);
    
    for (const exam of allExams) {
      await forceExamMarkSync(exam.id);
    }
    
    console.log(`✅ Manual sync complete for all exams`);
  } catch (error) {
    console.error('Error syncing all exam marks:', error);
  }
}