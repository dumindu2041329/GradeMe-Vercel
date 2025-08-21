# GradeMe - Exam Management System

## Overview
GradeMe is a comprehensive exam management system designed for educational institutions. It provides separate interfaces for administrators and students, enabling efficient exam creation and management, student performance tracking, and real-time updates. The system aims to modernize exam processes, enhance student engagement, and provide valuable analytics for academic insights.

## User Preferences
Preferred communication style: Simple, everyday language.
Recent Changes:
- Successfully migrated project from Replit Agent to Replit environment (August 4, 2025)
- Fixed autofill background color issues in login dialog email/password fields
- Updated forgot password form buttons to match dark glassmorphism theme
- Resolved package dependency issues with tsx installation
- Confirmed server running properly on port 5000 with database connectivity
- Implemented dark-themed glassmorphism toast notifications on landing page (August 2, 2025)
- Fixed all console errors and warnings including DialogContent accessibility and validateDOMNesting issues (August 2, 2025)
- Fixed exam header styling to remove top margin (changed sticky top-16 to top-0) for better UI experience (August 4, 2025)

## System Architecture
### Frontend
- **Framework**: React with TypeScript, using Vite for building.
- **UI/UX**: Shadcn/ui components, Radix UI primitives, Tailwind CSS with a glassmorphism design.
- **State Management**: TanStack Query for server state, React Context for authentication.
- **Routing**: Wouter for client-side navigation.
- **Visualization**: Three.js for 3D educational object displays.

### Backend
- **Runtime**: Node.js with TypeScript and Express.js.
- **Database ORM**: Drizzle with PostgreSQL.
- **Authentication**: Session-based authentication integrated with Supabase.
- **Real-time**: WebSocket server for live updates.
- **File Storage**: Supabase Storage for profile images and exam papers.

### Database Design
- **Primary Database**: PostgreSQL hosted on Supabase.
- **Schema Management**: Drizzle migrations.
- **Tables**: Users, students, exams, and results.
- **File Storage**: Supabase buckets for images and documents.

### Key Features
- **Authentication**: Role-based access control for admin and student users with secure session management.
- **Exam Management**: Creation of various question types (MCQ, written), real-time exam status tracking, and automated scoring. Exam papers are stored as JSON files.
- **Student Management**: Comprehensive student profile management, class enrollment, and academic performance analytics.
- **Results System**: Automated result calculation, performance analytics, ranking, and report export.
- **File Storage**: Secure handling of profile images and exam papers with validation and optimization.
- **Real-time Updates**: WebSocket connections for live exam status and result broadcasting.
- **Email Notifications**: Integration with an email service for result notifications and exam reminders for students, and exam submission notifications for admins.
- **Password Reset**: Secure forgot password functionality with email-based token verification.
- **Pagination**: Server-side pagination implemented for Students, Exams, and Results pages for performance.
- **Security**: Row Level Security (RLS) on database tables and removal of hardcoded credentials.

## External Dependencies
- **Supabase**: Authentication, PostgreSQL database hosting, file storage.
- **PostgreSQL**: Core relational database.
- **Node.js**: Server-side runtime.
- **React**: Frontend UI library.
- **TanStack Query**: Data fetching and caching.
- **Wouter**: Client-side routing.
- **Three.js**: 3D graphics rendering.
- **Express.js**: Backend web framework.
- **Drizzle**: ORM for PostgreSQL.
- **bcrypt**: Password hashing.
- **WebSockets**: Real-time communication.
- **Multer**: File upload handling.
- **Resend/SendGrid**: Email notification service.