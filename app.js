/* Catalan from Scratch — A1. Runtime: navigation, Web Speech audio, exercise
   engine, progress (localStorage, catalanA1.*), glossary tools, mock exam. */
'use strict';
(function () {
  var CAT = window.CAT || { ex: {}, units: [], mock: {} };

  // ------------------------------------------------------------- storage
  var NS = 'catalanA1.';
  function sget(key, fallback) {
    try { var v = localStorage.getItem(NS + key); return v === null ? fallback : JSON.parse(v); }
    catch (e) { return fallback; }
  }
  function sset(key, val) { try { localStorage.setItem(NS + key, JSON.stringify(val)); } catch (e) {} }
  function exState(id) { return sget('ex.' + id, { state: 'untouched', score: 0, total: 0 }); }
  function setExState(id, state, score, total) {
    sset('ex.' + id, { state: state, score: score || 0, total: total || 0, ts: Date.now() });
    refreshProgress();
  }

  // -------------------------------------------------------- normalisation
  function norm(s) {
    return s.replace(/[‘’ʼ]/g, "'")
      .replace(/[.,;:!?«»"“”…()·]/g, ' ')
      .replace(/\s+/g, ' ').trim().toLowerCase();
  }
  function deaccent(s) { return norm(s).normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function normIPA(s) { return s.replace(/[\/\sˈˌ.|]/g, ''); }
  function answerVariants(ans) {
    var v = [ans];
    if (ans.indexOf('(') !== -1) {
      v.push(ans.replace(/\([^)]*\)/g, ' '));         // without the bracketed part
      v.push(ans.replace(/[()]/g, ''));               // with it, no brackets
    }
    return v;
  }
  // returns 'ok' | 'almost' (right but missing accents) | 'bad'
  function checkText(user, ans, opts) {
    opts = opts || {};
    if (opts.ipa) return normIPA(user) === normIPA(ans) ? 'ok' : 'bad';
    var variants = answerVariants(ans), i;
    if (opts.caps) {
      var capUser = (user.match(/[A-ZÀÈÉÍÏÒÓÚÜÇ·]{2,}/) || [''])[0];
      var capAns = (ans.match(/[A-ZÀÈÉÍÏÒÓÚÜÇ·]{2,}/) || [''])[0];
      if (deaccent(user) !== deaccent(ans)) return 'bad';
      return deaccent(capUser) === deaccent(capAns) && capUser !== '' ? 'ok' : 'almost';
    }
    for (i = 0; i < variants.length; i++) if (norm(user) === norm(variants[i])) return 'ok';
    for (i = 0; i < variants.length; i++) if (deaccent(user) === deaccent(variants[i])) return 'almost';
    return 'bad';
  }
  function fb(el, status, okText) {
    if (!el) return;
    el.className = 'item-fb ' + status;
    el.textContent = status === 'ok' ? (okText || '✓') : status === 'almost' ? '✓ (check the accents!)' : '✗';
  }

  // ------------------------------------------------------------- speech
  var caVoice = null, voicesReady = false;
  function pickVoice() {
    var vs = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    if (vs.length) voicesReady = true;
    caVoice = null;
    for (var i = 0; i < vs.length; i++) {
      var l = (vs[i].lang || '').toLowerCase().replace('_', '-');
      if (l === 'ca-es') { caVoice = vs[i]; break; }
      if (l.slice(0, 2) === 'ca' && !caVoice) caVoice = vs[i];
    }
  }
  if (window.speechSynthesis) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }
  function ttsNotice() {
    if (sget('ttsNoticeDismissed', false) || document.getElementById('ttsNotice')) return;
    var n = document.createElement('div');
    n.className = 'tts-notice'; n.id = 'ttsNotice';
    n.innerHTML = '<span>No Catalan voice was found on this device, so audio may sound wrong. ' +
      'You can hear native recordings of every word on <a href="https://forvo.com/languages/ca/" target="_blank" rel="noopener">Forvo</a>.</span>' +
      '<button type="button">OK</button>';
    n.querySelector('button').addEventListener('click', function () {
      sset('ttsNoticeDismissed', true); n.remove();
    });
    document.body.appendChild(n);
  }
  function cleanSpeak(text) {
    return text.replace(/\/[^\/]*\//g, ' ')   // any leftover /IPA/
      .replace(/[«»]/g, '').replace(/…/g, '').replace(/\s+/g, ' ').trim();
  }
  function speak(text, onend, rate) {
    if (!window.speechSynthesis) { if (onend) onend(); return null; }
    if (!voicesReady) pickVoice();
    if (!caVoice) ttsNotice();
    var u = new SpeechSynthesisUtterance(cleanSpeak(text));
    u.lang = 'ca-ES';
    if (caVoice) u.voice = caVoice;
    u.rate = rate || 0.95;
    if (onend) { u.onend = onend; u.onerror = onend; }
    speechSynthesis.speak(u);
    return u;
  }
  function stopSpeak() { if (window.speechSynthesis) speechSynthesis.cancel(); }

  function sayButton(text, title) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'say'; b.textContent = '🔊';
    b.title = title || 'Listen';
    b.setAttribute('aria-label', 'Listen: ' + text);
    b.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      stopSpeak();
      b.classList.add('speaking');
      speak(text, function () { b.classList.remove('speaking'); });
    });
    return b;
  }
  function caTextOf(el) {
    var clone = el.cloneNode(true);
    var kill = clone.querySelectorAll('.pron, .en, .say');
    for (var i = 0; i < kill.length; i++) kill[i].remove();
    return cleanSpeak(clone.textContent);
  }
  function injectSpeech() {
    // every Catalan word/phrase: td.ca cells and inline span.ca — but not
    // inside exercises (would give answers away) or the answer key boxes.
    var nodes = document.querySelectorAll('td.ca, span.ca, p .ca');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      if (el.closest('.ex') || el.closest('.model-answer') || el.querySelector('.say')) continue;
      var t = caTextOf(el);
      if (!t) continue;
      el.appendChild(document.createTextNode(' '));
      el.appendChild(sayButton(t));
    }
    // dialogues: per-line buttons + play-whole-dialogue with highlighting
    var dialogues = document.querySelectorAll('.dialogue');
    for (var d = 0; d < dialogues.length; d++) initDialogue(dialogues[d]);
  }
  function dialogueLineText(p) {
    var clone = p.cloneNode(true);
    var kill = clone.querySelectorAll('.spk, .say');
    for (var i = 0; i < kill.length; i++) kill[i].remove();
    return cleanSpeak(clone.textContent);
  }
  function initDialogue(dlg) {
    if (dlg.closest('.ex')) return;
    var lines = [];
    var ps = dlg.querySelectorAll('p');
    for (var i = 0; i < ps.length; i++) {
      if (ps[i].classList.contains('gloss')) continue;
      var t = dialogueLineText(ps[i]);
      if (!t) continue;
      lines.push({ p: ps[i], text: t });
      ps[i].appendChild(document.createTextNode(' '));
      ps[i].appendChild(sayButton(t, 'Listen to this line'));
    }
    if (!lines.length) return;
    var ctr = document.createElement('div');
    ctr.className = 'dialogue-controls';
    var play = document.createElement('button');
    play.type = 'button'; play.className = 'btn'; play.textContent = '▶ Play whole dialogue';
    var stop = document.createElement('button');
    stop.type = 'button'; stop.className = 'btn'; stop.textContent = '■ Stop'; stop.hidden = true;
    ctr.appendChild(play); ctr.appendChild(document.createTextNode(' ')); ctr.appendChild(stop);
    dlg.appendChild(ctr);
    var stopped = false;
    function clearHi() { for (var j = 0; j < lines.length; j++) lines[j].p.classList.remove('playing'); }
    function done() { clearHi(); play.hidden = false; stop.hidden = true; }
    function playFrom(idx) {
      if (stopped || idx >= lines.length) { done(); return; }
      clearHi();
      lines[idx].p.classList.add('playing');
      speak(lines[idx].text, function () { setTimeout(function () { playFrom(idx + 1); }, 350); });
    }
    play.addEventListener('click', function () {
      stopSpeak(); stopped = false; play.hidden = true; stop.hidden = false; playFrom(0);
    });
    stop.addEventListener('click', function () { stopped = true; stopSpeak(); done(); });
  }

  // --------------------------------------------------------- char strip
  var strip, lastInput = null, stripLock = false;
  function buildCharStrip() {
    strip = document.createElement('div');
    strip.className = 'char-strip';
    strip.setAttribute('aria-label', 'Catalan characters');
    var chars = ['à', 'è', 'é', 'í', 'ï', 'ò', 'ó', 'ú', 'ü', 'ç', 'l·l'];
    chars.forEach(function (c) {
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = c;
      b.addEventListener('mousedown', function (e) { e.preventDefault(); stripLock = true; });
      b.addEventListener('click', function (e) {
        e.preventDefault();
        if (!lastInput) return;
        var el = lastInput, s = el.selectionStart || 0, epos = el.selectionEnd || 0;
        el.value = el.value.slice(0, s) + c + el.value.slice(epos);
        el.selectionStart = el.selectionEnd = s + c.length;
        el.focus();
        stripLock = false;
      });
      strip.appendChild(b);
    });
    document.body.appendChild(strip);
    document.addEventListener('focusin', function (e) {
      var t = e.target;
      if ((t.tagName === 'INPUT' && t.type === 'text') || t.tagName === 'TEXTAREA') {
        if (t.id === 'glosSearch') return;
        lastInput = t; strip.classList.add('visible');
      }
    });
    document.addEventListener('focusout', function () {
      setTimeout(function () {
        if (stripLock) return;
        var a = document.activeElement;
        if (!a || ((a.tagName !== 'INPUT' || a.type !== 'text') && a.tagName !== 'TEXTAREA')) {
          strip.classList.remove('visible');
        }
      }, 120);
    });
  }

  // -------------------------------------------------------------- nav
  function initNav() {
    var toggle = document.getElementById('navToggle');
    var backdrop = document.getElementById('backdrop');
    if (toggle) toggle.addEventListener('click', function () {
      var open = document.body.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    if (backdrop) backdrop.addEventListener('click', function () { document.body.classList.remove('nav-open'); });
  }

  // ----------------------------------------------------------- progress
  function unitProgress(u) {
    var passed = 0, attempted = 0;
    u.exercises.forEach(function (id) {
      var st = exState(id).state;
      if (st === 'passed') passed++;
      else if (st === 'attempted') attempted++;
    });
    return { passed: passed, attempted: attempted, total: u.exercises.length };
  }
  function refreshProgress() {
    // nav badges
    CAT.units.forEach(function (u) {
      var b = document.querySelector('.nav-badge[data-unit="' + u.num + '"]');
      if (!b) return;
      var p = unitProgress(u);
      b.textContent = p.passed + '/' + p.total;
      b.classList.toggle('done', p.passed === p.total);
    });
    // exercise state chips
    var chips = document.querySelectorAll('[data-exstate]');
    for (var i = 0; i < chips.length; i++) {
      var id = chips[i].getAttribute('data-exstate');
      var st = exState(id);
      chips[i].className = 'ex-state ' + (st.state === 'untouched' ? '' : st.state);
      chips[i].textContent = st.state === 'passed' ? '✓ done' : st.state === 'attempted' ? 'tried' : '';
    }
    // index dashboard
    var overall = document.getElementById('overallBar');
    if (overall) {
      var passed = 0, attempted = 0, total = 0;
      CAT.units.forEach(function (u) {
        var p = unitProgress(u);
        passed += p.passed; attempted += p.attempted; total += p.total;
      });
      overall.style.width = (total ? Math.round(passed / total * 100) : 0) + '%';
      document.getElementById('overallStats').textContent =
        passed + ' of ' + total + ' exercises passed' + (attempted ? ' · ' + attempted + ' in progress' : '');
      CAT.units.forEach(function (u) {
        var p = unitProgress(u);
        var bar = document.querySelector('[data-unitbar="' + u.num + '"]');
        var stats = document.querySelector('[data-unitstats="' + u.num + '"]');
        if (bar) bar.style.width = Math.round(p.passed / p.total * 100) + '%';
        if (stats) stats.textContent = p.passed + '/' + p.total + ' exercises' + (p.passed === p.total ? ' ✓' : '');
      });
      var attempts = sget('mock.attempts', []);
      var ms = document.getElementById('mockStats');
      if (ms) ms.textContent = attempts.length
        ? 'Mock exam attempts: ' + attempts.length + ' (last: ' + attempts[attempts.length - 1].date + ')'
        : 'Mock exam not attempted yet.';
    }
  }

  function initChecklist() {
    var boxes = document.querySelectorAll('.check-item');
    if (!boxes.length) return;
    var saved = sget('checklist', []);
    for (var i = 0; i < boxes.length; i++) {
      (function (box) {
        var idx = +box.getAttribute('data-check');
        box.checked = !!saved[idx];
        box.closest('li').classList.toggle('done', box.checked);
        box.addEventListener('change', function () {
          var cur = sget('checklist', []);
          cur[idx] = box.checked;
          sset('checklist', cur);
          box.closest('li').classList.toggle('done', box.checked);
        });
      })(boxes[i]);
    }
  }

  function initReset() {
    var btn = document.getElementById('resetProgress');
    if (!btn) return;
    btn.addEventListener('click', function () {
      if (!confirm('Reset ALL progress? This clears exercise results, the checklist and mock-exam history on this device.')) return;
      var kill = [];
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k && k.indexOf(NS) === 0) kill.push(k);
      }
      kill.forEach(function (k) { localStorage.removeItem(k); });
      location.reload();
    });
  }

  // ------------------------------------------------------ exercise engine
  function controls(ctr, opts) {
    ctr.innerHTML = '';
    var out = {};
    if (opts.check) {
      out.check = document.createElement('button');
      out.check.type = 'button'; out.check.className = 'btn btn-primary'; out.check.textContent = opts.checkLabel || 'Check answers';
      ctr.appendChild(out.check);
    }
    if (opts.reveal) {
      out.reveal = document.createElement('button');
      out.reveal.type = 'button'; out.reveal.className = 'btn'; out.reveal.textContent = opts.revealLabel || 'Show model answer';
      ctr.appendChild(out.reveal);
    }
    out.score = document.createElement('span');
    out.score.className = 'ex-score';
    ctr.appendChild(out.score);
    out.retry = document.createElement('button');
    out.retry.type = 'button'; out.retry.className = 'btn'; out.retry.textContent = 'Retry'; out.retry.hidden = true;
    ctr.appendChild(out.retry);
    return out;
  }
  function showScore(el, score, total) {
    el.textContent = score + ' / ' + total + (score === total ? ' — perfecte!' : '');
    el.className = 'ex-score ' + (score === total ? 'ok' : 'bad');
  }

  function initGapLike(box, id, data) {
    // gap, write & paradigm: text inputs checked against the key
    var items = box.querySelectorAll('ol.q > li, .q > li');
    var ctr = box.querySelector('.ex-controls');
    var ui = controls(ctr, { check: true });
    var opts = { ipa: !!data.ipa, caps: !!data.caps };
    ui.check.addEventListener('click', function () {
      var score = 0, total = 0;
      for (var i = 0; i < items.length; i++) {
        var inputs = items[i].querySelectorAll('.gap-input');
        var itemOK = true;
        for (var g = 0; g < inputs.length; g++) {
          total++;
          var ans = data.answers[i][g];
          var res = checkText(inputs[g].value, ans, opts);
          inputs[g].className = 'gap-input ' + (res === 'bad' ? 'bad' : res);
          if (res === 'bad') itemOK = false; else score++;
          if (res === 'almost') fb(items[i].querySelector('.item-fb'), 'almost');
        }
        var f = items[i].querySelector('.item-fb');
        if (f && f.className.indexOf('almost') === -1) fb(f, itemOK ? 'ok' : 'bad');
        if (data.ipaNotes && data.ipaNotes[i]) {
          var ipaSpan = items[i].querySelector('.paradigm-ipa');
          if (ipaSpan) ipaSpan.textContent = data.ipaNotes[i];
        }
      }
      showScore(ui.score, score, total);
      ui.retry.hidden = false;
      setExState(id, score === total ? 'passed' : 'attempted', score, total);
    });
    ui.retry.addEventListener('click', function () {
      var inputs = box.querySelectorAll('.gap-input');
      for (var i = 0; i < inputs.length; i++) { inputs[i].value = ''; inputs[i].className = 'gap-input'; }
      var fbs = box.querySelectorAll('.item-fb');
      for (var j = 0; j < fbs.length; j++) { fbs[j].className = 'item-fb'; fbs[j].textContent = ''; }
      ui.score.textContent = ''; ui.retry.hidden = true;
    });
  }

  function initInstantChoice(box, id, getAnswer, total, onComplete) {
    // tf & choice (and mock paper 1): instant feedback on each button
    var groups = box.querySelectorAll('.tf-btns');
    var answered = {}, score = 0;
    function finished() { return Object.keys(answered).length === total; }
    for (var i = 0; i < groups.length; i++) {
      (function (grp) {
        var idx = +grp.getAttribute('data-item');
        grp.addEventListener('click', function (e) {
          var btn = e.target.closest('.tf-btn');
          if (!btn || answered[idx] !== undefined) return;
          var ans = getAnswer(idx);
          var val = btn.getAttribute('data-val');
          var correct = String(ans.val !== undefined ? ans.val : ans) === val;
          answered[idx] = correct;
          if (correct) score++;
          btn.classList.add(correct ? 'ok' : 'bad');
          if (!correct) {
            var btns = grp.querySelectorAll('.tf-btn');
            for (var b = 0; b < btns.length; b++) {
              if (btns[b].getAttribute('data-val') === String(ans.val !== undefined ? ans.val : ans)) btns[b].classList.add('ok');
            }
          }
          var f = grp.parentNode.querySelector('.item-fb');
          var note = ans.note ? ' — ' + ans.note : '';
          fb(f, correct ? 'ok' : 'bad', '✓' + note);
          if (!correct && f) f.textContent = '✗' + note;
          if (finished() && onComplete) onComplete(score, total);
        });
      })(groups[i]);
    }
    return {
      reset: function () {
        answered = {}; score = 0;
        var btns = box.querySelectorAll('.tf-btn');
        for (var b = 0; b < btns.length; b++) btns[b].classList.remove('ok', 'bad', 'sel');
        var fbs = box.querySelectorAll('.item-fb');
        for (var j = 0; j < fbs.length; j++) { fbs[j].className = 'item-fb'; fbs[j].textContent = ''; }
      }
    };
  }

  function initTF(box, id, data) {
    var ctr = box.querySelector('.ex-controls');
    var ui = controls(ctr, {});
    var widget = initInstantChoice(box, id, function (i) { return data.answers[i]; }, data.answers.length,
      function (score, total) {
        showScore(ui.score, score, total);
        ui.retry.hidden = false;
        setExState(id, score === total ? 'passed' : 'attempted', score, total);
      });
    ui.retry.addEventListener('click', function () { widget.reset(); ui.score.textContent = ''; ui.retry.hidden = true; });
  }

  function initMatch(box, id, pairs, ctr, onDone) {
    var wrap = box.querySelector('.match');
    var leftBtns = wrap.querySelectorAll('[data-side="l"]');
    var rightBtns = wrap.querySelectorAll('[data-side="r"]');
    var ui = controls(ctr, { check: true });
    var chosen = {};   // left index (0-based) → letter
    var selLeft = null;
    function tag(btn, letter) {
      var t = btn.querySelector('.pair-tag');
      if (!t) { t = document.createElement('span'); t.className = 'pair-tag'; btn.appendChild(t); }
      t.textContent = letter ? '→ ' + letter : '';
    }
    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('.match-item');
      if (!btn) return;
      if (btn.getAttribute('data-side') === 'l') {
        if (selLeft) selLeft.classList.remove('sel');
        selLeft = btn; btn.classList.add('sel');
        var k = btn.getAttribute('data-key');
        if (chosen[k]) { // unpair on reselect
          var letter = chosen[k]; delete chosen[k];
          tag(btn, null); btn.classList.remove('paired');
          for (var r = 0; r < rightBtns.length; r++) if (rightBtns[r].getAttribute('data-key') === letter) rightBtns[r].classList.remove('paired');
        }
      } else if (selLeft) {
        var letter2 = btn.getAttribute('data-key');
        // free this letter from any previous pairing
        for (var key in chosen) if (chosen[key] === letter2) {
          delete chosen[key];
          for (var l = 0; l < leftBtns.length; l++) if (leftBtns[l].getAttribute('data-key') === key) { tag(leftBtns[l], null); leftBtns[l].classList.remove('paired'); }
        }
        chosen[selLeft.getAttribute('data-key')] = letter2;
        tag(selLeft, letter2);
        selLeft.classList.add('paired'); btn.classList.add('paired');
        selLeft.classList.remove('sel'); selLeft = null;
      }
    });
    ui.check.addEventListener('click', function () {
      var score = 0, total = Object.keys(pairs).length;
      for (var i = 0; i < leftBtns.length; i++) {
        var k = leftBtns[i].getAttribute('data-key');
        var want = pairs[String(+k + 1)];
        var ok = chosen[k] === want;
        leftBtns[i].classList.remove('ok', 'bad');
        leftBtns[i].classList.add(ok ? 'ok' : 'bad');
        if (!ok) tag(leftBtns[i], (chosen[k] ? chosen[k] + ' ✗ → ' : '→ ') + want);
        if (ok) score++;
      }
      showScore(ui.score, score, total);
      ui.retry.hidden = false;
      onDone(score, total);
    });
    ui.retry.addEventListener('click', function () {
      chosen = {}; selLeft = null;
      var all = wrap.querySelectorAll('.match-item');
      for (var i = 0; i < all.length; i++) {
        all[i].classList.remove('ok', 'bad', 'sel', 'paired');
        var t = all[i].querySelector('.pair-tag'); if (t) t.remove();
      }
      ui.score.textContent = ''; ui.retry.hidden = true;
    });
    return ui;
  }

  function normSentence(s) {
    return s.replace(/[‘’]/g, "'").replace(/\([^)]*\)/g, function (m) { return m.slice(1, -1); })
      .replace(/\s+([.?!,])/g, '$1').replace(/\s+/g, ' ').trim().toLowerCase().replace(/[.!]+$/, '');
  }
  function initReorder(box, id, data) {
    var ctr = box.querySelector('.ex-controls');
    var ui = controls(ctr, { check: true });
    var blocks = box.querySelectorAll('.reorder');
    var seqs = [];
    for (var i = 0; i < blocks.length; i++) {
      (function (blk, idx) {
        seqs[idx] = [];
        var out = blk.querySelector('.reorder-out');
        var chips = blk.querySelectorAll('.reorder-pool .chip');
        function render() {
          out.textContent = seqs[idx].map(function (j) { return data.answers[idx].tokens[j]; }).join(' ')
            .replace(/\s+([.?!,])/g, '$1');
          out.className = 'reorder-out';
        }
        blk.querySelector('.reorder-pool').addEventListener('click', function (e) {
          var c = e.target.closest('.chip');
          if (!c || c.disabled) return;
          c.disabled = true;
          seqs[idx].push(+c.getAttribute('data-tok'));
          render();
        });
        blk.querySelector('.chip-undo').addEventListener('click', function () {
          var last = seqs[idx].pop();
          if (last !== undefined) {
            for (var j = 0; j < chips.length; j++) if (+chips[j].getAttribute('data-tok') === last) chips[j].disabled = false;
          }
          render();
        });
      })(blocks[i], i);
    }
    ui.check.addEventListener('click', function () {
      var score = 0, total = blocks.length;
      for (var i = 0; i < blocks.length; i++) {
        var out = blocks[i].querySelector('.reorder-out');
        var built = seqs[i].map(function (j) { return data.answers[i].tokens[j]; }).join(' ');
        var complete = seqs[i].length === data.answers[i].tokens.length;
        var ok = complete && normSentence(built) === normSentence(data.answers[i].answer);
        out.classList.add(ok ? 'ok' : 'bad');
        fb(blocks[i].querySelector('.item-fb'), ok ? 'ok' : 'bad',
          ok ? '✓' : undefined);
        if (!ok) blocks[i].querySelector('.item-fb').textContent = '✗ → ' + data.answers[i].answer;
        if (ok) score++;
      }
      showScore(ui.score, score, total);
      ui.retry.hidden = false;
      setExState(id, score === total ? 'passed' : 'attempted', score, total);
    });
    ui.retry.addEventListener('click', function () {
      for (var i = 0; i < blocks.length; i++) {
        seqs[i] = [];
        var chips = blocks[i].querySelectorAll('.reorder-pool .chip');
        for (var j = 0; j < chips.length; j++) chips[j].disabled = false;
        var out = blocks[i].querySelector('.reorder-out');
        out.textContent = ''; out.className = 'reorder-out';
        var f = blocks[i].querySelector('.item-fb'); f.className = 'item-fb'; f.textContent = '';
      }
      ui.score.textContent = ''; ui.retry.hidden = true;
    });
  }

  function selfMarkWidget(span, onMark) {
    var yes = span.querySelector('.sm-yes'), no = span.querySelector('.sm-no');
    if (yes) yes.addEventListener('click', function () {
      yes.classList.add('sel'); if (no) no.classList.remove('sel'); onMark(true);
    });
    if (no) no.addEventListener('click', function () {
      no.classList.add('sel'); if (yes) yes.classList.remove('sel'); onMark(false);
    });
  }

  function initModel(box, id) {
    var ctr = box.querySelector('.ex-controls');
    var ui = controls(ctr, { reveal: true });
    var model = box.querySelector('.model-answer');
    var marks = box.querySelectorAll('.self-mark');
    var states = {};
    function update() {
      var got = 0, marked = 0;
      for (var k in states) { marked++; if (states[k]) got++; }
      if (marked < marks.length) { ui.score.textContent = ''; setExState(id, 'attempted', got, marks.length); return; }
      showScore(ui.score, got, marks.length);
      setExState(id, got === marks.length ? 'passed' : 'attempted', got, marks.length);
      ui.retry.hidden = false;
    }
    ui.reveal.addEventListener('click', function () {
      model.hidden = false;
      for (var i = 0; i < marks.length; i++) marks[i].hidden = false;
      ui.reveal.disabled = true;
      setExState(id, 'attempted', 0, marks.length);
    });
    for (var i = 0; i < marks.length; i++) {
      (function (idx) { selfMarkWidget(marks[idx], function (ok) { states[idx] = ok; update(); }); })(i);
    }
    ui.retry.addEventListener('click', function () {
      states = {};
      model.hidden = true; ui.reveal.disabled = false; ui.score.textContent = ''; ui.retry.hidden = true;
      var ins = box.querySelectorAll('.model-input, .free-text');
      for (var j = 0; j < ins.length; j++) ins[j].value = '';
      var sels = box.querySelectorAll('.sm-btn');
      for (var s = 0; s < sels.length; s++) sels[s].classList.remove('sel');
      for (var m = 0; m < marks.length; m++) marks[m].hidden = true;
    });
  }

  function initFree(box, id) {
    var ctr = box.querySelector('.ex-controls');
    var hasModel = !!box.querySelector('.model-answer .model-body') && box.querySelector('.model-answer .model-body').textContent.trim() !== '';
    var ui = controls(ctr, { reveal: hasModel });
    var model = box.querySelector('.model-answer');
    var mark = box.querySelector('.self-mark');
    var ta = box.querySelector('.free-text');
    if (ta) ta.addEventListener('input', function () {
      if (exState(id).state === 'untouched') setExState(id, 'attempted', 0, 1);
    });
    if (ui.reveal) ui.reveal.addEventListener('click', function () {
      model.hidden = false; mark.hidden = false; ui.reveal.disabled = true;
      if (exState(id).state === 'untouched') setExState(id, 'attempted', 0, 1);
    });
    else if (mark) mark.hidden = false;
    selfMarkWidget(mark, function (ok) {
      showScore(ui.score, ok ? 1 : 0, 1);
      setExState(id, ok ? 'passed' : 'attempted', ok ? 1 : 0, 1);
      ui.retry.hidden = false;
    });
    ui.retry.addEventListener('click', function () {
      if (ta) ta.value = '';
      if (model) model.hidden = true;
      if (ui.reveal) ui.reveal.disabled = false;
      mark.hidden = !!ui.reveal;
      var sels = box.querySelectorAll('.sm-btn');
      for (var s = 0; s < sels.length; s++) sels[s].classList.remove('sel');
      var al = box.querySelector('.aloud-check'); if (al) al.checked = false;
      ui.score.textContent = ''; ui.retry.hidden = true;
    });
  }

  function initPersonal(box, id) {
    var mark = box.querySelector('.self-mark');
    selfMarkWidget(mark, function () { setExState(id, 'passed', 1, 1); });
    var ins = box.querySelectorAll('.gap-input');
    for (var i = 0; i < ins.length; i++) ins[i].addEventListener('input', function () {
      if (exState(id).state === 'untouched') setExState(id, 'attempted', 0, 1);
    });
  }

  function initExercises() {
    var boxes = document.querySelectorAll('.ex[data-ex]');
    for (var i = 0; i < boxes.length; i++) {
      var box = boxes[i];
      var id = box.getAttribute('data-ex');
      var data = CAT.ex[id];
      if (!data) continue;
      var type = data.type;
      if (type === 'gap' || type === 'write' || type === 'paradigm') initGapLike(box, id, data);
      else if (type === 'tf' || type === 'choice') initTF(box, id, data);
      else if (type === 'match') initMatch(box, id, data.pairs, box.querySelector('.ex-controls'),
        (function (id2) { return function (score, total) { setExState(id2, score === total ? 'passed' : 'attempted', score, total); }; })(id));
      else if (type === 'reorder') initReorder(box, id, data);
      else if (type === 'model') initModel(box, id);
      else if (type === 'free') initFree(box, id);
      else if (type === 'personal') initPersonal(box, id);
    }
  }

  // ------------------------------------------------------------- glossary
  function initGlossary() {
    var table = document.getElementById('glosTable');
    if (!table) return;
    var tbody = table.tBodies[0];
    var rows = Array.prototype.slice.call(tbody.rows);
    // speech buttons per entry
    rows.forEach(function (r) {
      var ca = r.cells[0];
      if (ca.querySelector('.say')) return;   // injectSpeech may already have added one
      ca.appendChild(document.createTextNode(' '));
      ca.appendChild(sayButton(caTextOf(ca)));
    });
    var search = document.getElementById('glosSearch');
    var count = document.getElementById('glosCount');
    function applyFilter() {
      var q = deaccent(search.value);
      var shown = 0;
      rows.forEach(function (r) {
        var hit = !q || deaccent(r.textContent).indexOf(q) !== -1;
        r.style.display = hit ? '' : 'none';
        if (hit) shown++;
      });
      count.textContent = shown === rows.length ? rows.length + ' entries' : shown + ' of ' + rows.length + ' entries';
    }
    search.addEventListener('input', applyFilter);
    applyFilter();
    var heads = table.querySelectorAll('th.sortable');
    for (var h = 0; h < heads.length; h++) {
      (function (th) {
        th.addEventListener('click', function () {
          var col = +th.getAttribute('data-sort');
          var dir = th.classList.contains('asc') ? -1 : 1;
          for (var k = 0; k < heads.length; k++) heads[k].classList.remove('asc', 'desc');
          th.classList.add(dir === 1 ? 'asc' : 'desc');
          rows.sort(function (a, b) {
            var av = a.cells[col].textContent.trim(), bv = b.cells[col].textContent.trim();
            if (col === 3) return (+av - +bv) * dir;
            // ignore leading articles for the Catalan column, like the printed glossary
            if (col === 0) {
              av = deaccent(av).replace(/^(el |la |els |les |l'|un |una )/, '');
              bv = deaccent(bv).replace(/^(el |la |els |les |l'|un |una )/, '');
            }
            return av.localeCompare(bv, 'ca') * dir;
          });
          rows.forEach(function (r) { tbody.appendChild(r); });
        });
      })(heads[h]);
    }
  }

  // ------------------------------------------------------------- mock exam
  function initMock() {
    if (document.body.getAttribute('data-page') !== 'mock') return;
    var overtime = {};
    // exam conditions + timers
    var cond = document.getElementById('examConditions');
    cond.checked = sget('mock.conditions', false);
    document.body.classList.toggle('exam-mode', cond.checked);
    cond.addEventListener('change', function () {
      sset('mock.conditions', cond.checked);
      document.body.classList.toggle('exam-mode', cond.checked);
    });
    var timers = document.querySelectorAll('.paper-timer');
    for (var t = 0; t < timers.length; t++) {
      (function (el) {
        var paper = el.getAttribute('data-paper');
        var mins = +el.getAttribute('data-mins');
        var btn = el.querySelector('.timer-start');
        var disp = el.querySelector('.timer-display');
        var left = mins * 60, iv = null;
        function render() {
          var m = Math.floor(Math.abs(left) / 60), s = Math.abs(left) % 60;
          disp.textContent = (left < 0 ? '−' : '') + m + ':' + (s < 10 ? '0' : '') + s;
          disp.classList.toggle('overtime', left < 0);
        }
        btn.addEventListener('click', function () {
          if (iv) { clearInterval(iv); iv = null; left = mins * 60; btn.textContent = 'Start ' + mins + '-min timer'; disp.textContent = ''; disp.classList.remove('overtime'); return; }
          btn.textContent = 'Reset timer';
          render();
          iv = setInterval(function () {
            left--;
            if (left === 0) overtime[paper] = true;   // soft stop: flag, keep counting
            render();
          }, 1000);
        });
      })(timers[t]);
    }

    // Paper 1 — listening
    var playBtn = document.getElementById('playScript');
    var stopBtn = document.getElementById('stopScript');
    var playState = document.getElementById('playState');
    var stopped = false;
    function playTwice() {
      stopped = false;
      playBtn.hidden = true; stopBtn.hidden = false;
      playState.textContent = 'Playing — first reading…';
      speak(CAT.mock.script, function () {
        if (stopped) return;
        playState.textContent = 'Pause… second reading starts in 5 s';
        setTimeout(function () {
          if (stopped) return;
          playState.textContent = 'Playing — second reading…';
          speak(CAT.mock.script, function () {
            playState.textContent = 'Done. Now answer the questions.';
            playBtn.hidden = false; stopBtn.hidden = true;
          }, 0.9);
        }, 5000);
      }, 0.9);
    }
    playBtn.addEventListener('click', function () { stopSpeak(); playTwice(); });
    stopBtn.addEventListener('click', function () {
      stopped = true; stopSpeak();
      playBtn.hidden = false; stopBtn.hidden = true; playState.textContent = '';
    });
    var p1score = null;
    var p1ui = controls(document.getElementById('p1controls'), {});
    var p1box = document.getElementById('paper1');
    var p1widget = initInstantChoice(p1box, 'mock1', function (i) { return CAT.mock.p1[i]; }, CAT.mock.p1.length,
      function (score, total) {
        p1score = score;
        showScore(p1ui.score, score, total);
        p1ui.retry.hidden = false;
        document.getElementById('scriptReveal').hidden = false;
      });
    p1ui.retry.addEventListener('click', function () {
      p1widget.reset(); p1score = null; p1ui.score.textContent = ''; p1ui.retry.hidden = true;
      document.getElementById('scriptReveal').hidden = true;
      document.querySelector('.script-text').hidden = true;
    });
    document.getElementById('showScript').addEventListener('click', function () {
      document.querySelector('.script-text').hidden = false;
    });

    // Paper 2A — short answers, model + per-item self-mark
    var p2aUi = controls(document.getElementById('p2aControls'), { reveal: true, revealLabel: 'Show answers' });
    var p2aMarks = document.querySelectorAll('#p2a .self-mark');
    var p2aStates = {};
    p2aUi.reveal.addEventListener('click', function () {
      document.getElementById('p2aModel').hidden = false;
      for (var i = 0; i < p2aMarks.length; i++) p2aMarks[i].hidden = false;
      p2aUi.reveal.disabled = true;
    });
    for (var i2 = 0; i2 < p2aMarks.length; i2++) {
      (function (idx) {
        selfMarkWidget(p2aMarks[idx], function (ok) {
          p2aStates[idx] = ok;
          var got = 0, n = 0;
          for (var k in p2aStates) { n++; if (p2aStates[k]) got++; }
          if (n === p2aMarks.length) showScore(p2aUi.score, got, n);
        });
      })(i2);
    }

    // Paper 2B — matching
    var p2bScore = null;
    var p2bBox = document.getElementById('paper2');
    initMatch(p2bBox, 'mock2b', CAT.mock.p2b, document.getElementById('p2bControls'),
      function (score) { p2bScore = score; });

    // Paper 3 — writing
    var p3text = document.getElementById('p3text');
    var p3words = document.getElementById('p3words');
    p3text.addEventListener('input', function () {
      var w = p3text.value.trim().split(/\s+/).filter(Boolean).length;
      p3words.textContent = w;
    });
    var p3mark = null;
    document.getElementById('p3reveal').addEventListener('click', function () {
      document.getElementById('p3model').hidden = false;
      document.getElementById('p3mark').hidden = false;
    });
    selfMarkWidget(document.getElementById('p3mark'), function (ok) { p3mark = ok; });

    // Paper 4 — speaking
    var p4mark = null;
    document.getElementById('p4reveal').addEventListener('click', function () {
      document.getElementById('p4model').hidden = false;
      document.getElementById('p4mark2').hidden = false;
    });
    selfMarkWidget(document.getElementById('p4mark2'), function (ok) { p4mark = ok; });

    // attempts
    function renderHistory() {
      var attempts = sget('mock.attempts', []);
      var holder = document.getElementById('attemptHistory');
      if (!attempts.length) { holder.textContent = 'No attempts saved yet.'; return; }
      var html = '<table class="attempt-table"><thead><tr><th>Date</th><th>P1 listening</th><th>P2 reading</th><th>P3 writing</th><th>P4 speaking</th></tr></thead><tbody>';
      attempts.slice().reverse().forEach(function (a) {
        function ot(p) { return a.overtime && a.overtime[p] ? ' <span class="over-tag">over time</span>' : ''; }
        html += '<tr><td>' + a.date + '</td>' +
          '<td>' + (a.p1 === null ? '—' : a.p1 + '/6') + ot(1) + '</td>' +
          '<td>' + (a.p2a === null ? '—' : a.p2a + '/4') + ' + ' + (a.p2b === null ? '—' : a.p2b + '/5') + ot(2) + '</td>' +
          '<td>' + (a.p3 === null ? '—' : a.p3 ? 'self-passed' : 'not yet') + ' (' + a.p3words + ' w.)' + ot(3) + '</td>' +
          '<td>' + a.p4aloud + '/8 aloud · ' + (a.p4 === null ? '—' : a.p4 ? 'self-passed' : 'not yet') + ot(4) + '</td></tr>';
      });
      holder.innerHTML = html + '</tbody></table>';
    }
    renderHistory();
    document.getElementById('saveAttempt').addEventListener('click', function () {
      var got2a = null, n2a = 0, g2a = 0;
      for (var k in p2aStates) { n2a++; if (p2aStates[k]) g2a++; }
      if (n2a) got2a = g2a;
      var aloud = document.querySelectorAll('#p4qs .aloud-check:checked').length;
      var attempts = sget('mock.attempts', []);
      attempts.push({
        date: new Date().toISOString().slice(0, 10),
        p1: p1score, p2a: got2a, p2b: p2bScore,
        p3: p3mark, p3words: +p3words.textContent || 0,
        p4: p4mark, p4aloud: aloud,
        overtime: overtime,
      });
      sset('mock.attempts', attempts);
      renderHistory();
      refreshProgress();
      alert('Attempt saved.');
    });
  }

  // ------------------------------------------------------------------ boot
  document.addEventListener('DOMContentLoaded', function () {
    initNav();
    injectSpeech();
    buildCharStrip();
    initExercises();
    initChecklist();
    initReset();
    initGlossary();
    initMock();
    refreshProgress();
  });
})();
