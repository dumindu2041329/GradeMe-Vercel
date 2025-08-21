import { Express, Request, Response } from 'express';
import multer from 'multer';
import { profileImageStorage } from './profile-image-storage.js';

// Configure multer for file upload handling
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export function registerProfileRoutes(app: Express, requireAuth: any, requireAdmin: any, requireStudent: any) {
  // Upload profile image for admin/user
  app.post("/api/profile/upload-image", requireAuth, upload.single('profileImage'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const user = (req as any).session?.user;
      if (!user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const result = await profileImageStorage.uploadUserProfileImage(
        user.id,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      if (result.success) {
        // Update session data
        (req as any).session.user.profileImage = result.imageUrl;
        
        res.json({ 
          success: true, 
          imageUrl: result.imageUrl,
          message: 'Profile image uploaded successfully'
        });
      } else {
        res.status(500).json({ error: result.error || 'Failed to upload image' });
      }
    } catch (error) {
      console.error('Error uploading profile image:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Upload profile image for students
  app.post("/api/student/profile/upload-image", requireStudent, upload.single('profileImage'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const user = (req as any).session?.user;
      if (!user || !user.studentId) {
        return res.status(401).json({ error: 'Student not authenticated' });
      }

      const result = await profileImageStorage.uploadStudentProfileImage(
        user.studentId,
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );

      if (result.success) {
        // Update session data
        (req as any).session.user.profileImage = result.imageUrl;
        
        res.json({ 
          success: true, 
          imageUrl: result.imageUrl,
          message: 'Profile image uploaded successfully'
        });
      } else {
        res.status(500).json({ error: result.error || 'Failed to upload image' });
      }
    } catch (error) {
      console.error('Error uploading student profile image:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Delete profile image for admin/user
  app.delete("/api/profile/delete-image", requireAuth, async (req: Request, res: Response) => {
    try {
      const user = (req as any).session?.user;
      if (!user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const success = await profileImageStorage.deleteUserProfileImage(user.id);

      if (success) {
        // Update session data
        (req as any).session.user.profileImage = null;
        
        res.json({ 
          success: true,
          message: 'Profile image deleted successfully'
        });
      } else {
        res.status(500).json({ error: 'Failed to delete image' });
      }
    } catch (error) {
      console.error('Error deleting profile image:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Delete profile image for students
  app.delete("/api/student/profile/delete-image", requireStudent, async (req: Request, res: Response) => {
    try {
      const user = (req as any).session?.user;
      if (!user || !user.studentId) {
        return res.status(401).json({ error: 'Student not authenticated' });
      }

      const success = await profileImageStorage.deleteStudentProfileImage(user.studentId);

      if (success) {
        // Update session data
        (req as any).session.user.profileImage = null;
        
        res.json({ 
          success: true,
          message: 'Profile image deleted successfully'
        });
      } else {
        res.status(500).json({ error: 'Failed to delete image' });
      }
    } catch (error) {
      console.error('Error deleting student profile image:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
}