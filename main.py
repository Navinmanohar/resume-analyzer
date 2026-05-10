# main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import uvicorn
import os

# Routers
from agent_routes import router as agent_router
from resume_routes import router as resume_router
from hr_routes import router as hr_router
from auth_routes import router as auth_router

# ━━━━━━━━━━━━━━━━━━━━━━━━
# APP SETUP
# ━━━━━━━━━━━━━━━━━━━━━━━━

api = FastAPI(

    title="Resume Analyzer AI",

    description="AI + Agentic Resume Analyzer System",

    version="1.0.0"
)

# ━━━━━━━━━━━━━━━━━━━━━━━━
# CORS
# ━━━━━━━━━━━━━━━━━━━━━━━━

api.add_middleware(

    CORSMiddleware,

    allow_origins=["*"],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)

# ━━━━━━━━━━━━━━━━━━━━━━━━
# UPLOAD FOLDER
# ━━━━━━━━━━━━━━━━━━━━━━━━

os.makedirs("uploads", exist_ok=True)

# ━━━━━━━━━━━━━━━━━━━━━━━━
# ROOT ROUTE
# ━━━━━━━━━━━━━━━━━━━━━━━━

@api.get("/")
def root():

    return {

        "app": "Resume Analyzer AI",

        "status": "running",

        "docs": "/docs",

        "features": [

            "Resume Upload",

            "Resume Analysis",

            "Job Matching",

            "AI Hiring Agent",

            "Interview Question Generator",

            "Candidate Comparison",

            "Job Management",

            "Application Tracking",

            "Auto Scoring & Shortlisting",

            "Skill Gap Analysis",

            "Role-Specific Interview Generator"
        ]
    }

# ━━━━━━━━━━━━━━━━━━━━━━━━
# ROUTERS
# ━━━━━━━━━━━━━━━━━━━━━━━━

api.include_router(resume_router)
api.include_router(agent_router)
api.include_router(hr_router)
api.include_router(auth_router)

app = api  # alias for Render (uses main:app)

# ━━━━━━━━━━━━━━━━━━━━━━━━
# RUN SERVER
# ━━━━━━━━━━━━━━━━━━━━━━━━

if __name__ == "__main__":

    uvicorn.run(

        "main:api",

        host="0.0.0.0",

        port=8000,

        reload=True
    )