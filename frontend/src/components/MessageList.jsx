import React from 'react';
import MessageBubble from './MessageBubble';

export default function MessageList({
  messages,
  isLoading,
  handlePromptClick,
  messagesEndRef,
  setSelectedSource
}) {
  return (
    <main className="flex-1 overflow-y-auto px-2 md:px-4 pt-4 md:pt-8 pb-32 space-y-4 md:space-y-6 scroll-smooth scrollbar-hide">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-zinc-500 select-none w-full">
          <div className="text-center">
            <h2 className="text-3xl font-semibold text-zinc-100 mb-8">How can I help you today?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto w-full">
            {[
              "Summarize my uploaded documents",
              "What are the latest AI news headlines?",
              "Explain how LangGraph agents work",
              "Find the current weather in Islamabad",
            ].map((promptText, idx) => (
              <button
                key={idx}
                onClick={() => handlePromptClick(promptText)}
                className="p-4 text-left bg-zinc-900/50 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer group"
              >
                <p className="text-sm font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">{promptText}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((msg, i) => (
        <MessageBubble
          key={i}
          msg={msg}
          i={i}
          setSelectedSource={setSelectedSource}
        />
      ))}

      {isLoading && (
        <div className="flex justify-start max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-medium text-zinc-400 mb-4 animate-pulse">
            <svg className="animate-spin h-3.5 w-3.5 text-zinc-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Agent is thinking...
          </div>
        </div>
      )}

      <div ref={messagesEndRef} className="h-4" />
    </main>
  );
}
