# HireFlow AI — Smart Hiring Platform

AI-powered hiring system with resume analysis, job matching, candidate shortlisting, and a conversational AI agent.

## Tech Stack

**Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS v4, Framer Motion, Zustand, React Query, Recharts  
**Backend:** FastAPI, PostgreSQL, SQLAlchemy, Cerebras AI (LLaMA 3.1)  
**Auth:** JWT-based with role-based access (HR / Employee)

## Features

### HR Portal
- Dashboard with hiring stats (open jobs, applications, hired, avg score)
- Create & manage job postings
- View applicants with AI match scores
- Auto-shortlisting (80+ strong, 60-79 medium, <60 rejected)
- Close jobs, withdraw applications
- Analytics with hiring funnel & score distribution charts

### Employee Portal
- Dashboard with application tracking & latest analysis
- Browse & search jobs
- Apply with resume, get AI match analysis
- Skill gap analysis (candidate vs required skills)
- Resume upload (PDF parsing)
- Withdraw applications

### AI Assistant (Chat Panel)
- Floating chat on all dashboards
- Role-aware: HR gets full access, Employee restricted
- Session management: create, close, reopen, history
- 24 tools: jobs, resumes, applications, analysis, shortlisting, interview questions
- Smart routing: tool calls vs conversational responses
- Off-topic boundary — refuses non-hiring questions
- Persistent chat history in PostgreSQL

### AI Scoring
- LLM-powered resume-job matching via Cerebras API
- Scores: skill_score, exp_score, overall_score (0-100)
- Generates feedback, skill gaps, strengths, verdict
- Robust JSON parsing with regex fallback

## Setup

### Backend
```bash
cd resume_analyzer
pip install -r requirements.txt
# Set CEREBRAS_API_KEY in .env
python main.py
```

### Frontend
```bash
cd resume_analyzer/frontend
npm install
npm run dev
```

### Environment
```env
# resume_analyzer/.env
CEREBRAS_API_KEY=your_key_here
CEREBRAS_BASE_URL=https://api.cerebras.ai/v1
CEREBRAS_MODEL=llama3.1-8b
DB_HOST=localhost
DB_PORT=5432
DB_NAME=resume_analyzer
DB_USER=postgres
DB_PASSWORD=your_password
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register user |
| POST | `/auth/login` | Login, returns JWT |
| POST | `/jobs` | Create job |
| GET | `/jobs` | List jobs |
| POST | `/applications` | Apply + auto-analyze |
| DELETE | `/applications/{id}` | Withdraw application |
| GET | `/analyze/{resume_id}/{job_id}` | Analyze match |
| POST | `/jobs/{id}/shortlist` | Auto-shortlist |
| POST | `/agent/chat` | AI chat message |
| POST | `/agent/sessions` | Create chat session |
| GET | `/agent/sessions/{user_id}` | List chat sessions |

## Project Structure

```
resume_analyzer/
├── frontend/              # Next.js application
│   └── src/
│       ├── api/           # API client
│       ├── app/           # Pages (hr/, employee/, analytics/)
│       ├── components/    # UI, layout, AI, charts
│       ├── store/         # Zustand stores
│       └── types/         # TypeScript interfaces
├── main.py                # FastAPI entry point
├── hr_routes.py           # Job & application routes
├── agent_routes.py        # AI chat session routes
├── hiring_agent.py        # AI agent with tool calling
├── resume_tools.py        # Business logic
├── analyzer.py            # Cerebras AI integration
├── database.py            # PostgreSQL CRUD
└── sql_models.py          # ORM models
```

