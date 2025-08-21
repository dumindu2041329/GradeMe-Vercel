import { z } from "zod";
import { pgTable, serial, text, boolean, timestamp, integer, decimal, pgEnum } from "drizzle-orm/pg-core";

// Database enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'student']);
export const examStatusEnum = pgEnum('exam_status', ['upcoming', 'active', 'completed']);

// Database tables
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: userRoleEnum('role').notNull().default('student'),
  isAdmin: boolean('is_admin').notNull().default(false),
  profileImage: text('profile_image'),
  studentId: integer('student_id').references(() => students.id, { onDelete: 'set null' }),
  emailNotifications: boolean('email_notifications').notNull().default(false),
  emailExamResults: boolean('email_exam_results').notNull().default(false),
  emailUpcomingExams: boolean('email_upcoming_exams').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const students = pgTable('students', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  class: text('class').notNull(),
  enrollmentDate: timestamp('enrollment_date').notNull().defaultNow(),
  phone: text('phone'),
  address: text('address'),
  dateOfBirth: timestamp('date_of_birth'),
  guardianName: text('guardian_name'),
  guardianPhone: text('guardian_phone'),
  profileImage: text('profile_image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const exams = pgTable('exams', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  subject: text('subject').notNull(),
  date: timestamp('date').notNull(),
  startTime: timestamp('start_time'),
  duration: integer('duration').notNull(),
  totalMarks: integer('total_marks').notNull(),
  status: examStatusEnum('status').notNull().default('upcoming'),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const results = pgTable('results', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').notNull().references(() => students.id, { onDelete: 'cascade' }),
  examId: integer('exam_id').notNull().references(() => exams.id, { onDelete: 'cascade' }),
  score: decimal('score', { precision: 10, scale: 2 }).notNull(),
  percentage: decimal('percentage', { precision: 5, scale: 2 }).notNull(),
  submittedAt: timestamp('submitted_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: serial('id').primaryKey(),
  email: text('email').notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});





// Type definitions from tables
export type User = typeof users.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Exam = typeof exams.$inferSelect;
export type Result = typeof results.$inferSelect;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;

export type UserRole = 'admin' | 'student';
export type ExamStatus = 'upcoming' | 'active' | 'completed';

export type ResultWithDetails = Result & {
  student: Student;
  exam: Exam;
  rank?: number;
  totalParticipants?: number;
};

export type StudentDashboardData = {
  totalExams: number;
  averageScore: number;
  bestRank: number;
  overallRank: number;
  totalStudents: number;
  availableExams: Exam[];
  activeExams: Exam[];
  completedExams: Exam[];
  examHistory: ResultWithDetails[];
};

export type NotificationPreferences = {
  email: boolean;
  sms: boolean;
  emailExamResults?: boolean;
  emailUpcomingExams?: boolean;
  smsExamResults?: boolean;
  smsUpcomingExams?: boolean;
};

// Validation schemas for operations
export const insertUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["admin", "student"]).default("student"),
  isAdmin: z.boolean().default(false),
  profileImage: z.string().nullable().optional(),
  studentId: z.number().nullable().optional(),
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  emailExamResults: z.boolean().default(true),
  emailUpcomingExams: z.boolean().default(true),
  smsExamResults: z.boolean().default(false),
  smsUpcomingExams: z.boolean().default(false),
});

export const insertStudentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  class: z.string(),
  enrollmentDate: z.date().optional().default(() => new Date()),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  dateOfBirth: z.date().optional().nullable(),
  guardianName: z.string().optional().nullable(),
  guardianPhone: z.string().optional().nullable(),
  profileImage: z.string().optional().nullable()
});

export const insertExamSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  subject: z.string(),
  date: z.date(),
  startTime: z.date().optional().nullable(),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  totalMarks: z.number().min(1, "Total marks must be at least 1"),
  status: z.enum(["upcoming", "active", "completed"]).default("upcoming"),
  description: z.string().optional().nullable()
});

export const insertResultSchema = z.object({
  studentId: z.number(),
  examId: z.number(),
  score: z.number().min(0, "Score cannot be negative"),
  percentage: z.number().min(0, "Percentage cannot be negative").max(100, "Percentage cannot exceed 100"),
  submittedAt: z.date().default(() => new Date())
});





export const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Invalid email format").optional(),
  profileImage: z.string().nullable().optional(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  emailExamResults: z.boolean().optional(),
  emailUpcomingExams: z.boolean().optional(),
  smsExamResults: z.boolean().optional(),
  smsUpcomingExams: z.boolean().optional()
});

export const updateStudentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email format").optional(),
  class: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.date().optional().nullable(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  profileImage: z.string().nullable().optional()
});

export const loginUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export const studentLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(6, "Password must be at least 6 characters"),
  newPassword: z.string().min(6, "Password must be at least 6 characters")
});

export const notificationPreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  emailExamResults: z.boolean().optional(),
  emailUpcomingExams: z.boolean().optional(),
  smsExamResults: z.boolean().optional(),
  smsUpcomingExams: z.boolean().optional()
});

// Type aliases for inferred types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertExam = z.infer<typeof insertExamSchema>;
export type InsertResult = z.infer<typeof insertResultSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type StudentLogin = z.infer<typeof studentLoginSchema>;
export type UpdateStudent = z.infer<typeof updateStudentSchema>;
export type PasswordUpdate = z.infer<typeof passwordUpdateSchema>;
export type NotificationUpdate = z.infer<typeof notificationPreferencesSchema>;