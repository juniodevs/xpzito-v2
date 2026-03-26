import { useEffect, useState } from 'react';
import { Image, Music, Trash2, Upload, AlertCircle, CheckCircle } from 'lucide-react';
import { mediaService } from '@/services/mediaService';
import type { AudioLibrary, BotLibrary } from '@/types/media';

const getFilename = (url?: string) => {
  if (!url) return 'Nenhum';
  try {
    return decodeURIComponent(url).split('/').pop() || 'Desconhecido';
  } catch {
    return url;
  }
};

export const MediaLibraryManager = () => {
  const [audioLib, setAudioLib] = useState<AudioLibrary | null>(null);
  const [botLib, setBotLib] = useState<BotLibrary | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'error' | 'success' } | null>(null);

  // Estados EXLÍCITOS de arquivos controlados puramente pelo React (Sem ref, sem forms, sem overlays)
  const [spriteVariant, setSpriteVariant] = useState('idle');
  const [spriteFile, setSpriteFile] = useState<File | null>(null);
  const [transitionIn, setTransitionIn] = useState<File | null>(null);
  const [transitionOut, setTransitionOut] = useState<File | null>(null);
  const [randomFiles, setRandomFiles] = useState<File[]>([]);

  const loadData = async () => {
    try {
      const [a, b] = await Promise.all([mediaService.audioLibrary(), mediaService.botLibrary()]);
      setAudioLib(a);
      setBotLib(b);
    } catch (e) {
      showMsg('Erro ao carregar dados do servidor.', 'error');
    }
  };

  useEffect(() => { loadData(); }, []);

  const showMsg = (text: string, type: 'error' | 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleUploadSprite = async () => {
    if (!spriteFile) return showMsg('Por favor, selecione um arquivo de imagem.', 'error');
    setBusy(true);
    try {
      const res = await mediaService.uploadSprite(spriteVariant, spriteFile);
      setBotLib(res);
      setSpriteFile(null); // Limpa o estado
      showMsg('Sprite atualizada com sucesso!', 'success');
    } catch (e: any) {
      showMsg(e.message || 'Erro ao enviar sprite', 'error');
    } finally { setBusy(false); }
  };

  const handleUploadTransition = async (type: 'in' | 'out') => {
    const file = type === 'in' ? transitionIn : transitionOut;
    if (!file) return showMsg('Por favor, selecione um áudio.', 'error');
    setBusy(true);
    try {
      const res = await mediaService.uploadTransition(type, file);
      setAudioLib(res);
      if (type === 'in') setTransitionIn(null); else setTransitionOut(null);
      showMsg(`Transição (${type.toUpperCase()}) atualizada!`, 'success');
    } catch (e: any) {
      showMsg(e.message || 'Erro ao enviar transição', 'error');
    } finally { setBusy(false); }
  };

  const handleRemoveTransition = async (type: 'in' | 'out') => {
    setBusy(true);
    try {
      const res = await mediaService.deleteTransition(type);
      setAudioLib(res);
      showMsg(`Transição (${type.toUpperCase()}) removida.`, 'success');
    } catch (e: any) {
      showMsg(e.message || 'Erro ao remover', 'error');
    } finally { setBusy(false); }
  };

  const handleUploadRandom = async () => {
    if (!randomFiles.length) return showMsg('Selecione pelo menos um arquivo de áudio.', 'error');
    setBusy(true);
    try {
      const res = await mediaService.uploadRandomAudios(randomFiles);
      setAudioLib(res);
      setRandomFiles([]); // Limpa após o envio
      showMsg(`${randomFiles.length} áudio(s) adicionado(s)!`, 'success');
    } catch (e: any) {
      showMsg(e.message || 'Erro ao enviar áudios', 'error');
    } finally { setBusy(false); }
  };

  const handleRemoveRandom = async (url: string) => {
    setBusy(true);
    try {
      const res = await mediaService.deleteRandomAudio(getFilename(url));
      setAudioLib(res);
      showMsg('Áudio removido.', 'success');
    } catch (e: any) {
      showMsg(e.message || 'Erro ao remover', 'error');
    } finally { setBusy(false); }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="border-b border-zinc-800/50 pb-4">
        <h1 className="text-xl font-medium tracking-tight text-white flex items-center gap-2">
          <Image className="w-5 h-5 text-indigo-400" />
          Mídia & Biblioteca 2.0
        </h1>
        <p className="text-sm text-zinc-400 mt-1">Lógica refeita! Funciona com uploads diretos e imediatos.</p>
      </header>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-3 ${message.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
          {message.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* 1. SPRITES DO BOT */}
      <section className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-zinc-200">1. Sprites do Bot (Imagens)</h2>
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <label className="text-xs text-zinc-400 font-medium">Variação</label>
            <select 
              value={spriteVariant} 
              onChange={e => setSpriteVariant(e.target.value)}
              disabled={busy}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg p-2.5 text-sm text-white"
            >
              <option value="idle">Idle (Parado)</option>
              <option value="talking">Talking (Falando)</option>
            </select>
          </div>
          
          <div className="flex-[2] space-y-2">
            <label className="text-xs text-zinc-400 font-medium">Selecionar Arquivo</label>
            <input 
              type="file" 
              accept="image/png, image/gif, image/jpeg"
              disabled={busy}
              onChange={e => {
                if (e.target.files?.length) {
                  setSpriteFile(e.target.files[0]);
                } else {
                  setSpriteFile(null);
                }
              }}
              className="block w-full text-sm text-zinc-400 bg-zinc-800 border border-zinc-700 rounded-lg cursor-pointer file:cursor-pointer file:mr-4 file:py-2.5 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600 transition-all"
            />
            {spriteFile && <p className="text-xs text-indigo-400 font-medium">Pronto para enviar: {spriteFile.name}</p>}
          </div>
        </div>

        <div className="flex justify-end border-b border-zinc-800 pb-4">
          <button onClick={handleUploadSprite} disabled={busy || !spriteFile} className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2">
            <Upload className="w-4 h-4" /> Atualizar Imagem
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-2">
          {['idle', 'talking'].map((variant) => {
             // O backend retorna BotLibrary como { sprites: [ { name: 'idle', url: '...' }, { name: 'talking', url: '...' } ] }
             // Mas a UI antiga tentava acessar direto como botLib.sprites.idle (formato de objeto).
             // Adicionei essa busca pelo Array para garantir que acha a URL correta no padrão novo
             const spriteData = botLib?.sprites?.find(s => s.name === variant);
             const url = spriteData?.url || '';
             
             return (
              <div key={variant} className="bg-black/30 border border-zinc-800/80 p-3 rounded-lg flex justify-between items-center gap-2">
                <div className="min-w-0 flex-1">
                   <p className="text-xs text-zinc-500 font-bold uppercase">{variant}</p>
                   <p className="text-sm truncate opacity-70" title={getFilename(url)}>{getFilename(url)}</p>
                </div>
                {url ? (
                  <img src={url} className="h-10 w-10 object-contain rounded bg-zinc-900 border border-zinc-700/50 p-1 shrink-0" alt={variant} />
                ) : (
                  <span className="text-xs text-zinc-600 bg-zinc-900 px-2 py-1 rounded">Vazio</span>
                )}
              </div>
             );
          })}
        </div>
      </section>

      {/* 2. TRANSIÇÕES */}
      <section className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-zinc-200">2. Áudios de Transição</h2>
        
        {/* IN */}
        <div className="flex flex-col md:flex-row gap-4 items-end border-b border-zinc-800/80 pb-5">
          <div className="flex-1 space-y-2 w-full">
            <label className="text-xs text-zinc-400 font-medium block">Entrada (IN) - Atual: <span className="text-zinc-300">{getFilename(audioLib?.transitions?.in)}</span></label>
            <input 
              type="file" accept="audio/*" disabled={busy}
              onChange={e => setTransitionIn(e.target.files?.[0] || null)}
              className="block w-full text-sm text-zinc-400 bg-zinc-800 border border-zinc-700 rounded-lg cursor-pointer file:cursor-pointer file:mr-4 file:py-2.5 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600"
            />
            {transitionIn && <p className="text-xs text-indigo-400 font-medium">Pronto para enviar: {transitionIn.name}</p>}
          </div>
          <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
            <button onClick={() => handleUploadTransition('in')} disabled={busy || !transitionIn} className="flex-1 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium">Salvar</button>
            <button onClick={() => handleRemoveTransition('in')} disabled={busy || !audioLib?.transitions?.in} className="bg-red-500/10 text-red-500 disabled:opacity-50 px-3 py-2.5 rounded-lg hover:bg-red-500/20 tooltip" title="Excluir"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>

        {/* OUT */}
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-2 w-full">
            <label className="text-xs text-zinc-400 font-medium block">Saída (OUT) - Atual: <span className="text-zinc-300">{getFilename(audioLib?.transitions?.out)}</span></label>
            <input 
              type="file" accept="audio/*" disabled={busy}
              onChange={e => setTransitionOut(e.target.files?.[0] || null)}
              className="block w-full text-sm text-zinc-400 bg-zinc-800 border border-zinc-700 rounded-lg cursor-pointer file:cursor-pointer file:mr-4 file:py-2.5 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600"
            />
            {transitionOut && <p className="text-xs text-indigo-400 font-medium">Pronto para enviar: {transitionOut.name}</p>}
          </div>
          <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
            <button onClick={() => handleUploadTransition('out')} disabled={busy || !transitionOut} className="flex-1 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium">Salvar</button>
            <button onClick={() => handleRemoveTransition('out')} disabled={busy || !audioLib?.transitions?.out} className="bg-red-500/10 text-red-500 disabled:opacity-50 px-3 py-2.5 rounded-lg hover:bg-red-500/20 tooltip" title="Excluir"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>
      </section>

      {/* 3. RANDOM AUDIOS */}
      <section className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-5 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-zinc-200">3. Falas Aleatórias</h2>
        
        <div className="bg-black/20 p-4 rounded-lg border border-zinc-800/80">
           <label className="text-xs text-zinc-400 font-medium block mb-2">Adicionar novos áudios (Multi-seleção permitida)</label>
           <input 
              type="file" accept="audio/*" multiple disabled={busy}
              onChange={e => {
                if (e.target.files) {
                  setRandomFiles(Array.from(e.target.files));
                } else {
                  setRandomFiles([]);
                }
              }}
              className="block w-full text-sm text-zinc-400 bg-zinc-800 border border-zinc-700 rounded-lg cursor-pointer file:cursor-pointer file:mr-4 file:py-2.5 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-indigo-500 file:text-white hover:file:bg-indigo-600"
            />
            {randomFiles.length > 0 && <p className="text-xs text-indigo-400 font-medium mt-2">Pronto para enviar: {randomFiles.length} arquivo(s) mapeados.</p>}
            
            <button onClick={handleUploadRandom} disabled={busy || randomFiles.length === 0} className="w-full mt-4 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium flex justify-center items-center gap-2">
               <Music className="w-4 h-4" /> Subir Para a Lista Aleatória
            </button>
        </div>

        <div className="mt-2">
          <div className="flex justify-between items-center mb-3">
             <h3 className="text-xs text-zinc-500 font-semibold">CADASTRADOS NO SERVIDOR ({audioLib?.random?.length || 0})</h3>
          </div>
          <div className="max-h-56 overflow-y-auto bg-zinc-800/30 rounded-lg border border-zinc-800">
             {audioLib?.random?.map((url, i) => (
                <div key={i} className="flex justify-between items-center p-3 border-b border-zinc-800/50 hover:bg-black/20 transition-colors last:border-0">
                   <span className="text-sm text-zinc-300 font-mono truncate pr-4">{getFilename(url)}</span>
                   <button onClick={() => handleRemoveRandom(url)} disabled={busy} className="text-zinc-500 hover:text-red-400 p-1"><Trash2 className="w-4 h-4" /></button>
                </div>
             ))}
             {(!audioLib?.random || audioLib.random.length === 0) && (
               <p className="p-5 text-center text-zinc-500 text-sm">Nenhum áudio inserido ainda.</p>
             )}
          </div>
        </div>
      </section>

    </div>
  );
};
