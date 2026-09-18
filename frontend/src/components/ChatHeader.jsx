import React from 'react';

export default function ChatHeader({ sidebarOpen, setSidebarOpen, documentCount }) {
  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 px-4 md:px-6 h-14 border-b border-white/10 bg-[#0A0A0F]/70 backdrop-blur-xl shrink-0">
      {/* Sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="p-2 -ml-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white cursor-pointer"
        title="Toggle documents"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-zinc-800 to-zinc-950 shadow-inner ring-1 ring-white/10">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-zinc-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      </div>
      <h1 className="text-sm font-medium tracking-tight text-zinc-100">
        Agentic AI Assistant
      </h1>

      {/* Document count badge */}
      {documentCount > 0 && (
        <span className="ml-auto px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-800 text-zinc-300 ring-1 ring-white/10">
          {documentCount} doc{documentCount !== 1 ? 's' : ''} indexed
        </span>
      )}
    </header>
  );
}
