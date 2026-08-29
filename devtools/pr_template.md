# pr_template.md — 이 파일은 PR 본문 템플릿입니다. 프로젝트 실제 규칙에 맞게 문구를 조정하세요.

## 변경 요약
<!-- 무엇을 왜 바꿨는지 2~3문장 -->

## 테스트 결과
<!-- 어떤 테스트를 돌렸는지, pass/fail. 예: pytest 12 passed, coverage 82% -->

## 메트릭 스냅샷
<!-- scripts/collect_metrics.sh 실행 결과 붙여넣기 -->

## 프롬프트 스냅샷
<!-- 이 변경을 만든 에이전트 프롬프트/모델/버전을 devtools/prompt_snapshots/에 저장하고 여기 링크 -->

## PR 제목 형식
`[AGENT:<agent_name>] <요약> | tests:<pass|fail> | metrics:<key=value,...>`
