# Voice Journal

> AI 음성 그림일기 앱 - "말로 기록하면, AI가 그림일기로 만들어주는 감성 저널링 앱"

## 프로젝트 개요

- **한줄 설명**: 음성으로 일기를 말하면 AI가 감정 분석 + 그림일기 생성
- **타겟**: 혼자 사는 2030, 일기 쓰고 싶지만 귀찮은 사람
- **MVP 기간**: 2주 (퇴근 후 저녁 3시간씩)
- **차별화**: 음성 입력 + AI 그림 + 캐릭터 공감

## 기술 스택

| 영역 | 기술 |
|-----|------|
| Frontend | **Svelte 5** + SvelteKit 2 + TailwindCSS |
| STT | OpenAI Whisper API |
| AI 분석 | GPT-4o-mini |
| 이미지 생성 | DALL-E 3 (512x512) |
| DB/Auth | Supabase (PostgreSQL + Auth) |
| 배포 | Vercel |
| 모니터링 | Sentry |

## 프로젝트 구조

```
voice-journal/
├── src/
│   ├── routes/
│   │   ├── +page.svelte              # 메인 (일기 작성)
│   │   ├── +layout.svelte            # 레이아웃
│   │   ├── onboarding/+page.svelte   # 온보딩
│   │   ├── calendar/+page.svelte     # 캘린더 뷰
│   │   ├── journal/[id]/+page.svelte # 일기 상세
│   │   └── api/
│   │       ├── transcribe/+server.ts # Whisper STT
│   │       ├── analyze/+server.ts    # GPT 분석
│   │       └── generate-image/+server.ts # DALL-E
│   ├── lib/
│   │   ├── components/
│   │   │   ├── RecordButton.svelte   # 녹음 버튼
│   │   │   ├── LoadingCharacter.svelte # 로딩 캐릭터
│   │   │   ├── JournalCard.svelte    # 일기 카드
│   │   │   └── Calendar.svelte       # 캘린더
│   │   ├── stores/
│   │   │   └── user.svelte.ts        # 유저 상태 (Svelte 5 runes)
│   │   ├── utils/
│   │   │   ├── audio.ts              # 녹음 유틸
│   │   │   └── supabase.ts           # Supabase 클라이언트
│   │   └── prompts/
│   │       ├── analyze.ts            # GPT 프롬프트
│   │       └── image.ts              # DALL-E 프롬프트
│   └── app.css                       # 글로벌 스타일
├── static/
│   └── character/                    # 캐릭터 이미지
├── docs/
│   ├── PRD.md                        # 상세 기획
│   ├── TECH_SPEC.md                  # 기술 스펙
│   └── ROADMAP.md                    # 개발 로드맵
├── .env.example
├── CLAUDE.md                         # 이 파일
└── package.json
```

## 코딩 컨벤션

### 일반
- TypeScript 사용
- 함수형 컴포넌트
- 한국어 주석 OK

### Svelte 5 (Runes 문법)
- `+page.svelte` / `+server.ts` 라우팅 규칙 따르기
- 상태: `let count = $state(0)`
- 파생값: `let doubled = $derived(count * 2)`
- 이펙트: `$effect(() => { ... })`
- props: `let { name, age = 20 } = $props()`
- 이벤트: `onclick` (소문자, on: 디렉티브 대신)

### API
- 모든 외부 API 호출은 서버사이드 (`+server.ts`)
- API 키는 절대 클라이언트에 노출 금지
- 에러는 적절한 HTTP 상태 코드로 응답

### 스타일
- TailwindCSS 유틸리티 클래스 사용
- 커스텀 CSS는 최소화
- 모바일 퍼스트

## 환경 변수

```env
# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Sentry
PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

## 핵심 플로우

```
[녹음] → [STT] → [AI 분석] → [그림 생성] → [저장]
  │         │         │            │          │
  │         │         │            │          └─ Supabase DB
  │         │         │            └─ DALL-E 3
  │         │         └─ GPT-4o-mini (장면추출, 감정, 요약)
  │         └─ Whisper API
  └─ MediaRecorder API
```

## 비용 (1회당)

- Whisper: $0.018 (3분)
- GPT-4o-mini: $0.005
- DALL-E 3: $0.040
- **총: $0.063**

## 제한 사항

- 녹음: 최소 3초, 최대 5분
- 무료 티어: 하루 3회
- 이미지: 512x512 고정

## 관련 문서

- [PRD.md](docs/PRD.md) - 상세 기획
- [TECH_SPEC.md](docs/TECH_SPEC.md) - 기술 스펙, DB 스키마, 프롬프트
- [ROADMAP.md](docs/ROADMAP.md) - Day별 개발 계획

## 시작하기

```bash
# 프로젝트 생성 (Svelte 5 + SvelteKit 2)
npx sv create voice-journal
cd voice-journal

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일 편집

# 개발 서버
npm run dev
```

## Svelte 5 핵심 문법

```svelte
<script lang="ts">
  // 상태
  let count = $state(0);
  
  // 파생값
  let doubled = $derived(count * 2);
  
  // 이펙트
  $effect(() => {
    console.log('count changed:', count);
  });
  
  // Props
  let { name, age = 20 } = $props<{ name: string; age?: number }>();
</script>

<!-- 이벤트: onclick (소문자) -->
<button onclick={() => count++}>
  {count}
</button>
```

## Day 1 TODO

1. SvelteKit 프로젝트 생성 (TailwindCSS 포함)
2. 기본 레이아웃 + 라우트 구조
3. Sentry 설정
4. 환경변수 설정
5. 기본 UI 컴포넌트 (RecordButton)
