import { useEffect, useState } from 'react';
import type { TimerState } from '@/types/timer';
import { initialTimerState } from '@/types/timer';

export const useTimerChannel = () => {
  const [state, setState] = useState<TimerState>(initialTimerState);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const handleState = (payload: TimerState) => setState(payload);

    if (typeof window !== 'undefined' && !window.api) {
      // Fallback para navegador web (OBS)
      const ws = new WebSocket('ws://localhost:4005');
      ws.onopen = () => setIsConnected(true);
      ws.onclose = () => setIsConnected(false);
      ws.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          if (data.channel === 'timer:update') {
            handleState(data.args[0]);
          } else if (data.channel === 'timer:sync') {
            if (data.payload) handleState(data.payload);
          } else if (data.channel === 'timer:finished') {
            setState(prev => ({ ...prev, status: 'triggered', running: false } as TimerState));
          }
        } catch (err) {}
      };
      return () => ws.close();
    }

    // Modo nativo Electron APP
    const unsubscribe = window.api.on('timer:update', handleState);

    // Initial state fetch
    window.api.invoke('timer:status').then(handleState);

    return () => {
      unsubscribe();
    };
  }, []);

  return { state, isConnected };
};
