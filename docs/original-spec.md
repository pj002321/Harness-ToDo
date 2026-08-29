# Original Spec (as given)

This is the verbatim task prompt this repository was built from. Kept for
reference — later docs (AGENTS.md, ARCHITECTURE.md, docs/index.md) are the
maintained source of truth; this file is not updated as the repo evolves.

---

당신의 목표
---------
당신은 "하네스 엔지니어링(Harness Engineering)" 설계 원칙을 엄격히 따르는 엔지니어 에이전트입니다. 목표는 새 깃 리포지터리에서 **사람의 수동 코딩 최소화(사람은 설계·검증·의도 명시)** 원칙 하에, 에이전트가 자체적으로 소프트웨어 제품을 생성·테스트·배포·운영할 수 있는 완전한 하네스 엔지니어링 시스템을 **설계·구축·테스트·문서화** 하는 것입니다.

요구사항(핵심)
----------
1. 산출물(최종 결과)
   - 깃 리포지터리(빈 리포지터리에서 시작) 완성본: 스캐폴드, AGENTS.md, docs/, CI 구성, 실행 스크립트, 샘플 애플리케이션(간단한 CRUD 웹 서비스 권장), 테스트 스위트, 관측성 스택(로그/메트릭/트레이스), 배포 스크립트(컨테이너 + IaC), 보안/비밀관리 예시.
   - 각 커밋/PR은 자동 생성 가능하고, 에이전트가 로컬에서 인스턴스를 띄워 검증하는 워크플로우 포함.
   - 명확한 Acceptance Criteria(자동화된 검사 기준 포함).

2. 아키텍처 원칙(반드시 지킬 것)
   - 리포지터리는 '지식의 기록 시스템'으로 구조화 (AGENTS.md는 맵 역할, 심층 정보는 docs/에 분리).
   - 에이전트가 로컬 worktree 별로 앱을 부팅·검증 가능해야 함.
   - 관측성(로그/메트릭/트레이스)을 에이전트 런타임에 노출하여 자동 검증 가능하게 구성.
   - PR 생성/검토/병합 루프는 에이전트 간 자동화 가능하도록 설계.
   - 인간은 의도를 명확히 선언하고 검증을 수행; 수동 코드는 최소화.

3. 기술 스택(권장)
   - 언어: Python (백엔드 샘플) + Node.js나 Go 중 택1(프론트/툴링).
   - 컨테이너: Docker, 로컬 dev는 docker-compose.
   - CI: GitHub Actions (템플릿 제공).
   - IaC: Terraform (클라우드 배포 예시).
   - 관측성: Prometheus + Grafana + Loki (로그) + Jaeger(트레이스).
   - 테스트: pytest (unit), Playwright 또는 Cypress (e2e), contract tests.
   - 시크릿: HashiCorp Vault 또는 환경변수 암호화 예시.
   - 보안: 기본 SAST(예: bandit/ESLint), 의존성 스캔.

(전체 원문은 최초 커밋의 README.md 히스토리에서 확인 가능. 이 저장소가 실제로
어떤 범위로 구현되었는지는 [ARCHITECTURE.md](../ARCHITECTURE.md)와
[docs/quality_score.md](quality_score.md)의 "스코프 조정" 절을 참고.)
