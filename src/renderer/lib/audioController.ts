import { Howl, Howler } from 'howler';

export interface AudioHandle {
  play: (src: string) => Promise<void>;
  stop: () => void;
  unlock: () => Promise<void>;
  isUnlocked: () => boolean;
  getVolumeLevel: () => number;
}

let currentHowl: Howl | null = null;
let analyser: AnalyserNode | null = null;
let dataArray: Uint8Array | null = null;

const disposeCurrent = () => {
  if (currentHowl) {
    currentHowl.stop();
    currentHowl.unload();
    currentHowl = null;
  }
};

const ensureContextActive = async () => {
  const ctx = Howler.ctx;
  if (ctx && ctx.state === 'suspended') {
    await ctx.resume();
  }
  if (ctx && !analyser) {
    analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    Howler.masterGain.connect(analyser);
    dataArray = new Uint8Array(analyser.frequencyBinCount);
  }
};

const isContextUnlocked = () => {
  const ctx = Howler.ctx;
  return Boolean(ctx && ctx.state === 'running');
};

export const audioController: AudioHandle = {
  play: async (src: string) => {
    await ensureContextActive();

    return new Promise<void>((resolve, reject) => {
      disposeCurrent();
      currentHowl = new Howl({
        src: [src],
        preload: true,
        volume: 0.85,
        onend: () => {
          disposeCurrent();
          resolve();
        },
        onloaderror: (_id, error) => {
          disposeCurrent();
          reject(error ?? new Error('Falha ao carregar áudio.'));
        },
        onplayerror: (_id, error) => {
          disposeCurrent();
          reject(error ?? new Error('Falha ao reproduzir áudio.'));
        }
      });
      currentHowl.play();
    });
  },
  stop: () => disposeCurrent(),
  unlock: async () => {
    await ensureContextActive();
  },
  isUnlocked: () => isContextUnlocked(),
  getVolumeLevel: () => {
    if (!analyser || !dataArray) return 0;
    analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i];
    }
    return sum / dataArray.length;
  }
};
