# index.md — 이 파일은 시스템 개요를 담습니다. 실제 프로젝트 이름/목적/구성으로 채우세요. (필수)

## 개요

<!-- TODO: 이 프로젝트가 무엇인지 2~3문장으로 -->

## 구조

```
AGENTS.md               에이전트/권한 지도 — 여기서 시작
AGENTS/                  에이전트별 상세 프롬프트
docs/                    지식베이스 (지금 보고 있는 곳)
src/                     애플리케이션 코드
tests/                   테스트
scripts/                 로컬 실행/스모크/메트릭 수집 스크립트
observability/           관측성 설정(Prometheus 등)
infra/                   배포 인프라(Terraform 등)
devtools/                PR 템플릿, 에이전트 프롬프트 템플릿
hooks/                   git hook 예시
maintenance/             엔트로피 관리(오래된 worktree 정리 등)
policies/                병합 정책 등 규칙 문서
logs/, artifacts/        런타임 산출물(커밋 대상 아님, .gitkeep만 유지)
```

## docs/ 안의 문서

- [architecture.md](architecture.md) — 왜 이런 구조인가
- [agent-design.md](agent-design.md) — 에이전트별 입출력/권한
- [observability.md](observability.md) — 관측성 설정과 검증 기준
- [exec-plans/](exec-plans/) — 작업 단위별 실행 계획
- [original-spec.md](original-spec.md) — 이 스캐폴드가 나온 원본 프롬프트
