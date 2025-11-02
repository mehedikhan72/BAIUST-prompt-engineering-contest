# Prompt Engineering Contest Platform

A comprehensive ICPC-style prompt engineering competition platform with three phases:
- **Phase 1**: Password Retrieval via RAG Agent
- **Phase 2**: Reverse Prompt Engineering (Image Generation)
- **Phase 3**: Build-Your-Own RAG System

## Architecture

### Services
1. **ai-agent-service** (Port 8000): FastAPI RAG agent for Phase 1
2. **api** (Port 3001): Hono + Mongoose backend for contest orchestration
3. **client** (Port 3000): Next.js frontend
4. **mongo** (Port 27017): MongoDB database

## Features

### Backend (Hono + Mongoose)
- JWT authentication (6-hour tokens)
- Role-based access control (JUDGE and TEAM)
- Phase 1 proxy to ai-agent-service with validation
- Phase 2 OpenAI image generation (gpt-image-1)
- Phase 3 file upload system
- Penalty calculation and leaderboard
- Level unlock progression system

### Frontend (Next.js + TailwindCSS)
- Responsive design with dark mode support
- Judge dashboard for managing phases, teams, and judging submissions
- Team dashboard with phase-specific interfaces
- ICPC-inspired real-time leaderboard
- React Query for efficient data fetching

## Setup

### Prerequisites
- Docker and Docker Compose
- Node.js 20+ (for local development)
- OpenAI API key
- Bunny Storage account (for file uploads)

### Quick Start

1. Clone the repository:
```bash
git clone <repository-url>
cd BAIUST-prompt-engineering-contest
```

2. Copy and configure environment variables:
```bash
cp .env.example .env
# Edit .env with your actual credentials
```

3. Start all services:
```bash
make dev
# or
docker-compose up --build
```

4. Access the application:
- Frontend: http://localhost:3000
- API: http://localhost:3001
- AI Agent Service: http://localhost:8000
- MongoDB: mongodb://localhost:27017

### Initial Setup

Create a judge account by running this in the MongoDB container:
```bash
docker exec -it mongo mongosh -u admin -p password --authenticationDatabase admin
use contest
db.users.insertOne({
  email: "judge@contest.com",
  password: "$2a$10$YourHashedPasswordHere", // Use bcrypt to hash
  role: "JUDGE",
  createdAt: new Date()
})
```

Or use the judge API to create teams.

## Development

### Backend API Development
```bash
cd api
npm install
npm run dev
```

### Frontend Development
```bash
cd client
npm install
npm run dev
```

### AI Agent Service Development
```bash
cd ai-agent-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user

### Judge Endpoints (requires JUDGE role)
- `GET /api/judge/phases` - List phases
- `PUT /api/judge/phases/:phaseNumber` - Update phase
- `GET /api/judge/levels` - List all levels
- `PUT /api/judge/levels/:phaseNumber/:levelNumber` - Update level
- `GET /api/judge/teams` - List teams
- `POST /api/judge/teams` - Create team
- `PUT /api/judge/teams/:teamId` - Update team
- `GET /api/judge/submissions/pending` - Get pending submissions
- `PUT /api/judge/submissions/:submissionId/judge` - Judge submission

### Team Endpoints (requires TEAM role)
- `GET /api/team/phases` - List phases with unlock status
- `GET /api/team/phases/:phaseNumber/levels` - List levels
- `POST /api/team/phase1/:levelNumber/prompt` - Send prompt to AI agent
- `POST /api/team/phase1/:levelNumber/guess` - Submit password guess
- `POST /api/team/phase2/:levelNumber/generate` - Generate image
- `POST /api/team/phase2/:levelNumber/submit` - Submit Phase 2
- `POST /api/team/phase3/submit` - Submit Phase 3
- `GET /api/team/progress` - Get team progress
- `GET /api/team/submissions` - Get team submissions

### Public Endpoints
- `GET /api/leaderboard` - Get leaderboard

## Contest Rules

### Penalty System
- **Phase 1**: Time-based penalty (minutes since contest start) + 10 minutes for wrong guesses
- **Phase 2**: Judge scores (0-10) reduce penalty as bonus
- **Phase 3**: Judge scores (0-10) reduce penalty as bonus
- Lower total penalty = Higher rank
- Tie-breaker: Earlier last submission time

### Phase Progression
- Phase 1 has 5 levels; must complete sequentially
- Phase 2 unlocks when Phase 1 Level 3 is completed
- Phase 3 unlocks when Phase 2 is completed
- Each level unlocks only after previous level completion

### Submission Rules
- Phase 1: Instant validation, unlimited attempts (with penalty)
- Phase 2/3: Queue-based judging, no resubmission unless judge allows

## Technology Stack

### Backend
- Hono (Fast web framework)
- Mongoose (MongoDB ODM)
- JWT for authentication
- OpenAI API for image generation
- Bunny Storage for file hosting

### Frontend
- Next.js 15 (App Router)
- TailwindCSS for styling
- React Query for data fetching
- Zustand for state management
- TypeScript for type safety

### Database
- MongoDB 7

## License

MIT

