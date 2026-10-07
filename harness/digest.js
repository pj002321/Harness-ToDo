// 결과물: 분야 칩 + 썸네일 카드 브리핑 페이지. 서버에서 그려서 내보낸다 — 스크립트 없음.
// 분야 선택은 평범한 GET 폼(?c=경제&c=AI). 필터링은 코드가 한다, AI 호출 없음.
import { CATEGORIES } from './collect.js';

const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const safeUrl = (u) => (/^https?:\/\//i.test(u ?? '') ? esc(u) : '#');
const when = (d) => { const t = new Date(d); return isNaN(t) ? '' : t.toLocaleString('ko-KR', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }); };

export const CSP = "default-src 'none'; img-src https: http:; style-src 'unsafe-inline'; form-action 'self'";

// digest: digest.json 내용, selected: 보여줄 분야 배열, runId: 이 브리핑을 만든 실행
// pinned: ?run= 으로 특정 실행을 보고 있으면 필터를 바꿔도 그 실행에 머문다
export function renderBriefing({ digest, selected, runId, pinned = false }) {
  const shown = digest?.filter((d) => selected.includes(d.category)) ?? [];
  const chips = Object.keys(CATEGORIES).map((c) => `
    <label class="chip"><input type="checkbox" name="c" value="${esc(c)}"${selected.includes(c) ? ' checked' : ''}><span>${esc(c)}</span></label>`).join('');

  const cards = shown.map((d) => `
  <article class="card">
    <a class="thumb" href="${safeUrl(d.url)}" target="_blank" rel="noopener noreferrer">
      ${d.image ? `<img src="${safeUrl(d.image)}" alt="" loading="lazy" referrerpolicy="no-referrer">` : ''}
      <span class="cat">${esc(d.category)}</span>
    </a>
    <div class="body">
      <h2><a href="${safeUrl(d.url)}" target="_blank" rel="noopener noreferrer">${esc(d.headline)}</a></h2>
      <ul>${d.sentences.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
      <footer>
        <span class="${d.verified ? 'ok' : 'warn'}">${d.verified ? '✓ 원문 대조 통과' : '⚠ 미검증'}</span>
        <a href="${safeUrl(d.url)}" target="_blank" rel="noopener noreferrer">${esc(d.source)} · ${esc(when(d.published))} 원문 →</a>
      </footer>
    </div>
  </article>`).join('');

  const empty = !digest
    ? '아직 발행된 브리핑이 없습니다. <code>npm run harness</code> 로 오늘 브리핑을 만드세요.'
    : !selected.length ? '관심 분야를 하나 이상 고르세요.' : '선택한 분야에 오늘 실린 기사가 없습니다.';

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>오늘의 브리핑</title>
<style>
  :root { --bg: #f6f5f1; --card: #fff; --ink: #1c1c1a; --dim: #6b6a65; --line: #e4e2db; --ok: #1a7f37; --warn: #b35900; --accent: #1c1c1a; --on-accent: #fff;
          font: 15px/1.6 ui-sans-serif, system-ui, -apple-system, "Segoe UI", "Malgun Gothic", sans-serif; }
  @media (prefers-color-scheme: dark) { :root { --bg: #121211; --card: #1c1c1b; --ink: #ecebe6; --dim: #9a9890; --line: #2e2d2a; --ok: #3fb950; --warn: #e3a248; --accent: #ecebe6; --on-accent: #121211; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); }
  .wrap { max-width: 1180px; margin: 0 auto; padding: 0 24px; }
  header { padding: 44px 0 20px; display: flex; flex-wrap: wrap; gap: 16px 24px; align-items: end; justify-content: space-between; }
  header h1 { margin: 0; font-size: 34px; letter-spacing: -.02em; }
  header .how { color: var(--dim); font-size: 13px; }
  form { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; padding-bottom: 20px; border-bottom: 1px solid var(--line); margin-bottom: 24px; }
  .chip input { position: absolute; opacity: 0; pointer-events: none; }
  .chip span { display: inline-block; padding: 6px 14px; border: 1px solid var(--line); border-radius: 99px; cursor: pointer; user-select: none; color: var(--dim); background: var(--card); }
  .chip input:checked + span { background: var(--accent); color: var(--on-accent); border-color: var(--accent); }
  .chip input:focus-visible + span { outline: 2px solid var(--accent); outline-offset: 2px; }
  form button { margin-left: 4px; padding: 6px 14px; border-radius: 99px; border: 1px solid var(--line); background: none; color: var(--ink); font: inherit; cursor: pointer; }
  main { display: grid; gap: 20px; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); padding-bottom: 64px; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; }
  .thumb { position: relative; display: block; aspect-ratio: 16 / 9; background: linear-gradient(135deg, var(--line), var(--bg)); }
  .thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .cat { position: absolute; left: 10px; top: 10px; background: rgb(0 0 0 / .65); color: #fff; font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 99px; }
  .body { padding: 16px 18px 14px; display: flex; flex-direction: column; flex: 1; }
  h2 { margin: 0 0 10px; font-size: 18px; line-height: 1.4; letter-spacing: -.01em; }
  h2 a { color: inherit; text-decoration: none; } h2 a:hover { text-decoration: underline; }
  ul { margin: 0 0 14px; padding-left: 18px; } li { margin: 4px 0; }
  footer { margin-top: auto; display: flex; justify-content: space-between; gap: 12px; font-size: 12px; color: var(--dim); border-top: 1px solid var(--line); padding-top: 10px; }
  footer a { color: var(--dim); } .ok { color: var(--ok); } .warn { color: var(--warn); }
  .empty { grid-column: 1 / -1; color: var(--dim); text-align: center; padding: 64px 0; }
  .note { color: var(--dim); font-size: 12px; padding-bottom: 40px; }
  a.proc { color: var(--ink); }
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>오늘의 브리핑</h1>
    <span class="how">모든 문장은 원문 대조를 통과해야 실립니다 · <a class="proc" href="/process${runId ? `?run=${encodeURIComponent(runId)}` : ''}">이 브리핑이 만들어진 과정 보기 →</a></span>
  </header>
  <form method="get" action="/">
    <input type="hidden" name="sent" value="1">${pinned ? `<input type="hidden" name="run" value="${esc(runId)}">` : ''}${chips}
    <button type="submit">적용</button>
  </form>
  <main>${cards || `<p class="empty">${empty}</p>`}
  </main>
  <p class="note">요약은 AI가 작성했으며 원문을 대신하지 않습니다. 기사의 저작권은 각 언론사에 있습니다.</p>
</div>
</body>
</html>
`;
}
