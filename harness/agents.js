// 세 에이전트의 "역할 = 프롬프트 + 입력 + 출력 모양".
// 프롬프트(태도·기준)는 prompts/*.md, 입력과 출력 모양과 합격 판정은 여기서 코드로 강제한다.
import { readFileSync } from 'node:fs';
import { runAgent } from './claude.js';
import { BRIEF_SCHEMA } from './contract.js';

const prompt = (name) => readFileSync(new URL(`../prompts/${name}.md`, import.meta.url), 'utf8');
const str = { type: 'string' };
const arr = (items) => ({ type: 'array', items });
const obj = (properties) => ({ type: 'object', properties, required: Object.keys(properties) });

// 요약은 최대 3문장 — 원문을 대신하지 않고 원문으로 보내는 미리보기여야 한다 (저작권). 발행할 때 한 번 더 자른다.
export const MAX_SENTENCES = 3;
export const DRAFT_SCHEMA = obj({ headline: str, sentences: { ...arr(str), maxItems: MAX_SENTENCES } });
const CHECK_SCHEMA = obj({
  sentences: arr(obj({ n: { type: 'integer' }, supported: { type: 'boolean' }, quote: str, reason: str })),
  unmet: arr(str),
});

// 기사 원문은 신뢰할 수 없는 입력 — 태그로 감싸 "지시가 아니라 데이터"임을 표시한다
export const source = (a) => `<article id="${a.id}">\n# ${a.title}\n${a.text}\n</article>`;
const candidates = (articles) => articles.map((a) => `- [${a.id}] ${a.title} (${a.source})\n  ${a.text.slice(0, 300)}…`).join('\n');
const fields = (o) => Object.entries(o).filter(([k]) => k !== 'id').map(([k, v]) => `- ${k}: ${[].concat(v).join(' / ')}`).join('\n') || '(없음 — 근거만 검사)';
const draftMd = (d) => `# ${d.headline}\n\n${d.sentences.map((s, i) => `${i + 1}. ${s}`).join('\n')}`;
const verdictMd = (v) =>
  `# ${v.pass ? 'PASS' : 'FAIL'}\n\n` +
  v.results.map((r) => `${r.ok ? '✅' : '❌'} ${r.n}. ${r.sentence}\n   ↳ ${r.ok ? `"${r.quote}"` : r.reason}`).join('\n') +
  (v.unmet.length ? `\n\n## 계약 미충족\n${v.unmet.map((u) => `- ${u}`).join('\n')}` : '');

function save(run, role, rel, content) {
  run.save(rel, content);
  run.event({ type: 'artifact', role, file: rel });
}

// 인용이 원문에 실제로 있는가 — Checker의 말을 믿지 않고 코드로 대조한다.
export const norm = (s) => s.toLowerCase().replace(/[\s"'“”‘’]+/g, ' ').trim();
export const grounded = (quote, text) => norm(quote).length >= 15 && norm(text).includes(norm(quote));

// ── 에이전트 ────────────────────────────────────────────────────────────
// articles: 한 분야의 후보들
export async function edit(run, { category, articles }) {
  const { output } = await runAgent({
    run, role: 'editor', step: `${category} 기사 선정`, system: prompt('editor'), schema: BRIEF_SCHEMA,
    prompt: `분야: ${category}\n\n오늘의 후보 기사 ${articles.length}개:\n${candidates(articles)}`,
  });
  const ids = new Set(articles.map((a) => a.id));
  const picks = output.picks.filter((p) => ids.has(p.id)); // 후보에 없는 id를 지어낸 선정은 버린다
  save(run, 'editor', `brief-${category}.md`, picks.map((p) => `## ${p.id} ${articles.find((a) => a.id === p.id).title}\n${fields(p)}`).join('\n\n'));
  return picks;
}

export async function write(run, { article, pick, attempt = 1, feedback }) {
  const { output: draft } = await runAgent({
    run, role: 'writer', step: `${article.id} 요약 #${attempt}`, system: prompt('writer'), schema: DRAFT_SCHEMA,
    prompt:
      `${source(article)}\n\n---\nEditor의 브리프:\n${fields(pick)}` +
      (feedback ? `\n\n---\n직전 초안에 대한 Checker 판정:\n${verdictMd(feedback)}\n실패한 문장을 고치거나 빼라.` : ''),
  });
  save(run, 'writer', `${article.id}/draft-${attempt}.md`, draftMd(draft));
  return draft;
}

// tag: 저장 위치 겸 화면 표시용 이름 (예: 'abc123/check-2', 'audit/abc123')
export async function check(run, { article, pick = {}, draft, tag }) {
  const { output: v } = await runAgent({
    run, role: 'checker', step: `${tag} 검수`, system: prompt('checker'), schema: CHECK_SCHEMA,
    prompt:
      `${source(article)}\n\n---\n계약:\n${fields(pick)}\n\n---\n검수할 요약:\n${draftMd(draft)}\n\n` +
      `문장마다 n(번호), 근거 여부, 근거가 되는 원문 구절(quote, 원문 그대로)을 내라. 지키지 못한 계약 항목은 unmet에 적어라.`,
  });
  // 최종 합격은 LLM의 말이 아니라 하네스가 계산한다:
  // 모든 문장에 판정이 있고, supported이며, 그 인용이 원문에 실제로 있어야 한다.
  const results = draft.sentences.map((sentence, i) => {
    const r = v.sentences.find((x) => x.n === i + 1);
    const ok = !!r?.supported && grounded(r.quote, article.text);
    const reason = !r ? '검수 누락' : r.supported && !ok ? `인용이 원문에 없음: "${r.quote}"` : r.reason;
    return { n: i + 1, sentence, ok, quote: r?.quote ?? '', reason };
  });
  const verdict = { results, unmet: v.unmet, pass: results.every((r) => r.ok) && v.unmet.length === 0 };
  save(run, 'checker', `${tag}.md`, verdictMd(verdict));
  run.event({
    type: 'verdict', tag, pass: verdict.pass, total: results.length,
    failed: [...results.filter((r) => !r.ok).map((r) => `문장 ${r.n}`), ...v.unmet],
  });
  return verdict;
}

// 발행. solo와 harness가 똑같이 거친다. items = [{ article, draft, verified }]
// AUDIT=1 이면 발행 전에 감사: 계약 없이 "근거 없는 문장"만 세는 독립 검수.
// solo와 harness를 같은 잣대로 비교할 때만 켠다 (호출 수가 기사 수만큼 는다).
export async function finish(run, items) {
  const audit = process.env.AUDIT ? { sentences: 0, unsupported: 0 } : null;
  for (const it of audit ? items : []) {
    const v = await check(run, { article: it.article, draft: it.draft, tag: `audit/${it.article.id}` });
    audit.sentences += v.results.length;
    audit.unsupported += v.results.filter((r) => !r.ok).length;
  }
  // 공개되는 것은 제목·요약·링크·썸네일 주소뿐. 기사 본문(text)은 싣지 않는다.
  const digest = items.map(({ article: { text, ...a }, draft, verified }) => ({
    ...a, headline: draft.headline, sentences: draft.sentences.slice(0, MAX_SENTENCES), verified,
  }));
  save(run, 'harness', 'digest.json', JSON.stringify(digest, null, 2));
  run.event({ type: 'done', published: digest.length, ...audit });
  console.log(`발행 ${digest.length}건${audit ? ` · 근거 없는 문장 ${audit.unsupported}/${audit.sentences}` : ''}`);
  console.log(`→ npm run view 후 http://localhost:4400/?run=${run.id}`);
}
