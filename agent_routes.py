from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional

from hiring_agent import hiring_agent
from database import db
from models import AgentRequest, APIResponse

router = APIRouter(prefix="/agent", tags=["AI Agent"])


class CreateSessionRequest(BaseModel):
    session_id: str
    user_id: int
    role: str = "employee"


class UpdateSessionRequest(BaseModel):
    title: Optional[str] = None
    status: Optional[str] = None


@router.post("/chat")
def agent_chat(payload: AgentRequest):
    try:
        session = db.get_chat_session(payload.session_id)
        if not session:
            return APIResponse(success=False, error="Session not found. Create a session first.")
        if session["status"] == "closed":
            return APIResponse(success=False, error="This chat is closed. Start a new chat.")

        db.save_chat_message(payload.session_id, "user", payload.message)

        result = hiring_agent.run(
            user_message=payload.message,
            session_id=payload.session_id,
            user_role=payload.role
        )

        response_text = result.get("response", "")
        db.save_chat_message(payload.session_id, "assistant", response_text)

        messages = db.get_chat_messages(payload.session_id)
        user_msgs = [m for m in messages if m["role"] == "user"]
        if len(user_msgs) == 1:
            title = payload.message[:60]
            if len(payload.message) > 60:
                title += "..."
            db.update_chat_session(payload.session_id, title=title)

        return APIResponse(success=True, data=result)
    except Exception as e:
        return APIResponse(success=False, error=str(e))


@router.post("/sessions")
def create_session(payload: CreateSessionRequest):
    try:
        existing = db.get_chat_session(payload.session_id)
        if existing:
            return APIResponse(success=True, data=existing)
        result = db.create_chat_session(
            session_id=payload.session_id,
            user_id=payload.user_id,
            role=payload.role
        )
        if not result:
            return APIResponse(success=False, error="Failed to create chat session")
        return APIResponse(success=True, data={"session_id": payload.session_id, "status": "active"})
    except Exception as e:
        return APIResponse(success=False, error=str(e))


@router.get("/sessions/{user_id}")
def list_sessions(user_id: int):
    try:
        sessions = db.get_user_chat_sessions(user_id)
        return APIResponse(success=True, data=sessions)
    except Exception as e:
        return APIResponse(success=False, error=str(e))


@router.get("/sessions/{session_id}/messages")
def get_session_messages(session_id: str):
    try:
        s = db.get_chat_session(session_id)
        if not s:
            raise HTTPException(status_code=404, detail="Session not found")
        messages = db.get_chat_messages(session_id)
        return APIResponse(success=True, data={"session": s, "messages": messages})
    except HTTPException:
        raise
    except Exception as e:
        return APIResponse(success=False, error=str(e))


@router.patch("/sessions/{session_id}")
def update_session(session_id: str, payload: UpdateSessionRequest):
    try:
        s = db.get_chat_session(session_id)
        if not s:
            raise HTTPException(status_code=404, detail="Session not found")
        kwargs = {}
        if payload.title is not None:
            kwargs["title"] = payload.title
        if payload.status is not None:
            kwargs["status"] = payload.status
        if kwargs:
            db.update_chat_session(session_id, **kwargs)
        return APIResponse(success=True, data={"session_id": session_id, **kwargs})
    except HTTPException:
        raise
    except Exception as e:
        return APIResponse(success=False, error=str(e))


@router.post("/reset/{session_id}")
def reset_session(session_id: str = "default"):
    try:
        result = hiring_agent.reset_session(session_id)
        return APIResponse(success=result["success"], data=result)
    except Exception as e:
        return APIResponse(success=False, error=str(e))
