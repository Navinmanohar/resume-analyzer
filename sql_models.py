from sqlalchemy import (
    Column, Integer, String, Text, DateTime,
    ForeignKey, UniqueConstraint, Index
)
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()


class TimestampMixin:
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ====================================================================
# RESUME
# ====================================================================

class Resume(TimestampMixin, Base):
    __tablename__ = "resumes"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    filename        = Column(String(255), nullable=False, index=True)
    candidate_name  = Column(String(255))
    candidate_email = Column(String(255))
    raw_text        = Column(Text)
    skills          = Column(Text)      # JSON array as text
    experience      = Column(Text)      # JSON array as text
    education       = Column(Text)      # JSON array as text

    job_matches  = relationship("JobMatch", back_populates="resume", cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="resume", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_resumes_created_at", "created_at"),
    )


# ====================================================================
# JOB MATCH (legacy)
# ====================================================================

class JobMatch(TimestampMixin, Base):
    __tablename__ = "job_matches"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    resume_id   = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    job_title   = Column(String(255))
    match_score = Column(Integer, default=0)
    feedback    = Column(Text)

    resume = relationship("Resume", back_populates="job_matches")

    __table_args__ = (
        Index("ix_job_matches_resume_id", "resume_id"),
    )


# ====================================================================
# JOB
# ====================================================================

class Job(TimestampMixin, Base):
    __tablename__ = "jobs"

    id                  = Column(Integer, primary_key=True, autoincrement=True)
    title               = Column(String(255), nullable=False, index=True)
    description         = Column(Text)
    skills_required     = Column(Text)       # JSON array as text
    experience_required = Column(String(255))
    status              = Column(String(50), default="open", nullable=False, index=True)

    applications = relationship("Application", back_populates="job", cascade="all, delete-orphan")

    __table_args__ = (
        Index("ix_jobs_created_at", "created_at"),
    )


# ====================================================================
# APPLICATION
# ====================================================================

class Application(TimestampMixin, Base):
    __tablename__ = "applications"

    id            = Column(Integer, primary_key=True, autoincrement=True)
    job_id        = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False)
    resume_id     = Column(Integer, ForeignKey("resumes.id", ondelete="CASCADE"), nullable=False)
    status        = Column(String(50), default="applied", nullable=False, index=True)
    skill_score   = Column(Integer, default=0)
    exp_score     = Column(Integer, default=0)
    overall_score = Column(Integer, default=0)
    feedback      = Column(Text)
    skill_gaps    = Column(Text)     # JSON array as text

    job    = relationship("Job", back_populates="applications")
    resume = relationship("Resume", back_populates="applications")

    __table_args__ = (
        UniqueConstraint("job_id", "resume_id", name="uq_app_job_resume"),
        Index("ix_applications_job_id", "job_id"),
        Index("ix_applications_resume_id", "resume_id"),
        Index("ix_applications_score", "overall_score"),
    )


# ====================================================================
# CHAT SESSION
# ====================================================================

class ChatSession(TimestampMixin, Base):
    __tablename__ = "chat_sessions"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(255), nullable=False, unique=True, index=True)
    user_id    = Column(Integer, nullable=False, index=True)
    title      = Column(String(255), default="New Chat")
    status     = Column(String(50), default="active", nullable=False)  # active | closed
    role       = Column(String(50), default="employee")

    __table_args__ = (
        Index("ix_chat_sessions_user", "user_id", "status"),
    )


class ChatMessage(TimestampMixin, Base):
    __tablename__ = "chat_messages"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    session_id = Column(String(255), nullable=False, index=True)
    role       = Column(String(50), nullable=False)  # user | assistant
    content    = Column(Text, nullable=False)


# ====================================================================
# USER
# ====================================================================

class User(TimestampMixin, Base):
    __tablename__ = "users"

    id       = Column(Integer, primary_key=True, autoincrement=True)
    name     = Column(String(255), nullable=False)
    email    = Column(String(255), nullable=False, unique=True)
    password = Column(String(255), nullable=False)
    role     = Column(String(50), default="employee", nullable=False)  # 'hr' | 'employee'

    __table_args__ = (
        Index("ix_users_email", "email"),
    )
