import React from 'react';

export default function ChatInput({
  input,
  setInput,
  isLoading,
  uploading,
  handleSubmit,
  inputRef,
  handleAbort
}) {
  return (
    <footer className="absolute bottom-0 w-full bg-gradient-to-t from-[#0A0A0F] to-transparent p-3 pb-4 md:p-4 md:pb-6 z-10 border-t border-white/5">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="relative flex items-center w-full glass-panel rounded-full ring-1 ring-transparent focus-within:ring-purple-500/50 transition-all shadow-lg shadow-purple-900/10 pl-4 py-1">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (input.trim() && !isLoading) handleSubmit(e);
              }
            }}
            rows={1}
            placeholder={uploading ? "Uploading..." : "Message Agentic AI..."}
            className="flex-1 px-3 py-3.5 bg-transparent text-zinc-100 placeholder-zinc-500 focus:outline-none text-sm resize-none max-h-[200px] min-h-[44px] scrollbar-hide leading-relaxed"
            style={{ height: 'auto' }}
          />
          
          {isLoading ? (
            <button
              type="button"
              onClick={handleAbort}
              className="flex items-center justify-center w-8 h-8 mr-2 rounded-full bg-zinc-700 text-white transition-all hover:scale-105 active:scale-95 cursor-pointer"
              title="Stop generating"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                <rect x="5" y="5" width="10" height="10" />
              </svg>
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className={`flex items-center justify-center w-9 h-9 mr-1 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white transition-all shadow-lg cursor-pointer ${
                !input.trim() ? 'opacity-40 cursor-not-allowed' : 'opacity-100 hover:scale-105 hover:shadow-purple-500/30 active:scale-95'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          )}
        </form>
        <div className="text-center mt-2">
          <span className="text-[10px] text-zinc-600">AI can make mistakes. Verify important information.</span>
        </div>
      </div>
    </footer>
  );
}
