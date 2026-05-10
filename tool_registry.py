from resume_tools import resume_tools

TOOL_FUNCTIONS = {
    # Resumes
    "get_resume":               resume_tools.get_resume,
    "get_all_resumes":          resume_tools.get_all_resumes,
    "analyze_resume":           resume_tools.analyze_resume,
    "match_job":                resume_tools.match_job,
    "search_resumes_by_skill":  resume_tools.search_resumes_by_skill,
    "rank_all_candidates":      resume_tools.rank_all_candidates,
    "get_candidate_insights":   resume_tools.get_candidate_insights,
    "get_match_history":        resume_tools.get_match_history,
    "generate_candidate_summary":   resume_tools.generate_candidate_summary,
    # Jobs
    "create_job":               resume_tools.create_job,
    "get_all_jobs":             resume_tools.get_all_jobs,
    "get_job":                  resume_tools.get_job,
    "close_job":                resume_tools.close_job,
    # Applications
    "apply_for_job":            resume_tools.apply_for_job,
    "get_job_applications":     resume_tools.get_job_applications,
    "get_application_status":   resume_tools.get_application_status,
    "get_applications_by_resume": resume_tools.get_applications_by_resume,
    "get_all_applications":    resume_tools.get_all_applications,
    # Scoring & Analysis
    "analyze_resume_for_job":   resume_tools.analyze_resume_for_job,
    "shortlist_for_job":        resume_tools.shortlist_for_job,
    "get_skill_gaps":           resume_tools.get_skill_gaps,
    # Interview
    "generate_interview_questions": resume_tools.generate_interview_questions,
    "generate_role_questions":  resume_tools.generate_role_questions,
    # Compare
    "compare_candidates":       resume_tools.compare_candidates,
    "shortlist_candidate":      resume_tools.shortlist_candidate,
}

TOOLS = [

    # ── Resumes ──────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "get_resume",
            "description": "Fetch full details of a single resume by its ID. Returns skills, experience, education.",
            "parameters": {
                "type": "object",
                "properties": {
                    "resume_id": {"type": "integer", "description": "Resume ID"}
                },
                "required": ["resume_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_all_resumes",
            "description": "List all uploaded resumes with ID, filename, skills summary. Use this first for resume status or candidate listing.",
            "parameters": {"type": "object", "properties": {}}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "analyze_resume",
            "description": "Extract structured info (skills, experience, education) from resume text.",
            "parameters": {
                "type": "object",
                "properties": {
                    "resume_text": {"type": "string", "description": "Full raw text of the resume"}
                },
                "required": ["resume_text"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "match_job",
            "description": "Compare a resume against a job description. Returns match score, matching/missing skills.",
            "parameters": {
                "type": "object",
                "properties": {
                    "resume_text": {"type": "string"},
                    "job_title": {"type": "string"},
                    "job_description": {"type": "string"}
                },
                "required": ["resume_text", "job_title", "job_description"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_resumes_by_skill",
            "description": "Find candidates by skill name (e.g. Python, AWS, React). Case-insensitive.",
            "parameters": {
                "type": "object",
                "properties": {
                    "skill": {"type": "string", "description": "Skill name to search"}
                },
                "required": ["skill"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "rank_all_candidates",
            "description": "Match ALL resumes against a job and return ranked list from best to worst.",
            "parameters": {
                "type": "object",
                "properties": {
                    "job_title": {"type": "string"},
                    "job_description": {"type": "string"}
                },
                "required": ["job_title", "job_description"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_candidate_insights",
            "description": "Full candidate profile: parsed resume + match history + applications + AI summary.",
            "parameters": {
                "type": "object",
                "properties": {
                    "resume_id": {"type": "integer", "description": "Resume ID"}
                },
                "required": ["resume_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_match_history",
            "description": "Previous job match results for a resume with scores and feedback.",
            "parameters": {
                "type": "object",
                "properties": {
                    "resume_id": {"type": "integer"}
                },
                "required": ["resume_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_candidate_summary",
            "description": "Generate HR-ready 2-3 paragraph summary for a candidate.",
            "parameters": {
                "type": "object",
                "properties": {
                    "resume_text": {"type": "string"}
                },
                "required": ["resume_text"]
            }
        }
    },

    # ── Jobs ─────────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "create_job",
            "description": "Create a new job posting with title, description, required skills, and experience level.",
            "parameters": {
                "type": "object",
                "properties": {
                    "title": {"type": "string", "description": "Job title"},
                    "description": {"type": "string", "description": "Full job description"},
                    "skills_required": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of required skills"
                    },
                    "experience_required": {
                        "type": "string",
                        "description": "Required experience (e.g. '3-5 years')"
                    }
                },
                "required": ["title", "description"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_all_jobs",
            "description": "List all job postings with status (open/closed) and required skills.",
            "parameters": {"type": "object", "properties": {}}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_job",
            "description": "Get full details of a specific job posting by ID.",
            "parameters": {
                "type": "object",
                "properties": {
                    "job_id": {"type": "integer", "description": "Job ID"}
                },
                "required": ["job_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "close_job",
            "description": "Close a job posting (no more applications accepted).",
            "parameters": {
                "type": "object",
                "properties": {
                    "job_id": {"type": "integer"}
                },
                "required": ["job_id"]
            }
        }
    },

    # ── Applications ─────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "apply_for_job",
            "description": "Apply a resume to a job. Auto-analyzes match and generates scores (skill, exp, overall).",
            "parameters": {
                "type": "object",
                "properties": {
                    "resume_id": {"type": "integer", "description": "Resume ID"},
                    "job_id": {"type": "integer", "description": "Job ID"}
                },
                "required": ["resume_id", "job_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_job_applications",
            "description": "Get all applicants for a job, ranked by overall score descending.",
            "parameters": {
                "type": "object",
                "properties": {
                    "job_id": {"type": "integer"}
                },
                "required": ["job_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_application_status",
            "description": "Check the status of a specific application (applied/analyzed/shortlisted/rejected).",
            "parameters": {
                "type": "object",
                "properties": {
                    "application_id": {"type": "integer"}
                },
                "required": ["application_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_applications_by_resume",
            "description": "Get all jobs a specific resume has applied to.",
            "parameters": {
                "type": "object",
                "properties": {
                    "resume_id": {"type": "integer"}
                },
                "required": ["resume_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_all_applications",
            "description": "Get ALL applications across all jobs, with candidate and job details. Use this when user asks 'show all applications' or 'list all applicants'.",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },

    # ── Scoring & Analysis ───────────────────────
    {
        "type": "function",
        "function": {
            "name": "analyze_resume_for_job",
            "description": "Deep analysis of a resume against a specific job. Returns skill score, exp score, overall score, skill gaps, and rank among applicants.",
            "parameters": {
                "type": "object",
                "properties": {
                    "resume_id": {"type": "integer"},
                    "job_id": {"type": "integer"}
                },
                "required": ["resume_id", "job_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "shortlist_for_job",
            "description": "Auto-shortlist all applicants for a job. 80+ = strong, 60-79 = medium, <60 = rejected. Updates application statuses.",
            "parameters": {
                "type": "object",
                "properties": {
                    "job_id": {"type": "integer"}
                },
                "required": ["job_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_skill_gaps",
            "description": "Compare a candidate's skills against job requirements. Returns missing skills and strengths.",
            "parameters": {
                "type": "object",
                "properties": {
                    "resume_id": {"type": "integer"},
                    "job_id": {"type": "integer"}
                },
                "required": ["resume_id", "job_id"]
            }
        }
    },

    # ── Interview ────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "generate_interview_questions",
            "description": "Generate technical + behavioral questions from a skill list.",
            "parameters": {
                "type": "object",
                "properties": {
                    "skills": {
                        "type": "array", "items": {"type": "string"},
                        "description": "Skills to base questions on"
                    },
                    "experience": {"type": "string", "description": "Experience level"}
                },
                "required": ["skills", "experience"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "generate_role_questions",
            "description": "Generate role-specific interview questions (technical + HR) based on job requirements. Optionally tailors to a specific candidate.",
            "parameters": {
                "type": "object",
                "properties": {
                    "job_id": {"type": "integer", "description": "Job ID"},
                    "resume_id": {
                        "type": "integer",
                        "description": "Optional: tailor questions to this candidate"
                    }
                },
                "required": ["job_id"]
            }
        }
    },

    # ── Compare ──────────────────────────────────
    {
        "type": "function",
        "function": {
            "name": "compare_candidates",
            "description": "Compare multiple candidates side-by-side and recommend the best hire.",
            "parameters": {
                "type": "object",
                "properties": {
                    "candidates": {
                        "type": "array", "items": {"type": "object"},
                        "description": "Array of candidate objects with name, skills, experience"
                    }
                },
                "required": ["candidates"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "shortlist_candidate",
            "description": "Simple standalone shortlist check. 70+ = shortlisted.",
            "parameters": {
                "type": "object",
                "properties": {
                    "candidate_name": {"type": "string"},
                    "match_score": {"type": "integer"}
                },
                "required": ["candidate_name", "match_score"]
            }
        }
    },
]
