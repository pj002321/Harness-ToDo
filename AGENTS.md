# AGENTS.md

이 저장소에서 일하는 코딩 에이전트를 위한 지도. 매뉴얼이 아니다 — 깊은 내용은 링크를 따라간다.

## 이 저장소는

시사·경제·AI·문화 뉴스를 매일 골라 요약하고 문장마다 원문 근거를 검증하는 Editor → Writer ⇄ Checker 하네스 + 브리핑 사이트. `claude -p`로 돌아간다. 개요와 실행법은 [README.md](README.md).

## 규칙

- 의존성을 추가하지 않는다. Node 표준 라이브러리만 쓴다 (누구나 clone 후 바로 실행).
- `claude -p` 호출은 `harness/claude.js` 한 곳에서만. 에이전트에게 도구를 주지 않는다 — 기사 원문은 신뢰할 수 없는 입력이다.
- 모델로 하던 일을 코드로 옮길 수 있으면 옮긴다 (수집, 분야 분류, 합격 계산, 필터, 렌더링).
- 사이트 방문자의 요청이 AI 호출을 유발하면 안 된다. AI는 하루 1회 배치(`npm run harness`)에서만 돈다.
- 공개되는 것은 제목·3문장 요약·링크·썸네일 주소뿐. 기사 본문을 `digest.json`이나 페이지에 넣지 않는다.
- 외부 입력(기사 제목·본문·URL)을 HTML에 넣을 땐 반드시 escape. `npm test`에 XSS 회귀 테스트가 있다.
- `prompts/`, `harness/contract.js`의 TODO, `harness/run.js`의 TODO는 사람이 쓰는 부분이다. 에이전트가 임의로 채우지 않는다.
- `runs/`, `sources/`는 실행 산출물이다. 손으로 고치지 않는다 (`runs/demo-*` 녹화본 제외).
- 변경 후 `npm test`가 통과해야 한다. 이 테스트는 Claude를 호출하지 않는다.

## 어디에 뭐가

| 알고 싶은 것 | 가는 곳 |
|---|---|
| 왜 이런 구조인가, 원문과의 대응, 일부러 뺀 것 | [docs/architecture.md](docs/architecture.md) |
| 메인 루프 | [harness/run.js](harness/run.js) |
| 에이전트 입출력·합격 계산 | [harness/agents.js](harness/agents.js) |
| 수집·추출·분야 목록 | [harness/collect.js](harness/collect.js) |
| 사이트 (브리핑, 과정) | [viewer/server.js](viewer/server.js), [harness/digest.js](harness/digest.js) |
| 에이전트의 태도·기준 | [prompts/](prompts/) |
| 실행 기록 형식 | [harness/log.js](harness/log.js) — `events.jsonl`의 type: run, agent_start, agent_end, artifact, verdict, done |
