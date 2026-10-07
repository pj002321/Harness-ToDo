# AGENTS.md

이 저장소에서 일하는 코딩 에이전트를 위한 지도. 매뉴얼이 아니다 — 깊은 내용은 링크를 따라간다.

## 이 저장소는

Planner → Generator ⇄ Evaluator 하네스를 `claude -p`로 돌려보는 체험용 샘플. 개요와 실행법은 [README.md](README.md).

## 규칙

- 의존성을 추가하지 않는다. Node 표준 라이브러리만 쓴다 (누구나 clone 후 바로 실행).
- `claude -p` 호출은 `harness/claude.js` 한 곳에서만. 권한 플래그를 다른 곳에 흩뿌리지 않는다.
- 에이전트별 권한은 `harness/agents.js`의 `*_TOOLS`에서만 정한다. 바꾸면 README와 뷰어의 권한 표기도 같이 바꾼다.
- `runs/`는 실행 산출물이다. 손으로 고치지 않는다 (`runs/demo-*` 녹화본 제외).
- 변경 후 `npm test`가 통과해야 한다. 이 테스트는 Claude를 호출하지 않는다.

## 어디에 뭐가

| 알고 싶은 것 | 가는 곳 |
|---|---|
| 왜 이런 구조인가, 원문과의 대응, 일부러 뺀 것 | [docs/architecture.md](docs/architecture.md) |
| 메인 루프 | [harness/run.js](harness/run.js) |
| 에이전트 권한·출력 스키마 | [harness/agents.js](harness/agents.js) |
| 에이전트의 태도·기준 | [prompts/](prompts/) |
| 실행 기록 형식 | [harness/log.js](harness/log.js) — `events.jsonl`의 type: run, agent_start, agent_end, artifact, verdict, done |
