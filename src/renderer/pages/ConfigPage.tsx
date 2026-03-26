import { useState, useEffect } from 'react';
import { useTimerChannel } from '../hooks/useTimerChannel';
import { timerService } from '../services/timerService';
import { TimerForm } from '../components/TimerForm';
import { MediaLibraryManager } from '../components/MediaLibraryManager';
import { ClipboardCopy, Timer, Library, MonitorPlay } from 'lucide-react';
import { entranceAnimationOptions, exitAnimationOptions, type ViewerPreferences } from '../types/viewer';
import { loadViewerPreferences, saveViewerPreferences } from '../lib/viewerPreferencesStorage';

export const ConfigPage = () => {
  const { state } = useTimerChannel();
  const [activeTab, setActiveTab] = useState<'timer' | 'library'>('timer');
  const [copied, setCopied] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    const saved = loadViewerPreferences();
    if (saved) {
      timerService.updateViewerPreferences(saved);
    }
  }, []);

  const handleUpdatePrefs = (partial: Partial<ViewerPreferences>) => {
    const full = { ...state.viewer, ...partial } as ViewerPreferences;
    timerService.updateViewerPreferences(partial);
    saveViewerPreferences(full);
  };

  const isDev = import.meta.env.DEV;
  const viewerUrl = isDev ? 'http://localhost:5173/#/viewer' : 'http://localhost:4005/#/viewer';

  const handleStartTimer = async (seconds: number) => {
    setIsBusy(true);
    try {
      await timerService.start(seconds);
    } finally {
      setIsBusy(false);
    }
  };

  const handleCancelTimer = async () => {
    setIsBusy(true);
    try {
      await timerService.cancel();
    } finally {
      setIsBusy(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(viewerUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTestBot = () => {
    timerService.test();
  };

  return (
    <div className="min-h-screen bg-[#0f0f13] text-zinc-100 flex pb-10">
      <aside className="w-64 border-r border-zinc-800/50 bg-[#141419] p-4 flex flex-col gap-2 relative z-10">
        <div className="px-2 mb-6 mt-2">
          <h1 className="text-xl font-bold tracking-tight text-white mb-1">XPzito</h1>
          <p className="text-xs text-zinc-500 font-medium">BOT CONTROL PANEL</p>
        </div>
        
        <nav className="flex flex-col gap-1">
          <button
            onClick={() => setActiveTab('timer')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'timer' 
                ? 'bg-indigo-500/10 text-indigo-400' 
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            <Timer className="w-4 h-4" />
            Cronômetro
          </button>
          <button
            onClick={() => setActiveTab('library')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'library' 
                ? 'bg-indigo-500/10 text-indigo-400' 
                : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
            }`}
          >
            <Library className="w-4 h-4" />
            Mídia & Biblioteca
          </button>
        </nav>
      </aside>

      <main className="flex-1 max-w-4xl p-8 overflow-y-auto">
        {activeTab === 'timer' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="bg-[#141419] border border-zinc-800/50 rounded-2xl p-6 shadow-xl shadow-black/20">
              <TimerForm 
                state={state} 
                onStart={handleStartTimer} 
                onCancel={handleCancelTimer} 
                isBusy={isBusy}
                onTest={handleTestBot}
                canTest={state.status === 'idle'}
              />
            </div>
            
            <div className="flex flex-col gap-8">
              <section className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                    <ClipboardCopy className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div>
                    <h2 className="text-sm font-medium text-indigo-300">Link do OBS (Browser Source)</h2>
                    <p className="text-xs text-indigo-400/60">Servidor operando localmente na porta 4005</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={viewerUrl} 
                    className="flex-1 bg-black/40 border border-indigo-500/20 rounded-lg px-3 py-2 text-sm text-indigo-200 font-mono outline-none selection:bg-indigo-500/30"
                  />
                  <button 
                    onClick={handleCopyLink}
                    className="px-4 py-2 bg-indigo-500 text-white rounded-lg text-sm font-medium hover:bg-indigo-600 transition-colors active:scale-95 whitespace-nowrap"
                  >
                    {copied ? 'Copiado!' : 'Copiar'}
                  </button>
                  <a
                    href={viewerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-zinc-700 text-white rounded-lg text-sm font-medium hover:bg-zinc-600 transition-colors active:scale-95 flex items-center justify-center whitespace-nowrap"
                  >
                    Abrir Viewer
                  </a>
                </div>
              </section>

              <section className="bg-[#141419] border border-zinc-800/50 rounded-2xl p-6">
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center">
                    <MonitorPlay className="w-4 h-4 text-zinc-400" />
                  </div>
                  <h2 className="text-sm font-medium text-zinc-300">Animações da Tela</h2>
                </div>

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs text-zinc-400 font-medium">Animação de Entrada</label>
                    <select
                      value={state.viewer?.entranceAnimation || 'slide-up'}
                      onChange={(e) => handleUpdatePrefs({ entranceAnimation: e.target.value as any })}
                      className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none"
                    >
                      {entranceAnimationOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-zinc-400 font-medium">Animação de Saída</label>
                      <select
                        value={state.viewer?.exitAnimation || 'spin-fall'}
                        onChange={(e) => handleUpdatePrefs({ exitAnimation: e.target.value as any })}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none"
                      >
                        {exitAnimationOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-zinc-400 font-medium">Atraso ao sair (ms após a fala)</label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={state.viewer?.exitDelayMs || 0}
                        onChange={(e) => handleUpdatePrefs({ exitDelayMs: parseInt(e.target.value, 10) || 0 })}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2.5 text-sm text-zinc-200 focus:outline-none"
                      />
                    </div>
                  </div>
              </section>

              <div className="flex items-center justify-center gap-4 mt-2">
                <a
                  href="https://github.com/juniodevs"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  juniodevs
                </a>
                <span className="text-zinc-700">•</span>
                <a
                  href="https://github.com/juniodevs/xpzito-v2"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub do Projeto
                </a>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'library' && (
          <div className="bg-[#141419] border border-zinc-800/50 rounded-2xl p-6 shadow-xl shadow-black/20">
            <MediaLibraryManager />
          </div>
        )}
      </main>
    </div>
  );
};

