import json
import re
from typing import Optional

from analyzer import analyzer
from tool_registry import TOOLS, TOOL_FUNCTIONS
from database import db


class HiringAgent:

    def __init__(self):
        self.base_prompt = """
You are an AI HR & Recruitment Agent for a full HRMS system. You ONLY answer questions about jobs, resumes, candidates, hiring, and recruitment.
Always respond in clear, natural human language. Never output raw JSON or tool output.

=== SYSTEM CAPABILITIES ===
You manage the complete hiring lifecycle:
1. Job Management   - Create, view, close job postings
2. Resume Management - Upload, analyze, search resumes
3. Applications     - Apply resumes to jobs, track status
4. AI Matching      - Score candidates against jobs (skill/exp/overall 0-100)
5. Shortlisting     - Auto-shortlist: 80+ strong, 60-79 medium, <60 reject
6. Interview Questions - Generate role-specific technical + HR questions
7. Candidate Insights - Full profile with match history and applications

=== WORKFLOW STATES ===
JOB_CREATED → APPLICATION_RECEIVED → ANALYZED → SHORTLISTED → INTERVIEW_SCHEDULED → HIRED/REJECTED

=== BOUNDARIES ===
- You ONLY answer hiring/recruitment/job-related questions.
- If the user asks about ANY topic outside hiring (e.g., general AI, programming, weather, politics, science, entertainment, personal advice), politely refuse and redirect to hiring topics.
- Do NOT explain what AI is, how programming works, or any general knowledge.
- Do NOT answer questions about the broader capabilities of AI or machine learning.
- Stick strictly to: job postings, resumes, candidates, applications, interviews, skills, hiring pipeline.

=== RULES ===
- ALWAYS use tools for real data. Never hallucinate IDs or scores.
- If user asks about jobs → call get_all_jobs
- If user asks about candidates/resumes → call get_all_resumes
- When applying a candidate to a job → call apply_for_job (it auto-analyzes)
- Never assume job_id or resume_id without fetching first
- After any tool call, summarize results clearly in plain language
- For greetings like "hello", "hi", "who are you" → answer conversationally without tools, keeping it hiring-focused
- For explanations about how the system works → answer directly without tools
- Never prefix responses with tool names or JSON

=== INTENT GUIDE ===
Creating a job           → create_job
Viewing job list         → get_all_jobs
Viewing applicants       → get_job_applications
Shortlisting             → shortlist_for_job
Resume status            → get_all_resumes
Apply candidate          → apply_for_job
Score candidate          → analyze_resume_for_job
Skill gaps               → get_skill_gaps
Interview questions      → generate_role_questions
"""
        self.sessions = {}

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # PARSE TOOL CALL FROM TEXT
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    def _try_parse_tool_call(self, content: str) -> Optional[dict]:
        raw = content.strip()
        m = re.search(r'```(?:json)?\s*(\{.*?\})\s*```', raw, re.DOTALL)
        if m:
            raw = m.group(1).strip()
        try:
            obj = json.loads(raw)
            if isinstance(obj, dict) and "name" in obj and "arguments" in obj:
                return obj
        except json.JSONDecodeError:
            pass
        return None

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # FORMAT TOOL RESULT TO READABLE TEXT
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    def _format_result(self, fn_name: str, result: dict) -> str:
        if fn_name == "get_all_resumes":
            count = result.get("count", 0)
            if count == 0:
                return "No resumes uploaded yet."
            data = result.get("data", [])
            lines = [f"  • {r['filename']} (ID: {r['id']})" for r in data]
            return f"**{count} Resume(s) on file:**\n" + "\n".join(lines)

        if fn_name == "search_resumes_by_skill":
            count = result.get("count", 0)
            skill = result.get("skill", "")
            if count == 0:
                return f"No candidates found with skill '{skill}'."
            data = result.get("data", [])
            lines = [f"  • {r['filename']} (ID: {r['id']})" for r in data]
            return f"Found {count} candidate(s) with '{skill}':\n" + "\n".join(lines)

        if fn_name == "get_all_jobs":
            count = result.get("count", 0)
            if count == 0:
                return "No jobs created yet. Use create_job to post one."
            data = result.get("data", [])
            lines = [
                f"  • {j['title']} (ID: {j['id']}) — {j['status']} — Skills: {', '.join(j.get('skills_required', []) or [])}"
                for j in data
            ]
            return f"**{count} Job(s):**\n" + "\n".join(lines)

        if fn_name == "get_job":
            if not result.get("success"):
                return "Job not found."
            j = result["data"]
            skills = ", ".join(j.get("skills_required", []) or [])
            return (
                f"**{j['title']}** (ID: {j['id']}) — {j['status']}\n"
                f"Skills Required: {skills}\n"
                f"Experience: {j.get('experience_required', 'Not specified')}\n"
                f"Description: {j.get('description', 'N/A')}"
            )

        if fn_name == "get_job_applications":
            if not result.get("success"):
                return "Job not found."
            apps = result.get("data", [])
            if not apps:
                return f"No applicants for '{result['job']}' yet."
            lines = []
            for i, a in enumerate(apps):
                name = a.get("candidate_name") or a["filename"]
                email = a.get("candidate_email") or ""
                lines.append(f"  #{i+1} {name} ({email}) — Score: {a.get('overall_score', 0)} — Status: {a.get('status', 'applied')}")
            return f"**{result['job']} — {result['count']} Applicant(s):**\n" + "\n".join(lines)

        if fn_name == "get_application_status":
            if not result.get("success"):
                return "Application not found."
            a = result["data"]
            return (
                f"**Application #{a['id']}** — Status: {a['status']}\n"
                f"  Skill Score: {a.get('skill_score', 0)}/100\n"
                f"  Exp Score: {a.get('exp_score', 0)}/100\n"
                f"  Overall: {a.get('overall_score', 0)}/100\n"
                f"  Skill Gaps: {', '.join(a.get('skill_gaps', []) or [])}\n"
                f"  Feedback: {a.get('feedback', 'N/A')}"
            )

        if fn_name == "shortlist_for_job":
            if not result.get("success"):
                return result.get("message", "Shortlisting failed.")
            s = result.get("strong_shortlist", {})
            m = result.get("medium_shortlist", {})
            r = result.get("rejected", {})
            lines = [f"**{result['job_title']} — Shortlist Results:**"]
            def fmt_candidate(c):
                name = c.get("candidate_name") or c.get("candidate", "Unknown")
                email = c.get("candidate_email") or ""
                score = c.get("overall_score", 0)
                return f"{name} ({email}) — {score}/100"
            lines.append(f"\n✅ Strong ({s['count']}): " + ", ".join(fmt_candidate(c) for c in s.get('candidates', [])) if s['count'] else "\n✅ Strong: None")
            lines.append(f"⚠️ Medium ({m['count']}): " + ", ".join(fmt_candidate(c) for c in m.get('candidates', [])) if m['count'] else "⚠️ Medium: None")
            lines.append(f"❌ Rejected ({r['count']}): " + ", ".join(fmt_candidate(c) for c in r.get('candidates', [])) if r['count'] else "❌ Rejected: None")
            return "\n".join(lines)

        if fn_name == "analyze_resume_for_job":
            a = result.get("analysis", {})
            return (
                f"**Analysis for {result.get('job_title', 'Job')}:**\n"
                f"  Skill Score: {a.get('skill_score', 0)}/100\n"
                f"  Exp Score: {a.get('exp_score', 0)}/100\n"
                f"  Overall: {a.get('overall_score', 0)}/100\n"
                f"  Verdict: {a.get('verdict', 'Unknown')}\n"
                f"  Skill Gaps: {', '.join(a.get('skill_gaps', []) or [])}\n"
                f"  Feedback: {a.get('feedback', 'N/A')}"
            )

        if fn_name == "get_skill_gaps":
            if not result.get("success"):
                return result.get("message", "Not found")
            return (
                f"**Skill Gap Analysis — {result['candidate']} for {result['job_title']}**\n"
                f"  Candidate Skills: {', '.join(result.get('candidate_skills', []) or [])}\n"
                f"  Required Skills: {', '.join(result.get('required_skills', []) or [])}\n"
                f"  Missing: {', '.join(result.get('skill_gaps', []) or [])}\n"
                f"  Strengths: {', '.join(result.get('strengths', []) or [])}\n"
                f"  Overall Score: {result.get('overall_score', 0)}/100"
            )

        if fn_name == "create_job":
            return f"✅ {result.get('message', 'Job created')}"

        if fn_name == "apply_for_job":
            return f"✅ {result.get('message', 'Applied')}\n" + (
                f"  Skill Score: {result['analysis'].get('skill_score', 0)}/100\n"
                f"  Exp Score: {result['analysis'].get('exp_score', 0)}/100\n"
                f"  Overall: {result['analysis'].get('overall_score', 0)}/100\n"
                f"  Verdict: {result['analysis'].get('verdict', 'Unknown')}"
            )

        if fn_name == "close_job":
            return f"✅ {result.get('message', 'Job closed')}"

        return str(result)

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # FALLBACK INTENT DETECTION
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    def _detect_intent(self, msg: str) -> Optional[dict]:
        msg_lower = msg.lower()

        if any(k in msg_lower for k in ["job", "vacancy", "opening", "position", "posting", "hire"]):
            if any(k in msg_lower for k in ["create", "new", "post", "add"]):
                return {"tool": "create_job", "args": {}}
            return {"tool": "get_all_jobs", "args": {}}

        if any(k in msg_lower for k in ["resume", "candidate", "applicant", "status", "list", "how many", "uploaded"]):
            return {"tool": "get_all_resumes", "args": {}}

        if any(k in msg_lower for k in ["applicant", "applied", "who applied", "candidates for"]):
            m = re.search(r'(?:job|position|for)\s*#?(\d+)', msg_lower)
            if m:
                return {"tool": "get_job_applications", "args": {"job_id": int(m.group(1))}}
            return {"tool": "get_all_jobs", "args": {}}

        skill_patterns = [
            r"(?:find|search|who has|have|with) (?:skill|candidate|resume).*?(python|java|aws|react|node|sql|docker|kubernetes|ml|ai|data|devops|javascript|typescript|go|rust|flutter)",
            r"(python|java|aws|react|node|sql|docker|kubernetes|ml|ai|data|devops|javascript|typescript|go|rust|flutter).*?(?:skill|candidate|resume|developer|engineer)",
        ]
        for p in skill_patterns:
            m = re.search(p, msg_lower)
            if m:
                return {"tool": "search_resumes_by_skill", "args": {"skill": m.group(1).strip()}}

        return None

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # BUILD SYSTEM PROMPT
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    def _build_prompt(self, state: dict) -> str:
        prompt = self.base_prompt
        prompt += "\n\n=== CRITICAL BOUNDARY ===\nYou are a hiring/recruitment assistant ONLY. If the user asks about anything outside hiring (general AI, programming, weather, politics, entertainment, math, etc.), respond with: \"I'm designed to help with hiring and recruitment tasks only. I can assist with jobs, resumes, candidates, applications, and the hiring pipeline. How can I help with that?\""
        role = state.get("user_role", "hr")
        if role == "hr":
            prompt += "\n=== USER ROLE: HR ===\nYou have full access: create/manage jobs, view all candidates, shortlist, generate interview questions."
        else:
            prompt += "\n=== USER ROLE: EMPLOYEE ===\nYou can only VIEW jobs and your own applications. You CANNOT create, close, or shortlist jobs. If asked to create a job, explain that only HR can do that and offer to show available jobs instead."
        ctx = []
        if state.get("current_job_id"):
            ctx.append(f"Currently viewing job ID {state['current_job_id']}")
        if state.get("current_resume_id"):
            ctx.append(f"Currently viewing resume ID {state['current_resume_id']}")
        if state.get("last_job_count"):
            ctx.append(f"System has {state['last_job_count']} job(s)")
        if state.get("last_list_count"):
            ctx.append(f"System has {state['last_list_count']} resume(s)")
        if ctx:
            prompt += "\n=== CONTEXT ===\n" + "\n".join(ctx)
        return prompt

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # UPDATE STATE
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    def _update_state(self, state, tool_name: str, arguments: dict, result: dict):
        if state is None:
            return
        if tool_name == "get_resume" and result.get("success"):
            state["current_resume_id"] = arguments.get("resume_id")
        elif tool_name == "get_job" and result.get("success"):
            state["current_job_id"] = arguments.get("job_id")
        elif tool_name == "get_all_resumes":
            state["last_list_count"] = result.get("count", 0)
        elif tool_name == "get_all_jobs":
            state["last_job_count"] = result.get("count", 0)
        elif tool_name == "create_job" and result.get("success"):
            state["current_job_id"] = result.get("job_id")
        elif tool_name == "apply_for_job" and result.get("success"):
            state["current_resume_id"] = arguments.get("resume_id")
            state["current_job_id"] = arguments.get("job_id")
        elif tool_name == "analyze_resume_for_job" and result.get("success"):
            state["current_resume_id"] = arguments.get("resume_id")
            state["current_job_id"] = arguments.get("job_id")

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # EXECUTE TOOL
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    def _execute_tool(self, tool_call: dict) -> dict:
        fn_name = tool_call["function"]["name"]
        try:
            fn_args = json.loads(tool_call["function"]["arguments"])
        except json.JSONDecodeError:
            fn_args = {}
        function = TOOL_FUNCTIONS.get(fn_name)
        if not function:
            return {"success": False, "error": f"Tool '{fn_name}' not found"}
        try:
            return function(**fn_args)
        except Exception as e:
            return {"success": False, "error": str(e)}

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # EXECUTE FALLBACK TOOL
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    def _execute_fallback(self, intent: dict, state: dict) -> str:
        fn_name = intent["tool"]
        fn_args = intent["args"]
        role = state.get("user_role", "hr")
        restricted = {"create_job", "close_job", "shortlist_for_job"}
        if fn_name in restricted and role != "hr":
            return "Only HR users can perform this action. Would you like to view available jobs instead?"
        function = TOOL_FUNCTIONS.get(fn_name)
        if not function:
            return "I'm not sure how to help with that."
        result = function(**fn_args)
        self._update_state(None, fn_name, fn_args, result)
        return self._format_result(fn_name, result)

    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # MAIN RUN LOOP
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    def run(self, user_message: str, session_id: str = "default", user_role: str = "hr"):
        if session_id not in self.sessions:
            self.sessions[session_id] = {
                "current_resume_id": None,
                "current_job_id": None,
                "last_list_count": db.total_resumes(),
                "last_job_count": db.total_jobs(),
                "chat_history": [],
                "user_role": user_role
            }

        state = self.sessions[session_id]

        state["chat_history"].append({
            "role": "user", "content": user_message
        })

        sys_prompt = self._build_prompt(state)

        messages = [
            {"role": "system", "content": sys_prompt},
            *state["chat_history"]
        ]

        for step in range(5):
            response = analyzer.chat_with_tools(
                messages=messages, tools=TOOLS
            )

            message = response if isinstance(response, dict) else {}
            content = message.get("content", "").strip()
            tool_calls = message.get("tool_calls") or []

            if not tool_calls:
                tool_call_json = self._try_parse_tool_call(content)
                if tool_call_json:
                    fn_name = tool_call_json["name"]
                    fn_args = tool_call_json.get("arguments", {}) or {}
                    function = TOOL_FUNCTIONS.get(fn_name)
                    if function:
                        result = function(**fn_args)
                        self._update_state(state, fn_name, fn_args, result)
                        formatted = self._format_result(fn_name, result)
                        state["chat_history"].append({
                            "role": "assistant", "content": formatted
                        })
                        return {"success": True, "response": formatted}
                    return {"success": True, "response": f"Unknown tool: {fn_name}"}

                if content and content != "No response":
                    state["chat_history"].append({
                        "role": "assistant", "content": content
                    })
                    return {"success": True, "response": content}

                intent = self._detect_intent(user_message)
                if intent:
                    fallback_response = self._execute_fallback(intent, state)
                    state["chat_history"].append({
                        "role": "assistant", "content": fallback_response
                    })
                    return {"success": True, "response": fallback_response}

                fallback = self._conversational_response(user_message)
                state["chat_history"].append({
                    "role": "assistant", "content": fallback
                })
                return {"success": True, "response": fallback}

            messages.append(message)

            for tool_call in tool_calls:
                fn_name = tool_call["function"]["name"]
                fn_args = json.loads(tool_call["function"]["arguments"])
                result = self._execute_tool(tool_call)
                self._update_state(state, fn_name, fn_args, result)
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call["id"],
                    "name": fn_name,
                    "content": json.dumps(result)
                })

        return {
            "success": False,
            "response": "Max tool iterations reached. Please refine your query."
        }

    def _conversational_response(self, msg: str) -> str:
        msg_lower = msg.lower().strip()

        off_topic_keywords = [
            "what is ai", "what is artificial intelligence", "define ai", "ai meaning",
            "how does ai work", "machine learning", "deep learning", "neural network",
            "what is python", "programming", "coding", "computer science",
            "weather", "politics", "sports", "news", "movie", "music",
            "recipe", "cooking", "travel", "joke", "story",
            "calculate", "math", "equation",
        ]
        if any(k in msg_lower for k in off_topic_keywords):
            return (
                "I'm designed to help with hiring and recruitment tasks only. "
                "I can assist you with jobs, resumes, candidates, applications, "
                "and the hiring pipeline. How can I help with that?"
            )

        greetings = {"hello", "hi", "hey", "good morning", "good afternoon", "good evening", "howdy"}
        if msg_lower in greetings or msg_lower.rstrip("!.,?") in greetings:
            return "Hello! I'm your hiring assistant. I can help you manage jobs, resumes, candidates, and more. What would you like to do?"
        if msg_lower in ("who are you", "what are you"):
            return "I'm an HR & Recruitment Agent for this platform. I help with jobs, resumes, candidates, shortlisting, and the hiring process."
        if any(k in msg_lower for k in ("what can you do", "help", "capabilities", "features")):
            return (
                "Here's what I can help you with:\n"
                "• **Jobs** — Create, view, close job postings\n"
                "• **Resumes** — View uploaded resumes\n"
                "• **Applications** — Apply candidates to jobs\n"
                "• **Analysis** — Score candidates against jobs\n"
                "• **Shortlisting** — Auto-shortlist applicants\n"
                "• **Skill Gaps** — Analyze missing skills\n"
                "• **Questions** — Generate interview questions\n\n"
                "Try saying: 'Show all jobs' or 'List resumes'"
            )
        if any(k in msg_lower for k in ("thanks", "thank you", "thankyou")):
            return "You're welcome! Let me know if you need anything else regarding jobs or hiring."
        return (
            "I can help you manage the full hiring cycle. Try:\n"
            "• 'Show all jobs'\n"
            "• 'Create a new job for Python Developer'\n"
            "• 'List all resumes'\n"
            "• 'Shortlist for job 1'\n"
            "• 'Show applicants for job 1'\n"
            "• 'Explain how the system works'"
        )

    def reset_session(self, session_id: str = "default"):
        if session_id in self.sessions:
            del self.sessions[session_id]
            return {"success": True, "message": f"Session '{session_id}' reset"}
        return {"success": False, "message": f"Session '{session_id}' not found"}


hiring_agent = HiringAgent()
