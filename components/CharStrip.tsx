'use client';
import { useEffect, useRef, useState } from 'react';

const CHARS = ['à', 'è', 'é', 'í', 'ï', 'ò', 'ó', 'ú', 'ü', 'ç', 'l·l'];

/** Floating strip of Catalan characters that attaches to focused text inputs. */
export default function CharStrip() {
  const [visible, setVisible] = useState(false);
  const lastInput = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const lock = useRef(false);

  useEffect(() => {
    function isTextField(el: Element | null): el is HTMLInputElement | HTMLTextAreaElement {
      if (!el) return false;
      if (el.tagName === 'TEXTAREA') return true;
      return el.tagName === 'INPUT' && (el as HTMLInputElement).type === 'text';
    }
    function onFocusIn(e: FocusEvent) {
      const t = e.target as Element;
      if (isTextField(t) && (t as HTMLElement).id !== 'glosSearch') {
        lastInput.current = t;
        setVisible(true);
      }
    }
    function onFocusOut() {
      setTimeout(() => {
        if (lock.current) return;
        if (!isTextField(document.activeElement)) setVisible(false);
      }, 120);
    }
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', onFocusOut);
    return () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
    };
  }, []);

  function insert(c: string) {
    const el = lastInput.current;
    if (!el) return;
    const s = el.selectionStart ?? el.value.length;
    const e = el.selectionEnd ?? el.value.length;
    const setter = Object.getOwnPropertyDescriptor(
      el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype, 'value')!.set!;
    setter.call(el, el.value.slice(0, s) + c + el.value.slice(e));
    el.dispatchEvent(new Event('input', { bubbles: true }));  // keep React state in sync
    el.selectionStart = el.selectionEnd = s + c.length;
    el.focus();
    lock.current = false;
  }

  return (
    <div className={`char-strip${visible ? ' visible' : ''}`} aria-label="Catalan characters">
      {CHARS.map(c => (
        <button
          key={c} type="button"
          onMouseDown={e => { e.preventDefault(); lock.current = true; }}
          onClick={e => { e.preventDefault(); insert(c); }}
        >{c}</button>
      ))}
    </div>
  );
}
