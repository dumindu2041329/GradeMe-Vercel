# GradeMe

A modern exam management platform for students and educators, featuring a polished UI, smooth scrolling landing page, real-time stats, and a Node.js/Express API deployed on Vercel.

<p align="center">
  <img src="generated-icon.png" alt="GradeMe Logo" width="96" />
  <br/>
  <a href="https://img.shields.io/badge/Node-18%2B-339933?logo=node.js&logoColor=white"><img src="https://img.shields.io/badge/Node-18%2B-339933?logo=node.js&logoColor=white" alt="Node 18+" /></a>
  <a href="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=222"><img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=222" alt="React 18" /></a>
  <a href="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white"><img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript 5" /></a>
  <a href="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white"><img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white" alt="Vite 5" /></a>
  <a href="https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white"><img src="https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white" alt="Express 4" /></a>
  <a href="https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel&logoColor=white"><img src="https://img.shields.io/badge/Deployed%20on-Vercel-000000?logo=vercel&logoColor=white" alt="Vercel" /></a>
  
</p>

## Table of Contents
- [Overview](#overview)
- [Screenshots](#screenshots)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Run in Development](#run-in-development)
  - [Build and Start](#build-and-start)
- [Deployment (Vercel)](#deployment-vercel)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

## Login credentials

### Admin Account
- email: admin@example.com
- password: admin123

### Student Account
- email: student@example.com
- password: student123

## Overview
GradeMe is an exam management system that enables administrators and educators to create exams, manage students, and view results. The frontend is built with React + Vite and Tailwind CSS, while the backend is an Express app deployed as a serverless function on Vercel. The landing page features a Three.js background and smooth inertial scrolling on desktop.

## Screenshots
<p align="center">
  <img src="docs/screenshots/landing-desktop.png" alt="Landing - Desktop" width="900" />
</p>
<p align="center">
  <img src="docs/screenshots/landing-features-desktop.png" alt="Features - Desktop" width="900" />
</p>
<p align="center">
  <img src="docs/screenshots/landing-mobile.png" alt="Landing - Mobile" width="390" />
</p>

## Features
- Student management, exam scheduling, and results tracking
- Authentication with modal dialogs on the landing page
- Real-time statistics section (via Supabase)
- Three.js hero visualization with subtle motion
- Desktop slow inertial scrolling to mirror mobile feel
- Responsive, accessible UI with Tailwind + Radix UI primitives
- Serverless API endpoint routing on Vercel

## Tech Stack
- Frontend: React 18, Vite, Tailwind CSS, Radix UI, Lucide Icons, TanStack Query
- 3D/Graphics: Three.js
- Routing: Wouter
- Backend: Node.js, Express 4
- Data/Infra: Supabase, Drizzle ORM, PostgreSQL
- Deployment: Vercel (Static + Serverless Functions)

## Project Structure
```
.
├─ api/                    # Serverless function entry for Vercel
│  └─ index.ts
├─ client/                 # React application
│  ├─ src/
│  │  ├─ pages/landing.tsx
│  │  ├─ components/
│  │  ├─ hooks/
│  │  ├─ assets/
│  │  └─ index.css
│  └─ public/
│     └─ favicon.svg
├─ server/                 # Express app (bundled for serverless or dev server)
│  ├─ app.ts
│  ├─ index.ts
│  └─ routes/
├─ shared/                 # Shared types/schemas
├─ migrations/             # SQL and migration metadata
├─ vercel.json             # Vercel build and routing config
├─ package.json            # Root scripts (vite build, server bundle, etc.)
└─ README.md
```

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database (or Supabase project)

### Installation
```bash
# Clone and install
npm install
```

### Environment Variables
Create a `.env` at the repository root:
```bash
# Required
DATABASE_URL=postgres://USER:PASSWORD@HOST:PORT/DB
SESSION_SECRET=replace-with-a-long-random-string
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional
PORT=5000
SENDGRID_API_KEY=your-sendgrid-key
SENDGRID_FROM_EMAIL=no-reply@yourdomain.com
FRONTEND_URL=http://localhost:5000
```

### Run in Development
```bash
npm run dev
```
- Starts the Express dev server and Vite dev environment (hot reload).
- App available at `http://localhost:5000` (or the printed port).

### Build and Start
```bash
# Build client and server (ESM server build for local start)
npm run build

# Start built server locally
npm start
```

## Deployment (Vercel)
- Build Command: `npm run build:all`
- Output Directory: `dist/public`
- Serverless Function: `api/index.ts` (bundles `server/app.ts` into `dist/app.cjs`)
- Environment Variables: ensure the same `.env` keys are set in your Vercel Project settings.

The provided `vercel.json` handles rewrites so that:
- `/api/*` → serverless function
- everything else → SPA `index.html`

## Architecture
```mermaid
flowchart LR
  A["React + Vite (Client)"] -- "fetch" --> B["Express API (Vercel Function)"]
  B -- "queries" --> C[("PostgreSQL / Supabase")]
  A -- "static assets" --> D["CDN / dist/public"]
```

## Contributing
1. Fork the repo and create a feature branch.
2. Make your changes with clear, small commits.
3. Run lint/build locally and ensure no type errors.
4. Open a PR with a concise description and screenshots/GIFs where appropriate.

## License
MIT