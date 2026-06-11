'use client';
/* The exercise engine: renders all ten exercise types and checks answers
   against the parsed answer key. Markup/class names mirror the course CSS. */
import React, { Fragment, useEffect, useState } from 'react';
import type {
  ChoiceItem, Exercise, GapItem, MatchItem, PlainItem, ReorderItem, TFItem, WriteItem,
} from '@/lib/types';
import { CheckResult, checkText, joinTokens, normSentence } from '@/lib/check';
import { exState, setExState, subscribe } from '@/lib/progress';

const FILL = '<span class="fill">___</span>';

function Html({ html, as: Tag = 'span', className }: { html: string; as?: 'span' | 'div' | 'h4'; className?: string }) {
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

function StateChip({ id }: { id: string }) {
  const [state, setState] = useState<'untouched' | 'attempted' | 'passed'>('untouched');
  useEffect(() => {
    const read = () => setState(exState(id).state);
    read();
    return subscribe(read);
  }, [id]);
  return (
    <span className={`ex-state${state !== 'untouched' ? ' ' + state : ''}`} data-exstate={id}>
      {state === 'passed' ? '✓ done' : state === 'attempted' ? 'tried' : ''}
    </span>
  );
}

function Feedback({ res, wrongHint }: { res: CheckResult | null; wrongHint?: string }) {
  if (!res) return <span className="item-fb" />;
  const text = res === 'ok' ? '✓' : res === 'almost' ? '✓ (check the accents!)' : `✗${wrongHint ? ' ' + wrongHint : ''}`;
  return <span className={`item-fb ${res}`}>{text}</span>;
}

function Score({ score, total }: { score: number | null; total: number }) {
  if (score === null) return <span className="ex-score" />;
  return (
    <span className={`ex-score ${score === total ? 'ok' : 'bad'}`}>
      {score} / {total}{score === total ? ' — perfecte!' : ''}
    </span>
  );
}

function SelfMark({ value, onMark, yesLabel = '✓ I got it', noLabel = '✗ Not yet' }:
  { value: boolean | null; onMark: (ok: boolean) => void; yesLabel?: string; noLabel?: string | null }) {
  return (
    <span className="self-mark">
      <button type="button" className={`sm-btn sm-yes${value === true ? ' sel' : ''}`} onClick={() => onMark(true)}>{yesLabel}</button>
      {noLabel !== null && (
        <button type="button" className={`sm-btn sm-no${value === false ? ' sel' : ''}`} onClick={() => onMark(false)}>{noLabel}</button>
      )}
    </span>
  );
}

/** Item html with the fill markers replaced by controlled inputs. */
function GapSentence({ html, values, results, onChange }:
  { html: string; values: string[]; results: (CheckResult | null)[]; onChange: (gap: number, v: string) => void }) {
  const segments = html.split(FILL);
  return (
    <>
      {segments.map((seg, i) => (
        <Fragment key={i}>
          <Html html={seg} />
          {i < segments.length - 1 && (
            <input
              type="text"
              className={`gap-input${results[i] ? ' ' + results[i] : ''}`}
              data-gap={i}
              autoCapitalize="off" autoComplete="off" spellCheck={false}
              value={values[i] ?? ''}
              onChange={e => onChange(i, e.target.value)}
            />
          )}
        </Fragment>
      ))}
    </>
  );
}

// ------------------------------------------------------------ gap / write / paradigm

function GapLike({ ex }: { ex: Exercise }) {
  const isGap = ex.type === 'gap';
  const items = ex.items as (GapItem | WriteItem)[];
  const gapCounts = items.map(it => (isGap ? (it as GapItem).gaps : 1));
  const [values, setValues] = useState<string[][]>(items.map((_, i) => Array(gapCounts[i]).fill('')));
  const [results, setResults] = useState<(CheckResult | null)[][]>(items.map((_, i) => Array(gapCounts[i]).fill(null)));
  const [score, setScore] = useState<number | null>(null);
  const total = gapCounts.reduce((a, b) => a + b, 0);

  function check() {
    let ok = 0;
    const res = items.map((it, i) =>
      it.answers.map((ans, g) => {
        const r = checkText(values[i][g] ?? '', ans, { ipa: ex.ipa, caps: ex.caps });
        if (r !== 'bad') ok++;
        return r;
      }));
    setResults(res);
    setScore(ok);
    setExState(ex.id, ok === total ? 'passed' : 'attempted', ok, total);
  }
  function retry() {
    setValues(items.map((_, i) => Array(gapCounts[i]).fill('')));
    setResults(items.map((_, i) => Array(gapCounts[i]).fill(null)));
    setScore(null);
  }
  const itemResult = (i: number): CheckResult | null => {
    const r = results[i];
    if (r.some(x => x === null)) return null;
    if (r.some(x => x === 'bad')) return 'bad';
    if (r.some(x => x === 'almost')) return 'almost';
    return 'ok';
  };

  return (
    <>
      <ol className={`q${ex.type === 'paradigm' ? ' paradigm' : ''}`}>
        {items.map((it, i) => (
          <li key={i}>
            {isGap ? (
              <GapSentence
                html={(it as GapItem).html} values={values[i]} results={results[i]}
                onChange={(g, v) => setValues(vs => vs.map((row, ri) => ri === i ? row.map((x, gi) => gi === g ? v : x) : row))}
              />
            ) : (
              <>
                <Html html={it.html} className="w-prompt" />{' '}
                <input
                  type="text"
                  className={`gap-input${results[i][0] ? ' ' + results[i][0] : ''}`}
                  data-gap={0}
                  autoCapitalize="off" autoComplete="off" spellCheck={false}
                  value={values[i][0] ?? ''}
                  onChange={e => setValues(vs => vs.map((row, ri) => ri === i ? [e.target.value] : row))}
                />
              </>
            )}{' '}
            {ex.type === 'paradigm' && score !== null && (
              <span className="pron paradigm-ipa">{(it as WriteItem).ipaNote}</span>
            )}{' '}
            <Feedback res={itemResult(i)} />
          </li>
        ))}
      </ol>
      <div className="ex-controls">
        <button type="button" className="btn btn-primary" onClick={check}>Check answers</button>
        <Score score={score} total={total} />
        {score !== null && <button type="button" className="btn" onClick={retry}>Retry</button>}
      </div>
    </>
  );
}

// ------------------------------------------------------------------- tf / choice

function TFChoice({ ex }: { ex: Exercise }) {
  const isTF = ex.type === 'tf';
  const items = ex.items as (TFItem | ChoiceItem)[];
  const options: { val: string; label: string }[] = isTF
    ? [{ val: 'true', label: 'True' }, { val: 'false', label: 'False' }]
    : (ex.options || []).map(o => ({ val: o, label: o }));
  const [picked, setPicked] = useState<(string | null)[]>(items.map(() => null));
  const [done, setDone] = useState(false);
  const answerOf = (it: TFItem | ChoiceItem) => String(it.answer);
  const score = picked.filter((p, i) => p !== null && p === answerOf(items[i])).length;

  function pick(i: number, val: string) {
    if (picked[i] !== null) return;
    const next = picked.map((p, pi) => (pi === i ? val : p));
    setPicked(next);
    if (next.every(p => p !== null)) {
      const sc = next.filter((p, ni) => p === answerOf(items[ni])).length;
      setDone(true);
      setExState(ex.id, sc === items.length ? 'passed' : 'attempted', sc, items.length);
    }
  }
  function retry() {
    setPicked(items.map(() => null));
    setDone(false);
  }

  return (
    <>
      <ol className="q">
        {items.map((it, i) => {
          const ans = answerOf(it);
          const note = isTF ? (it as TFItem).note : '';
          const correct = picked[i] !== null && picked[i] === ans;
          return (
            <li key={i}>
              <Html html={it.html} className="w-prompt" />
              <span className="tf-btns" data-item={i}>
                {options.map(o => {
                  let cls = 'tf-btn';
                  if (picked[i] !== null) {
                    if (o.val === picked[i]) cls += o.val === ans ? ' ok' : ' bad';
                    else if (o.val === ans) cls += ' ok';
                  }
                  return (
                    <button key={o.val} type="button" className={cls} data-val={o.val} onClick={() => pick(i, o.val)}>
                      {o.label}
                    </button>
                  );
                })}
              </span>{' '}
              {picked[i] !== null
                ? <span className={`item-fb ${correct ? 'ok' : 'bad'}`}>{(correct ? '✓' : '✗') + (note ? ' — ' + note : '')}</span>
                : <span className="item-fb" />}
            </li>
          );
        })}
      </ol>
      <div className="ex-controls">
        <Score score={done ? score : null} total={items.length} />
        {done && <button type="button" className="btn" onClick={retry}>Retry</button>}
      </div>
    </>
  );
}

// ------------------------------------------------------------------------ match

export function MatchBoard({ items, pairs, onChecked }:
  { items: MatchItem[]; pairs: Record<string, string>; onChecked?: (score: number, total: number) => void }) {
  const [chosen, setChosen] = useState<Record<number, string>>({});
  const [selLeft, setSelLeft] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  function clickLeft(i: number) {
    if (checked) return;
    setSelLeft(i);
    if (chosen[i]) setChosen(c => { const n = { ...c }; delete n[i]; return n; });
  }
  function clickRight(letter: string) {
    if (checked || selLeft === null) return;
    setChosen(c => {
      const n = { ...c };
      for (const k of Object.keys(n)) if (n[+k] === letter) delete n[+k];
      n[selLeft] = letter;
      return n;
    });
    setSelLeft(null);
  }
  function check() {
    setChecked(true);
    const total = items.length;
    const score = items.filter((_, i) => chosen[i] === pairs[String(i + 1)]).length;
    onChecked?.(score, total);
  }
  function retry() {
    setChosen({}); setSelLeft(null); setChecked(false);
  }
  const score = items.filter((_, i) => chosen[i] === pairs[String(i + 1)]).length;

  return (
    <>
      <div className="match">
        <div className="match-col match-left">
          {items.map((it, i) => {
            let cls = 'match-item';
            if (selLeft === i) cls += ' sel';
            if (chosen[i] !== undefined) cls += ' paired';
            if (checked) cls += chosen[i] === pairs[String(i + 1)] ? ' ok' : ' bad';
            return (
              <button key={i} type="button" className={cls} data-side="l" data-key={i} onClick={() => clickLeft(i)}>
                {it.left}
                {(chosen[i] !== undefined || checked) && (
                  <span className="pair-tag">
                    {checked && chosen[i] !== pairs[String(i + 1)]
                      ? `${chosen[i] ?? ''} ✗ → ${pairs[String(i + 1)]}`
                      : `→ ${chosen[i]}`}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="match-col match-right">
          {items.map(it => (
            <button
              key={it.letter} type="button"
              className={`match-item${Object.values(chosen).includes(it.letter) ? ' paired' : ''}`}
              data-side="r" data-key={it.letter}
              onClick={() => clickRight(it.letter)}
            >({it.letter}) {it.right}</button>
          ))}
        </div>
      </div>
      <div className="ex-controls">
        <button type="button" className="btn btn-primary" onClick={check} disabled={checked}>Check answers</button>
        <Score score={checked ? score : null} total={items.length} />
        {checked && <button type="button" className="btn" onClick={retry}>Retry</button>}
      </div>
    </>
  );
}

function Match({ ex }: { ex: Exercise }) {
  return (
    <MatchBoard
      items={ex.items as MatchItem[]} pairs={ex.pairs!}
      onChecked={(score, total) => setExState(ex.id, score === total ? 'passed' : 'attempted', score, total)}
    />
  );
}

// ----------------------------------------------------------------------- reorder

function Reorder({ ex }: { ex: Exercise }) {
  const items = ex.items as ReorderItem[];
  const [seqs, setSeqs] = useState<number[][]>(items.map(() => []));
  const [checked, setChecked] = useState(false);

  const builtOf = (i: number) => joinTokens(seqs[i].map(j => items[i].tokens[j]));
  const okOf = (i: number) =>
    seqs[i].length === items[i].tokens.length && normSentence(builtOf(i)) === normSentence(items[i].answer);
  const score = items.filter((_, i) => okOf(i)).length;

  function check() {
    setChecked(true);
    setExState(ex.id, score === items.length ? 'passed' : 'attempted', score, items.length);
  }
  function retry() {
    setSeqs(items.map(() => []));
    setChecked(false);
  }

  return (
    <>
      {items.map((it, i) => (
        <div className="reorder" data-item={i} key={i}>
          <div className="reorder-pool">
            {it.tokens.map((t, j) => (
              <button
                key={j} type="button" className="chip" data-tok={j}
                disabled={checked || seqs[i].includes(j)}
                onClick={() => setSeqs(s => s.map((row, ri) => ri === i ? [...row, j] : row))}
              >{t}</button>
            ))}
          </div>
          <div className="reorder-built">
            <span className={`reorder-out${checked ? (okOf(i) ? ' ok' : ' bad') : ''}`}>{builtOf(i)}</span>
            <button
              type="button" className="chip chip-undo" title="Remove last word" disabled={checked}
              onClick={() => setSeqs(s => s.map((row, ri) => ri === i ? row.slice(0, -1) : row))}
            >⌫</button>
          </div>{' '}
          {checked
            ? <span className={`item-fb ${okOf(i) ? 'ok' : 'bad'}`}>{okOf(i) ? '✓' : `✗ → ${it.answer}`}</span>
            : <span className="item-fb" />}
        </div>
      ))}
      <div className="ex-controls">
        <button type="button" className="btn btn-primary" onClick={check} disabled={checked}>Check answers</button>
        <Score score={checked ? score : null} total={items.length} />
        {checked && <button type="button" className="btn" onClick={retry}>Retry</button>}
      </div>
    </>
  );
}

// ------------------------------------------------------------------------ model

function Model({ ex }: { ex: Exercise }) {
  const items = ex.items as PlainItem[];
  const hasItems = items.length > 0 && items[0].html !== '';
  const [revealed, setRevealed] = useState(false);
  const [inputs, setInputs] = useState<string[]>(items.map(() => ''));
  const [marks, setMarks] = useState<(boolean | null)[]>(items.map(() => null));
  const markCount = hasItems ? items.length : 1;
  const allMarked = marks.slice(0, markCount).every(m => m !== null);
  const score = marks.slice(0, markCount).filter(m => m === true).length;

  function reveal() {
    setRevealed(true);
    setExState(ex.id, 'attempted', 0, markCount);
  }
  function mark(i: number, ok: boolean) {
    const next = marks.map((m, mi) => (mi === i ? ok : m));
    setMarks(next);
    const got = next.slice(0, markCount).filter(m => m === true).length;
    if (next.slice(0, markCount).every(m => m !== null)) {
      setExState(ex.id, got === markCount ? 'passed' : 'attempted', got, markCount);
    }
  }
  function retry() {
    setRevealed(false);
    setInputs(items.map(() => ''));
    setMarks(items.map(() => null));
  }

  return (
    <>
      {hasItems ? (
        <ol className="q">
          {items.map((it, i) => (
            <li key={i}>
              <Html html={it.html} className="w-prompt" />{' '}
              <input
                type="text" className="gap-input model-input"
                autoCapitalize="off" autoComplete="off" spellCheck={false}
                value={inputs[i]}
                onChange={e => setInputs(v => v.map((x, vi) => vi === i ? e.target.value : x))}
              />
              {revealed && <SelfMark value={marks[i]} onMark={ok => mark(i, ok)} yesLabel="✓ I got it" noLabel="✗ Not yet" />}
            </li>
          ))}
        </ol>
      ) : (
        <>
          {ex.noteHtml && <Html html={ex.noteHtml} as="div" />}
          <textarea
            className="free-text" rows={3} spellCheck={false}
            value={inputs[0] ?? ''}
            onChange={e => setInputs([e.target.value])}
          />
          {revealed && <SelfMark value={marks[0] ?? null} onMark={ok => mark(0, ok)} />}
        </>
      )}
      {revealed && (
        <div className="model-answer">
          <div className="model-label">Model answer</div>
          <Html html={ex.keyHtml} as="div" className="model-body" />
        </div>
      )}
      <div className="ex-controls">
        <button type="button" className="btn" onClick={reveal} disabled={revealed}>Show model answer</button>
        <Score score={allMarked ? score : null} total={markCount} />
        {allMarked && <button type="button" className="btn" onClick={retry}>Retry</button>}
      </div>
    </>
  );
}

// ------------------------------------------------------------------------- free

function Free({ ex }: { ex: Exercise }) {
  const items = ex.items as PlainItem[];
  const [text, setText] = useState('');
  const [aloud, setAloud] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [mark, setMark] = useState<boolean | null>(null);
  const hasModel = ex.keyHtml.trim() !== '';

  function onText(v: string) {
    setText(v);
    if (exState(ex.id).state === 'untouched') setExState(ex.id, 'attempted', 0, 1);
  }
  function doMark(ok: boolean) {
    setMark(ok);
    setExState(ex.id, ok ? 'passed' : 'attempted', ok ? 1 : 0, 1);
  }
  function retry() {
    setText(''); setAloud(false); setRevealed(false); setMark(null);
  }

  return (
    <>
      {items.length > 0 && (
        <ol className="q">{items.map((it, i) => <li key={i}><Html html={it.html} /></li>)}</ol>
      )}
      {ex.noteHtml && <Html html={ex.noteHtml} as="div" />}
      <textarea
        className="free-text" rows={4} spellCheck={false} placeholder="Write here…"
        value={text} onChange={e => onText(e.target.value)}
      />
      {ex.oral && (
        <label className="said-aloud">
          <input type="checkbox" className="aloud-check" checked={aloud} onChange={e => setAloud(e.target.checked)} />
          {' '}I said it aloud
        </label>
      )}
      {(revealed || !hasModel) && <SelfMark value={mark} onMark={doMark} />}
      {revealed && (
        <div className="model-answer">
          <div className="model-label">Model answer</div>
          <Html html={ex.keyHtml} as="div" className="model-body" />
        </div>
      )}
      <div className="ex-controls">
        {hasModel && (
          <button
            type="button" className="btn"
            onClick={() => { setRevealed(true); if (exState(ex.id).state === 'untouched') setExState(ex.id, 'attempted', 0, 1); }}
            disabled={revealed}
          >Show model answer</button>
        )}
        <Score score={mark !== null ? (mark ? 1 : 0) : null} total={1} />
        {mark !== null && <button type="button" className="btn" onClick={retry}>Retry</button>}
      </div>
    </>
  );
}

// ---------------------------------------------------------------------- personal

function Personal({ ex }: { ex: Exercise }) {
  const items = ex.items as PlainItem[];
  const [done, setDone] = useState(false);

  function PersonalLine({ html }: { html: string }) {
    const withFill = html.replace(/___/g, FILL);
    const segments = withFill.split(FILL);
    return (
      <>
        {segments.map((seg, i) => (
          <Fragment key={i}>
            <Html html={seg} />
            {i < segments.length - 1 && (
              <input
                type="text" className="gap-input personal-input"
                autoCapitalize="off" autoComplete="off" spellCheck={false}
                onChange={() => { if (exState(ex.id).state === 'untouched') setExState(ex.id, 'attempted', 0, 1); }}
              />
            )}
          </Fragment>
        ))}
      </>
    );
  }

  return (
    <>
      <ol className="q">{items.map((it, i) => <li key={i}><PersonalLine html={it.html} /></li>)}</ol>
      <p className="note">Personal answers — fill it in as exam practice.</p>
      <SelfMark
        value={done ? true : null}
        onMark={() => { setDone(true); setExState(ex.id, 'passed', 1, 1); }}
        yesLabel="✓ Done" noLabel={null}
      />
      {ex.keyHtml && done && (
        <div className="model-answer">
          <div className="model-label">Note</div>
          <Html html={ex.keyHtml} as="div" className="model-body" />
        </div>
      )}
      <div className="ex-controls" />
    </>
  );
}

// --------------------------------------------------------------------- dispatcher

export default function ExerciseCard({ ex }: { ex: Exercise }) {
  const body =
    ex.type === 'gap' || ex.type === 'write' || ex.type === 'paradigm' ? <GapLike ex={ex} /> :
    ex.type === 'tf' || ex.type === 'choice' ? <TFChoice ex={ex} /> :
    ex.type === 'match' ? <Match ex={ex} /> :
    ex.type === 'reorder' ? <Reorder ex={ex} /> :
    ex.type === 'model' ? <Model ex={ex} /> :
    ex.type === 'free' ? <Free ex={ex} /> :
    <Personal ex={ex} />;
  const showNote = !['model', 'free', 'personal'].includes(ex.type) && ex.noteHtml;
  return (
    <div className="ex card" data-ex={ex.id} data-type={ex.type}>
      <div className="ex-head">
        <span className="label">EX {ex.id}</span>
        <Html html={ex.title} as="h4" />
        <StateChip id={ex.id} />
      </div>
      {showNote && <Html html={ex.noteHtml} as="div" />}
      {body}
    </div>
  );
}
