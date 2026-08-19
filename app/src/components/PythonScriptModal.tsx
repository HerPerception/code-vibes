import React, { useState, useEffect } from 'react';
import {
  Code2,
  Copy,
  Check,
  Download,
  Terminal,
  Server,
  Layers,
  Sparkles,
  X,
  Play,
  FileCode,
} from 'lucide-react';

interface PythonScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PythonScriptModal: React.FC<PythonScriptModalProps> = ({ isOpen, onClose }) => {
  const [pythonCode, setPythonCode] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'main_py' | 'instructions' | 'protocol'>('main_py');

  useEffect(() => {
    if (isOpen) {
      fetch('/api/python-code')
        .then((res) => res.json())
        .then((data) => {
          if (data.code) setPythonCode(data.code);
        })
        .catch(() => {
          // Fallback code if API is not yet loaded
          setPythonCode(`# ConnectFlow FastAPI WebSocket Server\n# Please refer to main.py in the root directory`);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      id="pythonScriptModal"
      className="fixed inset-0 bg-black/70 dark:bg-black/85 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200"
    >
      <div className="bg-surface-container-lowest dark:bg-surface rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] border border-outline-variant flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-outline-variant flex justify-between items-center bg-surface-variant/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-primary">
              <FileCode className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-on-surface">
                  Python WebSocket Backend (FastAPI)
                </h2>
                <span className="bg-indigo-500/10 text-primary text-[11px] font-semibold px-2 py-0.5 rounded-full border border-primary/20">
                  main.py
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Complete, production-ready asynchronous Python WebSocket server for instantaneous chat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary/90 text-on-primary text-xs font-semibold shadow-xs transition-all active:scale-95"
              title="Copy entire Python script to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
            <button
              onClick={() => handleDownload('main.py', pythonCode)}
              className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg bg-surface-variant hover:bg-surface-container-high border border-outline-variant text-on-surface text-xs font-semibold transition-all flex items-center gap-1.5"
              title="Download main.py"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-variant transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 border-b border-outline-variant/60 bg-surface">
          <button
            onClick={() => setActiveTab('main_py')}
            className={`pb-2.5 px-2 text-xs font-semibold transition-all border-b-2 ${
              activeTab === 'main_py'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Python Source Code (main.py)
          </button>
          <button
            onClick={() => setActiveTab('instructions')}
            className={`pb-2.5 px-2 text-xs font-semibold transition-all border-b-2 ${
              activeTab === 'instructions'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Quick Start & CLI Setup
          </button>
          <button
            onClick={() => setActiveTab('protocol')}
            className={`pb-2.5 px-2 text-xs font-semibold transition-all border-b-2 ${
              activeTab === 'protocol'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            WebSocket Protocol Spec
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed select-text">
          {activeTab === 'main_py' && (
            <pre className="overflow-x-auto p-4 bg-slate-900/90 rounded-xl border border-slate-800 text-slate-200">
              <code>{pythonCode}</code>
            </pre>
          )}

          {activeTab === 'instructions' && (
            <div className="space-y-6 text-sm font-sans">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-2">
                  <Terminal className="w-4 h-4" />
                  <span>Step 1: Install Python Dependencies</span>
                </div>
                <p className="text-slate-400 text-xs mb-3">
                  Install FastAPI, Uvicorn (ASGI server), and WebSockets via pip:
                </p>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-indigo-300 flex justify-between items-center">
                  <code>pip install fastapi uvicorn websockets pydantic</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        'pip install fastapi uvicorn websockets pydantic'
                      );
                    }}
                    className="p-1 hover:text-white"
                    title="Copy command"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold mb-2">
                  <Play className="w-4 h-4" />
                  <span>Step 2: Run the WebSocket Server</span>
                </div>
                <p className="text-slate-400 text-xs mb-3">
                  Start the server with hot-reloading on port 8000:
                </p>
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs text-indigo-300 flex justify-between items-center">
                  <code>uvicorn main:app --host 0.0.0.0 --port 8000 --reload</code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        'uvicorn main:app --host 0.0.0.0 --port 8000 --reload'
                      );
                    }}
                    className="p-1 hover:text-white"
                    title="Copy command"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5">
                <div className="flex items-center gap-2 text-amber-400 font-semibold mb-2">
                  <Server className="w-4 h-4" />
                  <span>Step 3: Connect Any Client or Frontend</span>
                </div>
                <ul className="list-disc list-inside text-xs text-slate-300 space-y-1.5">
                  <li>
                    Browser client URL:{' '}
                    <code className="text-amber-300">ws://localhost:8000/ws/general?user=Alex</code>
                  </li>
                  <li>
                    Interactive Swagger Docs:{' '}
                    <code className="text-amber-300">http://localhost:8000/docs</code>
                  </li>
                  <li>
                    REST Message History:{' '}
                    <code className="text-amber-300">http://localhost:8000/api/rooms/general/messages</code>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'protocol' && (
            <div className="space-y-4 text-xs font-sans text-slate-300">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <h3 className="font-bold text-white mb-1">1. Connection Lifecycle</h3>
                <p className="text-slate-400 text-xs mb-2">
                  Client initiates WebSocket handshake with query parameters for room and user name.
                </p>
                <code className="block bg-slate-950 p-2.5 rounded border border-slate-800 text-indigo-300 font-mono">
                  GET /ws/{'{room_id}'}?user={'Alex+Chen'}&avatar={'https://...'}
                </code>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <h3 className="font-bold text-white mb-1">2. Sending a Chat Message</h3>
                <pre className="bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-200 font-mono text-[11px] overflow-x-auto">
{`{
  "type": "message",
  "msg": "Hello team, the design specs look great!",
  "id": "msg-12345"
}`}
                </pre>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <h3 className="font-bold text-white mb-1">3. Typing Indicators</h3>
                <pre className="bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-200 font-mono text-[11px] overflow-x-auto">
{`{
  "type": "typing",
  "is_typing": true
}`}
                </pre>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <h3 className="font-bold text-white mb-1">4. Emoji Reactions</h3>
                <pre className="bg-slate-950 p-2.5 rounded border border-slate-800 text-slate-200 font-mono text-[11px] overflow-x-auto">
{`{
  "type": "reaction",
  "message_id": "msg-12345",
  "emoji": "🚀"
}`}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-surface border-t border-outline-variant flex justify-between items-center text-xs text-on-surface-variant font-sans">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Tested with FastAPI 0.110+ & Uvicorn 0.28+</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-surface-variant hover:bg-surface-container-high border border-outline-variant font-semibold text-on-surface"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
