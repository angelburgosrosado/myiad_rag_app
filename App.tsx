
import React, { useState, useEffect, useRef } from 'react';
import { Message, DocumentFile, RAGMode } from './types';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import { GeminiService } from './services/geminiService';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'model',
      content: 'Hello! I am Leafywell Wellness AI. Your documents are uploaded. You can now query them directly or click "Summarize Knowledge Base" for an overview.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [mode, setMode] = useState<RAGMode>(RAGMode.LONG_CONTEXT);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const geminiService = useRef(new GeminiService());

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleFileUpload = async (files: FileList) => {
    const newDocs: DocumentFile[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const text = await file.text();
      newDocs.push({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type,
        content: text,
        size: file.size
      });
    }

    setDocuments(prev => [...prev, ...newDocs]);
  };

  const handleSummarize = async () => {
    if (documents.length === 0 || isSummarizing) return;
    
    setIsSummarizing(true);
    setIsLoading(true);

    try {
      const summary = await geminiService.current.summarize(documents);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: `### Knowledge Base Summary\n\n${summary}`,
        timestamp: new Date()
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: "I couldn't generate a summary right now. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsSummarizing(false);
      setIsLoading(false);
    }
  };

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { text, sources } = await geminiService.current.chat(
        [...messages, userMessage],
        documents,
        mode
      );

      let formattedSources = [];
      if (mode === RAGMode.SEARCH_GROUNDING && sources) {
        formattedSources = sources
          .filter(chunk => chunk.web)
          .map((chunk, idx) => ({
            id: `s-${idx}`,
            title: chunk.web.title,
            uri: chunk.web.uri
          }));
      } else if (mode === RAGMode.LONG_CONTEXT && documents.length > 0) {
        // Find document names mentioned in the text
        formattedSources = documents
          .filter(doc => text.toLowerCase().includes(doc.name.split('.')[0].toLowerCase()))
          .map(doc => ({ id: doc.id, title: doc.name }));
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: text,
        timestamp: new Date(),
        sources: formattedSources
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "Sorry, I encountered an error. Please check your connectivity or API key.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 overflow-hidden">
      <Sidebar 
        documents={documents} 
        onUpload={handleFileUpload} 
        onRemoveDoc={removeDocument} 
        onSummarize={handleSummarize}
        mode={mode}
        setMode={setMode}
        isSummarizing={isSummarizing}
      />

      <main className="flex-1 flex flex-col relative min-w-0">
        <header className="h-16 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-400">Knowledge Assistant</span>
            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${documents.length > 0 ? 'bg-blue-500 animate-pulse' : 'bg-slate-700'}`}></div>
              <span className="text-xs text-slate-500 uppercase tracking-widest font-bold">
                {documents.length > 0 ? `${documents.length} Docs Indexed` : 'No context loaded'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <div className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full">
               <span className="text-[10px] text-blue-400 font-bold uppercase tracking-tighter">Gemini 3 Pro</span>
             </div>
          </div>
        </header>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto custom-scrollbar px-4 sm:px-8 py-8"
        >
          <div className="max-w-4xl mx-auto">
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex gap-3 items-center text-slate-500 animate-fade-in mb-6">
                <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-slate-600 border-t-blue-500 rounded-full animate-spin"></div>
                </div>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                  {isSummarizing ? 'Analyzing context...' : 'Gemini is thinking...'}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-8 bg-gradient-to-t from-slate-950 via-slate-950 to-transparent">
          <form 
            onSubmit={handleSubmit}
            className="max-w-4xl mx-auto relative group"
          >
            <div className="relative flex items-end bg-slate-900/50 border border-slate-800 rounded-2xl focus-within:border-blue-500/50 focus-within:ring-1 focus-within:ring-blue-500/20 transition-all shadow-2xl">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder={mode === RAGMode.LONG_CONTEXT ? "Ask a question about your files..." : "Search the internet..."}
                rows={1}
                className="w-full bg-transparent text-slate-200 py-4 px-4 pr-16 focus:outline-none resize-none min-h-[56px] max-h-40 custom-scrollbar text-sm"
              />
              <div className="absolute right-2 bottom-2">
                <button
                  type="submit"
                  disabled={isLoading || !input.trim()}
                  className={`p-2.5 rounded-xl transition-all ${
                    isLoading || !input.trim() 
                      ? 'bg-slate-800 text-slate-600' 
                      : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20'
                  }`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 px-2">
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                MyIAD Intelligence Layer v1.0
              </p>
              {documents.length > 0 && (
                <div className="flex items-center gap-1.5 text-[10px] text-blue-500/70 font-bold uppercase tracking-widest">
                  Long-Context window enabled
                </div>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default App;
