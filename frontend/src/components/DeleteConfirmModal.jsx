import React from 'react';

export default function DeleteConfirmModal({ documentToDelete, setDocumentToDelete, handleDeleteConfirm }) {
  if (!documentToDelete) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setDocumentToDelete(null)}>
      <div className="relative w-full max-w-sm flex flex-col glass-panel rounded-2xl p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-lg font-medium text-zinc-100 mb-2">Delete document?</h3>
        <p className="text-sm text-zinc-400 mb-6">
          This will remove all associated embeddings from the vector database. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={() => setDocumentToDelete(null)}
            className="px-4 py-2 text-sm font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              handleDeleteConfirm(documentToDelete);
              setDocumentToDelete(null);
            }}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors cursor-pointer"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
