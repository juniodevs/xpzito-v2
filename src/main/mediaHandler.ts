import path from 'path';
import fs from 'fs/promises';

// ─── Paths ────────────────────────────────────────────────────────────────────

let MEDIA_DIR: string;
let LOCAL_PORT: number;

export function initMediaHandler(mediaDir: string, localPort: number) {
  MEDIA_DIR = mediaDir;
  LOCAL_PORT = localPort;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Converts an absolute filesystem path inside MEDIA_DIR to a safe HTTP URL. */
export const safeURL = (p: string): string => {
  const rel = path.relative(MEDIA_DIR, p).replace(/\\/g, '/');
  return `http://localhost:${LOCAL_PORT}/media/${rel}`;
};

/** Lists non-hidden files in a directory. Returns [] if the dir doesn't exist. */
export const getDirFiles = async (dirPath: string): Promise<string[]> => {
  try {
    const files = await fs.readdir(dirPath);
    return files.filter((f) => !f.startsWith('.'));
  } catch {
    return [];
  }
};

// ─── Directory setup ──────────────────────────────────────────────────────────

export async function createMediaDirs(): Promise<void> {
  const dirs = ['audio/random', 'audio/transition', 'bot'];
  for (const dir of dirs) {
    await fs.mkdir(path.join(MEDIA_DIR, dir), { recursive: true });
  }
}

// ─── Audio library ────────────────────────────────────────────────────────────

export async function getAudioLibrary() {
  const transitionDir = path.join(MEDIA_DIR, 'audio', 'transition');

  const inFiles = await getDirFiles(transitionDir);
  const inFile = inFiles.find((f) => f.startsWith('in.'));
  const outFile = inFiles.find((f) => f.startsWith('out.'));

  const randoms = await getDirFiles(path.join(MEDIA_DIR, 'audio', 'random'));

  return {
    transitions: {
      in: inFile ? safeURL(path.join(MEDIA_DIR, 'audio', 'transition', inFile)) : '',
      out: outFile ? safeURL(path.join(MEDIA_DIR, 'audio', 'transition', outFile)) : ''
    },
    random: randoms.map((f) => safeURL(path.join(MEDIA_DIR, 'audio', 'random', f)))
  };
}

// ─── Bot library ──────────────────────────────────────────────────────────────

export async function getBotLibrary() {
  const sprites = await getDirFiles(path.join(MEDIA_DIR, 'bot'));
  return {
    sprites: sprites.map((name) => ({
      name: name.split('.')[0],
      url: safeURL(path.join(MEDIA_DIR, 'bot', name))
    }))
  };
}

// ─── Upload handlers ──────────────────────────────────────────────────────────

export async function uploadSprite(variant: string, fileName: string, buffer: ArrayBuffer) {
  const ext = path.extname(fileName);
  const dest = path.join(MEDIA_DIR, 'bot', variant + ext);
  await fs.writeFile(dest, Buffer.from(buffer));
  return getBotLibrary();
}

export async function uploadTransition(direction: 'in' | 'out', fileName: string, buffer: ArrayBuffer) {
  const ext = path.extname(fileName);
  const dir = path.join(MEDIA_DIR, 'audio', 'transition');
  const existing = await getDirFiles(dir);
  for (const f of existing) {
    if (f.startsWith(direction + '.')) {
      await fs.unlink(path.join(dir, f)).catch(() => {});
    }
  }
  await fs.writeFile(path.join(dir, direction + ext), Buffer.from(buffer));
  return getAudioLibrary();
}

export async function uploadRandomAudios(filesData: Array<{ fileName: string; buffer: ArrayBuffer }>) {
  for (const { fileName, buffer } of filesData) {
    const dest = path.join(MEDIA_DIR, 'audio', 'random', path.basename(fileName));
    await fs.writeFile(dest, Buffer.from(buffer));
  }
  return getAudioLibrary();
}

// ─── Delete handlers ──────────────────────────────────────────────────────────

export async function deleteSprite(variant: string) {
  const dir = path.join(MEDIA_DIR, 'bot');
  const files = await getDirFiles(dir);
  for (const f of files) {
    if (f.startsWith(variant + '.')) await fs.unlink(path.join(dir, f));
  }
  return getBotLibrary();
}

export async function deleteTransition(direction: 'in' | 'out') {
  const dir = path.join(MEDIA_DIR, 'audio', 'transition');
  const files = await getDirFiles(dir);
  for (const f of files) {
    if (f.startsWith(direction + '.')) await fs.unlink(path.join(dir, f));
  }
  return getAudioLibrary();
}

export async function deleteRandomAudio(fileName: string) {
  await fs.unlink(path.join(MEDIA_DIR, 'audio', 'random', fileName));
  return getAudioLibrary();
}
