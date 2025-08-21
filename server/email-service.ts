import sgMail from '@sendgrid/mail';
import { getDb } from './db-connection';
import { users, students, exams, results, passwordResetTokens } from './db';
import { eq, and, gt } from 'drizzle-orm';
import crypto from 'crypto';

// Initialize SendGrid
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface EmailData {
  to: string;
  from: string;
  subject: string;
  html: string;
  text?: string;
}

export class EmailService {
  private db = getDb();
  private fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@grademe.edu';

  constructor() {
    if (!SENDGRID_API_KEY) {
      console.warn('SendGrid API key not found. Email notifications will be disabled.');
    }
    if (!process.env.SENDGRID_FROM_EMAIL) {
      console.warn('SENDGRID_FROM_EMAIL not set. Using default: noreply@grademe.edu');
    }
  }

  private async sendEmail(emailData: EmailData): Promise<boolean> {
    if (!SENDGRID_API_KEY) {
      console.log('Email would be sent:', emailData.subject, 'to', emailData.to);
      return false;
    }

    try {
      await sgMail.send(emailData);
      console.log('Email sent successfully to:', emailData.to);
      return true;
    } catch (error: any) {
      console.error('Failed to send email:', error);
      if (error.response) {
        console.error('SendGrid error details:', JSON.stringify(error.response.body, null, 2));
      }
      return false;
    }
  }

  async sendExamResultNotification(studentId: number, examId: number, score: number, totalMarks: number): Promise<boolean> {
    try {
      // Get student and exam details
      const student = await this.db.select().from(students).where(eq(students.id, studentId)).limit(1);
      const exam = await this.db.select().from(exams).where(eq(exams.id, examId)).limit(1);
      
      if (!student[0] || !exam[0]) {
        console.error('Student or exam not found');
        return false;
      }

      // Check if student has email notifications enabled
      const user = await this.db.select().from(users).where(eq(users.studentId, studentId)).limit(1);
      if (user[0] && !user[0].emailExamResults) {
        console.log('Student has disabled exam result notifications');
        return false;
      }

      const percentage = Math.round((score / totalMarks) * 100);
      const grade = this.calculateGrade(percentage);

      const subject = `Exam Results: ${exam[0].name}`;
      const html = this.generateExamResultEmailHTML(student[0], exam[0], score, totalMarks, percentage, grade);
      const text = `Your exam results for ${exam[0].name} are now available. Score: ${score}/${totalMarks} (${percentage}%)`;

      return await this.sendEmail({
        to: student[0].email,
        from: this.fromEmail,
        subject,
        html,
        text
      });
    } catch (error) {
      console.error('Error sending exam result notification:', error);
      return false;
    }
  }

  async sendUpcomingExamNotification(studentId: number, examId: number): Promise<{ success: boolean; error?: string }> {
    try {
      const student = await this.db.select().from(students).where(eq(students.id, studentId)).limit(1);
      const exam = await this.db.select().from(exams).where(eq(exams.id, examId)).limit(1);
      
      if (!student[0] || !exam[0]) {
        console.error('Student or exam not found');
        return { success: false, error: 'Student or exam not found' };
      }

      // Check if student has email notifications enabled
      const user = await this.db.select().from(users).where(eq(users.studentId, studentId)).limit(1);
      if (user[0] && !user[0].emailUpcomingExams) {
        console.log('Student has disabled upcoming exam notifications');
        return { success: false, error: `${student[0].name} has disabled exam reminder notifications. They can enable them in their profile settings.` };
      }

      const subject = `Upcoming Exam Reminder: ${exam[0].name}`;
      const html = this.generateUpcomingExamEmailHTML(student[0], exam[0]);
      const text = `Reminder: You have an upcoming exam "${exam[0].name}" on ${exam[0].date}. Duration: ${exam[0].duration} minutes. Total Marks: ${exam[0].totalMarks}`;

      const emailSent = await this.sendEmail({
        to: student[0].email,
        from: this.fromEmail,
        subject,
        html,
        text
      });
      
      return { success: emailSent };
    } catch (error) {
      console.error('Error sending upcoming exam notification:', error);
      return { success: false, error: 'Failed to send notification due to a system error' };
    }
  }

  async sendBulkUpcomingExamNotifications(examId: number): Promise<{ sent: number; failed: number; errors: string[] }> {
    try {
      const exam = await this.db.select().from(exams).where(eq(exams.id, examId)).limit(1);
      if (!exam[0]) {
        throw new Error('Exam not found');
      }

      // Get all students with email notifications enabled
      const studentsWithNotifications = await this.db
        .select({
          student: students,
          user: users
        })
        .from(students)
        .leftJoin(users, eq(users.studentId, students.id))
        .where(
          and(
            eq(users.emailUpcomingExams, true),
            eq(users.emailNotifications, true)
          )
        );

      let sent = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const { student } of studentsWithNotifications) {
        const result = await this.sendUpcomingExamNotification(student.id, examId);
        if (result.success) {
          sent++;
        } else {
          failed++;
          if (result.error) {
            errors.push(result.error);
          }
        }
        
        // Add small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return { sent, failed, errors };
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      return { sent: 0, failed: 0, errors: ['System error occurred while sending notifications'] };
    }
  }

  async testEmailConnection(testEmail: string): Promise<boolean> {
    const testEmailData: EmailData = {
      to: testEmail,
      from: this.fromEmail,
      subject: 'GradeMe Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Email Test Successful!</h2>
          <p>This is a test email from your GradeMe exam management system.</p>
          <p>Your email notifications are working correctly.</p>
          <p style="color: #6b7280; font-size: 14px;">
            Sent on ${new Date().toLocaleString()}
          </p>
        </div>
      `,
      text: 'This is a test email from GradeMe. Email notifications are working correctly.'
    };

    return await this.sendEmail(testEmailData);
  }

  private calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A+';
    if (percentage >= 85) return 'A';
    if (percentage >= 80) return 'B+';
    if (percentage >= 75) return 'B';
    if (percentage >= 70) return 'C+';
    if (percentage >= 65) return 'C';
    if (percentage >= 60) return 'D';
    return 'F';
  }

  private generateExamResultEmailHTML(student: any, exam: any, score: number, totalMarks: number, percentage: number, grade: string): string {
    const gradeColor = percentage >= 75 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#ef4444';
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">GradeMe</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0;">Exam Management System</p>
          </div>
          
          <h2 style="color: #1f2937; margin-bottom: 20px;">Exam Results Available</h2>
          
          <p style="color: #374151; font-size: 16px;">Dear ${student.name},</p>
          
          <p style="color: #374151;">Your exam results for <strong>${exam.name}</strong> are now available.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0;">Result Summary</h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #6b7280;">Score:</span>
              <strong style="color: #1f2937;">${score} / ${totalMarks}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #6b7280;">Percentage:</span>
              <strong style="color: ${gradeColor};">${percentage}%</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #6b7280;">Grade:</span>
              <strong style="color: ${gradeColor}; font-size: 18px;">${grade}</strong>
            </div>
          </div>
          
          <div style="background: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
            <p style="color: #1e40af; margin: 0; font-size: 14px;">
              ${percentage >= 75 ? 'Congratulations on your excellent performance!' : 
                percentage >= 60 ? 'Good work! Keep up the effort for even better results.' : 
                'Don\'t be discouraged. Use this as motivation to improve in future exams.'
              }
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
            This email was sent automatically by the GradeMe system.<br>
            Exam Date: ${exam.date} | Duration: ${exam.duration} minutes
          </p>
        </div>
      </div>
    `;
  }

  private generateUpcomingExamEmailHTML(student: any, exam: any): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">GradeMe</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0;">Exam Management System</p>
          </div>
          
          <h2 style="color: #1f2937; margin-bottom: 20px;">📚 Upcoming Exam Reminder</h2>
          
          <p style="color: #374151; font-size: 16px;">Dear ${student.name},</p>
          
          <p style="color: #374151;">This is a reminder that you have an upcoming exam:</p>
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin: 0 0 15px 0;">${exam.name}</h3>
            <div style="color: #92400e;">
              <p style="margin: 5px 0;"><strong>Date:</strong> ${exam.date}</p>
              <p style="margin: 5px 0;"><strong>Duration:</strong> ${exam.duration} minutes</p>
              <p style="margin: 5px 0;"><strong>Total Marks:</strong> ${exam.totalMarks}</p>
              ${exam.startTime ? `<p style="margin: 5px 0;"><strong>Start Time:</strong> ${exam.startTime}</p>` : ''}
              ${exam.subject ? `<p style="margin: 5px 0;"><strong>Subject:</strong> ${exam.subject}</p>` : ''}
            </div>
          </div>
          
          <div style="background: #dbeafe; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
            <h4 style="color: #1e40af; margin: 0 0 10px 0;">Preparation Tips:</h4>
            <ul style="color: #1e40af; margin: 0; padding-left: 20px;">
              <li>Review your study materials</li>
              <li>Get a good night's sleep before the exam</li>
              <li>Log in to the system a few minutes early</li>
              <li>Ensure you have a stable internet connection</li>
            </ul>
          </div>
          
          <p style="color: #374151; margin-top: 20px;">Good luck with your exam!</p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
            This email was sent automatically by the GradeMe system.<br>
            If you don't want to receive these reminders, you can disable them in your profile settings.
          </p>
        </div>
      </div>
    `;
  }

  async generatePasswordResetToken(email: string): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      // Check if user exists (in both users and students tables)
      const userExists = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
      const studentExists = await this.db.select().from(students).where(eq(students.email, email)).limit(1);
      
      if (userExists.length === 0 && studentExists.length === 0) {
        return { success: false, error: 'Email address not found' };
      }

      // Generate secure token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

      // Store token in database
      await this.db.insert(passwordResetTokens).values({
        email,
        token,
        expiresAt,
        used: false
      });

      return { success: true, token };
    } catch (error) {
      console.error('Error generating password reset token:', error);
      return { success: false, error: 'Failed to generate reset token' };
    }
  }

  async sendPasswordResetEmail(email: string, token: string): Promise<boolean> {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5000'}/reset-password?token=${token}`;
    
    const emailData: EmailData = {
      to: email,
      from: this.fromEmail,
      subject: 'Password Reset Request - GradeMe',
      html: this.generatePasswordResetEmailHTML(resetUrl),
      text: `You requested a password reset. Please visit this link to reset your password: ${resetUrl}`
    };

    return await this.sendEmail(emailData);
  }

  async validatePasswordResetToken(token: string): Promise<{ valid: boolean; email?: string; error?: string }> {
    try {
      const tokenRecord = await this.db
        .select()
        .from(passwordResetTokens)
        .where(and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false),
          gt(passwordResetTokens.expiresAt, new Date())
        ))
        .limit(1);

      if (tokenRecord.length === 0) {
        return { valid: false, error: 'Invalid or expired token' };
      }

      return { valid: true, email: tokenRecord[0].email };
    } catch (error) {
      console.error('Error validating password reset token:', error);
      return { valid: false, error: 'Token validation failed' };
    }
  }

  async markTokenAsUsed(token: string): Promise<boolean> {
    try {
      await this.db
        .update(passwordResetTokens)
        .set({ used: true })
        .where(eq(passwordResetTokens.token, token));
      return true;
    } catch (error) {
      console.error('Error marking token as used:', error);
      return false;
    }
  }

  private generatePasswordResetEmailHTML(resetUrl: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">GradeMe</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0;">Exam Management System</p>
          </div>
          
          <h2 style="color: #1f2937; margin-bottom: 20px;">Password Reset Request</h2>
          
          <p style="color: #374151; font-size: 16px;">Hello,</p>
          
          <p style="color: #374151;">We received a request to reset your password for your GradeMe account. If you made this request, please click the button below to reset your password:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          
          <p style="color: #374151;">This link will expire in 1 hour for security reasons.</p>
          
          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-left: 4px solid #ef4444; margin: 20px 0;">
            <p style="color: #b91c1c; margin: 0; font-size: 14px;">
              <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px;">
            If the button doesn't work, you can copy and paste this link into your browser:<br>
            <a href="${resetUrl}" style="color: #2563eb; word-break: break-all;">${resetUrl}</a>
          </p>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
            This email was sent automatically by the GradeMe system.<br>
            If you continue to have issues, please contact your administrator.
          </p>
        </div>
      </div>
    `;
  }

  async sendAdminExamSubmissionNotification(studentId: number, examId: number, score: number, totalMarks: number): Promise<{ sent: number; failed: number }> {
    try {
      // Get student and exam details
      const student = await this.db.select().from(students).where(eq(students.id, studentId)).limit(1);
      const exam = await this.db.select().from(exams).where(eq(exams.id, examId)).limit(1);
      
      if (!student[0] || !exam[0]) {
        console.error('Student or exam not found for admin notification');
        return { sent: 0, failed: 0 };
      }

      // Get all admin users who have email notifications enabled
      const admins = await this.db
        .select()
        .from(users)
        .where(
          and(
            eq(users.role, 'admin'),
            eq(users.emailNotifications, true),
            eq(users.emailExamResults, true)
          )
        );

      if (admins.length === 0) {
        console.log('No admins with email notifications enabled');
        return { sent: 0, failed: 0 };
      }

      const percentage = Math.round((score / totalMarks) * 100);
      const grade = this.calculateGrade(percentage);
      const subject = `Student Exam Submission: ${student[0].name} - ${exam[0].name}`;
      const html = this.generateAdminExamSubmissionEmailHTML(student[0], exam[0], score, totalMarks, percentage, grade);
      const text = `${student[0].name} has submitted ${exam[0].name}. Score: ${score}/${totalMarks} (${percentage}%)`;

      let sent = 0;
      let failed = 0;

      // Send email to each admin
      for (const admin of admins) {
        try {
          const emailSent = await this.sendEmail({
            to: admin.email,
            from: this.fromEmail,
            subject,
            html,
            text
          });
          
          if (emailSent) {
            sent++;
          } else {
            failed++;
          }
        } catch (error) {
          console.error(`Failed to send notification to admin ${admin.email}:`, error);
          failed++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      return { sent, failed };
    } catch (error) {
      console.error('Error sending admin exam submission notifications:', error);
      return { sent: 0, failed: 0 };
    }
  }

  private generateAdminExamSubmissionEmailHTML(student: any, exam: any, score: number, totalMarks: number, percentage: number, grade: string): string {
    const gradeColor = percentage >= 75 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#ef4444';
    
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">GradeMe</h1>
            <p style="color: #6b7280; margin: 5px 0 0 0;">Exam Management System</p>
          </div>
          
          <h2 style="color: #1f2937; margin-bottom: 20px;">📋 Student Exam Submission</h2>
          
          <p style="color: #374151; font-size: 16px;">Dear Administrator,</p>
          
          <p style="color: #374151;">A student has just submitted an exam. Here are the details:</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0;">Student Information</h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #6b7280;">Name:</span>
              <strong style="color: #1f2937;">${student.name}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #6b7280;">Email:</span>
              <strong style="color: #1f2937;">${student.email}</strong>
            </div>
            ${student.classGrade ? `
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #6b7280;">Grade:</span>
              <strong style="color: #1f2937;">${student.classGrade}</strong>
            </div>
            ` : ''}
          </div>

          <div style="background: #e0e7ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #312e81; margin: 0 0 15px 0;">Exam Details</h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #4c1d95;">Exam Name:</span>
              <strong style="color: #312e81;">${exam.name}</strong>
            </div>
            ${exam.subject ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #4c1d95;">Subject:</span>
              <strong style="color: #312e81;">${exam.subject}</strong>
            </div>
            ` : ''}
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #4c1d95;">Submitted At:</span>
              <strong style="color: #312e81;">${new Date().toLocaleString()}</strong>
            </div>
          </div>

          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #1f2937; margin: 0 0 15px 0;">Result Summary</h3>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #6b7280;">Score:</span>
              <strong style="color: #1f2937;">${score} / ${totalMarks}</strong>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #6b7280;">Percentage:</span>
              <strong style="color: ${gradeColor};">${percentage}%</strong>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #6b7280;">Grade:</span>
              <strong style="color: ${gradeColor}; font-size: 18px;">${grade}</strong>
            </div>
          </div>
          
          <div style="background: #eff6ff; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
            <p style="color: #1e40af; margin: 0; font-size: 14px;">
              You can view detailed results and analytics in the admin dashboard.
            </p>
          </div>
          
          <p style="color: #6b7280; font-size: 14px; margin-top: 30px; text-align: center;">
            This email was sent automatically by the GradeMe system.
          </p>
        </div>
      </div>
    `;
  }
}

export const emailService = new EmailService();