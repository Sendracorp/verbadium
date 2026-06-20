'use client';
import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deaccent } from '@/lib/check';
import { toMp3 } from '@/lib/to-mp3';
import { uploadAudioOverride, deleteAudioOverride } from '@/app/admin/actions';

type Txt = { key: string; label: string; en: string; source: string };
type Override = { text_key: string; label: string | null; url: string; created_at: string };

const BADGE: Record<string, string> = { override: 'recorded ✓', native: 'native', tts: 'TTS', none: 'no audio' };

export default function AudioManager({ courseSlug, texts, overrides }:
  { courseSlug: string; texts: Txt[]; overrides: Override[] }) {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [text, setText] = useState('');                 // the Catalan phrase being recorded
  const [blob, setBlob] = useState<Blob | null>(null);
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunks = useRef<BlobPart[]>([]);

  const filtered = useMemo(() => {
    const n = deaccent(q);
    return (n ? texts.filter(t => deaccent(`${t.label} ${t.en}`).includes(n)) : texts).slice(0, 60);
  }, [q, texts]);

  async function startRec() {
    setMsg(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunks.current = [];
      mr.ondataavailable = e => { if (e.data.size) chunks.current.push(e.data); };
      mr.onstop = () => { setBlob(new Blob(chunks.current, { type: mr.mimeType || 'audio/webm' })); stream.getTracks().forEach(t => t.stop()); };
      mr.start();
      recRef.current = mr;
      setRecording(true);
    } catch { setMsg('Could not access the microphone.'); }
  }
  function stopRec() { recRef.current?.stop(); setRecording(false); }

  async function save(file: Blob | null) {
    if (!text.trim()) { setMsg('Pick or type the Catalan text first.'); return; }
    if (!file || !file.size) { setMsg('Record or choose an audio file first.'); return; }
    setBusy(true); setMsg('Processing audio…');
    try {
      const mp3 = await toMp3(file);                       // recordings → iOS-safe MP3
      const ext = mp3.type === 'audio/mpeg' ? 'mp3' : (file instanceof File ? (file.name.split('.').pop() || 'wav') : 'webm');
      const fd = new FormData();
      fd.set('courseSlug', courseSlug);
      fd.set('text', text.trim());
      fd.set('file', new File([mp3], `audio.${ext}`, { type: mp3.type }));
      await uploadAudioOverride(fd);
      setBlob(null); setText(''); setMsg('Saved.');
      router.refresh();
    } catch (e) { setMsg('Save failed: ' + (e as Error).message); }
    finally { setBusy(false); }
  }

  async function remove(textKey: string) {
    setBusy(true);
    const fd = new FormData();
    fd.set('courseSlug', courseSlug); fd.set('textKey', textKey);
    try { await deleteAudioOverride(fd); router.refresh(); } finally { setBusy(false); }
  }

  return (
    <div className="audio-mgr">
      {/* recorder / uploader */}
      <div className="audio-rec">
        <label>Catalan text
          <input list="audio-texts" value={text} onChange={e => setText(e.target.value)}
            placeholder="e.g. bon dia" autoCapitalize="off" spellCheck={false} />
        </label>
        <datalist id="audio-texts">
          {texts.slice(0, 500).map(t => <option key={t.key} value={t.label} />)}
        </datalist>
        <div className="audio-rec-controls">
          {!recording
            ? <button type="button" className="btn" onClick={startRec} disabled={busy}>🎙 Record</button>
            : <button type="button" className="btn btn-danger" onClick={stopRec}>■ Stop</button>}
          <span className="muted">or</span>
          <input type="file" accept="audio/*" disabled={busy}
            onChange={e => { const f = e.target.files?.[0]; if (f) { setBlob(f); } }} />
        </div>
        {blob && (
          <div className="audio-rec-preview">
            <audio controls src={URL.createObjectURL(blob)} />
            <button type="button" className="btn btn-primary" onClick={() => save(blob)} disabled={busy}>
              {busy ? 'Saving…' : 'Save recording'}
            </button>
          </div>
        )}
        {msg && <p className="note">{msg}</p>}
      </div>

      {/* existing overrides */}
      {overrides.length > 0 && (
        <div className="audio-overrides">
          <h3>Recorded ({overrides.length})</h3>
          <table className="account-table">
            <thead><tr><th>Text</th><th>Audio</th><th /></tr></thead>
            <tbody>
              {overrides.map(o => (
                <tr key={o.text_key}>
                  <td>{o.label || o.text_key}</td>
                  <td><audio controls preload="none" src={o.url} style={{ height: 32 }} /></td>
                  <td><button type="button" className="btn btn-danger" onClick={() => remove(o.text_key)} disabled={busy}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* reference list of course texts + current source */}
      <div className="audio-list">
        <input className="audio-search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search course words/phrases…" />
        <table className="account-table">
          <thead><tr><th>Catalan</th><th>English</th><th>Audio</th><th /></tr></thead>
          <tbody>
            {filtered.map(t => (
              <tr key={t.key}>
                <td>{t.label}</td>
                <td className="muted">{t.en}</td>
                <td><span className={`audio-badge audio-${t.source}`}>{BADGE[t.source]}</span></td>
                <td><button type="button" className="btn" onClick={() => { setText(t.label); setBlob(null); setMsg(null); }}>Record this</button></td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="muted">Showing {filtered.length} of {texts.length}. Refine with search.</p>
      </div>
    </div>
  );
}
