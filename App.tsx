import React, { useEffect, useState } from 'react';
import { ContextSession, Platform } from './types';
import * as StorageService from './services/storageService';
import { 
    extractChatGPTContext, 
    extractClaudeContext, 
    extractGeminiContext, 
    injectContentIntoPage,
    ExtractionResult 
} from './services/injection';
import ContextCard from './components/ContextCard';
import { ArrowRightLeft, Zap, ExternalLink, ShieldAlert, AlertTriangle, RefreshCw } from 'lucide-react';

// Declare chrome API for TypeScript
declare var chrome: any;

const App: React.FC = () => {
  const [session, setSession] = useState<ContextSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>('Ready');
  const [currentTab, setCurrentTab] = useState<{ id: number, url: string, platform: Platform | null } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load context from storage on mount
  useEffect(() => {
    refreshContext();
    checkCurrentTab();
  }, []);

  // Poll for tab changes to update UI state
  useEffect(() => {
    const interval = setInterval(checkCurrentTab, 2000);
    return () => clearInterval(interval);
  }, []);

  const checkCurrentTab = async () => {
    if (typeof chrome === 'undefined' || !chrome.tabs) return;

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) return;

    let platform: Platform | null = null;
    if (tab.url.includes('chatgpt.com')) platform = 'chatgpt';
    else if (tab.url.includes('claude.ai')) platform = 'claude';
    else if (tab.url.includes('gemini.google.com')) platform = 'gemini';

    setCurrentTab({ id: tab.id, url: tab.url, platform });
  };

  const refreshContext = async () => {
    try {
      const data = await StorageService.getContext();
      setSession(data);
    } catch (e) {
      console.error("Failed to load context", e);
    }
  };

  const handleGrabContext = async () => {
    if (!currentTab || !currentTab.platform) {
        setErrorMsg("Not on a supported AI platform (ChatGPT, Claude, Gemini)");
        return;
    }

    setLoading(true);
    setStatus(`Scanning ${currentTab.platform}...`);
    setErrorMsg(null);

    let func;
    switch (currentTab.platform) {
        case 'chatgpt': func = extractChatGPTContext; break;
        case 'claude': func = extractClaudeContext; break;
        case 'gemini': func = extractGeminiContext; break;
        default: func = null;
    }

    if (!func) {
        setLoading(false);
        return;
    }

    try {
        const results = await chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            func: func,
        });

        const result: ExtractionResult = results[0]?.result;

        if (result && result.success && result.messages.length > 0) {
            const newSession: ContextSession = {
                sourcePlatform: currentTab.platform,
                sourceUrl: currentTab.url,
                topic: result.topic,
                messages: result.messages,
                lastUpdated: Date.now()
            };
            await StorageService.saveContext(newSession);
            setSession(newSession);
            setStatus('Captured');
        } else {
            setErrorMsg("No messages found. Are you in a conversation?");
            setStatus('Failed');
        }
    } catch (err: any) {
        console.error(err);
        setErrorMsg("Failed to access page. Refresh the tab and try again.");
    } finally {
        setLoading(false);
    }
  };

  const handleSync = async () => {
    if (!session || !currentTab || !currentTab.platform) return;
    
    setLoading(true);
    setStatus('Syncing...');
    setErrorMsg(null);

    // Prepare text blob
    const promptHeader = `[SYSTEM: The following is context from a previous conversation on ${session.sourcePlatform}. Please digest it to continue the discussion.]\n\n`;
    const body = session.messages.map(m => `**${m.role.toUpperCase()}**: ${m.content}`).join('\n\n');
    const fullPayload = promptHeader + body;

    try {
        await chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            func: injectContentIntoPage,
            args: [currentTab.platform, fullPayload]
        });
        setStatus('Done!');
        setTimeout(() => setStatus('Ready'), 2000);
    } catch (err) {
        console.error(err);
        setErrorMsg("Failed to inject. Is the input box visible?");
    } finally {
        setLoading(false);
    }
  };

  const handleClear = async () => {
      await StorageService.clearContext();
      setSession(null);
      setStatus('Memory Cleared');
  };

  const isPlatformSupported = !!currentTab?.platform;

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col font-sans">
      
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="bg-gradient-to-tr from-blue-500 to-purple-600 p-2 rounded-lg">
            <ArrowRightLeft size={20} className="text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">MindBridge</h1>
        </div>
        <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-yellow-400 animate-pulse' : (status === 'Ready' ? 'bg-green-400' : 'bg-slate-500')}`}></div>
            <span className="text-xs text-slate-400">{status}</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 flex flex-col space-y-4 overflow-y-auto">
        
        {/* Error Banner */}
        {errorMsg && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 p-3 rounded-lg text-xs flex items-center space-x-2">
                <AlertTriangle size={14} />
                <span>{errorMsg}</span>
            </div>
        )}

        {/* Current Tab Indicator */}
        <div className="flex items-center justify-between text-xs text-slate-500 bg-surface p-2 rounded-lg border border-slate-800">
            <div className="flex items-center space-x-2">
                <ExternalLink size={12} />
                <span>Current Tab:</span>
            </div>
            <span className={`font-mono ${isPlatformSupported ? 'text-green-400' : 'text-slate-500'}`}>
                {currentTab?.platform ? currentTab.platform.toUpperCase() : 'Unknown Site'}
            </span>
        </div>

        {/* Action Button: Grab Context */}
        <button
            onClick={handleGrabContext}
            disabled={loading || !isPlatformSupported}
            className={`w-full py-3 rounded-xl border border-dashed border-slate-700 flex items-center justify-center space-x-2 transition-all ${
                isPlatformSupported && !loading
                ? 'hover:bg-slate-800 hover:border-slate-500 text-slate-300' 
                : 'opacity-50 cursor-not-allowed text-slate-600'
            }`}
        >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>{loading ? 'Processing...' : 'Capture Context from Tab'}</span>
        </button>
        
        {/* Context Card */}
        {session ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
                <span>Stored Context</span>
                <button onClick={handleClear} className="hover:text-red-400 transition-colors text-xs">Clear</button>
             </div>
             <ContextCard session={session} />
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/30">
            <ShieldAlert className="text-slate-600 mb-3" size={24} />
            <p className="text-xs text-slate-500">
              No context stored. Visit ChatGPT, Claude, or Gemini and click "Capture".
            </p>
          </div>
        )}

        {/* Action Button: Sync */}
        <div className="mt-auto pt-2">
             <button
                onClick={handleSync}
                disabled={loading || !session || !isPlatformSupported}
                className="group w-full relative overflow-hidden bg-primary hover:bg-blue-600 disabled:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl shadow-lg shadow-blue-900/20 transition-all active:scale-[0.98]"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <div className="flex items-center justify-center space-x-2">
                    <Zap size={18} className={`${loading && session ? 'animate-spin' : ''}`} />
                    <span>Paste to {currentTab?.platform ? currentTab.platform.toUpperCase() : 'Current Tab'}</span>
                </div>
             </button>
        </div>
      </main>
    </div>
  );
};

export default App;