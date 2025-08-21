# GradeMe
Exam Management System

## Overview
GradeMe is an exam management system that helps educators track students, exams, and results. The application features a modern React frontend with a Node.js/Express backend, designed to run in Replit's environment.

## Features
- Student management
- Exam scheduling and tracking
- Results recording and analysis
- Dashboard with statistics
- User authentication
- Educational 3D objects in Three.js visualization
- Glassmorphism UI design for a modern look

## Login credentials

### Admin Account
- **Email:** admin@example.com
- **Password:** admin123
- **Role:** Administrator
- **Access:** Full system access including student management, exam creation, and results tracking

### Student Account
1. **John Doe**
   - Email: student@example.com
   - Password: student123
   - Class: 12th Grade
   - Phone: 123-456-7890
   - Guardian: Jane Doe (123-456-7891)
   - Date of Birth: January 15, 2005

## Project structure
- `client/` - Frontend React application
- `server/` - Backend Express server
- `shared/` - Shared types and schemas used by both frontend and backend

## UI Features
- Modern glassmorphism design with frosted glass effect
- Educational-themed Three.js visualization with objects like books, pens, and rulers
- Responsive design that works on both desktop and mobile devices

## Deploying to Vercel

1. Set these environment variables in your Vercel Project:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - Optional: `SENDGRID_API_KEY`, `SENDGRID_FROM_EMAIL`, `FRONTEND_URL`
2. Build settings:
   - Build Command: `npm run vercel-build`
   - Output Directory: `dist/public`
3. Push to your repo and import into Vercel. The included `vercel.json` rewrites `/api/*` to the Express serverless function and serves the SPA otherwise.