import type { TimerState } from '@/types/timer';
import type { ViewerPreferencesPayload } from '@/types/viewer';

export const timerService = {
  start: (durationSeconds: number) => window.api.invoke('timer:start', { durationSeconds }),
  cancel: () => window.api.invoke('timer:cancel'),
  acknowledge: () => window.api.invoke('timer:ack-trigger'),
  current: () => window.api.invoke('timer:status'),
  updateViewerPreferences: (preferences: ViewerPreferencesPayload) =>
    window.api.invoke('timer:viewer-preferences', preferences),
  test: () => {
    if (typeof window !== 'undefined' && window.api) {
      window.api.send('timer:test');
    } else {
      const ws = new WebSocket('ws://localhost:4005');
      ws.onopen = () => {
        ws.send(JSON.stringify({ channel: 'timer:test' }));
        setTimeout(() => ws.close(), 1000);
      };
    }
  }
};
