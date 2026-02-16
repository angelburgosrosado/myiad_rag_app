
import React from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}>
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isUser ? 'bg-blue-600' : 'bg-slate-800 border border-slate-700 text-slate-400'}`}>
          {isUser ? 'U' : 'AI'}
        </div>
        
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
            isUser 
              ? 'bg-blue-600 text-white rounded-tr-none' 
              : 'bg-slate-800/50 text-slate-200 border border-slate-700/50 rounded-tl-none shadow-sm'
          }`}>
            {message.content}
          </div>

          {message.sources && message.sources.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {message.sources.map((source, idx) => (
                <a 
                  key={idx}
                  href={source.uri || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-2 py-1 bg-slate-800/80 border border-slate-700 rounded-lg text-[10px] text-blue-400 hover:bg-slate-700 transition-all"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  {source.title || (source.uri ? new URL(source.uri).hostname : `Source ${idx + 1}`)}
                </a>
              ))}
            </div>
          )}

          <span className="text-[10px] text-slate-600 mt-1 uppercase tracking-tighter">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
