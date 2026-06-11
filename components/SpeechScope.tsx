'use client';
import { useEffect, useRef } from 'react';
import { cleanSpeak, speak, stopSpeak } from '@/lib/speech';

/**
 * Renders trusted course HTML and enhances it after mount:
 *  - a 🔊 button on every Catalan word/phrase (td.ca / span.ca)
 *  - per-line 🔊 + "play whole dialogue" with current-line highlight
 * Mirrors the markup the course expects; idempotent for StrictMode remounts.
 */
export default function SpeechScope({ html, className }: { html: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || root.dataset.enhanced === '1') return;
    root.dataset.enhanced = '1';

    function caTextOf(el: Element): string {
      const clone = el.cloneNode(true) as Element;
      clone.querySelectorAll('.pron, .en, .say').forEach(k => k.remove());
      return cleanSpeak(clone.textContent || '');
    }
    function sayButton(text: string, title = 'Listen'): HTMLButtonElement {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'say';
      b.textContent = '🔊';
      b.title = title;
      b.setAttribute('aria-label', 'Listen: ' + text);
      b.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        stopSpeak();
        b.classList.add('speaking');
        speak(text, () => b.classList.remove('speaking'));
      });
      return b;
    }

    root.querySelectorAll('td.ca, span.ca, p .ca').forEach(el => {
      if (el.closest('.model-answer') || el.querySelector('.say')) return;
      const t = caTextOf(el);
      if (!t) return;
      el.appendChild(document.createTextNode(' '));
      el.appendChild(sayButton(t));
    });

    root.querySelectorAll('.dialogue').forEach(dlg => {
      const lines: { p: HTMLElement; text: string }[] = [];
      dlg.querySelectorAll('p').forEach(p => {
        if (p.classList.contains('gloss')) return;
        const clone = p.cloneNode(true) as Element;
        clone.querySelectorAll('.spk, .say').forEach(k => k.remove());
        const text = cleanSpeak(clone.textContent || '');
        if (!text) return;
        lines.push({ p, text });
        p.appendChild(document.createTextNode(' '));
        p.appendChild(sayButton(text, 'Listen to this line'));
      });
      if (!lines.length) return;
      const ctr = document.createElement('div');
      ctr.className = 'dialogue-controls';
      const play = document.createElement('button');
      play.type = 'button'; play.className = 'btn'; play.textContent = '▶ Play whole dialogue';
      const stop = document.createElement('button');
      stop.type = 'button'; stop.className = 'btn'; stop.textContent = '■ Stop'; stop.hidden = true;
      ctr.append(play, ' ', stop);
      dlg.appendChild(ctr);
      let stopped = false;
      const clearHi = () => lines.forEach(l => l.p.classList.remove('playing'));
      const done = () => { clearHi(); play.hidden = false; stop.hidden = true; };
      const playFrom = (idx: number) => {
        if (stopped || idx >= lines.length) { done(); return; }
        clearHi();
        lines[idx].p.classList.add('playing');
        speak(lines[idx].text, () => setTimeout(() => playFrom(idx + 1), 350));
      };
      play.addEventListener('click', () => {
        stopSpeak(); stopped = false; play.hidden = true; stop.hidden = false; playFrom(0);
      });
      stop.addEventListener('click', () => { stopped = true; stopSpeak(); done(); });
    });
  }, []);

  return <div ref={ref} className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
