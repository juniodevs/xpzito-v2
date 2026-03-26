import React, { useState } from 'react';
import type { TimerState } from '@/types/timer';
import { useTimerForm } from '@/hooks/useTimerForm';
import { Play, Square, Timer, Activity } from 'lucide-react';

interface Props {
  state: TimerState;
  onStart: (seconds: number) => Promise<void>;
  onCancel: () => Promise<void>;
  isBusy?: boolean;
  onTest?: () => void;
  canTest?: boolean;
}

const quickPresets = [
  { label: '15s', value: 15 },
  { label: '30s', value: 30 },
  { label: '5m', value: 5 * 60 },
  { label: '20m', value: 20 * 60 }
];

export const TimerForm = ({ state, onStart, onCancel, isBusy = false, onTest, canTest = true }: Props) => {
  const {
    seconds,
    setSeconds,
    message,
    handleSubmit,
    handleCancel,
    startLabel,
    stateLabel
  } = useTimerForm({ state, onStart, onCancel });

  const [isTesting, setIsTesting] = useState(false);

  const disabled = isBusy;
  const isRunning = state.status !== 'idle';
  
  const handleTestClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onTest && !isTesting && canTest) {
      setIsTesting(true);
      onTest();
      
      // Cooldown visual no botão durante o preview (6 segundos)
      setTimeout(() => {
        setIsTesting(false);
      }, 6000);
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-indigo-400" />
          <h1 className="text-xl font-medium tracking-tight">Cronômetro do Bot</h1>
        </div>
        <p className="text-sm text-zinc-400">{stateLabel}</p>
      </header>

      <div className="flex flex-col gap-3">
        <label className="text-sm font-medium text-zinc-300" htmlFor="seconds">
          Tempo em segundos
        </label>
        <input
          id="seconds"
          type="number"
          min={5}
          step={5}
          value={seconds}
          disabled={disabled}
          className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-mono text-lg"
          onChange={(event) => {
            const value = Number(event.currentTarget.value);
            setSeconds(Number.isFinite(value) ? value : 0);
          }}
        />
      </div>

      <div className="grid grid-cols-4 gap-2">
        {quickPresets.map((preset) => (
          <button
            type="button"
            key={preset.label}
            disabled={disabled}
            className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 rounded-lg px-2 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setSeconds(preset.value)}
          >
            {preset.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 pt-4 border-t border-zinc-800/50">
        <button 
          type="submit" 
          disabled={disabled}
          className="flex items-center justify-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-4 py-3 font-medium transition-all active:scale-[0.98] disabled:opacity-50 shadow-sm shadow-indigo-500/10"
        >
          {startLabel}
        </button>
        <button
          type="button"
          disabled={disabled || !isRunning}
          onClick={handleCancel}
          className="flex items-center justify-center gap-2 bg-zinc-900/50 hover:bg-zinc-800 border-zinc-800 border text-zinc-300 rounded-lg px-4 py-3 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Square className="w-4 h-4" /> Cancelar
        </button>
        
        {onTest && (
          <div className="mt-2 text-center flex flex-col gap-2">
            <div className="border-t border-zinc-800/50 pt-4" />
            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Ferramentas de Teste</span>
            <button
              type="button"
              className={`flex items-center justify-center gap-2 border rounded-lg px-4 py-3 font-medium transition-all active:scale-[0.98]
                ${isTesting 
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 cursor-wait' 
                  : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20 shadow-sm shadow-emerald-500/5'}
                disabled:opacity-40 disabled:cursor-not-allowed`}
              onClick={handleTestClick}
              disabled={disabled || !canTest || isTesting}
            >
              {isTesting ? (
                <>
                  <Activity className="w-4 h-4 animate-pulse" /> Testando Animação...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Testar na Tela (Preview)
                </>
              )}
            </button>
            <p className="text-[10px] text-zinc-500 mt-1">Este teste executará a sequência no Viewer sem modificar o cronômetro.</p>
          </div>
        )}
      </div>

      {message && <p className="text-sm text-amber-400 mt-2 p-3 bg-amber-400/10 rounded-lg border border-amber-400/20">{message}</p>}
    </form>
  );
};
