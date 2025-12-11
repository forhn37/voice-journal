# Voice Journal 개발 로드맵

## 개요

- **총 기간**: 2주 (14일)
- **일일 작업 시간**: 퇴근 후 3시간
- **목표**: MVP 런칭

---

## Week 1: 핵심 기능

### Day 1: 프로젝트 셋업 ⏱️ 3h ✅

#### TODO
- [x] SvelteKit 프로젝트 생성 (Svelte 5)
  ```bash
  npx sv create voice-journal
  # 옵션: SvelteKit minimal, TypeScript, TailwindCSS, ESLint, Prettier
  # Svelte 5가 기본으로 설치됨
  ```
- [x] TailwindCSS 설정 확인
- [x] 기본 폴더 구조 생성
  ```
  src/
  ├── routes/
  │   ├── +page.svelte
  │   ├── +layout.svelte
  │   └── api/
  ├── lib/
  │   ├── components/
  │   ├── stores/
  │   ├── utils/
  │   └── prompts/
  └── app.css
  ```
- [x] 환경변수 설정 (`.env`, `.env.example`)
- [x] Sentry 설치 및 설정
  ```bash
  npx @sentry/wizard@latest -i sveltekit
  ```
- [x] 기본 레이아웃 컴포넌트 (`+layout.svelte`)
- [x] 메인 페이지 기본 UI (빈 껍데기)

#### 완료 기준
- `npm run dev`로 로컬 서버 실행
- 기본 레이아웃 표시
- Sentry 테스트 에러 전송 확인

---

### Day 2: 온보딩 플로우 ⏱️ 3h ✅

#### TODO
- [x] `/onboarding` 라우트 생성
- [x] 온보딩 스텝 컴포넌트
  - [x] Step 1: 환영 화면
  - [x] Step 2: 닉네임 입력
  - [x] Step 3: 알림 시간 선택
- [x] ~~로컬 스토리지에 온보딩 완료 상태 저장~~ → Supabase profiles 테이블 사용
- [x] 온보딩 미완료 시 리다이렉트 로직
- [x] 캐릭터 이미지 (임시 이모지 사용)

#### 완료 기준
- 온보딩 3단계 플로우 동작
- 닉네임 저장 후 메인으로 이동
- 재방문 시 온보딩 스킵

---

### Day 3: 음성 녹음 기능 ⏱️ 3h ✅

#### TODO
- [x] `RecordButton.svelte` 컴포넌트
- [x] MediaRecorder API 래퍼 유틸
  ```typescript
  // src/lib/utils/audio.ts
  - startRecording()
  - stopRecording() → Blob
  - getAudioDuration()
  ```
- [x] 녹음 상태 관리 (idle, recording, processing)
- [x] 녹음 중 UI (타이머, 파형 애니메이션)
- [x] 녹음 시간 제한 (3초~5분)
- [x] 마이크 권한 요청 및 에러 처리

#### 완료 기준
- 녹음 시작/정지 동작
- 녹음 파일 Blob 생성
- 권한 거부 시 에러 메시지

---

### Day 4: Whisper API 연동 (STT) ⏱️ 3h ✅

#### TODO
- [x] `/api/transcribe/+server.ts` 생성
- [x] OpenAI SDK 설치
  ```bash
  npm install openai
  ```
- [x] Whisper API 호출 로직
- [x] 오디오 파일 검증 (크기, 형식)
- [x] 에러 핸들링 (API 에러, 타임아웃)
- [x] 클라이언트에서 API 호출 및 결과 표시

#### 완료 기준
- 녹음 → 텍스트 변환 성공
- 에러 시 적절한 메시지 표시
- API 키 서버에서만 사용 확인

---

### Day 5: GPT 분석 연동 ⏱️ 3h ✅

#### TODO
- [x] `/api/analyze/+server.ts` 생성
- [x] 분석 프롬프트 작성 (`src/lib/prompts/analyze.ts`)
- [x] GPT-4o-mini 호출 로직
- [x] JSON 응답 파싱
  ```typescript
  { scene, emotion, emotionScore, summary, characterMessage }
  ```
- [x] 프롬프트 테스트 및 튜닝
- [x] 다양한 입력에 대한 테스트

#### 완료 기준
- 텍스트 → 분석 결과 반환
- 감정/장면/요약/캐릭터 메시지 정상 추출
- 한국어 일상 표현 인식 확인

---

### Day 6: DALL-E 이미지 생성 ⏱️ 3h ✅

#### TODO
- [x] `/api/generate-image/+server.ts` 생성
- [x] 이미지 프롬프트 빌더 (`src/lib/prompts/image.ts`)
- [x] DALL-E 3 API 호출 (1024x1024)
- [x] 이미지 URL 반환
- [x] 감정별 스타일 적용
- [x] 결과 화면 UI (이미지 + 텍스트)

#### 완료 기준
- 장면 설명 → 이미지 생성
- 캐릭터 일관성 (귀여운 곰 캐릭터)
- 감정별 색감/분위기 차이

---

### Day 7: 로딩 경험 (캐릭터) ⏱️ 3h ✅

#### TODO
- [x] `LoadingCharacter.svelte` 컴포넌트
- [x] 로딩 단계별 메시지 시퀀스
  ```
  0초: "오늘 이야기 잘 들었어!"
  3초: "음... 그랬구나~"
  6초: "그림 그려볼게!"
  ...
  ```
- [x] 캐릭터 애니메이션 (CSS)
- [x] 진행 상태 인디케이터
- [x] 감정 기반 공감 메시지 표시

#### 완료 기준
- 15~30초 로딩 동안 지루하지 않음
- 캐릭터가 살아있는 느낌
- 단계별 메시지 자연스럽게 전환

---

## Week 2: 완성 + 리텐션

### Day 8: Supabase 연동 (Auth + DB) ⏱️ 3h ✅

#### TODO
- [x] Supabase 프로젝트 생성
- [x] Supabase SDK 설치
  ```bash
  npm install @supabase/supabase-js @supabase/ssr
  ```
- [x] DB 테이블 생성 (SQL 실행)
  - profiles
  - journals
- [x] RLS 정책 설정
- [x] Auth 설정 (이메일/구글)
- [x] 로그인/회원가입 UI

#### 완료 기준
- 회원가입/로그인 동작
- 세션 유지
- 인증 필요 페이지 보호

---

### Day 9: 일기 저장/조회 + 캘린더 ⏱️ 3h ✅

#### TODO
- [x] `/api/journal/+server.ts` (POST, GET)
- [x] 일기 저장 로직 (전체 플로우 연결)
- [x] 일기 목록 조회
- [x] 캘린더 페이지 (`/calendar`)
- [x] 캘린더 뷰 (월별 감정 이모지)
- [x] 일기 상세 페이지 (`/journal/[id]`)

#### 완료 기준
- 녹음 → 분석 → 이미지 → 저장 전체 플로우
- 캘린더에서 과거 일기 확인
- 일기 클릭 시 상세 페이지

---

### Day 10: 스트릭 시스템 ⏱️ 2h ✅

#### TODO
- [x] 스트릭 계산 함수 (`+page.server.ts`, `/api/usage`)
- [x] `/api/usage/+server.ts`에 스트릭 추가
- [x] 스트릭 UI (메인 페이지)
- [x] 메인 화면에 스트릭 표시
- [x] 스트릭 마일스톤 (7일, 30일, 100일, 365일)

#### 완료 기준
- 연속 기록 일수 정확히 계산
- UI에 🔥 스트릭 표시
- 일기 작성 후 스트릭 업데이트

---

### Day 11: 공유 기능 ⏱️ 3h

#### TODO
- [ ] 공유 이미지 생성 (Canvas API 또는 html2canvas)
- [ ] 공유 카드 디자인
  - 그림
  - 요약 텍스트
  - 날짜
  - 워터마크
- [ ] 이미지 다운로드 기능
- [ ] Web Share API 연동 (모바일)

#### 완료 기준
- 버튼 클릭 → 공유 이미지 생성
- 갤러리에 저장 가능
- SNS 공유 가능 (모바일)

---

### Day 12: 에러 처리 + 입력 검증 ⏱️ 3h ✅

#### TODO
- [x] 에러 UI 컴포넌트 (캐릭터 + 메시지)
- [x] 각 단계별 에러 처리
  - 녹음 실패
  - STT 실패
  - 분석 실패
  - 이미지 생성 실패
- [x] 재시도 로직
- [x] 일일 사용량 제한 (3회)
- [x] 사용량 초과 시 안내

#### 완료 기준
- 모든 에러 상황에서 친절한 메시지
- 재시도 버튼 동작
- 사용량 제한 동작

---

### Day 13: UI/UX 다듬기 ⏱️ 3h ✅

#### TODO
- [x] 반응형 디자인 점검 (모바일 우선)
- [x] 애니메이션 추가 (페이지 전환, 버튼)
- [x] 로딩 스켈레톤
- [x] 빈 상태 UI (일기 없을 때)
- [x] 폰트, 색상 통일
- [x] SSR (Server-Side Rendering) 적용
- [ ] 접근성 점검 (a11y)

#### 완료 기준
- 모바일에서 자연스러운 사용
- 일관된 디자인 시스템
- 부드러운 인터랙션

---

### Day 14: 배포 + 런칭 🚀 ⏱️ 2h

#### TODO
- [ ] Vercel 프로젝트 생성
- [ ] 환경변수 설정 (Vercel Dashboard)
- [ ] 빌드 테스트
- [ ] 배포
- [ ] 실제 기기 테스트
- [ ] 개인정보처리방침 페이지
- [ ] 이용약관 페이지
- [ ] (선택) 커스텀 도메인 연결

#### 완료 기준
- 프로덕션 URL 접속 가능
- 전체 플로우 정상 동작
- 법적 문서 페이지 존재

---

## Phase 2 (Week 3-4) - 선택

### 우선순위 높음
- [ ] 푸시 알림 / 리마인더
- [ ] 위기 대응 (자살예방 키워드 감지)

### 우선순위 중간
- [ ] 움짤 GIF (프리미엄)
- [ ] 타임캡슐 (1년 전 오늘)
- [ ] 감정 통계 대시보드

### 우선순위 낮음
- [ ] 주간/월간 회고 리포트
- [ ] 캐릭터 커스터마이징
- [ ] PDF 책 내보내기

---

## 체크리스트 요약

### 기능
- [x] 음성 녹음
- [x] STT (Whisper)
- [x] AI 분석 (GPT)
- [x] 이미지 생성 (DALL-E)
- [x] 캐릭터 로딩 경험
- [x] 일기 저장/조회
- [x] 캘린더 뷰
- [ ] 스트릭 시스템
- [ ] 공유 기능
- [x] 온보딩

### 기술
- [x] Supabase Auth
- [x] Supabase DB + RLS
- [x] API 키 서버사이드
- [x] 입력 검증
- [x] 에러 처리
- [x] 사용량 제한
- [x] Sentry 모니터링
- [x] SSR (Server-Side Rendering)

### 법적
- [ ] 개인정보처리방침
- [ ] 이용약관

### 배포
- [ ] Vercel 배포
- [ ] 환경변수 설정
- [ ] 실기기 테스트

---

## 런칭 후 TODO

- [ ] ProductHunt 등록
- [ ] 디스콰이엇 등록
- [ ] 사용자 피드백 수집
- [ ] 버그 수정
- [ ] Phase 2 기능 개발
