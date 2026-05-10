import os
import json
import ast
import logging
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import scoped_session, sessionmaker
from sqlalchemy.exc import IntegrityError

from sql_models import Base, Resume, JobMatch, Job, Application, User, ChatSession, ChatMessage

load_dotenv()

logger = logging.getLogger(__name__)


def safe_json_loads(val, default=None):
    if val is None:
        return default or []
    if isinstance(val, list):
        return val
    if isinstance(val, (int, float)):
        return val
    s = str(val).strip()
    if not s:
        return default or []
    try:
        return json.loads(s)
    except (json.JSONDecodeError, TypeError):
        pass
    try:
        return ast.literal_eval(s)
    except (ValueError, SyntaxError, TypeError):
        return default or []


def _serialize(row: dict) -> dict:
    if row is None:
        return None
    return {
        k: v.isoformat() if isinstance(v, datetime) else v
        for k, v in row.items()
    }


def _to_dict(obj):
    if obj is None:
        return None
    d = {}
    for c in obj.__table__.columns:
        val = getattr(obj, c.name)
        if isinstance(val, datetime):
            val = val.isoformat()
        d[c.name] = val
    return d


class Database:

    def __init__(self):
        db_url = os.getenv("DATABASE_URL")
        if not db_url:
            db_host = os.getenv("DB_HOST", "localhost")
            db_port = int(os.getenv("DB_PORT", 5432))
            db_name = os.getenv("DB_NAME", "resume_analyzer")
            db_user = os.getenv("DB_USER", "postgres")
            db_password = os.getenv("DB_PASSWORD", "postgres")
            db_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
        self._engine = create_engine(db_url, pool_size=10, max_overflow=0)
        self._session_factory = scoped_session(sessionmaker(bind=self._engine))
        try:
            Base.metadata.create_all(self._engine)
        except Exception:
            pass  # tables/indexes may already exist
        self._migrate()
        print("✅ SQLAlchemy + PostgreSQL ready!")

    def Session(self):
        return self._session_factory()

    def _active(self, model, session):
        """Return query filtered to non-deleted records (soft delete support)."""
        q = session.query(model)
        if hasattr(model, "deleted_at"):
            q = q.filter(model.deleted_at.is_(None))
        return q

    def _migrate(self):
        """Add columns that may be missing from existing tables."""
        migrates = [
            ("resumes",     "updated_at",       "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
            ("resumes",     "candidate_name",   "VARCHAR(255)"),
            ("resumes",     "candidate_email",  "VARCHAR(255)"),
            ("job_matches", "updated_at",       "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
            ("jobs",        "updated_at",       "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
            ("applications","updated_at",       "TIMESTAMP DEFAULT CURRENT_TIMESTAMP"),
        ]
        with self._engine.connect() as conn:
            for table, col, dtype in migrates:
                try:
                    conn.execute(text(
                        f"ALTER TABLE {table} ADD COLUMN IF NOT EXISTS {col} {dtype}"
                    ))
                    conn.commit()
                except Exception:
                    conn.rollback()

    # ====================================================================
    # RESUMES
    # ====================================================================

    def save_resume(self, filename, raw_text, skills, experience, education,
                    candidate_name=None, candidate_email=None):
        session = self.Session()
        try:
            r = Resume(filename=filename, raw_text=raw_text,
                       skills=skills, experience=experience, education=education,
                       candidate_name=candidate_name, candidate_email=candidate_email)
            session.add(r)
            session.flush()
            rid = r.id
            session.commit()
            return rid
        finally:
            session.close()

    def get_resume(self, resume_id):
        session = self.Session()
        try:
            r = session.get(Resume, resume_id)
            return _to_dict(r) if r else None
        finally:
            session.close()

    def get_all_resumes(self):
        session = self.Session()
        try:
            rows = session.query(Resume).order_by(Resume.created_at.desc()).all()
            return [_to_dict(r) for r in rows]
        finally:
            session.close()

    def get_resume_text(self, resume_id):
        session = self.Session()
        try:
            r = session.get(Resume, resume_id)
            return r.raw_text if r else None
        finally:
            session.close()

    def search_resumes_by_skill(self, skill):
        session = self.Session()
        try:
            pattern = f"%{skill}%"
            rows = session.query(Resume).filter(
                Resume.skills.ilike(pattern)
            ).all()
            return [{"id": r.id, "filename": r.filename, "skills": r.skills,
                     "candidate_name": r.candidate_name, "candidate_email": r.candidate_email} for r in rows]
        finally:
            session.close()

    def total_resumes(self):
        session = self.Session()
        try:
            return session.query(Resume).count()
        finally:
            session.close()

    def delete_resume(self, resume_id):
        session = self.Session()
        try:
            r = session.get(Resume, resume_id)
            if r:
                session.delete(r)
                session.commit()
            return True
        finally:
            session.close()

    # ====================================================================
    # JOB MATCHES (legacy)
    # ====================================================================

    def save_job_match(self, resume_id, job_title, score, feedback):
        session = self.Session()
        try:
            jm = JobMatch(resume_id=resume_id, job_title=job_title,
                          match_score=score, feedback=feedback)
            session.add(jm)
            session.commit()
        finally:
            session.close()

    def get_job_matches(self, resume_id):
        session = self.Session()
        try:
            rows = session.query(JobMatch).filter(
                JobMatch.resume_id == resume_id
            ).order_by(JobMatch.created_at.desc()).all()
            return [_to_dict(r) for r in rows]
        finally:
            session.close()

    def get_top_matches(self, limit=5):
        session = self.Session()
        try:
            rows = session.query(
                Resume.id.label("resume_id"),
                Resume.filename,
                JobMatch.job_title,
                JobMatch.match_score
            ).join(JobMatch, Resume.id == JobMatch.resume_id
            ).order_by(JobMatch.match_score.desc()).limit(limit).all()
            return [r._asdict() for r in rows]
        finally:
            session.close()

    # ====================================================================
    # JOBS
    # ====================================================================

    def create_job(self, title, description, skills_required, experience_required):
        session = self.Session()
        try:
            skills_json = json.dumps(skills_required) if isinstance(skills_required, list) else skills_required
            j = Job(title=title, description=description,
                    skills_required=skills_json,
                    experience_required=experience_required)
            session.add(j)
            session.flush()
            jid = j.id
            session.commit()
            return jid
        finally:
            session.close()

    def get_job(self, job_id):
        session = self.Session()
        try:
            j = session.get(Job, job_id)
            if not j:
                return None
            d = _to_dict(j)
            d["skills_required"] = safe_json_loads(d.get("skills_required"))
            return d
        finally:
            session.close()

    def get_all_jobs(self):
        session = self.Session()
        try:
            rows = session.query(Job).order_by(Job.created_at.desc()).all()
            result = []
            for j in rows:
                d = _to_dict(j)
                d["skills_required"] = safe_json_loads(d.get("skills_required"))
                result.append(d)
            return result
        finally:
            session.close()

    def update_job_status(self, job_id, status):
        session = self.Session()
        try:
            j = session.get(Job, job_id)
            if j:
                j.status = status
                session.commit()
            return True
        finally:
            session.close()

    def total_jobs(self):
        session = self.Session()
        try:
            return session.query(Job).count()
        finally:
            session.close()

    # ====================================================================
    # APPLICATIONS
    # ====================================================================

    def create_application(self, job_id, resume_id):
        session = self.Session()
        try:
            a = Application(job_id=job_id, resume_id=resume_id)
            session.add(a)
            session.flush()
            aid = a.id
            session.commit()
            return aid
        except IntegrityError:
            session.rollback()
            return None
        finally:
            session.close()

    def get_application(self, application_id):
        session = self.Session()
        try:
            a = session.get(Application, application_id)
            if not a:
                return None
            d = _to_dict(a)
            d["skill_gaps"] = safe_json_loads(d.get("skill_gaps"))
            return d
        finally:
            session.close()

    def get_job_applications(self, job_id):
        session = self.Session()
        try:
            rows = session.query(
                Application, Resume.filename, Resume.skills,
                Resume.experience, Resume.education,
                Resume.candidate_name, Resume.candidate_email
            ).join(Resume, Resume.id == Application.resume_id
            ).filter(Application.job_id == job_id
            ).order_by(Application.overall_score.desc(), Application.created_at.desc()).all()

            results = []
            for a, fname, skills, exp, edu, cname, cemail in rows:
                d = _to_dict(a)
                d["filename"] = fname
                d["skills"] = safe_json_loads(skills)
                d["experience"] = safe_json_loads(exp)
                d["education"] = safe_json_loads(edu)
                d["skill_gaps"] = safe_json_loads(d.get("skill_gaps"))
                d["candidate_name"] = cname
                d["candidate_email"] = cemail
                results.append(d)
            return results
        finally:
            session.close()

    def get_applications_by_resume(self, resume_id):
        session = self.Session()
        try:
            rows = session.query(
                Application, Job.title, Job.status
            ).join(Job, Job.id == Application.job_id
            ).filter(Application.resume_id == resume_id
            ).order_by(Application.created_at.desc()).all()

            results = []
            for a, jtitle, jstatus in rows:
                d = _to_dict(a)
                d["job_title"] = jtitle
                d["job_status"] = jstatus
                results.append(d)
            return results
        finally:
            session.close()

    def get_all_applications(self):
        session = self.Session()
        try:
            rows = session.query(
                Application, Resume.filename, Resume.skills,
                Job.title, Job.status,
                Resume.candidate_name, Resume.candidate_email
            ).join(Resume, Resume.id == Application.resume_id
            ).join(Job, Job.id == Application.job_id
            ).order_by(Application.created_at.desc()).all()

            results = []
            for a, fname, skills, jtitle, jstatus, cname, cemail in rows:
                d = _to_dict(a)
                d["filename"] = fname
                d["skills"] = safe_json_loads(skills)
                d["job_title"] = jtitle
                d["job_status"] = jstatus
                d["skill_gaps"] = safe_json_loads(d.get("skill_gaps"))
                d["candidate_name"] = cname
                d["candidate_email"] = cemail
                results.append(d)
            return results
        finally:
            session.close()

    def update_application_status(self, app_id, status):
        session = self.Session()
        try:
            a = session.get(Application, app_id)
            if a:
                a.status = status
                session.commit()
            return True
        finally:
            session.close()

    def update_application_scores(self, app_id, skill_score, exp_score,
                                  overall_score, feedback, skill_gaps):
        session = self.Session()
        try:
            a = session.get(Application, app_id)
            if a:
                a.skill_score = skill_score
                a.exp_score = exp_score
                a.overall_score = overall_score
                a.feedback = feedback
                a.skill_gaps = json.dumps(skill_gaps) if isinstance(skill_gaps, list) else skill_gaps
                a.status = "analyzed"
                session.commit()
            return True
        finally:
            session.close()

    def get_applications_by_status(self, job_id, status):
        session = self.Session()
        try:
            rows = session.query(
                Application, Resume.filename, Resume.skills,
                Resume.candidate_name, Resume.candidate_email
            ).join(Resume, Resume.id == Application.resume_id
            ).filter(Application.job_id == job_id, Application.status == status
            ).order_by(Application.overall_score.desc()).all()

            results = []
            for a, fname, skills, cname, cemail in rows:
                d = _to_dict(a)
                d["filename"] = fname
                d["skills"] = safe_json_loads(skills)
                d["skill_gaps"] = safe_json_loads(d.get("skill_gaps"))
                d["candidate_name"] = cname
                d["candidate_email"] = cemail
                results.append(d)
            return results
        finally:
            session.close()

    def check_duplicate_application(self, job_id, resume_id):
        session = self.Session()
        try:
            return session.query(Application).filter(
                Application.job_id == job_id,
                Application.resume_id == resume_id
            ).first() is not None
        finally:
            session.close()

    # ====================================================================
    # USERS
    # ====================================================================

    def create_user(self, name, email, hashed_password, role):
        session = self.Session()
        try:
            u = User(name=name, email=email, password=hashed_password, role=role)
            session.add(u)
            session.flush()
            uid = u.id
            session.commit()
            return uid
        except IntegrityError:
            session.rollback()
            return None
        finally:
            session.close()

    def get_user_by_email(self, email):
        session = self.Session()
        try:
            return session.query(User).filter(User.email == email).first()
        finally:
            session.close()

    def get_user_by_id(self, user_id):
        session = self.Session()
        try:
            return session.query(User).filter(User.id == user_id).first()
        finally:
            session.close()

    # ====================================================================
    # CHAT SESSIONS
    # ====================================================================

    def create_chat_session(self, session_id, user_id, title="New Chat", role="employee"):
        session = self.Session()
        try:
            cs = ChatSession(session_id=session_id, user_id=user_id, title=title, role=role)
            session.add(cs)
            session.flush()
            sid = cs.id
            session.commit()
            return sid
        except IntegrityError:
            session.rollback()
            return None
        finally:
            session.close()

    def get_chat_session(self, session_id):
        session = self.Session()
        try:
            cs = session.query(ChatSession).filter(ChatSession.session_id == session_id).first()
            return _to_dict(cs) if cs else None
        finally:
            session.close()

    def get_user_chat_sessions(self, user_id):
        session = self.Session()
        try:
            rows = session.query(ChatSession).filter(
                ChatSession.user_id == user_id
            ).order_by(ChatSession.updated_at.desc()).all()
            return [_to_dict(r) for r in rows]
        finally:
            session.close()

    def update_chat_session(self, session_id, **kwargs):
        session = self.Session()
        try:
            cs = session.query(ChatSession).filter(ChatSession.session_id == session_id).first()
            if cs:
                for k, v in kwargs.items():
                    if hasattr(cs, k):
                        setattr(cs, k, v)
                session.commit()
            return True
        finally:
            session.close()

    def save_chat_message(self, session_id, role, content):
        session = self.Session()
        try:
            cm = ChatMessage(session_id=session_id, role=role, content=content)
            session.add(cm)
            session.flush()
            mid = cm.id
            session.commit()
            return mid
        finally:
            session.close()

    def get_chat_messages(self, session_id):
        session = self.Session()
        try:
            rows = session.query(ChatMessage).filter(
                ChatMessage.session_id == session_id
            ).order_by(ChatMessage.created_at.asc()).all()
            return [_to_dict(r) for r in rows]
        finally:
            session.close()


db = Database()
