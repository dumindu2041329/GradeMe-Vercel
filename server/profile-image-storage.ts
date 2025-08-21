import { createClient } from '@supabase/supabase-js';
import { getDb } from './db-connection.js';
import { users, students } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface ProfileImageUploadResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}

export class ProfileImageStorage {
  private bucketName = 'profile-images';
  private bucketInitialized = false;
  private db = getDb();

  constructor() {
    this.initializeBucket();
  }

  private async ensureBucketExists() {
    if (this.bucketInitialized) return;
    await this.initializeBucket();
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
        console.log(`Creating profile images storage bucket: ${this.bucketName}`);
        const { data, error } = await supabase.storage.createBucket(this.bucketName, {
          public: true, // Profile images should be publicly accessible
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
          fileSizeLimit: 5242880 // 5MB limit for profile images
        });
        
        if (error) {
          console.error('Error creating profile images bucket:', error);
        } else {
          console.log('Profile images bucket created successfully');
          this.bucketInitialized = true;
        }
      } else {
        console.log('Profile images bucket already exists');
        this.bucketInitialized = true;
      }
    } catch (error) {
      console.error('Error initializing profile images bucket:', error);
    }
  }

  async createBucketManually(): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage.createBucket(this.bucketName, {
        public: true,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        fileSizeLimit: 5242880 // 5MB
      });
      
      if (error) {
        console.error('Manual profile images bucket creation error:', error);
        return false;
      }
      
      this.bucketInitialized = true;
      console.log('Profile images bucket created manually successfully');
      return true;
    } catch (error) {
      console.error('Manual profile images bucket creation failed:', error);
      return false;
    }
  }

  private generateFileName(userId: number, userType: 'user' | 'student', originalName: string): string {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop() || 'jpg';
    return `${userType}_${userId}_${timestamp}.${extension}`;
  }

  async uploadUserProfileImage(
    userId: number, 
    file: Buffer, 
    fileName: string, 
    mimeType: string
  ): Promise<ProfileImageUploadResult> {
    try {
      await this.ensureBucketExists();

      // Generate unique filename
      const uniqueFileName = this.generateFileName(userId, 'user', fileName);

      // Delete existing profile image if it exists
      const existingUser = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (existingUser.length > 0 && existingUser[0].profileImage) {
        const existingFileName = existingUser[0].profileImage.split('/').pop();
        if (existingFileName) {
          await supabase.storage.from(this.bucketName).remove([existingFileName]);
        }
      }

      // Upload new image to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.bucketName)
        .upload(uniqueFileName, file, {
          contentType: mimeType,
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading user profile image:', uploadError);
        return { success: false, error: uploadError.message };
      }

      // Get public URL for the uploaded image
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(uniqueFileName);

      const imageUrl = urlData.publicUrl;

      // Update user record in database with new profile image URL
      await this.db
        .update(users)
        .set({ 
          profileImage: imageUrl,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      return { success: true, imageUrl };

    } catch (error) {
      console.error('Error in uploadUserProfileImage:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async uploadStudentProfileImage(
    studentId: number, 
    file: Buffer, 
    fileName: string, 
    mimeType: string
  ): Promise<ProfileImageUploadResult> {
    try {
      await this.ensureBucketExists();

      // Generate unique filename
      const uniqueFileName = this.generateFileName(studentId, 'student', fileName);

      // Delete existing profile image if it exists
      const existingStudent = await this.db.select().from(students).where(eq(students.id, studentId)).limit(1);
      if (existingStudent.length > 0 && existingStudent[0].profileImage) {
        const existingFileName = existingStudent[0].profileImage.split('/').pop();
        if (existingFileName) {
          await supabase.storage.from(this.bucketName).remove([existingFileName]);
        }
      }

      // Upload new image to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.bucketName)
        .upload(uniqueFileName, file, {
          contentType: mimeType,
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading student profile image:', uploadError);
        return { success: false, error: uploadError.message };
      }

      // Get public URL for the uploaded image
      const { data: urlData } = supabase.storage
        .from(this.bucketName)
        .getPublicUrl(uniqueFileName);

      const imageUrl = urlData.publicUrl;

      // Update student record in database with new profile image URL
      await this.db
        .update(students)
        .set({ 
          profileImage: imageUrl,
          updatedAt: new Date()
        })
        .where(eq(students.id, studentId));

      // Also update the corresponding user record to keep them synchronized
      // Find the user record that has this student_id
      await this.db
        .update(users)
        .set({ 
          profileImage: imageUrl,
          updatedAt: new Date()
        })
        .where(eq(users.studentId, studentId));

      return { success: true, imageUrl };

    } catch (error) {
      console.error('Error in uploadStudentProfileImage:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async deleteUserProfileImage(userId: number): Promise<boolean> {
    try {
      await this.ensureBucketExists();

      // Get current profile image URL
      const user = await this.db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (user.length === 0 || !user[0].profileImage) {
        return true; // No image to delete
      }

      // Extract filename from URL
      const fileName = user[0].profileImage.split('/').pop();
      if (fileName) {
        // Delete from storage
        await supabase.storage.from(this.bucketName).remove([fileName]);
      }

      // Update database to remove profile image URL
      await this.db
        .update(users)
        .set({ 
          profileImage: null,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));

      return true;
    } catch (error) {
      console.error('Error deleting user profile image:', error);
      return false;
    }
  }

  async deleteStudentProfileImage(studentId: number): Promise<boolean> {
    try {
      await this.ensureBucketExists();

      // Get current profile image URL
      const student = await this.db.select().from(students).where(eq(students.id, studentId)).limit(1);
      if (student.length === 0 || !student[0].profileImage) {
        return true; // No image to delete
      }

      // Extract filename from URL
      const fileName = student[0].profileImage.split('/').pop();
      if (fileName) {
        // Delete from storage
        await supabase.storage.from(this.bucketName).remove([fileName]);
      }

      // Update database to remove profile image URL
      await this.db
        .update(students)
        .set({ 
          profileImage: null,
          updatedAt: new Date()
        })
        .where(eq(students.id, studentId));

      // Also update the corresponding user record to keep them synchronized
      // Find the user record that has this student_id
      await this.db
        .update(users)
        .set({ 
          profileImage: null,
          updatedAt: new Date()
        })
        .where(eq(users.studentId, studentId));

      return true;
    } catch (error) {
      console.error('Error deleting student profile image:', error);
      return false;
    }
  }
}

export const profileImageStorage = new ProfileImageStorage();