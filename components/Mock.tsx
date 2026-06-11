'use client';
/* The mock exam: TTS listening paper (script spoken twice, hidden until
   answered), per-paper exam-condition timers with soft-stop, auto-marked
   objective tasks, self-marked writing/speaking, attempt history. */
import { useEffect, useRef, useState } from 'react';
import type { MockData } from '@/lib/types';
import { speak, stopSpeak } from '@/lib/speech';
import { MockAttempt, sget, sset } from '@/lib/progress';
import { MatchBoard } from './exercises';

function Timer({ paper, mins, onOvertime }: { paper: number; mins: number; onOvertime: () => void }) {
  const [left, setLeft] = useState<number | null>(null);
  const flagged = useRef(false);
  useEffect(() => {
    if (left === null) return;
    const iv = setInterval(() => setLeft(l => (l === null ? l : l - 1)), 1000);
    return () => clearInterval(iv);
    // restart only when arming/disarming, not every tick
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left === null]);
  useEffect(() => {
    if (left !== null && left <= 0 && !flagged.current) { flagged.current = true; onOvertime(); }
  }, [left, onOvertime]);

  const running = left !== null;
  const m = running ? Math.floor(Math.abs(left) / 60) : 0;
  const s = running ? Math.abs(left) % 60 : 0;
  return (
    <div className="paper-timer" data-paper={paper} data-mins={mins}>
      <button
        type="button" className="btn timer-start"
        onClick={() => { flagged.current = false; setLeft(running ? null : mins * 60); }}
      >
        {running ? 'Reset timer' : `Start ${mins}-min timer`}
      </button>
      {running && (
        <span className={`timer-display${left < 0 ? ' overtime' : ''}`}>
          {left < 0 ? '−' : ''}{m}:{s < 10 ? '0' : ''}{s}
        </span>
      )}
    </div>
  );
}

export default function Mock({ mock }: { mock: MockData }) {
  const overtime = useRef<Record<string, boolean>>({});
  const [conditions, setConditions] = useState(false);
  useEffect(() => { setConditions(sget('mock.conditions', false)); }, []);
  useEffect(() => {
    document.body.classList.toggle('exam-mode', conditions);
    return () => document.body.classList.remove('exam-mode');
  }, [conditions]);

  // ---- paper 1 (listening)
  const [playState, setPlayState] = useState<'idle' | 'p1' | 'pause' | 'p2'>('idle');
  const stoppedRef = useRef(false);
  const [p1picked, setP1picked] = useState<(boolean | null)[]>(mock.p1items.map(() => null));
  const [scriptShown, setScriptShown] = useState(false);
  const p1done = p1picked.every(p => p !== null);
  const p1score = p1picked.filter((p, i) => p === mock.p1answers[i].val).length;

  function playTwice() {
    stopSpeak();
    stoppedRef.current = false;
    setPlayState('p1');
    speak(mock.script, () => {
      if (stoppedRef.current) return;
      setPlayState('pause');
      setTimeout(() => {
        if (stoppedRef.current) return;
        setPlayState('p2');
        speak(mock.script, () => setPlayState('idle'), 0.9);
      }, 5000);
    }, 0.9);
  }
  function stopPlay() {
    stoppedRef.current = true;
    stopSpeak();
    setPlayState('idle');
  }

  // ---- paper 2
  const [p2aRevealed, setP2aRevealed] = useState(false);
  const [p2aInputs, setP2aInputs] = useState<string[]>(mock.p2aItems.map(() => ''));
  const [p2aMarks, setP2aMarks] = useState<(boolean | null)[]>(mock.p2aItems.map(() => null));
  const [p2bScore, setP2bScore] = useState<number | null>(null);
  const p2aScore = p2aMarks.every(m => m !== null) ? p2aMarks.filter(Boolean).length : null;

  // ---- paper 3
  const [p3text, setP3text] = useState('');
  const [p3revealed, setP3revealed] = useState(false);
  const [p3mark, setP3mark] = useState<boolean | null>(null);
  const p3words = p3text.trim() ? p3text.trim().split(/\s+/).length : 0;

  // ---- paper 4
  const [p4aloud, setP4aloud] = useState<boolean[]>(mock.p4qs.map(() => false));
  const [p4revealed, setP4revealed] = useState(false);
  const [p4mark, setP4mark] = useState<boolean | null>(null);

  // ---- attempts
  const [attempts, setAttempts] = useState<MockAttempt[]>([]);
  useEffect(() => { setAttempts(sget<MockAttempt[]>('mock.attempts', [])); }, []);
  function saveAttempt() {
    const a: MockAttempt = {
      date: new Date().toISOString().slice(0, 10),
      p1: p1done ? p1score : null,
      p2a: p2aScore,
      p2b: p2bScore,
      p3: p3mark,
      p3words,
      p4: p4mark,
      p4aloud: p4aloud.filter(Boolean).length,
      overtime: { ...overtime.current },
    };
    const next = [...sget<MockAttempt[]>('mock.attempts', []), a];
    sset('mock.attempts', next);
    setAttempts(next);
    alert('Attempt saved.');
  }

  const playLabel =
    playState === 'p1' ? 'Playing — first reading…' :
    playState === 'pause' ? 'Pause… second reading starts in 5 s' :
    playState === 'p2' ? 'Playing — second reading…' : '';

  return (
    <>
      <div className="unit-head"><div className="unit-num">Mock exam · A1</div><h2>Full Practice Exam</h2></div>
      <div dangerouslySetInnerHTML={{ __html: mock.introNote }} />

      <div className="card exam-conditions">
        <label>
          <input
            type="checkbox" id="examConditions" checked={conditions}
            onChange={e => { setConditions(e.target.checked); sset('mock.conditions', e.target.checked); }}
          />
          {' '}<b>Exam conditions</b> — show per-paper timers (15 / 30 / 30 / 10 min).
          When time runs out the paper is marked &quot;over time&quot;, but you can finish.
        </label>
      </div>

      {/* ---------------- Paper 1 ---------------- */}
      <div className="card exam" id="paper1">
        <h4>Paper 1 · Comprensió oral (listening) — 15 min</h4>
        <Timer paper={1} mins={15} onOvertime={() => { overtime.current['1'] = true; }} />
        <p>The script is read aloud <b>twice</b> with a pause, using your browser&apos;s Catalan voice. Don&apos;t read it — just listen, then answer.</p>
        <p>
          {playState === 'idle'
            ? <button type="button" className="btn btn-primary" id="playScript" onClick={playTwice}>▶ Play listening script (twice)</button>
            : <button type="button" className="btn" id="stopScript" onClick={stopPlay}>■ Stop</button>}
          {' '}<span id="playState" className="note">{playLabel}</span>
        </p>
        <ol className="q">
          {mock.p1items.map((q, i) => {
            const picked = p1picked[i];
            const ans = mock.p1answers[i];
            const correct = picked !== null && picked === ans.val;
            return (
              <li key={i}>
                <span className="w-prompt">{q}</span>
                <span className="tf-btns" data-item={i}>
                  {[true, false].map(v => {
                    let cls = 'tf-btn';
                    if (picked !== null) {
                      if (v === picked) cls += v === ans.val ? ' ok' : ' bad';
                      else if (v === ans.val) cls += ' ok';
                    }
                    return (
                      <button
                        key={String(v)} type="button" className={cls} data-val={String(v)}
                        onClick={() => { if (p1picked[i] === null) setP1picked(p => p.map((x, xi) => xi === i ? v : x)); }}
                      >{v ? 'V (vertader)' : 'F (fals)'}</button>
                    );
                  })}
                </span>{' '}
                {picked !== null
                  ? <span className={`item-fb ${correct ? 'ok' : 'bad'}`}>{(correct ? '✓' : '✗') + (ans.note ? ' — ' + ans.note : '')}</span>
                  : <span className="item-fb" />}
              </li>
            );
          })}
        </ol>
        <div className="ex-controls" id="p1controls">
          {p1done && <span className={`ex-score ${p1score === 6 ? 'ok' : 'bad'}`}>{p1score} / 6{p1score === 6 ? ' — perfecte!' : ''}</span>}
          {p1done && (
            <button
              type="button" className="btn"
              onClick={() => { setP1picked(mock.p1items.map(() => null)); setScriptShown(false); }}
            >Retry</button>
          )}
        </div>
        {p1done && (
          <div id="scriptReveal">
            <button type="button" className="btn" id="showScript" onClick={() => setScriptShown(true)}>Show script</button>
            {scriptShown && <p className="note script-text">«{mock.script}»</p>}
          </div>
        )}
      </div>

      {/* ---------------- Paper 2 ---------------- */}
      <div className="card exam" id="paper2">
        <h4>Paper 2 · Comprensió lectora (reading) — 30 min</h4>
        <Timer paper={2} mins={30} onOvertime={() => { overtime.current['2'] = true; }} />
        <p><b>Task A — Read this notice and answer.</b></p>
        <p className="note">«{mock.p2notice}»</p>
        <ol className="q" id="p2a">
          {mock.p2aItems.map((q, i) => (
            <li key={i}>
              <span className="w-prompt">{q}</span>{' '}
              <input
                type="text" className="gap-input model-input" autoCapitalize="off" spellCheck={false}
                value={p2aInputs[i]}
                onChange={e => setP2aInputs(v => v.map((x, xi) => xi === i ? e.target.value : x))}
              />
              {p2aRevealed && (
                <span className="self-mark">
                  <button type="button" className={`sm-btn sm-yes${p2aMarks[i] === true ? ' sel' : ''}`} onClick={() => setP2aMarks(m => m.map((x, xi) => xi === i ? true : x))}>✓</button>
                  <button type="button" className={`sm-btn sm-no${p2aMarks[i] === false ? ' sel' : ''}`} onClick={() => setP2aMarks(m => m.map((x, xi) => xi === i ? false : x))}>✗</button>
                </span>
              )}
            </li>
          ))}
        </ol>
        {p2aRevealed && (
          <div className="model-answer" id="p2aModel">
            <div className="model-label">Answers</div>
            <div className="model-body" dangerouslySetInnerHTML={{ __html: mock.p2aKeyHtml }} />
          </div>
        )}
        <div className="ex-controls" id="p2aControls">
          <button type="button" className="btn" onClick={() => setP2aRevealed(true)} disabled={p2aRevealed}>Show answers</button>
          {p2aScore !== null && <span className={`ex-score ${p2aScore === 4 ? 'ok' : 'bad'}`}>{p2aScore} / 4{p2aScore === 4 ? ' — perfecte!' : ''}</span>}
        </div>
        <p><b>Task B — Match each sign (1–5) to its meaning (a–e).</b></p>
        <div id="p2b">
          <MatchBoard items={mock.p2bItems} pairs={mock.p2bPairs} onChecked={score => setP2bScore(score)} />
        </div>
      </div>

      {/* ---------------- Paper 3 ---------------- */}
      <div className="card exam" id="paper3">
        <h4>Paper 3 · Expressió escrita (writing) — 30 min</h4>
        <Timer paper={3} mins={30} onOvertime={() => { overtime.current['3'] = true; }} />
        <p><b>Task A — Fill in this library-card application about yourself.</b></p>
        <ol className="q">
          {mock.p3form.map((li, i) => (
            <li key={i}>
              {li.split('___').map((seg, si, arr) => (
                <span key={si}>
                  <span dangerouslySetInnerHTML={{ __html: seg }} />
                  {si < arr.length - 1 && <input type="text" className="gap-input personal-input" autoCapitalize="off" spellCheck={false} />}
                </span>
              ))}
            </li>
          ))}
        </ol>
        <div dangerouslySetInnerHTML={{ __html: mock.p3bTask }} />
        <textarea
          className="free-text" id="p3text" rows={5} spellCheck={false}
          placeholder="Write your postcard here (35–45 words)…"
          value={p3text} onChange={e => setP3text(e.target.value)}
        />
        <div className="note">Words: <span id="p3words">{p3words}</span></div>
        <button type="button" className="btn" id="p3reveal" onClick={() => setP3revealed(true)} disabled={p3revealed}>Show model answer</button>
        {p3revealed && (
          <>
            <div className="model-answer" id="p3model">
              <div className="model-label">Model (38 words)</div>
              <div className="model-body" dangerouslySetInnerHTML={{ __html: mock.p3bModel }} />
            </div>
            <span className="self-mark" id="p3mark">
              <button type="button" className={`sm-btn sm-yes${p3mark === true ? ' sel' : ''}`} onClick={() => setP3mark(true)}>✓ I got it</button>
              <button type="button" className={`sm-btn sm-no${p3mark === false ? ' sel' : ''}`} onClick={() => setP3mark(false)}>✗ Not yet</button>
            </span>
          </>
        )}
      </div>

      {/* ---------------- Paper 4 ---------------- */}
      <div className="card exam" id="paper4">
        <h4>Paper 4 · Expressió oral (speaking) — 10 min</h4>
        <Timer paper={4} mins={10} onOvertime={() => { overtime.current['4'] = true; }} />
        <p><b>Part 1 — Answer these aloud in full sentences (the examiner&apos;s classic set):</b></p>
        <ol className="q" id="p4qs">
          {mock.p4qs.map((q, i) => (
            <li key={i}>
              <span className="w-prompt">{q}</span>{' '}
              <label className="said-aloud">
                <input
                  type="checkbox" className="aloud-check" checked={p4aloud[i]}
                  onChange={e => setP4aloud(a => a.map((x, xi) => xi === i ? e.target.checked : x))}
                />
                {' '}I said it aloud
              </label>
            </li>
          ))}
        </ol>
        <div dangerouslySetInnerHTML={{ __html: mock.p4role }} />
        <div dangerouslySetInnerHTML={{ __html: mock.p4mark }} />
        <button type="button" className="btn" id="p4reveal" onClick={() => setP4revealed(true)} disabled={p4revealed}>Show model answers</button>
        {p4revealed && (
          <>
            <div className="model-answer" id="p4model">
              <div className="model-label">Model answers (Part 1)</div>
              <div className="model-body" dangerouslySetInnerHTML={{ __html: mock.p4model }} />
              <div className="model-label">Role-play skeleton</div>
              <div className="model-body" dangerouslySetInnerHTML={{ __html: mock.p4roleModel }} />
            </div>
            <span className="self-mark" id="p4mark2">
              <button type="button" className={`sm-btn sm-yes${p4mark === true ? ' sel' : ''}`} onClick={() => setP4mark(true)}>✓ I got it</button>
              <button type="button" className={`sm-btn sm-no${p4mark === false ? ' sel' : ''}`} onClick={() => setP4mark(false)}>✗ Not yet</button>
            </span>
          </>
        )}
      </div>

      {/* ---------------- attempts ---------------- */}
      <div className="card">
        <h2>Save this attempt</h2>
        <p className="note">Finishes the sitting and stores the per-paper results (with today&apos;s date) in your browser.</p>
        <button type="button" className="btn btn-primary" id="saveAttempt" onClick={saveAttempt}>Finish &amp; save attempt</button>
        <h3>Attempt history</h3>
        <div id="attemptHistory" className="note">
          {!attempts.length ? 'No attempts saved yet.' : (
            <table className="attempt-table">
              <thead><tr><th>Date</th><th>P1 listening</th><th>P2 reading</th><th>P3 writing</th><th>P4 speaking</th></tr></thead>
              <tbody>
                {[...attempts].reverse().map((a, i) => {
                  const ot = (p: number) => a.overtime?.[String(p)]
                    ? <span className="over-tag"> over time</span> : null;
                  return (
                    <tr key={i}>
                      <td>{a.date}</td>
                      <td>{a.p1 === null ? '—' : `${a.p1}/6`}{ot(1)}</td>
                      <td>{a.p2a === null ? '—' : `${a.p2a}/4`} + {a.p2b === null ? '—' : `${a.p2b}/5`}{ot(2)}</td>
                      <td>{a.p3 === null ? '—' : a.p3 ? 'self-passed' : 'not yet'} ({a.p3words} w.){ot(3)}</td>
                      <td>{a.p4aloud}/8 aloud · {a.p4 === null ? '—' : a.p4 ? 'self-passed' : 'not yet'}{ot(4)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
