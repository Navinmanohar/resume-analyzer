# routes/resume_routes.py

from fastapi import (
    APIRouter,
    UploadFile,
    File,
    HTTPException
)

import shutil
import json

from analyzer import analyzer
from database import db, safe_json_loads

from models import (
    JobDescription,
    APIResponse
)

router = APIRouter(
    tags=["Resume"]
)

# ━━━━━━━━━━━━━━━━━━━━━━━━
# UPLOAD RESUME
# ━━━━━━━━━━━━━━━━━━━━━━━━
@router.post("/upload-resume")
async def upload_resume(
    file: UploadFile = File(...)
):

    try:
        print(file)
        # VALIDATE PDF
        if not file.filename.endswith(".pdf"):

            raise HTTPException(
                status_code=400,
                detail="Sirf PDF files allowed hain"
            )

        # SAVE FILE
        filepath = f"uploads/{file.filename}"

        with open(filepath, "wb") as f:

            shutil.copyfileobj(
                file.file,
                f
            )

        # EXTRACT TEXT
        print(
            f"📄 Extracting text from {file.filename}"
        )

        text = analyzer.extract_text(filepath)

        if not text:

            raise HTTPException(
                status_code=400,
                detail="PDF se text extract nahi hua"
            )

        # ANALYZE
        print("🤖 Analyzing resume...")

        analysis = analyzer.analyze_resume(text)

        # EXTRACT NAME + EMAIL
        contact = analyzer.extract_contact(text)

        # SAVE DB
        resume_id = db.save_resume(

            filename=file.filename,

            raw_text=text,

            candidate_name=contact.get("name"),
            candidate_email=contact.get("email"),

            skills=json.dumps(
                analysis.get("skills", [])
            ),

            experience=json.dumps(
                analysis.get("experience", [])
            ),

            education=json.dumps(
                analysis.get("education", [])
            )
        )

        return APIResponse(

            success=True,

            data={

                "resume_id": resume_id,

                "filename": file.filename,

                "candidate_name": contact.get("name"),
                "candidate_email": contact.get("email"),

                "analysis": analysis,

                "message":
                "✅ Resume analyzed successfully"
            }
        )

    except Exception as e:

        return APIResponse(

            success=False,

            error=str(e)
        )


# ━━━━━━━━━━━━━━━━━━━━━━━━
# MATCH JOB
# ━━━━━━━━━━━━━━━━━━━━━━━━
@router.post("/match-job")
def match_job(
    request: JobDescription
):

    try:

        # GET RESUME
        resume = db.get_resume(
            request.resume_id
        )

        if not resume:

            raise HTTPException(
                status_code=404,
                detail="Resume not found"
            )

        # MATCH
        print(
            f"🔍 Matching with {request.job_title}"
        )

        result = analyzer.match_job(

            resume_text=resume["raw_text"],

            job_title=request.job_title,

            job_desc=request.job_description
        )

        # SAVE MATCH
        db.save_job_match(

            resume_id=request.resume_id,

            job_title=request.job_title,

            score=result.get(
                "match_score",
                0
            ),

            feedback=result.get(
                "feedback",
                ""
            )
        )

        return APIResponse(

            success=True,

            data={

                "resume_id":
                request.resume_id,

                "job_title":
                request.job_title,

                "result":
                result
            }
        )

    except Exception as e:

        return APIResponse(

            success=False,

            error=str(e)
        )


# ━━━━━━━━━━━━━━━━━━━━━━━━
# GET RESUME
# ━━━━━━━━━━━━━━━━━━━━━━━━
@router.get("/resume/{resume_id}")
def get_resume(
    resume_id: int
):

    try:

        resume = db.get_resume(
            resume_id
        )

        if not resume:

            raise HTTPException(
                status_code=404,
                detail="Resume not found"
            )

        resume["skills"] = safe_json_loads(resume.get("skills"))
        resume["experience"] = safe_json_loads(resume.get("experience"))
        resume["education"] = safe_json_loads(resume.get("education"))

        return APIResponse(

            success=True,

            data=resume
        )

    except Exception as e:

        return APIResponse(

            success=False,

            error=str(e)
        )


# ━━━━━━━━━━━━━━━━━━━━━━━━
# GET MATCHES
# ━━━━━━━━━━━━━━━━━━━━━━━━
@router.get("/resume/{resume_id}/matches")
def get_matches(
    resume_id: int
):

    try:

        matches = db.get_job_matches(
            resume_id
        )

        return APIResponse(

            success=True,

            data={

                "resume_id":
                resume_id,

                "matches":
                matches,

                "total":
                len(matches)
            }
        )

    except Exception as e:

        return APIResponse(

            success=False,

            error=str(e)
        )


# ━━━━━━━━━━━━━━━━━━━━━━━━
# GET ALL RESUMES
# ━━━━━━━━━━━━━━━━━━━━━━━━
@router.get("/resumes")
def get_all_resumes():

    try:

        resumes = db.get_all_resumes()

        return APIResponse(
            success=True,
            data={
                "success": True,
                "count": len(resumes),
                "data": resumes
            }
        )

    except Exception as e:

        return APIResponse(

            success=False,

            error=str(e)
        )