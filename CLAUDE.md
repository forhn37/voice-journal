# Voice Journal

> **매 세션 시작 시 이 파일을 읽습니다. 모든 규칙을 준수하세요.**

---

## 1. 세션 시작 절차 (필수)

```
1. docs/STATUS.md 읽기 - 현재 진행 상황
2. docs/work-logs/ 최신 파일 읽기 - 직전 작업 내용
3. 사용자 요청에 따라 관련 명세 읽기
```

**절대 금지:**
- 이전 세션 기억에 의존
- 파일 읽지 않고 상태 추측
- 확인 없이 바로 구현 시작

---

## 2. 핵심 원칙

### 구현 전 필수
1. **명세 먼저** - `docs/` 해당 문서 읽기
2. **깊게 고민** - 여러 접근법 비교
3. **계획 수립** - TodoWrite로 작업 분해
4. **승인 요청** - 새로운 아이디어는 보고 후 진행

### 절대 금지
- 명세 없이 구현 시작
- 임의로 기능 추가/변경
- 더 좋은 방법이라고 독단적 결정
- 코드에 이모지 사용 (cp949 에러)

---

## 3. 프로젝트 개요

**AI 음성 그림일기 앱** - "말로 기록하면, AI가 그림일기로 만들어주는 감성 저널링 앱"

### 기술 스택
| 영역 | 기술 |
|-----|------|
| Frontend | Svelte 5 + SvelteKit 2 + TailwindCSS 4 |
| STT | OpenAI Whisper API |
| AI 분석 | GPT-4o-mini |
| 이미지 | DALL-E 3 (1024x1024) |
| DB/Auth | Supabase |
| 배포 | Vercel |
| 모니터링 | Sentry |

### 핵심 플로우
```
[녹음] -> [STT] -> [AI 분석] -> [그림 생성] -> [저장]
```

---

## 4. 프로젝트 구조

```
voice-journal/
├── src/
│   ├── routes/
│   │   ├── +page.svelte           # 메인 (일기 작성)
│   │   ├── +layout.svelte         # 레이아웃
│   │   ├── onboarding/            # 온보딩
│   │   ├── calendar/              # 캘린더 뷰
│   │   ├── journal/[id]/          # 일기 상세
│   │   └── api/                   # 서버 API
│   │       ├── transcribe/        # Whisper STT
│   │       ├── analyze/           # GPT 분석
│   │       ├── generate-image/    # DALL-E
│   │       ├── journal/           # 일기 CRUD
│   │       └── usage/             # 사용량 체크
│   └── lib/
│       ├── components/            # UI 컴포넌트
│       ├── stores/                # 상태 관리
│       ├── utils/                 # 유틸리티
│       ├── server/                # 서버 전용
│       ├── prompts/               # AI 프롬프트
│       ├── types.ts               # 공통 타입
│       └── constants.ts           # 공통 상수
├── docs/
│   ├── STATUS.md                  # 현재 진행 상황 (필수!)
│   ├── work-logs/                 # 작업 로그
│   ├── PRD.md                     # 제품 기획
│   ├── TECH_SPEC.md               # 기술 스펙
│   └── ROADMAP.md                 # 개발 로드맵
└── .claude/commands/              # 슬래시 명령
```

---

## 5. 명세 문서 색인

| 작업 유형 | 읽어야 할 문서 |
|----------|---------------|
| 제품 기획/UX | `docs/PRD.md` |
| 기술 구현 | `docs/TECH_SPEC.md` |
| 일정/진행 | `docs/ROADMAP.md` |
| 현재 상태 | `docs/STATUS.md` |

---

## 6. 코딩 컨벤션

### Svelte 5 (Runes)
```svelte
<script lang="ts">
  let count = $state(0);                    // 상태
  let doubled = $derived(count * 2);        // 파생값
  $effect(() => { console.log(count); });   // 이펙트
  let { name } = $props();                  // Props
</script>

<button onclick={() => count++}>Click</button>  <!-- 소문자 -->
```

### API
- 모든 외부 API는 서버사이드 (`+server.ts`)
- API 키 절대 클라이언트 노출 금지

### 타입 & 상수
- 공통 타입: `$lib/types.ts`
- 공통 상수: `$lib/constants.ts`
- 감정 매핑: `EMOTION_EMOJI`, `EMOTION_KOREAN`

---

## 7. Git 규칙

### 브랜치
- `main`: 프로덕션
- `dev`: 개발 (기본 작업 브랜치)

### 커밋 메시지
```
<type>: <subject>

<body>

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Type**: feat, fix, docs, style, refactor, test, chore

### 커밋 전 체크리스트
- [ ] 명세대로 구현했는가?
- [ ] STATUS.md 업데이트했는가?
- [ ] TodoWrite completed 처리했는가?
- [ ] 코드에 이모지 없는가?
- [ ] `npm run check` 통과하는가?

---

## 8. TodoWrite 규칙

### 필수 업데이트 시점
- 작업 시작 -> `in_progress`
- 작업 완료 -> **즉시** `completed`
- 새 작업 발견 -> 리스트에 추가

### 금지
- 여러 작업 완료 후 한번에 업데이트
- 2개 이상 동시 in_progress (항상 1개만)

---

## 9. Work Log 규칙

### 날짜 기준 (새벽 6시)
- 새벽 6시 이전 -> **전날** night로 기록
- 예: 12/11 새벽 02:00 -> `2025-12-10.night.md`

### 시간대
| 시간대 | 시간 |
|--------|------|
| am | 06:00 ~ 12:00 |
| pm | 12:00 ~ 18:00 |
| night | 18:00 ~ 06:00 |

---

## 10. 환경 변수

```env
# 서버 전용
OPENAI_API_KEY=sk-...
SUPABASE_SECRET_KEY=eyJ...

# 클라이언트 허용
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...
PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

---

## 11. 슬래시 명령

| 명령 | 용도 |
|------|------|
| `/start` | 세션 시작 (STATUS.md 확인) |
| `/spec` | 명세 확인 |
| `/worklog` | 작업 로그 작성 |
| `/todo` | 현재 작업 확인 |

---

## 12. 핵심 명령어

```bash
# 개발
npm run dev

# 타입 체크
npm run check

# 포맷팅
npm run format

# 빌드
npm run build
```

---

## 13. 제한 사항

- 녹음: 최소 3초, 최대 5분
- 무료: 하루 3회 (`DAILY_LIMIT`)
- 이미지: 1024x1024

---

## 14. 비용 (1회당)

| API | 비용 |
|-----|------|
| Whisper | $0.018 |
| GPT-4o-mini | $0.005 |
| DALL-E 3 | $0.080 |
| **총** | **~$0.103** |

---

## 15. 절대 금지 (NEVER)

- 명세 없이 구현 시작
- 코드/커밋에 이모지 사용
- STATUS.md 업데이트 없이 커밋
- 이전 세션 기억에만 의존
- TodoWrite 완료 처리 미루기
- 임의로 기능 추가/변경
- 사용자 승인 없이 새 아이디어 구현

---

> **진행 상황**: `docs/STATUS.md` 확인
> **명세 문서**: `docs/PRD.md`, `docs/TECH_SPEC.md`, `docs/ROADMAP.md`
