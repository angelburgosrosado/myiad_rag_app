
import React, { useRef } from 'react';
import { DocumentFile, RAGMode } from '../types';

interface SidebarProps {
  documents: DocumentFile[];
  onUpload: (files: FileList) => void;
  onRemoveDoc: (id: string) => void;
  onSummarize: () => void;
  mode: RAGMode;
  setMode: (mode: RAGMode) => void;
  isSummarizing: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  documents, 
  onUpload, 
  onRemoveDoc, 
  onSummarize, 
  mode, 
  setMode,
  isSummarizing
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="w-80 h-full bg-slate-900 border-r border-slate-800 flex flex-col p-4">
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold tracking-tight">Nexus RAG</h1>
      </div>

      <div className="mb-8">
        <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 block">
          Retrieval Mode
        </label>
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={() => setMode(RAGMode.LONG_CONTEXT)}
            className={`flex items-center gap-3 p-3 rounded-xl text-sm transition-all ${
              mode === RAGMode.LONG_CONTEXT 
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50' 
                : 'text-slate-400 hover:bg-slate-800 border border-transparent'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Long-Context RAG
          </button>
          <button
            onClick={() => setMode(RAGMode.SEARCH_GROUNDING)}
            className={`flex items-center gap-3 p-3 rounded-xl text-sm transition-all ${
              mode === RAGMode.SEARCH_GROUNDING 
                ? 'bg-blue-600/20 text-blue-400 border border-blue-500/50' 
                : 'text-slate-400 hover:bg-slate-800 border border-transparent'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Google Search Grounding
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Knowledge Base
          </label>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="text-blue-400 hover:text-blue-300 text-xs font-medium"
          >
            + Add Files
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            multiple 
            onChange={(e) => e.target.files && onUpload(e.target.files)}
          />
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 mb-4">
          {documents.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center">
              <p className="text-xs text-slate-600">No documents uploaded</p>
            </div>
          ) : (
            documents.map((doc) => (
              <div key={doc.id} className="group relative bg-slate-800/50 p-3 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-medium text-slate-300 truncate">{doc.name}</p>
                    <p className="text-[10px] text-slate-500 uppercase">{(doc.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button 
                  onClick={() => onRemoveDoc(doc.id)}
                  className="absolute top-2 right-2 p-1 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {documents.length > 0 && (
          <button
            onClick={onSummarize}
            disabled={isSummarizing}
            className="w-full py-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-2 mb-4"
          >
            {isSummarizing ? (
              <div className="w-3 h-3 border-2 border-slate-400 border-t-white rounded-full animate-spin"></div>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            )}
            Summarize Knowledge Base
          </button>
        )}
      </div>

      <div className="mt-auto pt-4 border-t border-slate-800">
        <div className="bg-slate-800/50 p-3 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
            <p className="text-xs text-slate-400 font-medium">Gemini context ready</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
