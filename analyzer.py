# analyzer.py
import os
import json
import logging
import requests
import PyPDF2
from dotenv import load_dotenv

load_dotenv()

# Logger setup
logging.basicConfig(
    level  = logging.INFO,
    format = "%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Constants
MAX_RESUME_CHARS = 3000
MAX_JOB_CHARS    = 1000

class ResumeAnalyzer:

    def __init__(self):
        self.api_key  = os.getenv("CEREBRAS_API_KEY")
        self.base_url = os.getenv(
            "CEREBRAS_BASE_URL",
            "https://api.cerebras.ai/v1"
        )
        self.model = os.getenv(
            "CEREBRAS_MODEL",
            "llama3.1-8b"
        )

        # Validate
        if not self.api_key:
            raise Exception("❌ CEREBRAS_API_KEY missing in .env!")

        logger.info(f"✅ ResumeAnalyzer ready! Model: {self.model}")

    # ━━━ AI Request ━━━
    def ask_ai(self, prompt: str):
        """Cerebras API call"""
        try:
            logger.info("Calling Cerebras API...")

            response = requests.post(
                f"{self.base_url}/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type":  "application/json"
                },
                json={
                    "model":                 self.model,
                    "messages":              [{"role": "user", "content": prompt}],
                    "temperature":           0.3,
                    "max_completion_tokens": 2000,
                    "stream":                False
                },
                timeout=30
            )

            # Status check
            if response.status_code == 401:
                raise Exception("❌ Invalid API Key!")
            if response.status_code == 429:
                raise Exception("❌ Rate limit exceeded!")
            if response.status_code != 200:
                raise Exception(f"❌ API Error: {response.status_code}")

            data   = response.json()
            usage  = data.get("usage", {})
            logger.info(f"✅ Tokens used: {usage}")

            return data["choices"][0]["message"]["content"]

        except requests.Timeout:
            raise Exception("❌ Request timeout!")
        except requests.ConnectionError:
            raise Exception("❌ Connection error!")
        except Exception as e:
            raise Exception(f"❌ API Error: {str(e)}")

    # ━━━ Clean JSON ━━━
    def clean_json(self, raw: str):
        """JSON response clean karo"""
        clean = raw.strip()

        if "```json" in clean:
            clean = clean.split("```json")[1].split("```")[0]
        elif "```" in clean:
            parts = clean.split("```")
            if len(parts) >= 3:
                clean = parts[1]
                if parts[1].startswith("json"):
                    clean = parts[1][4:]

        clean = clean.strip()
        if clean.startswith("json"):
            clean = clean[4:].strip()

        return clean

    # ━━━ PDF Extract ━━━
    def extract_text(self, filepath: str):
        """PDF se text nikalo"""
        try:
            text = ""

            with open(filepath, "rb") as f:
                reader     = PyPDF2.PdfReader(f)
                total_pages = len(reader.pages)

                for i, page in enumerate(reader.pages):
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n"

            logger.info(f"✅ Extracted {total_pages} pages, {len(text)} chars")

            if not text.strip():
                raise Exception("PDF mein text nahi mila!")

            return text.strip()

        except Exception as e:
            raise Exception(f"PDF read error: {str(e)}")

    # ━━━ Resume Analyze ━━━
    def analyze_resume(self, text: str):
        """Resume analyze karo"""

        # Truncate if too long
        if len(text) > MAX_RESUME_CHARS:
            logger.warning(f"⚠️ Resume truncated: {len(text)} → {MAX_RESUME_CHARS}")
            text = text[:MAX_RESUME_CHARS]

        prompt = f"""
Tu ek expert HR assistant hai.
Neeche diye resume se information extract karo.

RESUME:
{text}

Exactly is JSON format mein return karo:
{{
    "skills": ["skill1", "skill2"],
    "experience": [
        {{
            "company":  "Company Name",
            "role":     "Job Title",
            "duration": "X years"
        }}
    ],
    "education": [
        {{
            "degree":  "Degree Name",
            "college": "College Name",
            "year":    "Year"
        }}
    ],
    "total_experience": "X years",
    "summary": "2-3 line professional summary"
}}

Sirf JSON return karo.
"""

        raw = self.ask_ai(prompt)

        try:
            return json.loads(self.clean_json(raw))
        except Exception as e:
            logger.error(f"JSON parse error: {e}")
            return {
                "skills":           [],
                "experience":       [],
                "education":        [],
                "total_experience": "Unknown",
                "summary":          raw[:500]
            }

    # ━━━ Extract Contact Info ━━━
    def extract_contact(self, text: str):
        """Extract candidate name and email from resume text."""
        prompt = f"""
From the resume below, extract the candidate's full name and email address.

RESUME:
{text[:2000]}

Return ONLY valid JSON:
{{"name": "Full Name", "email": "email@example.com"}}

If not found, use null for missing values.
"""
        raw = self.ask_ai(prompt)
        try:
            return json.loads(self.clean_json(raw))
        except Exception:
            return {"name": None, "email": None}

    # ━━━ Job Match ━━━
    def match_job(self, resume_text: str, job_title: str, job_desc: str):
        """Resume ko job se match karo"""

        # Truncate
        resume_text = resume_text[:MAX_RESUME_CHARS]
        job_desc    = job_desc[:MAX_JOB_CHARS]

        prompt = f"""
Tu ek expert HR recruiter hai.
Resume aur Job Description compare karo.

RESUME: {resume_text}
JOB TITLE: {job_title}
JOB DESCRIPTION: {job_desc}

Exactly is JSON format mein return karo:
{{
    "match_score":      75,
    "matching_skills":  ["skill1", "skill2"],
    "missing_skills":   ["skill3", "skill4"],
    "strengths":        ["strength1"],
    "improvements":     ["improvement1"],
    "verdict":          "Strong Match",
    "feedback":         "2-3 line feedback"
}}

Sirf JSON return karo.
"""

        raw = self.ask_ai(prompt)

        try:
            return json.loads(self.clean_json(raw))
        except Exception as e:
            logger.error(f"JSON parse error: {e}")
            return {
                "match_score":     0,
                "matching_skills": [],
                "missing_skills":  [],
                "strengths":       [],
                "improvements":    [],
                "verdict":         "Unknown",
                "feedback":        raw[:500]
            }


    def chat_with_tools(
    self,
    messages,
    tools
    ):

        response = requests.post(

            f"{self.base_url}/chat/completions",

            headers={
                "Authorization":
                f"Bearer {self.api_key}",

                "Content-Type":
                "application/json"
            },

            json={

                "model": self.model,

                "messages": messages,

                "tools": tools,

                "tool_choice": "auto",

                "temperature": 0.3,

                "max_completion_tokens": 2000,

                "stream": False
            },

            timeout=30
        )

        data = response.json()

        if response.status_code != 200:
            error_msg = data.get("error", {}).get("message", str(data))
            logger.error(f"Cerebras API error: {error_msg}")
            return {
                "content": f"I encountered an API error: {error_msg}. Please try again.",
                "tool_calls": None
            }

        choices = data.get("choices", [])
        if not choices:
            logger.error("No choices in API response")
            return {
                "content": "I received an empty response. Please try again.",
                "tool_calls": None
            }

        return choices[0].get("message", {"content": "No response", "tool_calls": None})
# Singleton
analyzer = ResumeAnalyzer()