import { Request, Response, Express } from 'express';
import { paperFileStorage } from './paper-file-storage.js';
import { storage } from './storage.js';

// Note: Automatic total marks synchronization removed - admin controls manually

export function registerQuestionRoutes(app: Express, requireAdmin: any, broadcastUpdate?: (type: string, data: any) => void) {
  // Get questions for a specific paper - using file storage
  app.get("/api/questions/:paperId", requireAdmin, async (req: Request, res: Response) => {
    try {
      const paperId = req.params.paperId;
      console.log('Fetching questions for paperId:', paperId);
      
      // Extract examId from paper ID if it's a string like "paper_5_new"
      let examId: number;
      
      if (paperId.startsWith('paper_')) {
        const match = paperId.match(/paper_(\d+)_/);
        examId = match ? parseInt(match[1]) : parseInt(paperId);
      } else {
        examId = parseInt(paperId);
      }
      
      console.log('Extracted examId:', examId);
      
      // For file storage, we need examId instead of paperId
      // We'll get the paper data which contains questions
      const paper = await paperFileStorage.getPaperByExamId(examId);
      
      console.log('Retrieved paper:', paper ? {
        id: paper.id,
        examId: paper.examId,
        title: paper.title,
        questionsCount: paper.questions.length
      } : 'null');
      
      // Map storage question format to frontend expected format
      const questions = paper ? paper.questions.map(q => ({
        id: q.id,
        paperId: paperId, // Use the paperId from request
        type: q.type === 'multiple_choice' ? 'mcq' : 'written',
        questionText: q.question,
        marks: q.marks,
        orderIndex: q.orderIndex,
        optionA: q.options?.[0] || null,
        optionB: q.options?.[1] || null,
        optionC: q.options?.[2] || null,
        optionD: q.options?.[3] || null,
        correctAnswer: q.correctAnswer || null,
        expectedAnswer: null,
        answerGuidelines: null,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt
      })) : [];
      
      console.log('Returning questions count:', questions.length);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  // Create a new question - using file storage
  app.post("/api/questions", requireAdmin, async (req: Request, res: Response) => {
    try {
      let examId: number;
      
      // Handle both examId and paperId
      if (req.body.examId) {
        examId = parseInt(req.body.examId);
      } else if (req.body.paperId) {
        // Extract examId from paperId if it's in format "paper_5_new" or similar
        const paperId = req.body.paperId;
        if (typeof paperId === 'string' && paperId.startsWith('paper_')) {
          const match = paperId.match(/paper_(\d+)_/);
          examId = match ? parseInt(match[1]) : parseInt(paperId);
        } else {
          examId = parseInt(paperId);
        }
      } else {
        return res.status(400).json({ message: "examId or paperId is required" });
      }
      
      if (!examId || isNaN(examId)) {
        return res.status(400).json({ message: "Valid examId is required" });
      }

      // Map frontend question types to backend types
      const typeMapping: { [key: string]: string } = {
        'mcq': 'multiple_choice',
        'written': 'short_answer',
        'essay': 'essay',
        'true_false': 'true_false',
        'multiple_choice': 'multiple_choice',
        'short_answer': 'short_answer'
      };

      const questionType = typeMapping[req.body.type] || req.body.type;

      const questionData = {
        type: questionType,
        question: req.body.questionText || req.body.question,
        marks: parseInt(req.body.marks),
        orderIndex: parseInt(req.body.orderIndex) || 0,
        options: (questionType === 'multiple_choice') ? (
          // Handle both array format (new) and individual fields format (legacy)
          req.body.options ? req.body.options.filter((opt: string) => opt && opt.trim() !== "") : 
          [req.body.optionA, req.body.optionB, req.body.optionC, req.body.optionD].filter(Boolean)
        ) : undefined,
        correctAnswer: req.body.correctAnswer || req.body.expectedAnswer || null
      };

      console.log('Creating question with data:', questionData);
      
      const question = await paperFileStorage.addQuestion(examId, questionData);
      
      if (!question) {
        return res.status(400).json({ message: "Failed to create question" });
      }
      
      // Note: No automatic total marks sync - admin controls manually
      
      // Broadcast question creation to connected clients
      if (broadcastUpdate) {
        broadcastUpdate('questions_updated', { examId, paperId: req.body.paperId, action: 'created', question });
      }
      
      res.status(201).json(question);
    } catch (error) {
      console.error("Error creating question:", error);
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  // Update a question - using file storage
  app.put("/api/questions/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const questionId = req.params.id;
      let examId: number;
      
      // Handle both examId and paperId, or extract from query
      if (req.body.examId) {
        examId = parseInt(req.body.examId);
      } else if (req.body.paperId) {
        const paperId = req.body.paperId;
        if (typeof paperId === 'string' && paperId.startsWith('paper_')) {
          const match = paperId.match(/paper_(\d+)_/);
          examId = match ? parseInt(match[1]) : parseInt(paperId);
        } else {
          examId = parseInt(paperId);
        }
      } else if (req.query.examId) {
        examId = parseInt(req.query.examId as string);
      } else {
        return res.status(400).json({ message: "examId or paperId is required" });
      }
      
      if (!examId || isNaN(examId)) {
        return res.status(400).json({ message: "Valid examId is required" });
      }
      
      const updateData: any = {};
      if (req.body.questionText || req.body.question) {
        updateData.question = req.body.questionText || req.body.question;
      }
      if (req.body.type) {
        updateData.type = req.body.type;
      }
      if (req.body.type === 'multiple_choice' && (req.body.options || req.body.optionA || req.body.optionB || req.body.optionC || req.body.optionD)) {
        updateData.options = req.body.options ? 
          req.body.options.filter((opt: string) => opt && opt.trim() !== "") :
          [req.body.optionA, req.body.optionB, req.body.optionC, req.body.optionD].filter(Boolean);
      }
      if (req.body.correctAnswer !== undefined || req.body.expectedAnswer !== undefined) {
        updateData.correctAnswer = req.body.correctAnswer || req.body.expectedAnswer;
      }
      if (req.body.marks) updateData.marks = parseInt(req.body.marks);
      if (req.body.orderIndex !== undefined) updateData.orderIndex = parseInt(req.body.orderIndex);
      
      const question = await paperFileStorage.updateQuestion(examId, questionId, updateData);
      
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      // Note: No automatic total marks sync - admin controls manually
      
      // Broadcast question update to connected clients
      if (broadcastUpdate) {
        broadcastUpdate('questions_updated', { examId, paperId: req.body.paperId, action: 'updated', question });
      }
      
      res.json(question);
    } catch (error) {
      console.error("Error updating question:", error);
      res.status(500).json({ message: "Failed to update question" });
    }
  });

  // Delete a question - using file storage
  app.delete("/api/questions/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const questionId = req.params.id;
      let examId: number;
      
      // Handle examId from query params or body
      if (req.query.examId) {
        examId = parseInt(req.query.examId as string);
      } else if (req.body.examId) {
        examId = parseInt(req.body.examId);
      } else if (req.query.paperId) {
        const paperId = req.query.paperId as string;
        if (paperId.startsWith('paper_')) {
          const match = paperId.match(/paper_(\d+)_/);
          examId = match ? parseInt(match[1]) : parseInt(paperId);
        } else {
          examId = parseInt(paperId);
        }
      } else {
        return res.status(400).json({ message: "examId is required as query parameter" });
      }
      
      if (!examId || isNaN(examId)) {
        return res.status(400).json({ message: "Valid examId is required" });
      }
      
      const success = await paperFileStorage.deleteQuestion(examId, questionId);
      
      if (!success) {
        return res.status(404).json({ message: "Question not found" });
      }
      
      // Note: No automatic total marks sync - admin controls manually
      
      // Broadcast question deletion to connected clients
      if (broadcastUpdate) {
        broadcastUpdate('questions_updated', { examId, questionId, action: 'deleted' });
      }
      
      res.json({ message: "Question deleted successfully" });
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

}