import type { User, Student, Exam, Result, ResultWithDetails, StudentDashboardData } from "../shared/schema.js";
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, desc } from 'drizzle-orm';
import postgres from 'postgres';
import { users, students, exams, results } from '../shared/schema.js';
import { getDb } from './db-connection.js';
import { paperFileStorage } from './paper-file-storage.js';

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: any): Promise<User>;
  updateUser(id: number, user: Partial<any>): Promise<User | undefined>;
  
  // Student operations
  getStudents(): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByEmail(email: string): Promise<Student | undefined>;
  createStudent(student: any): Promise<Student>;
  updateStudent(id: number, student: Partial<any>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  authenticateStudent(email: string, password: string): Promise<Student | null>;
  
  // Exam operations
  getExams(): Promise<Exam[]>;
  getExam(id: number): Promise<Exam | undefined>;
  getExamsByStatus(status: string): Promise<Exam[]>;
  createExam(exam: any): Promise<Exam>;
  updateExam(id: number, exam: Partial<any>): Promise<Exam | undefined>;
  deleteExam(id: number): Promise<boolean>;
  
  // Result operations
  getResults(): Promise<ResultWithDetails[]>;
  getResult(id: number): Promise<ResultWithDetails | undefined>;
  getResultsByStudentId(studentId: number): Promise<ResultWithDetails[]>;
  getResultsByExamId(examId: number): Promise<ResultWithDetails[]>;
  createResult(result: any): Promise<Result>;
  updateResult(id: number, result: Partial<any>): Promise<Result | undefined>;
  deleteResult(id: number): Promise<boolean>;

  // Dashboard statistics
  getStatistics(): Promise<{ 
    totalStudents: number; 
    activeExams: number; 
    completedExams: number; 
    upcomingExams: number;
  }>;
  
  // Student dashboard data
  getStudentDashboardData(studentId: number): Promise<StudentDashboardData>;
}

export class SupabaseStorage implements IStorage {
  private db = getDb();

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(userData: any): Promise<User> {
    const result = await this.db.insert(users).values(userData).returning();
    return result[0];
  }

  async updateUser(id: number, userData: Partial<any>): Promise<User | undefined> {
    const updateData = { ...userData, updatedAt: new Date() };
    const result = await this.db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return result[0];
  }

  // Student operations
  async getStudents(): Promise<Student[]> {
    const result = await this.db.select().from(students).orderBy(desc(students.createdAt));
    return result;
  }

  async getStudent(id: number): Promise<Student | undefined> {
    const result = await this.db.select().from(students).where(eq(students.id, id)).limit(1);
    return result[0];
  }

  async getStudentByEmail(email: string): Promise<Student | undefined> {
    const result = await this.db.select().from(students).where(eq(students.email, email)).limit(1);
    return result[0];
  }

  async createStudent(studentData: any): Promise<Student> {
    // First create the student record
    const studentResult = await this.db.insert(students).values(studentData).returning();
    const newStudent = studentResult[0];
    
    // Then create a corresponding user record for login
    const userData = {
      name: studentData.name,
      email: studentData.email,
      password: studentData.password, // Password should already be hashed at this point
      role: 'student' as const,
      studentId: newStudent.id,
      emailNotifications: true,
      smsNotifications: false,
      emailExamResults: true,
      emailUpcomingExams: true,
      smsExamResults: false,
      smsUpcomingExams: false,
      profileImage: null
    };
    
    try {
      await this.db.insert(users).values(userData);
    } catch (error) {
      console.error('Failed to create user record for student:', error);
      // If user creation fails, we should still return the student
      // but log the error for investigation
    }
    
    return newStudent;
  }

  async updateStudent(id: number, studentData: Partial<any>): Promise<Student | undefined> {
    const updateData = { ...studentData, updatedAt: new Date() };
    const result = await this.db.update(students).set(updateData).where(eq(students.id, id)).returning();
    const updatedStudent = result[0];
    
    if (updatedStudent) {
      // Also update the corresponding user record if it exists
      const userUpdateData: any = {};
      if (studentData.name) userUpdateData.name = studentData.name;
      if (studentData.email) userUpdateData.email = studentData.email;
      if (studentData.password) userUpdateData.password = studentData.password;
      
      if (Object.keys(userUpdateData).length > 0) {
        try {
          await this.db.update(users)
            .set({ ...userUpdateData, updatedAt: new Date() })
            .where(eq(users.studentId, id));
        } catch (error) {
          console.error('Failed to update user record for student:', error);
          // Continue even if user update fails
        }
      }
    }
    
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<boolean> {
    try {
      // First check if the student exists
      const existingStudent = await this.getStudent(id);
      if (!existingStudent) {
        return false;
      }
      
      // Delete the corresponding user record first
      try {
        await this.db.delete(users).where(eq(users.studentId, id));
      } catch (error) {
        console.log(`User record deletion failed for student ${id}, but continuing with student deletion:`, error);
      }
      
      // Then delete the student record
      await this.db.delete(students).where(eq(students.id, id));
      return true; // If no error is thrown, deletion was successful
    } catch (error) {
      console.error(`Error deleting student ${id}:`, error);
      return false;
    }
  }

  async authenticateStudent(email: string, password: string): Promise<Student | null> {
    const student = await this.getStudentByEmail(email);
    if (!student) {
      return null;
    }
    
    // Use bcryptjs (pure JS). Dynamic import can expose compare either at the root or under default
    const bcrypt = await import('bcryptjs');
    const compareFn = (bcrypt as any).compare || (bcrypt as any).default?.compare;
    if (typeof compareFn !== 'function') {
      throw new Error('bcryptjs compare function not available');
    }
    const isValid = await compareFn(password, student.password);
    if (!isValid) {
      return null;
    }
    
    return student;
  }

  // Exam operations
  async getExams(): Promise<Exam[]> {
    const result = await this.db.select().from(exams).orderBy(desc(exams.date));
    return result;
  }

  async getExam(id: number): Promise<Exam | undefined> {
    const result = await this.db.select().from(exams).where(eq(exams.id, id)).limit(1);
    return result[0];
  }

  async getExamsByStatus(status: string): Promise<Exam[]> {
    const result = await this.db.select().from(exams).where(eq(exams.status, status as any));
    return result;
  }

  async createExam(examData: any): Promise<Exam> {
    const result = await this.db.insert(exams).values(examData).returning();
    return result[0];
  }

  async updateExam(id: number, examData: Partial<any>): Promise<Exam | undefined> {
    const updateData = { ...examData, updatedAt: new Date() };
    const result = await this.db.update(exams).set(updateData).where(eq(exams.id, id)).returning();
    return result[0];
  }

  async deleteExam(id: number): Promise<boolean> {
    try {
      // First check if the exam exists
      const existingExam = await this.getExam(id);
      if (!existingExam) {
        return false;
      }
      
      // Delete the exam record from the database first
      await this.db.delete(exams).where(eq(exams.id, id));
      
      // Then delete the associated paper from Supabase storage
      // This can fail without affecting the main deletion
      try {
        await paperFileStorage.deletePaper(id);
      } catch (paperError) {
        console.log(`Paper deletion failed for exam ${id}, but exam was deleted successfully:`, paperError);
      }
      
      return true; // Exam was successfully deleted
    } catch (error) {
      console.error(`Error deleting exam ${id}:`, error);
      return false;
    }
  }

  // Result operations
  async getResults(): Promise<ResultWithDetails[]> {
    const result = await this.db
      .select()
      .from(results)
      .leftJoin(students, eq(results.studentId, students.id))
      .leftJoin(exams, eq(results.examId, exams.id))
      .orderBy(desc(results.submittedAt));

    return result.map(row => ({
      ...row.results,
      student: row.students!,
      exam: row.exams!
    }));
  }

  async getResult(id: number): Promise<ResultWithDetails | undefined> {
    const result = await this.db
      .select()
      .from(results)
      .leftJoin(students, eq(results.studentId, students.id))
      .leftJoin(exams, eq(results.examId, exams.id))
      .where(eq(results.id, id))
      .limit(1);

    if (result.length === 0) return undefined;

    const row = result[0];
    return {
      ...row.results,
      student: row.students!,
      exam: row.exams!
    };
  }

  async getResultsByStudentId(studentId: number): Promise<ResultWithDetails[]> {
    const result = await this.db
      .select()
      .from(results)
      .leftJoin(students, eq(results.studentId, students.id))
      .leftJoin(exams, eq(results.examId, exams.id))
      .where(eq(results.studentId, studentId))
      .orderBy(desc(results.submittedAt));

    return result.map(row => ({
      ...row.results,
      student: row.students!,
      exam: row.exams!
    }));
  }

  async getResultsByExamId(examId: number): Promise<ResultWithDetails[]> {
    const result = await this.db
      .select()
      .from(results)
      .leftJoin(students, eq(results.studentId, students.id))
      .leftJoin(exams, eq(results.examId, exams.id))
      .where(eq(results.examId, examId))
      .orderBy(desc(results.submittedAt));

    return result.map(row => ({
      ...row.results,
      student: row.students!,
      exam: row.exams!
    }));
  }

  async createResult(resultData: any): Promise<Result> {
    const result = await this.db.insert(results).values(resultData).returning();
    return result[0];
  }

  async updateResult(id: number, resultData: Partial<any>): Promise<Result | undefined> {
    const updateData = { ...resultData, updatedAt: new Date() };
    const result = await this.db.update(results).set(updateData).where(eq(results.id, id)).returning();
    return result[0];
  }

  async deleteResult(id: number): Promise<boolean> {
    const result = await this.db.delete(results).where(eq(results.id, id));
    return Array.isArray(result) ? result.length > 0 : false;
  }

  // Dashboard statistics
  async getStatistics(): Promise<{ 
    totalStudents: number; 
    activeExams: number; 
    completedExams: number; 
    upcomingExams: number;
  }> {
    const [studentCount] = await this.db.select().from(students);
    const allExams = await this.db.select().from(exams);

    return {
      totalStudents: await this.db.select().from(students).then(r => r.length),
      activeExams: allExams.filter(exam => exam.status === 'active').length,
      completedExams: allExams.filter(exam => exam.status === 'completed').length,
      upcomingExams: allExams.filter(exam => exam.status === 'upcoming').length
    };
  }
  
  // Student dashboard data
  async getStudentDashboardData(studentId: number): Promise<StudentDashboardData> {
    const student = await this.getStudent(studentId);
    if (!student) {
      throw new Error(`Student with ID ${studentId} not found`);
    }
    
    const allExams = await this.getExams();
    const studentResults = await this.getResultsByStudentId(studentId);
    
    // Get exam IDs that this student has already completed
    const completedExamIds = new Set(studentResults.map(result => result.examId));
    
    const availableExams = allExams
      .filter(exam => exam.status === 'upcoming' && !completedExamIds.has(exam.id))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const activeExams = allExams
      .filter(exam => exam.status === 'active' && !completedExamIds.has(exam.id))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Completed exams include both globally completed exams and exams this student has taken
    const completedExams = allExams
      .filter(exam => exam.status === 'completed' || completedExamIds.has(exam.id))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // Get total number of students in the system
    const allStudents = await this.getStudents();
    const totalStudentCount = allStudents.length;
    
    // Calculate overall class ranking based on average scores
    const allStudentAverages = await Promise.all(allStudents.map(async (s) => {
      const sResults = await this.getResultsByStudentId(s.id);
      const sAverage = sResults.length > 0
        ? sResults.reduce((sum, result) => sum + parseFloat(result.percentage), 0) / sResults.length
        : 0;
      return {
        studentId: s.id,
        average: sAverage,
        hasResults: sResults.length > 0
      };
    }));
    
    // Sort by average (descending), but prioritize students with results
    const sortedAverages = allStudentAverages.sort((a, b) => {
      // Students with results rank higher than those without
      if (a.hasResults && !b.hasResults) return -1;
      if (!a.hasResults && b.hasResults) return 1;
      // If both have or don't have results, sort by average
      return b.average - a.average;
    });
    
    // Find this student's overall rank in class
    const overallRank = sortedAverages.findIndex(s => s.studentId === studentId) + 1;
    
    console.log(`Student ${studentId} rank: ${overallRank} of ${totalStudentCount} students`);
    console.log('Student averages:', sortedAverages);
    
    // Calculate ranks for each result
    const examHistoryWithRanks = await Promise.all(studentResults.map(async (result) => {
      // Get all results for this exam to calculate rank
      const allExamResults = await this.getResultsByExamId(result.examId);
      
      // Sort by percentage (descending)
      const sortedResults = allExamResults.sort((a, b) => {
        const aPercentage = typeof a.percentage === 'string' ? parseFloat(a.percentage) : Number(a.percentage || 0);
        const bPercentage = typeof b.percentage === 'string' ? parseFloat(b.percentage) : Number(b.percentage || 0);
        return bPercentage - aPercentage;
      });
      
      // Find this student's rank among those who took the exam
      const studentRank = sortedResults.findIndex(r => r.studentId === studentId) + 1;
      
      return {
        ...result,
        rank: studentRank,
        totalParticipants: allExamResults.length // Use actual participants count
      };
    }));
    
    const averageScore = studentResults.length > 0
      ? studentResults.reduce((sum, result) => sum + parseFloat(result.percentage), 0) / studentResults.length
      : 0;
    
    // Calculate best rank from all exam results
    const bestRank = examHistoryWithRanks.length > 0
      ? Math.min(...examHistoryWithRanks.map(r => r.rank || Infinity))
      : 0;
    
    return {
      totalExams: studentResults.length,
      averageScore,
      bestRank,
      overallRank, // New field for overall class ranking
      totalStudents: totalStudentCount, // Include total students for display
      availableExams,
      activeExams,
      completedExams,
      examHistory: examHistoryWithRanks
    };
  }
}

// Export storage instance
export const storage = new SupabaseStorage();