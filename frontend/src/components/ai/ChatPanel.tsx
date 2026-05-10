'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, Send, X, Bot, User, Sparkles,
  Plus, Clock, CheckCircle, Trash2, ChevronLeft
} from 'lucide-react'
import api from '@/api/client'
import { useAuthStore } from '@/store/authStore'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface ChatSession {
  session_id: string
  title: string
  status: string
  updated_at: string
}

let sessionCounter = 0

export default function ChatPanel() {
  const { user, isHR } = useAuthStore()
  const role = isHR ? 'hr' : 'employee'
  const userId = user?.id

  const [open, setOpen] = useState(false)
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [currentSession, setCurrentSession] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sidebar, setSidebar] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open && userId) {
      loadSessions()
      if (!currentSession) setSidebar(true)
    }
  }, [open, userId])

  const loadSessions = async () => {
    if (!userId) return
    try {
      const res = await api.get(`/agent/sessions/${userId}`)
      if (!res.data.success) {
        console.error('Load sessions failed:', res.data.error)
        return
      }
      const list: ChatSession[] = res.data.data || []
      setSessions(list)
    } catch (e) {
      console.error('Load sessions error:', e)
    }
  }

  const createSession = async () => {
    if (!userId) return
    sessionCounter++
    const sid = `chat_${userId}_${Date.now()}_${sessionCounter}`
    try {
      const res = await api.post('/agent/sessions', { session_id: sid, user_id: Number(userId), role })
      if (!res.data.success) {
        console.error('Session creation failed:', res.data.error)
        return
      }
      setCurrentSession(sid)
      setMessages([{ role: 'assistant', content: role === 'hr' ? 'Hi! I can help you manage jobs, candidates, and shortlisting.' : 'Hi! I can help you explore jobs and track your applications.' }])
      setSidebar(false)
      await loadSessions()
    } catch (e) {
      console.error('Session creation error:', e)
    }
  }

  const openSession = async (sid: string) => {
    setCurrentSession(sid)
    setSidebar(false)
    setInput('')
    try {
      const res = await api.get(`/agent/sessions/${sid}/messages`)
      const data = res.data.data
      const msgs: Message[] = (data?.messages || []).map((m: any) => ({
        role: m.role,
        content: m.content,
      }))
      setMessages(msgs.length ? msgs : [{ role: 'assistant', content: 'No messages yet.' }])
    } catch {
      setMessages([{ role: 'assistant', content: 'Failed to load messages.' }])
    }
  }

  const closeSession = async () => {
    if (!currentSession) return
    try {
      const res = await api.patch(`/agent/sessions/${currentSession}`, { status: 'closed' })
      if (!res.data.success) {
        console.error('Close session failed:', res.data.error)
      }
      setCurrentSession(null)
      setMessages([])
      await loadSessions()
      setSidebar(true)
    } catch (e) {
      console.error('Close session error:', e)
    }
  }

  const isClosed = currentSession ? sessions.find((s) => s.session_id === currentSession)?.status === 'closed' : false

  const send = async () => {
    if (!input.trim() || loading || !currentSession || isClosed) return
    const msg = input.trim()
    setInput('')
    setMessages((m) => [...m, { role: 'user', content: msg }])
    setLoading(true)
    try {
      const res = await api.post('/agent/chat', {
        message: msg,
        session_id: currentSession,
        role,
      })
      const data = res.data.data
      if (data?.response) {
        setMessages((m) => [...m, { role: 'assistant', content: data.response }])
      }
      await loadSessions()
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' }])
    }
    setLoading(false)
  }

  const activeSession = sessions.find((s) => s.session_id === currentSession)
  const noActiveSession = !currentSession

  return (
    <>
      <button
        onClick={() => { setOpen(true); if (!currentSession) setSidebar(true) }}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-gradient-to-r from-blue-600 to-blue-500">
              <div className="flex items-center gap-2 min-w-0">
                <button onClick={() => setSidebar(!sidebar)} className="p-0.5 rounded hover:bg-white/10 transition-colors mr-1">
                  <ChevronLeft className={`w-4 h-4 text-white transition-transform ${sidebar ? 'rotate-180' : ''}`} />
                </button>
                <Sparkles className="w-5 h-5 text-blue-200 flex-shrink-0" />
                <span className="font-semibold text-white truncate">
                  {sidebar ? `History (${sessions.length})` : (activeSession?.title || 'AI Assistant')}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={createSession} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors" title="New chat">
                  <Plus className="w-4 h-4 text-white" />
                </button>
                <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
            </div>

            {sidebar && (
              <div className="max-h-96 overflow-y-auto border-b border-slate-100 bg-slate-50/50">
                <div className="p-3 space-y-1">
                  <button
                    onClick={createSession}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" /> New Chat
                  </button>
                  {sessions.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4">No previous chats</p>
                  )}
                  {sessions.map((s) => (
                    <button
                      key={s.session_id}
                      onClick={() => openSession(s.session_id)}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-colors text-left ${
                        s.session_id === currentSession
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:bg-white hover:text-slate-900'
                      }`}
                    >
                      {s.status === 'closed' ? (
                        <CheckCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 text-green-500 flex-shrink-0" />
                      )}
                      <span className="truncate">{s.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {noActiveSession ? (
              <div className="h-80 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                <MessageSquare className="w-12 h-12 mb-3 text-slate-200" />
                <p className="text-sm font-medium text-slate-500">No active chat</p>
                <p className="text-xs mt-1">Create a new chat or select from history</p>
                <button
                  onClick={createSession}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-4 h-4 inline mr-1" /> New Chat
                </button>
              </div>
            ) : (
              <>
                <div className="h-80 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : ''}`}>
                      {m.role === 'assistant' && (
                        <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                          <Bot className="w-4 h-4 text-blue-600" />
                        </div>
                      )}
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                        m.role === 'user'
                          ? 'bg-blue-600 text-white rounded-br-md'
                          : 'bg-white border border-slate-100 text-slate-700 rounded-bl-md shadow-sm'
                      }`}>
                        {m.content}
                      </div>
                      {m.role === 'user' && (
                        <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0 mt-1">
                          <User className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="bg-white border border-slate-100 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                        <div className="flex gap-1.5">
                          <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                          <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                          <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={bottomRef} />
                </div>

                <div className="p-4 border-t border-slate-100 bg-white">
                  <div className="flex items-center gap-2 mb-2">
                    {!isClosed ? (
                      <button
                        onClick={closeSession}
                        className="text-xs text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1"
                        title="Close chat"
                      >
                        <Trash2 className="w-3 h-3" /> Close chat
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Closed
                      </span>
                    )}
                  </div>
                  {isClosed ? (
                    <div className="px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-400 text-center">
                      This chat is closed. <button onClick={createSession} className="text-blue-600 font-medium hover:underline">Start a new chat</button>
                    </div>
                  ) : (
                    <form onSubmit={(e) => { e.preventDefault(); send() }} className="flex gap-2 items-end">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={`Ask ${role === 'hr' ? 'about jobs, candidates...' : 'about jobs, applications...'}`}
                        className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50 resize-none"
                        rows={1}
                        disabled={loading}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
                      />
                      <button
                        type="submit"
                        disabled={!input.trim() || loading}
                        className="p-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
