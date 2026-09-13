import React from 'react';

export default function CitationModal({ selectedSource, setSelectedSource }) {
  if (!selectedSource) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200" 
        onClick={() => setSelectedSource(null)} 
      />
      <div 
        className="fixed inset-y-0 right-0 z-50 w-full md:w-[400px] bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300"
      >
        <div className="flex items-center justify-between px-4 py-4 md:px-6 md:py-5 border-b border-white/5 bg-zinc-900/50">
          <div>
            <h3 className="text-base font-semibold text-zinc-100">{selectedSource.filename}</h3>
            {selectedSource.page !== "N/A" && (
              <p className="text-xs font-medium text-zinc-500 mt-1">Page {selectedSource.page}</p>
            )}
          </div>
          <button onClick={() => setSelectedSource(null)} className="p-2 -mr-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto h-full">
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="whitespace-pre-wrap leading-relaxed text-zinc-300">{selectedSource.text}</p>
          </div>
        </div>
      </div>
    </>
  );
}
