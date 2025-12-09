# 🐶 Voice Journal

> AI 음성 그림일기 앱 - "말로 기록하면, AI가 그림일기로 만들어주는 감성 저널링 앱"

## 📱 주요 기능

- **음성 녹음**: 3초~5분 음성으로 일기 작성
- **AI 분석**: GPT-4o-mini로 감정 분석 및 요약
- **그림일기 생성**: DALL-E 3로 Studio Ghibli 스타일 이미지 자동 생성
- **감성 캐릭터**: 따뜻한 강아지 캐릭터의 공감 메시지
- **캘린더 뷰**: 월별 일기 조회 및 감정 추적
- **사용량 제한**: 하루 3회 무료 (비용 관리)

## 🛠 기술 스택

- **Frontend**: Svelte 5 (Runes) + SvelteKit 2 + TailwindCSS 4
- **STT**: OpenAI Whisper API
- **AI**: GPT-4o-mini (분석) + DALL-E 3 (이미지)
- **Database**: Supabase (PostgreSQL + Storage)
- **Monitoring**: Sentry
- **Deployment**: Vercel

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.example`을 `.env`로 복사하고 API 키를 설정하세요:

```env
# OpenAI API
OPENAI_API_KEY=sk-...

# Supabase
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...
SUPABASE_SECRET_KEY=eyJ...

# Sentry (Optional)
PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

### 3. Supabase 설정

Supabase에서 다음을 생성하세요:

**1) journals 테이블 생성**

```sql
CREATE TABLE journals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  transcript TEXT NOT NULL,
  summary TEXT NOT NULL,
  emotion TEXT NOT NULL,
  emotion_score INTEGER DEFAULT 0,
  scene TEXT,
  character_message TEXT,
  image_url TEXT NOT NULL,
  audio_duration INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_journals_created_at ON journals(created_at DESC);
CREATE INDEX idx_journals_user_id ON journals(user_id);
```

**2) Storage 버킷 생성**

- 버킷 이름: `journal-images`
- Public 설정: ✅ 활성화

### 4. 개발 서버 실행

```bash
npm run dev
```

## 📦 배포

### Vercel 배포

```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# 배포
vercel

# 프로덕션 배포
vercel --prod
```

### 환경변수 설정 (Vercel)

Vercel 대시보드에서 다음 환경변수를 설정하세요:

- `OPENAI_API_KEY`
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SECRET_KEY`
- `PUBLIC_SENTRY_DSN` (선택사항)

## 💰 비용 (1회당)

- Whisper API: $0.018 (3분 기준)
- GPT-4o-mini: $0.005
- DALL-E 3: $0.040
- **총: 약 $0.063**

하루 3회 제한 시 월 비용: 약 $5.67

## 📝 프로젝트 구조

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
│   │       ├── generate-image/+server.ts # DALL-E
│   │       ├── journal/+server.ts    # 일기 CRUD
│   │       └── usage/+server.ts      # 사용량 체크
│   ├── lib/
│   │   ├── components/
│   │   │   ├── RecordButton.svelte   # 녹음 버튼
│   │   │   └── JournalCard.svelte    # 일기 카드
│   │   ├── stores/
│   │   │   └── user.svelte.ts        # 유저 상태 (Svelte 5 runes)
│   │   ├── utils/
│   │   │   ├── audio.ts              # 녹음 유틸
│   │   │   └── supabase.ts           # Supabase 클라이언트
│   │   ├── prompts/
│   │   │   ├── analyze.ts            # GPT 프롬프트
│   │   │   └── image.ts              # DALL-E 프롬프트
│   │   └── server/
│   │       └── supabase.ts           # Supabase Admin
│   ├── hooks.client.ts               # Sentry (클라이언트)
│   └── hooks.server.ts               # Sentry (서버)
├── static/                           # 정적 파일
├── .env.example                      # 환경변수 예시
└── package.json
```

## 🎨 주요 기능 플로우

```
[녹음] → [STT] → [AI 분석] → [그림 생성] → [저장]
  │         │         │            │          │
  │         │         │            │          └─ Supabase DB
  │         │         │            └─ DALL-E 3 + Supabase Storage
  │         │         └─ GPT-4o-mini (장면, 감정, 요약)
  │         └─ Whisper API
  └─ MediaRecorder API
```

## 🔒 보안

- API 키는 서버사이드에서만 사용 (`$env/static/private`)
- Supabase Row Level Security (RLS) 설정 권장
- Sentry로 에러 모니터링

## 📄 라이선스

MIT

---

Made with ❤️ using Svelte 5, OpenAI, and Supabase
