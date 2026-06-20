import { Mp3Encoder } from '@breezystack/lamejs';

// formats Safari/iOS already plays — leave them as-is
const IOS_SAFE = /^audio\/(mpeg|mp3|wav|x-wav|mp4|x-m4a|aac)/;

/* Convert a browser-decodable audio Blob (e.g. a WebM/Opus recording, which
   iOS can't play) to a mono MP3 Blob. Runs entirely in the admin's browser. */
export async function toMp3(blob: Blob): Promise<Blob> {
  if (IOS_SAFE.test(blob.type)) return blob;

  const data = await blob.arrayBuffer();
  const Ctx: typeof AudioContext = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  let audio: AudioBuffer;
  try { audio = await ctx.decodeAudioData(data); } finally { void ctx.close(); }

  // down-mix to mono float32
  const len = audio.length;
  const mono = new Float32Array(len);
  for (let c = 0; c < audio.numberOfChannels; c++) {
    const ch = audio.getChannelData(c);
    for (let i = 0; i < len; i++) mono[i] += ch[i] / audio.numberOfChannels;
  }
  // float32 → int16
  const pcm = new Int16Array(len);
  for (let i = 0; i < len; i++) {
    const s = Math.max(-1, Math.min(1, mono[i]));
    pcm[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  const enc = new Mp3Encoder(1, audio.sampleRate, 128);
  const out: Uint8Array[] = [];
  for (let i = 0; i < pcm.length; i += 1152) {
    const chunk = enc.encodeBuffer(pcm.subarray(i, i + 1152));
    if (chunk.length) out.push(chunk);
  }
  const tail = enc.flush();
  if (tail.length) out.push(tail);
  return new Blob(out as BlobPart[], { type: 'audio/mpeg' });
}
