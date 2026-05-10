from pydantic import BaseModel
from typing import Optional, List


class JobDescription(BaseModel):
    resume_id: int
    job_title: str
    job_description: str


class APIResponse(BaseModel):
    success: bool
    data: Optional[dict] = None
    error: Optional[str] = None


class AgentRequest(BaseModel):
    message: str
    session_id: str = "default"
    role: str = "hr"
