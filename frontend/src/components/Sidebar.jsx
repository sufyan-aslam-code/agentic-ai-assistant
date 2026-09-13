import React, { useState } from 'react';

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  documents,
  uploading,
  uploadStatus,
  fileInputRef,
  handleFileUpload,
  setDocumentToDelete,
  sessions,
  setSessions,
  currentSessionId,
  setCurrentSessionId,
  createNewSession
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionToDelete, setSessionToDelete] = useState(null);

  const filteredSessions = (sessions || []).filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteSession = (id) => {
    const updatedSessions = sessions.filter(s => s.id !== id);
    setSessions(updatedSessions);
    setSessionToDelete(null);
    if (currentSessionId === id) {
      if (updatedSessions.length > 0) {
        setCurrentSessionId(updatedSessions[0].id);
      } else {
        createNewSession();
      }
    }
  };

  return (
    <>
      <aside
      className={`shrink-0 border-r border-white/10 bg-zinc-900 flex flex-col transition-all duration-300 ease-in-out overflow-hidden fixed md:relative z-40 h-full shadow-2xl md:shadow-none ${
        sidebarOpen ? 'w-72 translate-x-0' : 'w-72 md:w-0 -translate-x-full md:translate-x-0'
      }`}
    >
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10 shrink-0">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-400 uppercase">Chat Sessions</h2>
        <button
          onClick={() => setSidebarOpen(false)}
          className="p-1 rounded-md hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white cursor-pointer md:hidden"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="p-3 border-b border-white/10 shrink-0 space-y-3">
        <button
          onClick={createNewSession}
          className="w-full flex items-center justify-between p-2.5 rounded-lg border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-sm font-medium text-zinc-200 transition-colors cursor-pointer"
        >
          <span>New Chat</span>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <input
          type="text"
          placeholder="Search chats..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-xs text-zinc-300 placeholder-zinc-500 focus:outline-none focus:border-zinc-700"
        />
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 border-b border-white/10 min-h-[30vh] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-700/30 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-600/50 [&::-webkit-scrollbar-thumb]:rounded-full">
        {filteredSessions.length === 0 ? (
          <p className="text-xs text-zinc-600 text-center mt-6">No chats found</p>
        ) : (
          filteredSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => setCurrentSessionId(session.id)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg cursor-pointer group transition-all ${
                currentSessionId === session.id
                  ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/50'
                  : 'hover:bg-zinc-900/80 text-zinc-400 hover:text-zinc-200 border border-transparent'
              }`}
            >
              <div className="min-w-0 flex-1 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 shrink-0 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-xs font-medium truncate">{session.title}</p>
              </div>
              
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSessionToDelete(session.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all cursor-pointer shrink-0 ml-2"
                title="Delete chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      <div className="px-4 py-3 border-b border-white/10 shrink-0">
        <h2 className="text-[11px] font-semibold tracking-wide text-zinc-500 uppercase">Documents</h2>
      </div>

      {/* Upload area */}
      <div className="px-4 py-2 shrink-0">
        <label
          className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-lg border border-dashed transition-colors cursor-pointer group ${
            uploading
              ? 'border-zinc-500/40 bg-zinc-500/5'
              : 'border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
          {uploading ? (
            <div className="flex items-center gap-2 text-zinc-400">
              <svg className="w-4 h-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-[11px] font-medium">Processing…</span>
            </div>
          ) : (
            <span className="text-[11px] text-zinc-500 font-medium group-hover:text-zinc-300 transition-colors">Upload PDF</span>
          )}
        </label>
        {uploadStatus && uploadStatus.startsWith('Error') && (
          <p className="mt-1 text-[10px] text-center text-red-400 truncate">
            {uploadStatus}
          </p>
        )}
      </div>

      {/* Document list */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-700/30 hover:[&::-webkit-scrollbar-thumb]:bg-zinc-600/50 [&::-webkit-scrollbar-thumb]:rounded-full">
        {documents.length === 0 ? (
          <p className="text-[11px] text-zinc-600 text-center mt-2">No documents indexed</p>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.document_id}
              className="flex items-start gap-2.5 px-2.5 py-2 rounded-lg bg-zinc-800/20 ring-1 ring-white/5 hover:ring-white/10 transition-all group"
            >
              <div className="flex items-center justify-center w-6 h-6 rounded bg-zinc-700/30 text-zinc-400 shrink-0 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium text-zinc-300 truncate">{doc.filename}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">
                  {doc.page_count}p · {doc.chunk_count} chunks
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDocumentToDelete(doc.document_id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-red-500/20 text-zinc-500 hover:text-red-400 transition-all cursor-pointer mt-0.5"
                title="Delete document"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </aside>

      {/* Delete Confirmation Modal */}
      {sessionToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-lg font-semibold text-zinc-100">Delete Chat?</h3>
            <p className="text-sm text-zinc-400">
              Are you sure you want to delete this conversation? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 mt-2">
              <button
                onClick={() => setSessionToDelete(null)}
                className="px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-sm font-medium text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteSession(sessionToDelete)}
                className="px-4 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-sm font-medium transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
