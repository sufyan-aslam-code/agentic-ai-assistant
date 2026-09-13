import React, { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function SourceModal({ selectedSource, setSelectedSource }) {
  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedSource(null);
      }
    };
    if (selectedSource) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedSource, setSelectedSource]);

  if (!selectedSource) return null;

  const isWeb = selectedSource.filename.startsWith('Web: ');
  const url = isWeb ? selectedSource.filename.replace('Web: ', '') : null;
  const title = isWeb ? url : selectedSource.filename;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity animate-in fade-in"
      onClick={() => setSelectedSource(null)}
    >
      <div 
        className="relative flex flex-col max-h-[85vh] w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl p-6 shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-800 shrink-0">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${isWeb ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                {isWeb ? 'Web Citation' : 'Document Chunk'}
              </span>
            </div>
            <h3 className="text-sm font-semibold text-zinc-100 truncate max-w-[250px] md:max-w-[400px]">
              {title}
            </h3>
            {!isWeb && selectedSource.page !== "N/A" && (
              <p className="text-xs font-medium text-zinc-500">Page {selectedSource.page}</p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {isWeb && url && (
              <a 
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-medium text-blue-400 hover:text-blue-300 hover:underline px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 transition-colors flex items-center gap-1"
              >
                Open Link ↗
              </a>
            )}
            <button 
              onClick={() => setSelectedSource(null)} 
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="max-h-[60vh] overflow-y-auto bg-zinc-950 p-4 rounded-lg border border-zinc-800 text-xs text-zinc-300 shadow-inner prose prose-invert prose-sm max-w-none leading-relaxed [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-zinc-700 [&::-webkit-scrollbar-thumb]:rounded-full">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {selectedSource.text}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
