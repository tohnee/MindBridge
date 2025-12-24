import React, { useState } from 'react';
import { ContextSession } from '../types';
import { ChevronDown, ChevronUp, Bot, User, Copy, Check } from 'lucide-react';

interface ContextCardProps {
  session: ContextSession;
}

const ContextCard: React.FC<ContextCardProps> = ({ session }) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const formatPlatform = (p: string) => p.charAt(0).toUpperCase() + p.slice(1);
  
  const handleCopy = () => {
    // Generate Markdown representation
    const text = session.messages.map(m => `**${m.role.toUpperCase()}**: ${m.content}`).join('\n\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lastMessage = session.messages[session.messages.length - 1];

  return (
    <div className="bg-surface rounded-xl border border-slate-700 shadow-lg overflow-hidden transition-all duration-300">
      {/* Card Header */}
      <div className="p-4 bg-slate-800/50 border-b border-slate-700">
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${session.sourcePlatform === 'chatgpt' ? 'bg-green-500' : session.sourcePlatform === 'claude' ? 'bg-orange-500' : 'bg-blue-500'}`}></span>
            <h3 className="text-sm font-semibold text-slate-200">
              From {formatPlatform(session.sourcePlatform)}
            </h3>
          </div>
          <span className="text-xs text-slate-500">
            {new Date(session.lastUpdated).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        
        <p className="text-xs text-slate-400 font-mono truncate">
            {session.topic || session.sourceUrl}
        </p>
      </div>

      {/* Preview Section */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                {session.messages.length} Messages Captured
            </span>
            <button 
                onClick={handleCopy}
                className="text-xs flex items-center space-x-1 text-primary hover:text-blue-400 transition-colors"
            >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy MD'}</span>
            </button>
        </div>

        {/* Short Preview */}
        {!expanded && lastMessage && (
            <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 text-sm text-slate-300">
                <div className="flex items-center space-x-2 mb-1 text-xs text-slate-500 uppercase">
                    {lastMessage.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                    <span>Last Message</span>
                </div>
                <p className="line-clamp-3 opacity-80">{lastMessage.content}</p>
            </div>
        )}

        {/* Expanded View */}
        {expanded && (
             <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {session.messages.map((msg, idx) => (
                    <div key={idx} className={`p-3 rounded-lg text-sm border ${
                        msg.role === 'user' 
                            ? 'bg-slate-800 border-slate-700 ml-4' 
                            : 'bg-slate-900/50 border-slate-800 mr-4'
                    }`}>
                        <div className="flex items-center space-x-2 mb-1 text-xs text-slate-500 uppercase">
                            {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                            <span>{msg.role}</span>
                        </div>
                        <p className="whitespace-pre-wrap text-slate-300">{msg.content}</p>
                    </div>
                ))}
             </div>
        )}

        <button 
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-center space-x-1 py-2 text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 rounded transition-colors"
        >
            <span>{expanded ? 'Show Less' : 'Show Full Context'}</span>
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>
    </div>
  );
};

export default ContextCard;