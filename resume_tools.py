import json
import re
import logging
from analyzer import analyzer
from database import db, safe_json_loads

logger = logging.getLogger(__name__)


class ResumeTools:

    # ====================================================================
    # RESUMES
    # ====================================================================

    def get_resume(self, resume_id: int):
        resume = db.get_resume(resume_id)
        if not resume:
            return {"success": False, "message": "Resume not found"}
        resume["skills"] = safe_json_loads(resume.get("skills"))
        resume["experience"] = safe_json_loads(resume.get("experience"))
        resume["education"] = safe_json_loads(resume.get("education"))
        return {"success": True, "data": resume}

    def get_all_resumes(self):
        resumes = db.get_all_resumes()
        return {"success": True, "count": len(resumes), "data": resumes}

    def analyze_resume(self, resume_text: str):
        result = analyzer.analyze_resume(resume_text)
        return {"success": True, "data": result}

    def match_job(self, resume_text: str, job_title: str, job_description: str):
        result = analyzer.match_job(resume_text, job_title, job_description)
        return {"success": True, "data": result}

    def search_resumes_by_skill(self, skill: str):
        results = db.search_resumes_by_skill(skill)
        return {"success": True, "count": len(results), "skill": skill, "data": results}

    def rank_all_candidates(self, job_title: str, job_description: str):
        all_resumes = db.get_all_resumes()
        if not all_resumes:
            return {"success": False, "message": "No resumes found", "rankings": []}
        rankings = []
        for r in all_resumes:
            resume = db.get_resume(r["id"])
            if not resume or not resume.get("raw_text"):
                continue
            match = analyzer.match_job(resume["raw_text"], job_title, job_description)
            rankings.append({
                "resume_id": r["id"],
                "filename": r["filename"],
                "match_score": match.get("match_score", 0),
                "matching_skills": match.get("matching_skills", []),
                "missing_skills": match.get("missing_skills", []),
                "verdict": match.get("verdict", "Unknown")
            })
        rankings.sort(key=lambda x: x["match_score"], reverse=True)
        return {"success": True, "job_title": job_title, "total_candidates": len(rankings), "rankings": rankings}

    def get_candidate_insights(self, resume_id: int):
        resume = db.get_resume(resume_id)
        if not resume:
            return {"success": False, "message": "Resume not found"}
        resume["skills"] = safe_json_loads(resume.get("skills"))
        resume["experience"] = safe_json_loads(resume.get("experience"))
        resume["education"] = safe_json_loads(resume.get("education"))
        matches = db.get_job_matches(resume_id)
        apps = db.get_applications_by_resume(resume_id)
        summary_prompt = f'''Summarize this candidate's profile for an HR manager.
Name/File: {resume["filename"]}
Skills: {resume["skills"]}
Experience: {resume["experience"]}
Education: {resume["education"]}
Return concise 3-bullet summary.'''
        summary = analyzer.ask_ai(summary_prompt)
        return {
            "success": True,
            "data": {
                "profile": resume,
                "match_history": matches,
                "applications": apps,
                "ai_summary": summary
            }
        }

    def get_match_history(self, resume_id: int):
        matches = db.get_job_matches(resume_id)
        return {
            "success": True,
            "resume_id": resume_id,
            "matches": matches,
            "total": len(matches),
            "average_score": sum(m["match_score"] for m in matches) // len(matches) if matches else 0
        }

    # ====================================================================
    # JOBS
    # ====================================================================

    def create_job(self, title: str, description: str,
                   skills_required: list = None,
                   experience_required: str = ""):
        if not title:
            return {"success": False, "message": "Job title is required"}
        job_id = db.create_job(title, description, skills_required or [], experience_required)
        return {
            "success": True,
            "job_id": job_id,
            "message": f"Job '{title}' created successfully (ID: {job_id})"
        }

    def get_all_jobs(self):
        jobs = db.get_all_jobs()
        return {"success": True, "count": len(jobs), "data": jobs}

    def get_job(self, job_id: int):
        job = db.get_job(job_id)
        if not job:
            return {"success": False, "message": "Job not found"}
        return {"success": True, "data": job}

    def close_job(self, job_id: int):
        job = db.get_job(job_id)
        if not job:
            return {"success": False, "message": "Job not found"}
        db.update_job_status(job_id, "closed")
        return {"success": True, "message": f"Job '{job['title']}' closed"}

    # ====================================================================
    # APPLICATIONS
    # ====================================================================

    def apply_for_job(self, resume_id: int, job_id: int):
        resume = db.get_resume(resume_id)
        if not resume:
            return {"success": False, "message": "Resume not found"}
        job = db.get_job(job_id)
        if not job:
            return {"success": False, "message": "Job not found"}
        if job.get("status") != "open":
            return {"success": False, "message": f"Job '{job['title']}' is {job['status']}"}
        if db.check_duplicate_application(job_id, resume_id):
            return {"success": False, "message": "Already applied for this job"}
        app_id = db.create_application(job_id, resume_id)
        if not app_id:
            return {"success": False, "message": "Duplicate application detected"}
        analysis = self._auto_score(resume, job)
        db.update_application_scores(
            app_id,
            analysis["skill_score"],
            analysis["exp_score"],
            analysis["overall_score"],
            analysis["feedback"],
            analysis["skill_gaps"]
        )
        app = db.get_application(app_id)
        return {
            "success": True,
            "application_id": app_id,
            "message": f"Applied & analyzed for '{job['title']}'",
            "analysis": analysis,
            "data": app
        }

    def get_job_applications(self, job_id: int):
        job = db.get_job(job_id)
        if not job:
            return {"success": False, "message": "Job not found"}
        apps = db.get_job_applications(job_id)
        return {"success": True, "job": job["title"], "count": len(apps), "data": apps}

    def get_application_status(self, application_id: int):
        app = db.get_application(application_id)
        if not app:
            return {"success": False, "message": "Application not found"}
        return {"success": True, "data": app}

    def get_applications_by_resume(self, resume_id: int):
        apps = db.get_applications_by_resume(resume_id)
        return {"success": True, "count": len(apps), "data": apps}

    def get_all_applications(self):
        apps = db.get_all_applications()
        return {"success": True, "count": len(apps), "data": apps}

    def withdraw_application(self, application_id: int):
        app = db.get_application(application_id)
        if not app:
            return {"success": False, "message": "Application not found"}
        if app["status"] in ("hired", "rejected"):
            return {"success": False, "message": f"Cannot withdraw a {app['status']} application"}
        db.update_application_status(application_id, "withdrawn")
        return {"success": True, "message": "Application withdrawn successfully"}

    # ====================================================================
    # SCORING & ANALYSIS
    # ====================================================================

    def analyze_resume_for_job(self, resume_id: int, job_id: int):
        resume = db.get_resume(resume_id)
        if not resume:
            return {"success": False, "message": "Resume not found"}
        job = db.get_job(job_id)
        if not job:
            return {"success": False, "message": "Job not found"}
        analysis = self._auto_score(resume, job)
        apps = db.get_job_applications(job_id)
        rank = 0
        for i, a in enumerate(sorted(apps, key=lambda x: x.get("overall_score", 0), reverse=True)):
            if a["resume_id"] == resume_id:
                rank = i + 1
                break
        return {
            "success": True,
            "resume_id": resume_id,
            "job_id": job_id,
            "job_title": job["title"],
            "analysis": analysis,
            "rank_among_applicants": rank
        }

    def _auto_score(self, resume: dict, job: dict) -> dict:
        resume_text = resume.get("raw_text", "")
        job_skills = job.get("skills_required", [])
        job_title = job.get("title", "")
        job_desc = job.get("description", "")

        prompt = f'''You are an expert HR evaluator. Score this candidate for the given job.

JOB TITLE: {job_title}
JOB DESCRIPTION: {job_desc}
REQUIRED SKILLS: {json.dumps(job_skills)}

CANDIDATE RESUME:
{resume_text[:2500]}

Return ONLY valid JSON. No markdown. No explanation. No code fences. Just raw JSON.
{{
    "skill_score": 75,
    "exp_score": 60,
    "overall_score": 70,
    "feedback": "Candidate has strong technical skills but lacks experience in team leadership.",
    "skill_gaps": ["missing skill 1", "missing skill 2"],
    "strengths": ["strength 1", "strength 2"],
    "verdict": "Strong Match"
}}'''
        raw = analyzer.ask_ai(prompt)
        logger.info("LLM raw response: %s", raw[:500])
        data = self._parse_analysis(raw)
        return {
            "skill_score": data.get("skill_score", 0),
            "exp_score": data.get("exp_score", 0),
            "overall_score": data.get("overall_score", 0),
            "feedback": data.get("feedback", "Analysis failed"),
            "skill_gaps": data.get("skill_gaps", []),
            "strengths": data.get("strengths", []),
            "verdict": data.get("verdict", "Unknown")
        }

    def _parse_analysis(self, raw: str) -> dict:
        try:
            cleaned = analyzer.clean_json(raw)
            return json.loads(cleaned)
        except Exception:
            pass
        try:
            match = re.search(r'\{.*\}', raw, re.DOTALL)
            if match:
                candidate = match.group(0)
                candidate = re.sub(r',\s*}', '}', candidate)
                candidate = re.sub(r',\s*]', ']', candidate)
                return json.loads(candidate)
        except Exception:
            pass
        logger.warning("All JSON parsing attempts failed for: %s", raw[:300])
        return {
            "skill_score": 0, "exp_score": 0, "overall_score": 0,
            "feedback": "Analysis failed", "skill_gaps": [],
            "strengths": [], "verdict": "Unknown"
        }

    def shortlist_for_job(self, job_id: int):
        job = db.get_job(job_id)
        if not job:
            return {"success": False, "message": "Job not found"}
        apps = db.get_job_applications(job_id)
        if not apps:
            return {"success": False, "message": "No applicants for this job"}
        strong = []
        medium = []
        reject = []
        for a in apps:
            score = a.get("overall_score", 0)
            status = "strong_shortlist" if score >= 80 else "medium_shortlist" if score >= 60 else "rejected"
            db.update_application_status(a["id"], status)
            entry = {
                "application_id": a["id"],
                "resume_id": a["resume_id"],
                "candidate": a.get("filename", "Unknown"),
                "candidate_name": a.get("candidate_name"),
                "candidate_email": a.get("candidate_email"),
                "skill_score": a.get("skill_score", 0),
                "exp_score": a.get("exp_score", 0),
                "overall_score": score,
                "skill_gaps": a.get("skill_gaps", []),
                "status": status
            }
            if score >= 80:
                strong.append(entry)
            elif score >= 60:
                medium.append(entry)
            else:
                reject.append(entry)
        strong.sort(key=lambda x: x["overall_score"], reverse=True)
        medium.sort(key=lambda x: x["overall_score"], reverse=True)
        reject.sort(key=lambda x: x["overall_score"], reverse=True)
        return {
            "success": True,
            "job_title": job["title"],
            "strong_shortlist": {"count": len(strong), "candidates": strong},
            "medium_shortlist": {"count": len(medium), "candidates": medium},
            "rejected": {"count": len(reject), "candidates": reject},
            "total": len(apps)
        }

    def get_skill_gaps(self, resume_id: int, job_id: int):
        resume = db.get_resume(resume_id)
        if not resume:
            return {"success": False, "message": "Resume not found"}
        job = db.get_job(job_id)
        if not job:
            return {"success": False, "message": "Job not found"}
        analysis = self._auto_score(resume, job)
        return {
            "success": True,
            "candidate": resume.get("filename"),
            "job_title": job["title"],
            "candidate_skills": json.loads(resume.get("skills") or "[]"),
            "required_skills": job.get("skills_required", []),
            "skill_gaps": analysis["skill_gaps"],
            "strengths": analysis["strengths"],
            "overall_score": analysis["overall_score"]
        }

    # ====================================================================
    # INTERVIEW QUESTIONS (Role-Specific)
    # ====================================================================

    def generate_interview_questions(self, skills: list, experience: str):
        prompt = f'''Generate technical interview questions.

SKILLS: {skills}
EXPERIENCE: {experience}

Return JSON array with objects: {{"question": "...", "type": "technical/behavioral", "difficulty": "easy/medium/hard", "expected_answer": "..."}}'''
        result = analyzer.ask_ai(prompt)
        return {"success": True, "questions": result}

    def generate_role_questions(self, job_id: int, resume_id: int = None):
        job = db.get_job(job_id)
        if not job:
            return {"success": False, "message": "Job not found"}
        skills = job.get("skills_required", [])
        context = f"JOB: {job['title']}\nDESCRIPTION: {job['description']}\nSKILLS: {skills}"
        if resume_id:
            resume = db.get_resume(resume_id)
            if resume:
                c_skills = json.loads(resume.get("skills") or "[]")
                context += f"\nCANDIDATE SKILLS: {c_skills}"
        prompt = f'''Generate interview questions for this role.

{context}

Return JSON array with 5 questions:
{{"question": "...", "type": "technical/behavioral/hr", "difficulty": "easy/medium/hard", "expected_answer": "..."}}'''
        result = analyzer.ask_ai(prompt)
        return {"success": True, "job_title": job["title"], "questions": result}

    # ====================================================================
    # COMPARE
    # ====================================================================

    def compare_candidates(self, candidates: list):
        prompt = f'''Compare these candidates and recommend the best hire.

CANDIDATES:
{candidates}

Return JSON:
{{
    "rankings": [{{"name": "...", "rank": 1, "reason": "..."}}],
    "best_candidate": "...",
    "recommendation": "..."
}}'''
        result = analyzer.ask_ai(prompt)
        return {"success": True, "comparison": result}

    # ====================================================================
    # LEGACY SHORTLIST (standalone)
    # ====================================================================

    def shortlist_candidate(self, candidate_name: str, match_score: int):
        shortlisted = match_score >= 70
        return {
            "candidate": candidate_name,
            "match_score": match_score,
            "shortlisted": shortlisted,
            "verdict": "Shortlisted" if shortlisted else "Not Shortlisted"
        }

    def generate_candidate_summary(self, resume_text: str):
        prompt = f'''Create a concise HR summary for this candidate (2-3 paragraphs).

Include:
- Overall profile
- Key strengths
- Years of experience
- Best suited roles

RESUME:
{resume_text[:2000]}'''
        result = analyzer.ask_ai(prompt)
        return {"success": True, "summary": result}


resume_tools = ResumeTools()
