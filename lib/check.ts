/* Pure answer-checking helpers shared by exercise components. */

export type CheckResult = 'ok' | 'almost' | 'bad';

export function norm(s: string): string {
  return s.replace(/[‘’ʼ]/g, "'")
    .replace(/[.,;:!?«»"“”…()·]/g, ' ')
    .replace(/\s+/g, ' ').trim().toLowerCase();
}
export function deaccent(s: string): string {
  return norm(s).normalize('NFD').replace(/[̀-ͯ]/g, '');
}
export function normIPA(s: string): string {
  return s.replace(/[/\sˈˌ.|]/g, '');
}
function answerVariants(ans: string): string[] {
  const v = [ans];
  if (ans.includes('(')) {
    v.push(ans.replace(/\([^)]*\)/g, ' '));
    v.push(ans.replace(/[()]/g, ''));
  }
  return v;
}

/** 'ok' exact (case/punct-insensitive), 'almost' right but missing accents, else 'bad'. */
export function checkText(user: string, ans: string, opts?: { ipa?: boolean; caps?: boolean }): CheckResult {
  if (opts?.ipa) return normIPA(user) === normIPA(ans) ? 'ok' : 'bad';
  if (opts?.caps) {
    const capUser = (user.match(/[A-ZÀÈÉÍÏÒÓÚÜÇ·]{2,}/) || [''])[0];
    const capAns = (ans.match(/[A-ZÀÈÉÍÏÒÓÚÜÇ·]{2,}/) || [''])[0];
    if (deaccent(user) !== deaccent(ans)) return 'bad';
    return deaccent(capUser) === deaccent(capAns) && capUser !== '' ? 'ok' : 'almost';
  }
  const variants = answerVariants(ans);
  for (const v of variants) if (norm(user) === norm(v)) return 'ok';
  for (const v of variants) if (deaccent(user) === deaccent(v)) return 'almost';
  return 'bad';
}

/** Sentence compare for reorder: parens-tolerant, punctuation-spacing-tolerant. */
export function normSentence(s: string): string {
  return s.replace(/[‘’]/g, "'").replace(/\(([^)]*)\)/g, '$1')
    .replace(/\s+([.?!,])/g, '$1').replace(/\s+/g, ' ').trim().toLowerCase().replace(/[.!]+$/, '');
}

/** Join clicked tokens with natural punctuation spacing. */
export function joinTokens(tokens: string[]): string {
  return tokens.join(' ').replace(/\s+([.?!,])/g, '$1');
}
