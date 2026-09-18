import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function MessageBubble({ msg, setSelectedSource }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex items-start max-w-3xl mx-auto gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} group`}>
      {msg.role === 'ai' && (
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800 ring-1 ring-white/10 shrink-0 mt-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      )}
      <div className="relative group/bubble flex-1 max-w-[90%] md:max-w-[75%]">
        <div
          className={`px-3 py-2 md:px-4 md:py-3 text-[13px] md:text-sm leading-relaxed break-words ${
            msg.role === 'user'
              ? 'bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-purple-500/20 text-white rounded-2xl ml-auto'
              : 'glass-panel text-zinc-200 rounded-2xl w-full'
          }`}
        >
          {msg.role === 'ai' ? (
            <div className="prose prose-invert max-w-none prose-sm prose-p:leading-relaxed prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-white/10 prose-code:bg-zinc-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded text-zinc-300">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.text}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{msg.text}</div>
          )}

          {msg.sources && msg.sources.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {Array.from(new Map(msg.sources.map(item => [item.filename || item.title, item])).values()).map((src, idx) => {
                const isWeb = src.filename.startsWith('Web: ');
                const rawUrl = isWeb ? src.filename.replace('Web: ', '') : null;
                let displayTitle = src.filename;
                
                if (isWeb && rawUrl) {
                  try {
                    const urlObj = new URL(rawUrl);
                    displayTitle = urlObj.hostname.replace('www.', '');
                  } catch (e) {
                    displayTitle = rawUrl.length > 30 ? rawUrl.substring(0, 30) + '...' : rawUrl;
                  }
                }

                const showPage = !isWeb && src.page && src.page !== "N/A" && src.page !== "null" && src.page !== "undefined";

                return (
                  <button
                    key={idx}
                    onClick={() => setSelectedSource(src)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/50 border border-zinc-800/80 rounded-full hover:bg-zinc-800 transition-colors text-xs font-medium text-zinc-300 cursor-pointer w-auto max-w-[250px] group/btn"
                    title={isWeb ? rawUrl : src.filename}
                  >
                    {isWeb ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-blue-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                    <span className="truncate">
                      {displayTitle}
                    </span>
                    {showPage && (
                      <span className="text-zinc-500 shrink-0 border-l border-zinc-700 pl-1.5 ml-0.5">p.{src.page}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Action Bar */}
        <div className={`absolute flex items-center gap-2 mt-1 opacity-0 group-hover/bubble:opacity-100 transition-opacity ${msg.role === 'user' ? 'right-0' : 'left-0'}`}>
          <button
            onClick={handleCopy}
            className="flex items-center justify-center p-1.5 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Copy message"
          >
            {copied ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
          
          {msg.role === 'ai' && (
            <>
              <button
                className="flex items-center justify-center p-1.5 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Good response"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                </svg>
              </button>
              <button
                className="flex items-center justify-center p-1.5 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Bad response"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                </svg>
              </button>
              <button
                className="flex items-center justify-center p-1.5 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Regenerate response"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
