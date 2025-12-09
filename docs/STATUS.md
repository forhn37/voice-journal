# Voice Journal - 현재 상태

> 마지막 업데이트: 2025-12-10 night

---

## 현재 단계

**MVP 핵심 기능 완료** - Day 7~9 수준

---

## 완료된 작업

### 인프라 및 설정
- [x] SvelteKit 프로젝트 생성 (Svelte 5 + TailwindCSS 4)
- [x] Sentry 설정 (hooks.server.ts, hooks.client.ts)
- [x] 환경변수 설정 (.env.example)
- [x] 공통 타입/상수 파일 분리 ($lib/types.ts, $lib/constants.ts)
- [x] Git 설정 (main 브랜치, GitHub remote)
- [x] 슬래시 명령 설정 (.claude/commands/)
- [x] 워크플로우 문서화 (CLAUDE.md, STATUS.md, work-logs)

### 페이지 및 UI
- [x] 기본 레이아웃 (+layout.svelte)
- [x] 메인 페이지 - 녹음 및 결과 표시 (+page.svelte)
- [x] 온보딩 페이지 - 3단계 플로우 (onboarding/+page.svelte)
- [x] 캘린더 페이지 - 월별 일기 조회 (calendar/+page.svelte)
- [x] 일기 상세 페이지 (journal/[id]/+page.svelte)
- [x] BottomNav 공통 컴포넌트

### 컴포넌트
- [x] RecordButton - 녹음 버튼 (타이머, 상태 관리)
- [x] JournalCard - 일기 카드 표시
- [x] BottomNav - 하단 네비게이션

### API 엔드포인트
- [x] POST /api/transcribe - Whisper STT
- [x] POST /api/analyze - GPT-4o-mini 분석
- [x] POST /api/generate-image - DALL-E 3 이미지 생성
- [x] POST/GET /api/journal - 일기 저장/조회
- [x] GET /api/usage - 일일 사용량 체크

### 기능
- [x] 음성 녹음 (MediaRecorder API)
- [x] 음성 -> 텍스트 변환 (Whisper)
- [x] AI 감정 분석 및 요약 (GPT-4o-mini)
- [x] 그림일기 이미지 생성 (DALL-E 3)
- [x] 일일 사용량 제한 (3회)
- [x] 로컬스토리지 기반 유저 상태

---

## 부분 완료 (추가 작업 필요)

### 에러 처리 (Day 12)
- [x] 기본 에러 메시지 표시 (토스트)
- [x] 각 단계별 에러 catch
- [x] 사용량 초과 안내
- [ ] 재시도 버튼/로직
- [ ] 에러 UI 컴포넌트 (캐릭터 + 메시지)

### UI/UX (Day 13)
- [x] 반응형 디자인 (모바일 퍼스트)
- [x] 기본 애니메이션 (bounce, spin)
- [x] 폰트/색상 통일 (CSS 변수)
- [ ] 빈 상태 UI (일기 없을 때)
- [ ] 로딩 스켈레톤
- [ ] 페이지 전환 애니메이션

---

## 다음 작업 (우선순위순)

1. **Supabase Auth 연동** (Day 8)
   - 현재: user_id가 null로 저장됨
   - 필요: 로그인/회원가입 + RLS 적용

2. **에러 처리 강화** (Day 12 남은 부분)
   - 재시도 버튼 추가
   - 에러 UI 개선

3. **UI/UX 다듬기** (Day 13 남은 부분)
   - 빈 상태 UI
   - 로딩 스켈레톤

4. **스트릭 시스템** (Day 10)
   - 연속 기록 일수 계산
   - UI 표시

5. **Vercel 배포** (Day 14)

---

## 알려진 이슈

1. **인증 없음**: user_id가 null로 저장됨 -> Supabase Auth 필요
2. **CSS 경고**: JournalCard의 -webkit-line-clamp (무시 가능)

---

## 참고

- PRD: `docs/PRD.md`
- 기술 스펙: `docs/TECH_SPEC.md`
- 로드맵: `docs/ROADMAP.md`
