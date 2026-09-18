# Atheeg Test

## Project Overview
Atheeg Test is a production-ready online assessment platform for candidate registration, exam delivery, timed multi-level evaluations, and admin review. The system is designed for secure, browser-based testing with a clean candidate experience and a focused admin dashboard.

## Features
- Candidate sign-in and registration
- Test code-based exam entry
- Multiple timed question levels
- Exam scoring and result review
- Admin dashboard for tests, candidates, and attempts
- CSV import for quiz creation
- PDF result export support
- Responsive, mobile-friendly interface
- Controlled local demo storage workflow

## Technology Stack
- Frontend: React + Vite + TypeScript
- Styling: Tailwind CSS
- Backend: Express.js
- Database: Firebase-ready configuration (project preserved; runtime currently uses local storage for demo/offline operation)
- AI: Google Gemini SDK integration support through environment configuration
- Deployment targets: Vercel (frontend), Render (backend)

## Project Structure
- `src/` — React application source
- `src/components/` — UI views and flows
- `src/utils/` — local storage and app utilities
- `src/data/` — seeded exam content and defaults
- `public/` — static assets and HTML shell
- `server.js` — backend health and API entry point
- `vite.config.ts` — Vite configuration
- `.env.example` — environment variable template

## Local Development
1. Install dependencies:
   npm install
2. Copy the environment template:
   copy .env.example .env
3. Fill in the required values for your deployment environment.
4. Start the frontend dev server:
   npm run dev
5. Start the backend API:
   npm start
6. Build the production bundle:
   npm run build

## Environment Variables
Required for frontend and backend:

VITE_API_URL=
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
FRONTEND_URL=
PORT=5000
GEMINI_API_KEY=
GOOGLE_API_KEY=
APP_URL=
VITE_ADMIN_EMAIL=
VITE_ADMIN_PASSWORD=

## Frontend Deployment — Vercel
1. Import the repository in Vercel.
2. Set the root directory to the project root.
3. Set the build command:
   npm run build
4. Set the output directory:
   dist
5. Add environment variables from `.env.example`.
6. Deploy.

## Backend Deployment — Render
1. Create a new Web Service in Render.
2. Connect this repository.
3. Set the root directory to the project root.
4. Set the build command:
   npm install
5. Set the start command:
   npm start
6. Add the same environment variables used for the API.
7. Deploy.

## Firebase Configuration
This project includes Firebase Web SDK environment variables in `.env.example` and is prepared to preserve the existing Firebase project without exposing backend secrets. Do not add service-account JSON or private keys to the frontend or repository.

## API Configuration
The backend exposes:
- GET /api/health
- GET /api

The frontend should call the backend through `VITE_API_URL` rather than hardcoded localhost assignment.

## Troubleshooting
- If the frontend build fails, validate the dependency versions in `package.json` and rerun `npm install`.
- If the backend does not start, confirm `PORT` is defined and `npm start` is available.
- If API health checks fail, verify `VITE_API_URL` points to the deployed Render service URL.
- If Firebase settings are empty, add the values from the existing project configuration without exposing secret credentials.
