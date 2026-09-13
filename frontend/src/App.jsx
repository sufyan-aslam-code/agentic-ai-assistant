import { useState, useRef, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import ChatHeader from './components/ChatHeader'
import MessageList from './components/MessageList'
import ChatInput from './components/ChatInput'
import SourceModal from './components/SourceModal'
import DeleteConfirmModal from './components/DeleteConfirmModal'

const API_BASE = 'http://localhost:8000'

function App() {
  const [sessions, setSessions] = useState([])
  const [currentSessionId, setCurrentSessionId] = useState(null)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [abortController, setAbortController] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  // Document state
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [documents, setDocuments] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')
  const [documentToDelete, setDocumentToDelete] = useState(null)
  const fileInputRef = useRef(null)
  const chatFileInputRef = useRef(null)
  const [selectedSource, setSelectedSource] = useState(null)
  const [alertMessage, setAlertMessage] = useState('')

  const currentSession = sessions.find(s => s.id === currentSessionId)
  const messages = currentSession ? currentSession.messages : []

  // Load sessions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('chat_sessions')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setSessions(parsed)
        if (parsed.length > 0) {
          setCurrentSessionId(parsed[0].id)
        } else {
          createNewSession()
        }
      } catch (e) {
        console.error("Failed to parse sessions", e)
        createNewSession()
      }
    } else {
      createNewSession()
    }
  }, [])

  // Save sessions to localStorage when they change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('chat_sessions', JSON.stringify(sessions))
    }
  }, [sessions])

  const createNewSession = () => {
    const newSession = {
      id: crypto.randomUUID(),
      title: "New Chat",
      createdAt: Date.now(),
      messages: []
    }
    setSessions(prev => {
      const filtered = prev.filter(s => s.messages.length > 0)
      return [newSession, ...filtered]
    })
    setCurrentSessionId(newSession.id)
    if (window.innerWidth < 768) setSidebarOpen(false) // Close sidebar on mobile
  }

  const handleSelectSession = (id) => {
    setSessions(prev => prev.filter(s => s.id === id || s.messages.length > 0))
    setCurrentSessionId(id)
  }

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Fetch documents on mount and when sidebar opens
  useEffect(() => {
    fetchDocuments()
  }, [])

  useEffect(() => {
    if (sidebarOpen) fetchDocuments()
  }, [sidebarOpen])

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/documents`)
      if (res.ok) {
        const data = await res.json()
        setDocuments(data)
      }
    } catch {
      // silently ignore fetch errors
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setAlertMessage("Only PDF files are supported.")
      if (e.target) e.target.value = ''
      return
    }

    if (documents.length >= 5) {
      setAlertMessage("Upload limit reached. You can only maintain 5 active documents at a time. Please delete an existing document to upload a new one.")
      if (e.target) e.target.value = ''
      return
    }

    setUploading(true)
    setUploadStatus(`Processing ${file.name}…`)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch(`${API_BASE}/api/documents/upload`, {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error(`Upload failed: ${res.status}`)

      const data = await res.json()
      if (data.error) {
        setUploadStatus(`Error: ${data.error}`)
      } else {
        setDocuments(prevDocs => {
          // Prevent duplicates if fetchDocuments also adds it
          if (prevDocs.some(d => d.document_id === data.document_id)) return prevDocs;
          return [...prevDocs, data];
        });
        fetchDocuments()
      }
    } catch (err) {
      setUploadStatus(`Error: ${err.message}`)
    } finally {
      setUploading(false)
      // Reset file input so the same file can be re-uploaded
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteDocument = async (documentId) => {
    try {
      const res = await fetch(`${API_BASE}/api/documents/${documentId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchDocuments()
      }
    } catch (err) {
      console.error('Failed to delete document', err)
    }
  }

  const handleSubmit = async (e, textToSubmit = null) => {
    if (e && e.preventDefault) e.preventDefault()
    const text = textToSubmit !== null ? textToSubmit : input
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    let activeSessionId = currentSessionId
    if (!activeSessionId) {
      const newSession = {
        id: crypto.randomUUID(),
        title: "New Chat",
        createdAt: Date.now(),
        messages: []
      }
      setSessions(prev => [newSession, ...prev])
      setCurrentSessionId(newSession.id)
      activeSessionId = newSession.id
    }

    const userMessage = { role: 'user', text: trimmed }
    setSessions(prev => prev.map(s => 
      s.id === activeSessionId ? { ...s, messages: [...s.messages, userMessage] } : s
    ))
    
    setInput('')
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
    }
    setIsLoading(true)

    const isFirstMessage = !currentSession || currentSession.messages.length === 0;

    if (isFirstMessage) {
      fetch(`${API_BASE}/api/chat/title`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
      }).then(res => res.json()).then(data => {
        if (data.title) {
          setSessions(prev => prev.map(s => 
            s.id === activeSessionId ? { ...s, title: data.title } : s
          ))
        }
      }).catch(console.error)
    }

    const controller = new AbortController()
    setAbortController(controller)

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed }),
        signal: controller.signal
      })

      if (!res.ok) throw new Error(`Server error: ${res.status}`)

      const data = await res.json()
      setSessions(prev => prev.map(s => 
        s.id === activeSessionId ? { ...s, messages: [...s.messages, { role: 'ai', text: data.response, sources: data.sources }] } : s
      ))
    } catch (err) {
      if (err.name === 'AbortError') {
        return // User aborted the request
      }
      setSessions(prev => prev.map(s => 
        s.id === activeSessionId ? { ...s, messages: [...s.messages, { role: 'ai', text: `Error: ${err.message}` }] } : s
      ))
    } finally {
      setIsLoading(false)
      setAbortController(null)
      inputRef.current?.focus()
    }
  }

  const handleAbort = () => {
    if (abortController) {
      abortController.abort()
      setIsLoading(false)
      setAbortController(null)
    }
  }

  const handlePromptClick = (promptText) => {
    handleSubmit(null, promptText)
  }

  return (
    <div className="flex h-screen bg-[#0f0f11] text-zinc-100 font-sans relative overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        documents={documents}
        uploading={uploading}
        uploadStatus={uploadStatus}
        fileInputRef={fileInputRef}
        handleFileUpload={handleFileUpload}
        setDocumentToDelete={setDocumentToDelete}
        sessions={sessions}
        setSessions={setSessions}
        currentSessionId={currentSessionId}
        setCurrentSessionId={handleSelectSession}
        createNewSession={createNewSession}
      />

      {/* -------- Main chat column -------- */}
      <div className="flex flex-col flex-1 min-w-0 relative h-screen">
        <ChatHeader
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          documentCount={documents.length}
        />

        <MessageList
          messages={messages}
          isLoading={isLoading}
          messagesEndRef={messagesEndRef}
          setSelectedSource={setSelectedSource}
          handlePromptClick={handlePromptClick}
        />

        <ChatInput
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          uploading={uploading}
          handleSubmit={handleSubmit}
          inputRef={inputRef}
          chatFileInputRef={chatFileInputRef}
          handleFileUpload={handleFileUpload}
          handleAbort={handleAbort}
        />
      </div>

      <SourceModal
        selectedSource={selectedSource}
        setSelectedSource={setSelectedSource}
      />

      <DeleteConfirmModal
        documentToDelete={documentToDelete}
        setDocumentToDelete={setDocumentToDelete}
        handleDeleteConfirm={handleDeleteDocument}
      />

      {/* Alert Modal */}
      {alertMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-semibold text-zinc-100">Notice</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {alertMessage}
            </p>
            <div className="flex items-center justify-end mt-2">
              <button
                onClick={() => setAlertMessage('')}
                className="px-5 py-2 rounded-lg bg-zinc-100 hover:bg-white text-sm font-semibold text-zinc-900 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
