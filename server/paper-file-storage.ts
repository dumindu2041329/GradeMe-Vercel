import { createClient } from '@supabase/supabase-js';
import { getDb } from './db-connection.js';
import { exams } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface QuestionData {
  id: string;
  question: string;
  type: 'multiple_choice' | 'short_answer' | 'essay' | 'true_false';
  options?: string[];
  correctAnswer?: string;
  marks: number;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaperData {
  id: string;
  examId: number;
  title: string;
  instructions: string;
  totalQuestions: number;
  totalMarks: number;
  questions: QuestionData[];
  createdAt: string;
  updatedAt: string;
  metadata: {
    examName: string;
    lastUpdated: string;
    version: string;
  };
  examDetails?: {
    name: string;
    subject: string;
    date: string;
    duration: number;
    status: string;
    description: string | null;
  };
}

export class PaperFileStorage {
  private bucketName = 'exam-papers';
  private bucketInitialized = false;
  private db = getDb();
  private examNameCache = new Map<number, string>();
  private paperCache = new Map<number, { data: PaperData; timestamp: number }>();
  private cacheExpiry = 5000; // 5 seconds cache
  // Removed paper caching to ensure real-time updates from storage

  constructor() {
    // Initialize bucket asynchronously without blocking constructor
    this.initializeBucket().catch(console.error);
  }

  private async ensureBucketExists() {
    if (!this.bucketInitialized) {
      await this.initializeBucket();
    }
  }

  // Manual bucket creation for when automatic creation fails
  async createBucketManually(): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage.createBucket(this.bucketName, {
        public: false,
        allowedMimeTypes: ['application/json'],
        fileSizeLimit: 52428800 // 50MB
      });
      
      if (error) {
        console.error('Manual bucket creation error:', error);
        return false;
      }
      
      this.bucketInitialized = true;
      console.log('Paper bucket created manually successfully');
      return true;
    } catch (error) {
      console.error('Manual bucket creation failed:', error);
      return false;
    }
  }

  private async initializeBucket() {
    try {
      // Check if bucket exists, create if it doesn't
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
        return;
      }
      
      const bucketExists = buckets?.some(bucket => bucket.name === this.bucketName);
      
      if (!bucketExists) {
        console.log(`Creating storage bucket: ${this.bucketName}`);
        const { data, error } = await supabase.storage.createBucket(this.bucketName, {
          public: false,
          allowedMimeTypes: ['application/json'],
          fileSizeLimit: 52428800 // 50MB
        });
        
        if (error) {
          console.error('Error creating storage bucket:', error);
        } else {
          console.log('Storage bucket created successfully');
          this.bucketInitialized = true;
        }
      } else {
        console.log('Storage bucket already exists');
        this.bucketInitialized = true;
      }
    } catch (error) {
      console.error('Error initializing bucket:', error);
    }
  }

  private async getExamName(examId: number): Promise<string> {
    // Check cache first
    if (this.examNameCache.has(examId)) {
      return this.examNameCache.get(examId)!;
    }

    try {
      const exam = await this.db.select().from(exams).where(eq(exams.id, examId)).limit(1);
      const examName = exam[0]?.name || `Exam ${examId}`;
      
      // Cache the result
      this.examNameCache.set(examId, examName);
      
      // Clear cache after 5 minutes
      setTimeout(() => {
        this.examNameCache.delete(examId);
      }, 300000);
      
      return examName;
    } catch (error) {
      return `Exam ${examId}`;
    }
  }

  private async getFileName(examId: number): Promise<string> {
    const examName = await this.getExamName(examId);
    // Sanitize the exam name for file system
    const sanitizedName = examName.replace(/[^a-zA-Z0-9\-_\s]/g, '').replace(/\s+/g, '_');
    return `exam_${examId}_${sanitizedName}_paper.json`;
  }

  async getPaperByExamId(examId: number): Promise<PaperData | null> {
    // Always fetch fresh data from storage to ensure real-time updates
    // Remove caching to prevent stale data issues

    try {
      await this.ensureBucketExists();
      
      const fileName = await this.getFileName(examId);
      
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .download(fileName);
      
      if (error) {
        if (error.message.includes('Object not found') || 
            error.message.includes('Bad Request') ||
            (error as any).originalError?.status === 400) {
          return null; // Paper doesn't exist yet
        }
        return null;
      }
      
      const text = await data.text();
      const paperData: PaperData = JSON.parse(text);
      

      
      return paperData;
    } catch (error: any) {
      // Handle storage errors gracefully - file might not exist yet
      if (error?.message?.includes('not found') ||
          error?.message?.includes('Bad Request') ||
          error?.status === 400) {
        return null;
      }
      return null;
    }
  }

  async savePaper(examId: number, paperData: Omit<PaperData, 'id' | 'examId' | 'createdAt' | 'updatedAt' | 'metadata'>): Promise<PaperData | null> {
    try {
      await this.ensureBucketExists();
      
      const fileName = await this.getFileName(examId);
      const examName = await this.getExamName(examId);
      const now = new Date().toISOString();
      
      // Check if paper already exists
      const existingPaper = await this.getPaperByExamId(examId);
      
      // Calculate total marks from all questions
      const calculatedTotalMarks = paperData.questions.reduce((sum, q) => sum + q.marks, 0);
      
      const fullPaperData: PaperData = {
        id: existingPaper?.id || `paper_${examId}_${Date.now()}`,
        examId,
        ...paperData,
        totalQuestions: paperData.questions.length,
        totalMarks: calculatedTotalMarks, // Auto-calculate total marks
        createdAt: existingPaper?.createdAt || now,
        updatedAt: now,
        metadata: {
          examName,
          lastUpdated: now,
          version: '1.0'
        }
      };
      
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(fileName, JSON.stringify(fullPaperData, null, 2), {
          cacheControl: '3600',
          upsert: true,
          contentType: 'application/json'
        });
      
      if (error) {
        console.error('Error saving paper:', error);
        return null;
      }
      
      // Automatically sync total marks to exam table
      await this.syncExamTotalMarks(examId, calculatedTotalMarks);
      
      // Clear cache to ensure fresh data
      this.paperCache.delete(examId);
      
      return fullPaperData;
    } catch (error) {
      console.error('Error saving paper:', error);
      return null;
    }
  }

  private async syncExamTotalMarks(examId: number, totalMarks: number): Promise<void> {
    try {
      const result = await this.db
        .update(exams)
        .set({ totalMarks })
        .where(eq(exams.id, examId))
        .returning();
      
      if (result.length > 0) {
        console.log(`✓ Synced exam ${examId} total marks to ${totalMarks}`);
      }
    } catch (error) {
      console.error(`Error syncing exam ${examId} total marks:`, error);
    }
  }

  async updatePaperDetails(examId: number, updateData: Partial<Pick<PaperData, 'title' | 'instructions'>>): Promise<PaperData | null> {
    try {
      const existingPaper = await this.getPaperByExamId(examId);
      
      if (!existingPaper) {
        // Create new paper if it doesn't exist
        const examName = await this.getExamName(examId);
        const newPaper: Omit<PaperData, 'id' | 'examId' | 'createdAt' | 'updatedAt' | 'metadata'> = {
          title: updateData.title || '',
          instructions: updateData.instructions || '',
          totalQuestions: 0,
          totalMarks: 0,
          questions: []
        };
        return await this.savePaper(examId, newPaper);
      }
      
      const updatedPaper: Omit<PaperData, 'id' | 'examId' | 'createdAt' | 'updatedAt' | 'metadata'> = {
        ...existingPaper,
        ...updateData,
        totalQuestions: existingPaper.questions.length,
        totalMarks: existingPaper.questions.reduce((sum, q) => sum + q.marks, 0)
      };
      
      return await this.savePaper(examId, updatedPaper);
    } catch (error) {
      console.error('Error updating paper details:', error);
      return null;
    }
  }

  async addQuestion(examId: number, questionData: Omit<QuestionData, 'id' | 'createdAt' | 'updatedAt'>): Promise<QuestionData | null> {
    try {
      await this.ensureBucketExists();
      
      let existingPaper = await this.getPaperByExamId(examId);
      
      if (!existingPaper) {
        // Create a new paper for this exam
        const examName = await this.getExamName(examId);
        const newPaper = await this.savePaper(examId, {
          title: `${examName} Question Paper`,
          instructions: "Please read all questions carefully before answering.",
          totalQuestions: 0,
          totalMarks: 0,
          questions: []
        });
        
        if (!newPaper) {
          return null;
        }
        
        existingPaper = newPaper;
      }
      
      const now = new Date().toISOString();
      const newQuestion: QuestionData = {
        ...questionData,
        id: `question_${examId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now
      };
      
      const updatedQuestions = [...existingPaper.questions, newQuestion];
      
      // Directly save to storage without redundant calls
      const fileName = await this.getFileName(examId);
      const examName = await this.getExamName(examId);
      
      // Calculate total marks from all questions
      const calculatedTotalMarks = updatedQuestions.reduce((sum, q) => sum + q.marks, 0);
      
      const fullPaperData: PaperData = {
        id: existingPaper.id,
        examId,
        title: existingPaper.title,
        instructions: existingPaper.instructions,
        totalQuestions: updatedQuestions.length,
        totalMarks: calculatedTotalMarks, // Auto-calculate total marks
        questions: updatedQuestions,
        createdAt: existingPaper.createdAt,
        updatedAt: now,
        metadata: {
          examName,
          lastUpdated: now,
          version: '1.0'
        }
      };
      
      const { error } = await supabase.storage
        .from(this.bucketName)
        .upload(fileName, JSON.stringify(fullPaperData, null, 2), {
          upsert: true,
          contentType: 'application/json'
        });
      
      if (error) {
        console.error('Error saving paper:', error);
        return null;
      }
      
      // Automatically sync total marks to exam table
      await this.syncExamTotalMarks(examId, calculatedTotalMarks);
      
      // Clear cache to ensure fresh data
      this.paperCache.delete(examId);
      
      return newQuestion;
    } catch (error) {
      console.error('Error adding question:', error);
      return null;
    }
  }

  async updateQuestion(examId: number, questionId: string, updateData: Partial<Omit<QuestionData, 'id' | 'createdAt'>>): Promise<QuestionData | null> {
    try {
      const existingPaper = await this.getPaperByExamId(examId);
      
      if (!existingPaper) {
        console.error('Paper not found for exam ID:', examId);
        return null;
      }
      
      const questionIndex = existingPaper.questions.findIndex(q => q.id === questionId);
      if (questionIndex === -1) {
        console.error('Question not found:', questionId);
        return null;
      }
      
      const updatedQuestion: QuestionData = {
        ...existingPaper.questions[questionIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      const updatedQuestions = [...existingPaper.questions];
      updatedQuestions[questionIndex] = updatedQuestion;
      
      const updatedPaper: Omit<PaperData, 'id' | 'examId' | 'createdAt' | 'updatedAt' | 'metadata'> = {
        ...existingPaper,
        questions: updatedQuestions,
        totalQuestions: updatedQuestions.length,
        totalMarks: updatedQuestions.reduce((sum, q) => sum + q.marks, 0)
      };
      
      const savedPaper = await this.savePaper(examId, updatedPaper);
      
      // The savePaper method now handles automatic total marks sync
      return savedPaper ? updatedQuestion : null;
    } catch (error) {
      console.error('Error updating question:', error);
      return null;
    }
  }

  async deleteQuestion(examId: number, questionId: string): Promise<boolean> {
    try {
      const existingPaper = await this.getPaperByExamId(examId);
      
      if (!existingPaper) {
        console.error('Paper not found for exam ID:', examId);
        return false;
      }
      
      const updatedQuestions = existingPaper.questions.filter(q => q.id !== questionId);
      
      const updatedPaper: Omit<PaperData, 'id' | 'examId' | 'createdAt' | 'updatedAt' | 'metadata'> = {
        ...existingPaper,
        questions: updatedQuestions,
        totalQuestions: updatedQuestions.length,
        totalMarks: updatedQuestions.reduce((sum, q) => sum + q.marks, 0)
      };
      
      const savedPaper = await this.savePaper(examId, updatedPaper);
      
      // The savePaper method now handles automatic total marks sync
      return !!savedPaper;
    } catch (error) {
      console.error('Error deleting question:', error);
      return false;
    }
  }

  async renamePaperFile(examId: number, oldExamName: string): Promise<boolean> {
    try {
      await this.ensureBucketExists();
      
      // Clear the exam name cache to force refresh
      this.examNameCache.delete(examId);
      
      // Generate old and new file names
      const sanitizedOldName = oldExamName.replace(/[^a-zA-Z0-9\-_\s]/g, '').replace(/\s+/g, '_');
      const oldFileName = `exam_${examId}_${sanitizedOldName}_paper.json`;
      const newFileName = await this.getFileName(examId);
      
      // If the file names are the same, no need to rename
      if (oldFileName === newFileName) {
        console.log('Paper file names are identical, no rename needed');
        return true;
      }
      
      console.log(`Renaming paper file from ${oldFileName} to ${newFileName}`);
      
      // First, check if the old file exists
      const { data: oldFileData, error: downloadError } = await supabase.storage
        .from(this.bucketName)
        .download(oldFileName);
      
      if (downloadError) {
        if (downloadError.message.includes('Object not found')) {
          console.log('Old paper file not found, no rename needed');
          return true;
        }
        console.error('Error downloading old paper file:', downloadError);
        return false;
      }
      
      // Upload the file with the new name
      const { error: uploadError } = await supabase.storage
        .from(this.bucketName)
        .upload(newFileName, oldFileData, {
          contentType: 'application/json',
          upsert: true
        });
      
      if (uploadError) {
        console.error('Error uploading renamed paper file:', uploadError);
        return false;
      }
      
      // Delete the old file
      const { error: deleteError } = await supabase.storage
        .from(this.bucketName)
        .remove([oldFileName]);
      
      if (deleteError) {
        console.error('Error deleting old paper file:', deleteError);
        // Don't fail the operation if we can't delete the old file
      }
      
      console.log(`Successfully renamed paper file from ${oldFileName} to ${newFileName}`);
      return true;
    } catch (error) {
      console.error('Error renaming paper file:', error);
      return false;
    }
  }

  async deletePaper(examId: number): Promise<boolean> {
    try {
      await this.ensureBucketExists();
      
      const fileName = await this.getFileName(examId);
      
      // First check if the file exists before trying to delete it
      const { data: fileExists } = await supabase.storage
        .from(this.bucketName)
        .list('', { search: fileName });
      
      if (!fileExists || fileExists.length === 0) {
        console.log(`Paper file ${fileName} does not exist, considering deletion successful`);
        return true;
      }
      
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([fileName]);
      
      if (error) {
        console.error('Error deleting paper:', error);
        // Don't fail if the file doesn't exist
        if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
          console.log('Paper file was already deleted or does not exist');
          return true;
        }
        return false;
      }
      
      console.log(`Successfully deleted paper file: ${fileName}`);
      return true;
    } catch (error) {
      console.error('Error deleting paper:', error);
      // Consider it successful if it's just a file not found error
      return true;
    }
  }

  async getAllPapers(): Promise<PaperData[]> {
    try {
      await this.ensureBucketExists();
      
      const { data: files, error } = await supabase.storage
        .from(this.bucketName)
        .list();
      
      if (error) {
        console.error('Error listing papers:', error);
        return [];
      }
      
      const papers: PaperData[] = [];
      
      for (const file of files || []) {
        if (file.name.endsWith('_paper.json')) {
          const { data, error: downloadError } = await supabase.storage
            .from(this.bucketName)
            .download(file.name);
          
          if (!downloadError && data) {
            try {
              const text = await data.text();
              const paperData: PaperData = JSON.parse(text);
              papers.push(paperData);
            } catch (parseError) {
              console.error('Error parsing paper file:', file.name, parseError);
            }
          }
        }
      }
      
      return papers;
    } catch (error) {
      console.error('Error getting all papers:', error);
      return [];
    }
  }

  // Methods for handling questions (consolidated from QuestionFileStorage)
  async getQuestionsByExamId(examId: number): Promise<QuestionData[]> {
    try {
      const paper = await this.getPaperByExamId(examId);
      return paper?.questions || [];
    } catch (error) {
      console.error('Error getting questions by exam ID:', error);
      return [];
    }
  }

  async saveQuestions(examId: number, questions: QuestionData[]): Promise<boolean> {
    try {
      const existingPaper = await this.getPaperByExamId(examId);
      
      if (!existingPaper) {
        console.error('Paper not found for exam ID:', examId);
        return false;
      }
      
      const updatedPaper: Omit<PaperData, 'id' | 'examId' | 'createdAt' | 'updatedAt' | 'metadata'> = {
        ...existingPaper,
        questions,
        totalQuestions: questions.length,
        totalMarks: questions.reduce((sum, q) => sum + q.marks, 0)
      };
      
      const savedPaper = await this.savePaper(examId, updatedPaper);
      return !!savedPaper;
    } catch (error) {
      console.error('Error saving questions:', error);
      return false;
    }
  }

  async deleteAllQuestions(examId: number): Promise<boolean> {
    try {
      const existingPaper = await this.getPaperByExamId(examId);
      
      if (!existingPaper) {
        console.error('Paper not found for exam ID:', examId);
        return false;
      }
      
      const updatedPaper: Omit<PaperData, 'id' | 'examId' | 'createdAt' | 'updatedAt' | 'metadata'> = {
        ...existingPaper,
        questions: [],
        totalQuestions: 0,
        totalMarks: 0
      };
      
      const savedPaper = await this.savePaper(examId, updatedPaper);
      return !!savedPaper;
    } catch (error) {
      console.error('Error deleting all questions:', error);
      return false;
    }
  }

  async getAllQuestionsByExamId(examId: number): Promise<{ examId: number; questions: QuestionData[]; paperTitle?: string }[]> {
    try {
      const paper = await this.getPaperByExamId(examId);
      if (!paper) return [];
      
      return [{
        examId: paper.examId,
        questions: paper.questions,
        paperTitle: paper.title
      }];
    } catch (error) {
      console.error('Error getting all questions by exam ID:', error);
      return [];
    }
  }

  async deleteAllQuestionsForExam(examId: number): Promise<boolean> {
    return this.deleteAllQuestions(examId);
  }
}

export const paperFileStorage = new PaperFileStorage();