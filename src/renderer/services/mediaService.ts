import type { AudioLibrary, BotLibrary } from '@/types/media';

const isWeb = typeof window !== 'undefined' && !window.api;
const SERVER_URL = 'http://localhost:4005';

export const mediaService = {
  audioLibrary: async () => {
    if (isWeb) return fetch(`${SERVER_URL}/api/audioLibrary`).then(r => r.json());
    return window.api.invoke('media:audioLibrary');
  },
  botLibrary: async () => {
    if (isWeb) return fetch(`${SERVER_URL}/api/botLibrary`).then(r => r.json());
    return window.api.invoke('media:botLibrary');
  },
  uploadSprite: async (variant: string, file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    return window.api.invoke('media:uploadSprite', { variant, fileName: file.name, buffer: arrayBuffer });
  },
  uploadTransition: async (direction: 'in' | 'out', file: File) => {
    const arrayBuffer = await file.arrayBuffer();
    return window.api.invoke('media:uploadTransition', { direction, fileName: file.name, buffer: arrayBuffer });
  },
  uploadRandomAudios: async (files: File[]) => {
    const filesData = await Promise.all(
      files.map(async (f) => ({
        fileName: f.name,
        buffer: await f.arrayBuffer(),
      }))
    );
    return window.api.invoke('media:uploadRandomAudios', { filesData });
  },
  deleteSprite: async (variant: string) => window.api.invoke('media:deleteSprite', { variant }),
  deleteTransition: async (direction: 'in' | 'out') => window.api.invoke('media:deleteTransition', { direction }),
  deleteRandomAudio: async (fileName: string) => window.api.invoke('media:deleteRandomAudio', { fileName })
};
