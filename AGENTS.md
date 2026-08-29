# AGENTS.md — 이 파일은 에이전트 목록/권한/검증 방법을 담는 지도입니다. 아래 YAML의 owner를 실제 팀/담당자로, verification 스크립트를 실제 경로로 채우세요. (필수)

이 파일은 매뉴얼이 아니라 지도다. 깊은 내용은 `docs/`로, 각 에이전트에게 줄 상세 프롬프트는
`AGENTS/<agent-name>/prompt.txt`로 분리한다.

## 에이전트 목록 (YAML)

```yaml
- name: scaffold-agent
  responsibility: "리포지터리 기본 스캐폴드 및 설명 파일 생성"
  allowed_paths: ["README.md","AGENTS.md","docs/**","scripts/**","devtools/**"]
  verification: "scripts/run_smoke.sh"
  owner: "team/infra"

- name: codegen-agent
  responsibility: "샘플 앱(health + CRUD) 및 기본 테스트 생성"
  allowed_paths: ["src/**","tests/**"]
  verification: "tests/smoke_test.sh"
  owner: "team/backend"

- name: test-agent
  responsibility: "테스트 생성·실행·리포트"
  allowed_paths: ["tests/**"]
  verification: "artifacts/test-report-<ts>.json"
  owner: "team/qa"

- name: observability-agent
  responsibility: "Prometheus/Grafana 설정 및 metric 검증 스크립트 생성"
  allowed_paths: ["observability/**","docs/observability.md","scripts/**"]
  verification: "scripts/collect_metrics.sh"
  owner: "team/sre"

- name: security-agent
  responsibility: "SAST/dependency scan 설정 및 보안 문서 업데이트"
  allowed_paths: ["policies/**",".github/workflows/**","hooks/**"]
  verification: "artifacts/security-<ts>.json"
  owner: "team/sec"
```

## 규칙

- 각 에이전트는 위 `allowed_paths` 밖의 파일을 이유 없이 건드리지 않는다.
- 각 에이전트의 산출물은 `verification`에 적힌 스크립트/산출물로 확인한다.
- 추가 에이전트가 필요하면 이 YAML에 자동으로 추가하지 말고 사람이 수동으로 추가한다.
- PR 제목 형식: `[AGENT:<agent_name>] <요약> | tests:<pass|fail> | metrics:<key=value,...>`

## 더 알고 싶으면

| 알고 싶은 것 | 가는 곳 |
|---|---|
| 시스템 개요 | [docs/index.md](docs/index.md) |
| 왜 이런 구조인가 | [docs/architecture.md](docs/architecture.md) |
| 에이전트별 상세 입출력/권한 | [docs/agent-design.md](docs/agent-design.md) |
| 관측성 설정/검증 방법 | [docs/observability.md](docs/observability.md) |
| 실행 계획 | [docs/exec-plans/](docs/exec-plans/) |
| PR 작성 규칙 | [devtools/pr_template.md](devtools/pr_template.md) |
| 병합 정책 | [policies/merge-policy.md](policies/merge-policy.md) |
