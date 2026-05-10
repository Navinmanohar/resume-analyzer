from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from database import db
from resume_tools import resume_tools
from models import APIResponse


router = APIRouter(tags=["HRMS"])


# ── Request Models ──────────────────────────────────

class CreateJobRequest(BaseModel):
    title: str
    description: str
    skills_required: Optional[List[str]] = None
    experience_required: Optional[str] = ""


class ApplyJobRequest(BaseModel):
    resume_id: int
    job_id: int


# ── Health ──────────────────────────────────────────

@router.get("/hrms/health")
def hrms_health():
    return APIResponse(success=True, data={
        "resumes": db.total_resumes(),
        "jobs": db.total_jobs(),
        "status": "operational"
    })


# ── Jobs ────────────────────────────────────────────

@router.post("/jobs")
def create_job(payload: CreateJobRequest):
    try:
        result = resume_tools.create_job(
            title=payload.title,
            description=payload.description,
            skills_required=payload.skills_required,
            experience_required=payload.experience_required
        )
        return APIResponse(success=result["success"], data=result)
    except Exception as e:
        return APIResponse(success=False, error=str(e))


@router.get("/jobs")
def list_jobs():
    try:
        result = resume_tools.get_all_jobs()
        return APIResponse(success=True, data=result)
    except Exception as e:
        return APIResponse(success=False, error=str(e))


@router.get("/jobs/{job_id}")
def get_job(job_id: int):
    try:
        result = resume_tools.get_job(job_id)
        if not result["success"]:
            raise HTTPException(status_code=404, detail=result["message"])
        return APIResponse(success=True, data=result)
    except HTTPException:
        raise
    except Exception as e:
        return APIResponse(success=False, error=str(e))


@router.post("/jobs/{job_id}/close")
def close_job(job_id: int):
    try:
        result = resume_tools.close_job(job_id)
        return APIResponse(success=result["success"], data=result)
    except Exception as e:
        return APIResponse(success=False, error=str(e))


# ── Applications ────────────────────────────────────

@router.get("/applications")
def list_all_applications():
    try:
        result = resume_tools.get_all_applications()
        return APIResponse(success=True, data=result)
    except Exception as e:
        return APIResponse(success=False, error=str(e))


@router.post("/applications")
def apply_job(payload: ApplyJobRequest):
    try:
        result = resume_tools.apply_for_job(
            resume_id=payload.resume_id,
            job_id=payload.job_id
        )
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        return APIResponse(success=True, data=result)
    except HTTPException:
        raise
    except Exception as e:
        return APIResponse(success=False, error=str(e))


@router.get("/applications/{app_id}")
def get_application(app_id: int):
    try:
        result = resume_tools.get_application_status(app_id)
        if not result["success"]:
            raise HTTPException(status_code=404, detail=result["message"])
        return APIResponse(success=True, data=result)
    except HTTPException:
        raise
    except Exception as e:
        return APIResponse(success=False, error=str(e))


@router.get("/jobs/{job_id}/applications")
def get_job_applications(job_id: int):
    try:
        result = resume_tools.get_job_applications(job_id)
        if not result["success"]:
            raise HTTPException(status_code=404, detail=result["message"])
        return APIResponse(success=True, data=result)
    except HTTPException:
        raise
    except Exception as e:
        return APIResponse(success=False, error=str(e))


@router.get("/resumes/{resume_id}/applications")
def get_resume_applications(resume_id: int):
    try:
        result = resume_tools.get_applications_by_resume(resume_id)
        return APIResponse(success=True, data=result)
    except Exception as e:
        return APIResponse(success=False, error=str(e))


@router.delete("/applications/{app_id}")
def withdraw_application(app_id: int):
    try:
        result = resume_tools.withdraw_application(app_id)
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        return APIResponse(success=True, data=result)
    except HTTPException:
        raise
    except Exception as e:
        return APIResponse(success=False, error=str(e))


# ── Analysis & Shortlisting ────────────────────────

@router.get("/analyze/{resume_id}/{job_id}")
def analyze_resume_for_job(resume_id: int, job_id: int):
    try:
        result = resume_tools.analyze_resume_for_job(resume_id, job_id)
        if not result["success"]:
            raise HTTPException(status_code=404, detail=result["message"])
        return APIResponse(success=True, data=result)
    except HTTPException:
        raise
    except Exception as e:
        return APIResponse(success=False, error=str(e))


@router.get("/skill-gaps/{resume_id}/{job_id}")
def skill_gaps(resume_id: int, job_id: int):
    try:
        result = resume_tools.get_skill_gaps(resume_id, job_id)
        if not result["success"]:
            raise HTTPException(status_code=404, detail=result["message"])
        return APIResponse(success=True, data=result)
    except HTTPException:
        raise
    except Exception as e:
        return APIResponse(success=False, error=str(e))


@router.post("/jobs/{job_id}/shortlist")
def shortlist_job(job_id: int):
    try:
        result = resume_tools.shortlist_for_job(job_id)
        if not result["success"]:
            raise HTTPException(status_code=400, detail=result["message"])
        return APIResponse(success=True, data=result)
    except HTTPException:
        raise
    except Exception as e:
        return APIResponse(success=False, error=str(e))
