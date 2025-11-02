# Quick Start Guide

## 🚀 Getting Started

### 1. Environment Setup

Create a `.env` file from the example:
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:
- OpenAI API key for image generation
- Bunny Storage credentials for file uploads
- JWT secret for authentication

### 2. Start Services

```bash
make dev
```

This will start all services:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001  
- **AI Agent Service**: http://localhost:8000
- **MongoDB**: mongodb://localhost:27017

### 3. Seed Database

In a new terminal, seed the database with initial data:
```bash
make seed
```

This creates:
- **Judge account**: `judge@contest.com` / `judge123`
- **Sample team**: `team1@contest.com` / `team123`
- Contest structure with 3 phases and levels

### 4. Login

Visit http://localhost:3000 and login with:
- Judge: `judge@contest.com` / `judge123`
- Team: `team1@contest.com` / `team123`

## 📋 What's Implemented

### Backend API (`/api`)
✅ Hono + Mongoose setup
✅ JWT authentication (6-hour tokens)
✅ RBAC (JUDGE and TEAM roles)
✅ All database models
✅ Judge endpoints (phase/level/team management, judging)
✅ Team endpoints (phase access, submissions)
✅ Phase 1 proxy to ai-agent-service with validation
✅ Phase 2 OpenAI image generation (gpt-image-1 model)
✅ Phase 3 file upload with Bunny Storage
✅ Penalty calculation system
✅ Level unlock progression
✅ Leaderboard with ICPC-style scoring

### Frontend (`/client`)
✅ Next.js 15 with App Router
✅ TailwindCSS styling with dark mode
✅ React Query for data management
✅ Zustand for auth state
✅ Login page with role-based routing
✅ Judge dashboard:
  - Phase and level editor
  - Team management (create/update)
  - Submission judging interface
✅ Team dashboard:
  - Phase progress overview
  - Level unlock visualization
  - Real-time penalty display
✅ Phase 1 interface (chat with AI agent)
✅ Phase 2 interface (image generation and submission)
✅ Phase 3 interface (file upload and documentation)
✅ ICPC-inspired leaderboard with real-time updates

### Infrastructure
✅ Docker Compose setup with all services
✅ MongoDB for data persistence
✅ Network configuration for service communication
✅ Volume management
✅ Development hot-reload for all services

## 🎮 Using the Platform

### As a Judge

1. **Manage Phases & Levels**
   - Edit level details, descriptions
   - Set reference images and assets for Phase 2
   - Configure max scores

2. **Manage Teams**
   - Create new teams
   - Update team information
   - View all teams and their progress

3. **Judge Submissions**
   - View pending submissions from Phase 2 & 3
   - Review prompts, images, and files
   - Assign scores (0-10)
   - Allow/deny resubmissions

### As a Team

1. **Phase 1: Password Retrieval**
   - Chat with AI agent to retrieve passwords
   - Submit password guesses
   - Progress through 5 levels sequentially
   - Wrong guesses add 10 minutes penalty

2. **Phase 2: Reverse Prompt Engineering**
   - View reference image and required assets
   - Write prompts to recreate the image
   - Generate images using OpenAI
   - Submit for judging
   - Unlocks after completing Phase 1 Level 3

3. **Phase 3: Build-Your-Own RAG**
   - Submit code, documentation, and files
   - Provide API endpoint (optional)
   - Wait for judge evaluation
   - Unlocks after completing Phase 2

4. **Monitor Progress**
   - View unlocked/completed levels
   - Check current penalty score
   - Track submission status
   - Compare on leaderboard

## 🏆 Scoring System

- **Phase 1**: Time penalty (minutes since contest start) + 10 min per wrong guess
- **Phase 2**: Judge scores reduce penalty (bonus)
- **Phase 3**: Judge scores reduce penalty (bonus)
- **Ranking**: Lower penalty = Higher rank
- **Tie-breaker**: Earlier last submission time

## 🛠️ Development Commands

```bash
# Start all services
make dev

# Stop services
make stop

# Clean up (removes volumes)
make clean

# Seed database
make seed

# View logs
make logs        # All services
make api         # API only
make client      # Client only
```

## 🔧 Troubleshooting

### Services won't start
- Check Docker is running
- Ensure ports 3000, 3001, 8000, 27017 are available
- Run `make clean` then `make dev`

### Database connection issues
- Wait for MongoDB to fully initialize (~10 seconds)
- Check `.env` has correct `MONGODB_URI`

### Image generation not working
- Verify `OPENAI_API_KEY` in `.env`
- Check OpenAI account has credits
- Ensure you're using the correct model name (`gpt-image-1`)

### File uploads failing
- Configure Bunny Storage credentials in `.env`
- Verify storage zone exists
- Check CDN URL is correct

## 📚 Key Files

```
├── api/                      # Backend API
│   ├── src/
│   │   ├── index.ts         # Main app entry
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Auth & RBAC
│   │   └── scripts/seed.ts  # Database seeding
├── client/                   # Frontend
│   ├── src/
│   │   ├── app/            # Next.js pages
│   │   ├── components/     # React components
│   │   ├── lib/           # API client & utilities
│   │   └── store/         # State management
├── ai-agent-service/        # Phase 1 RAG agent
├── docker-compose.yml       # Service orchestration
└── .env                     # Environment variables
```

## 🎯 Next Steps

1. Customize level descriptions and challenges
2. Add reference images for Phase 2 levels
3. Configure contest start/end times
4. Create team accounts for participants
5. Test the full flow as both judge and team
6. Monitor the leaderboard during the contest

Enjoy your prompt engineering contest! 🚀

