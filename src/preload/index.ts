import { contextBridge, ipcRenderer } from 'electron';

const api = {
  invoke: (channel: string, data?: any) => ipcRenderer.invoke(channel, data),
  on: (channel: string, callback: (...args: any[]) => void) => {
    const subscription = (_event: Electron.IpcRendererEvent, ...args: any[]) => callback(...args);
    ipcRenderer.on(channel, subscription);
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
  send: (channel: string, ...args: any[]) => ipcRenderer.send(channel, ...args)
};

contextBridge.exposeInMainWorld('api', api);

export type ElectronAPI = typeof api;
