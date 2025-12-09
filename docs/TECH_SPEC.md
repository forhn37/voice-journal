# Voice Journal 기술 스펙

## 1. 아키텍처

### 1.1 전체 구조

```
┌─────────────────────────────────────────────────────────┐
│                      Client                              │
│                (SvelteKit Frontend)                      │
│   - MediaRecorder API (녹음)                            │
│   - UI 렌더링                                           │
│   - API 키 없음 (보안)                                  │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTPS
                      ▼
┌─────────────────────────────────────────────────────────┐
│                      Server                              │
│              (SvelteKit API Routes)                      │
│   - /api/transcribe (Whisper)                           │
│   - /api/analyze (GPT)                                  │
│   - /api/generate-image (DALL-E)                        │
│   - Rate limiting                                       │
│   - 입력 검증                                           │
└───────────┬─────────────┬─────────────┬─────────────────┘
            │             │             │
            ▼             ▼             ▼
      ┌─────────┐   ┌─────────┐   ┌─────────────┐
      │ OpenAI  │   │Supabase │   │   Sentry    │
      │   API   │   │ DB/Auth │   │ (Monitoring)│
      └─────────┘   └─────────┘   └─────────────┘
```

### 1.2 데이터 플로우

```
[1. 녹음]
Client: MediaRecorder → Blob (webm/mp3)
                           │
                           ▼
[2. STT]
Server: POST /api/transcribe
        → Whisper API
        → 텍스트 반환
                           │
                           ▼
[3. AI 분석]
Server: POST /api/analyze
        → GPT-4o-mini
        → { scene, emotion, summary, characterMessage }
                           │
                           ▼
[4. 이미지 생성]
Server: POST /api/generate-image
        → DALL-E 3
        → 이미지 URL
                           │
                           ▼
[5. 저장]
Server: Supabase에 저장
        → journals 테이블
        → Storage (이미지, 오디오)
```

---

## 2. DB 스키마 (Supabase)

### 2.1 profiles 테이블 (auth.users 확장)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname VARCHAR(50),
  notification_time TIME,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS 정책
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
```

### 2.2 journals 테이블

```sql
CREATE TABLE journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- 원본 데이터
  audio_url TEXT,
  transcript TEXT NOT NULL,
  duration INTEGER,
  
  -- AI 분석 결과
  scene TEXT,
  emotion VARCHAR(50),
  emotion_score INTEGER,
  summary TEXT,
  character_message TEXT,
  
  -- 생성 이미지
  image_url TEXT,
  image_prompt TEXT,
  
  -- 메타데이터
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_journals_user_id ON journals(user_id);
CREATE INDEX idx_journals_created_at ON journals(created_at DESC);
CREATE INDEX idx_journals_user_date ON journals(user_id, DATE(created_at));

-- RLS 정책
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own journals"
  ON journals FOR ALL USING (auth.uid() = user_id);
```

### 2.3 daily_usage 테이블

```sql
CREATE TABLE daily_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER DEFAULT 1,
  UNIQUE(user_id, date)
);

-- RLS 정책
ALTER TABLE daily_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own usage"
  ON daily_usage FOR ALL USING (auth.uid() = user_id);
```

### 2.4 스트릭 계산 함수

```sql
CREATE OR REPLACE FUNCTION get_user_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  streak INTEGER := 0;
  check_date DATE := CURRENT_DATE;
  has_journal BOOLEAN;
BEGIN
  LOOP
    SELECT EXISTS(
      SELECT 1 FROM journals 
      WHERE user_id = p_user_id 
      AND DATE(created_at) = check_date
    ) INTO has_journal;
    
    IF has_journal THEN
      streak := streak + 1;
      check_date := check_date - 1;
    ELSE
      EXIT;
    END IF;
  END LOOP;
  
  RETURN streak;
END;
$$ LANGUAGE plpgsql;
```

---

## 3. API 설계

### 3.1 POST /api/transcribe

```typescript
// 요청: multipart/form-data
{ audio: File }

// 성공 응답
{
  success: true,
  transcript: string,
  duration: number
}

// 에러 응답
{
  success: false,
  error: "INVALID_AUDIO" | "TOO_SHORT" | "TOO_LONG" | "API_ERROR",
  message: string
}
```

### 3.2 POST /api/analyze

```typescript
// 요청
{ transcript: string }

// 성공 응답
{
  success: true,
  scene: string,
  emotion: "joy" | "sadness" | "anger" | "fear" | "anxiety" | "neutral",
  emotionScore: number,  // -5 ~ +5
  summary: string,
  characterMessage: string
}
```

### 3.3 POST /api/generate-image

```typescript
// 요청
{ scene: string, emotion: string }

// 성공 응답
{
  success: true,
  imageUrl: string,
  prompt: string
}
```

### 3.4 POST /api/journals

```typescript
// 요청
{
  audioUrl?: string,
  transcript: string,
  duration: number,
  scene: string,
  emotion: string,
  emotionScore: number,
  summary: string,
  characterMessage: string,
  imageUrl: string
}

// 성공 응답
{
  success: true,
  journal: Journal
}
```

### 3.5 GET /api/journals

```typescript
// 쿼리: ?year=2024&month=12&limit=30&offset=0

// 성공 응답
{
  success: true,
  journals: Journal[],
  total: number
}
```

### 3.6 GET /api/usage

```typescript
// 성공 응답
{
  success: true,
  todayCount: number,
  limit: number,
  remaining: number,
  streak: number
}
```

---

## 4. AI 프롬프트

### 4.1 GPT 분석 시스템 프롬프트

```typescript
export const ANALYZE_SYSTEM_PROMPT = `
당신은 한국의 20-30대가 쓴 일기를 분석하는 감성적인 AI입니다.

## 역할
1. 일기에서 핵심 장면을 추출 (그림으로 표현할 수 있게)
2. 감정을 분석
3. 구어체로 요약 (반말, 이모지 사용)
4. 따뜻한 캐릭터 메시지 생성

## 한국어 표현 이해
- "아아" = 아이스 아메리카노
- "퇴근 후 치맥" = 치킨과 맥주
- "카공" = 카페에서 공부
- "존맛" = 정말 맛있음

## 출력 (JSON만, 설명 없이)
{
  "scene": "영어로 핵심 장면 묘사 (DALL-E용)",
  "emotion": "joy|sadness|anger|fear|anxiety|neutral",
  "emotionScore": -5~5 사이 정수,
  "summary": "구어체 요약 (2-3문장, 이모지 포함)",
  "characterMessage": "캐릭터 공감 메시지 (반말, 따뜻하게)"
}
`;
```

### 4.2 DALL-E 이미지 프롬프트

```typescript
export const buildImagePrompt = (scene: string, emotion: string) => {
  const moodStyles = {
    joy: "bright cheerful colors, warm sunlight, happy atmosphere",
    sadness: "soft blue tones, gentle melancholy, cozy comfort",
    anger: "warm orange tones, expressive, dynamic",
    fear: "soft purple, nighttime, comforting elements",
    anxiety: "muted colors, worried expression, supportive mood",
    neutral: "balanced warm colors, peaceful, relaxed"
  };

  return `
Cute illustration, soft watercolor style, simple adorable character (small bear).
Korean modern lifestyle aesthetic, no text.
Scene: ${scene}
Mood: ${moodStyles[emotion] || moodStyles.neutral}
Style: Studio Ghibli inspired, pastel colors, cozy, square format.
  `.trim();
};
```

### 4.3 감정별 캐릭터 톤

```typescript
export const CHARACTER_TONES = {
  joy: {
    style: "신나고 밝게",
    examples: ["와~ 진짜?! 🎉", "완전 좋겠다~!!", "행복한 날이었네! ✨"]
  },
  sadness: {
    style: "따뜻하게 위로",
    examples: ["힘들었겠다 😢", "괜찮아, 들어줄게", "푹 쉬어..."]
  },
  anger: {
    style: "공감하며 편들기",
    examples: ["그건 진짜 화날 만해...", "아 그건 좀 너무하다", "화나는 거 당연해!"]
  },
  fear: {
    style: "안심시키기",
    examples: ["걱정돼도 괜찮아", "잘 될 거야", "무서웠겠다... 이제 괜찮아"]
  },
  anxiety: {
    style: "차분히 위로",
    examples: ["긴장되는 거 당연해~", "잘 해낼 수 있어!", "천천히 하면 돼"]
  },
  neutral: {
    style: "편안하고 다정",
    examples: ["오늘도 수고했어~ ☺️", "고마워 얘기해줘서", "평화로운 하루였네~"]
  }
};
```

---

## 5. 에러 처리

### 5.1 에러 코드

```typescript
export const ERROR_CODES = {
  // 인증
  UNAUTHORIZED: { status: 401, message: "로그인이 필요해요" },
  
  // 입력 검증
  INVALID_AUDIO: { status: 400, message: "올바른 오디오 파일이 아니에요" },
  AUDIO_TOO_SHORT: { status: 400, message: "3초 이상 녹음해주세요" },
  AUDIO_TOO_LONG: { status: 400, message: "5분 이내로 녹음해주세요" },
  
  // 사용량
  DAILY_LIMIT_EXCEEDED: { status: 429, message: "오늘 사용량을 다 썼어요 (3회)" },
  
  // API
  WHISPER_ERROR: { status: 502, message: "음성 인식에 문제가 생겼어요" },
  GPT_ERROR: { status: 502, message: "AI 분석에 문제가 생겼어요" },
  DALLE_ERROR: { status: 502, message: "그림 생성에 문제가 생겼어요" },
  
  // 서버
  INTERNAL_ERROR: { status: 500, message: "잠시 문제가 생겼어요" }
};
```

### 5.2 재시도 설정

```typescript
export const RETRY_CONFIG = {
  transcribe: { maxRetries: 2, delayMs: 1000 },
  analyze: { maxRetries: 2, delayMs: 500 },
  generateImage: { maxRetries: 1, delayMs: 2000 }
};
```

---

## 6. 보안

### 6.1 환경변수 구조

```env
# 서버 전용 (절대 PUBLIC_ 붙이지 않음)
OPENAI_API_KEY=sk-...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# 클라이언트 접근 가능
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_ANON_KEY=eyJ...
PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

### 6.2 API 보안 체크리스트

- [ ] 모든 API 라우트에서 세션 확인
- [ ] OpenAI 키는 서버에서만 사용
- [ ] 일일 사용량 제한 (3회)
- [ ] 파일 크기/타입 검증
- [ ] RLS 정책 활성화

---

## 7. 성능

### 7.1 이미지 설정

```typescript
const IMAGE_CONFIG = {
  size: '512x512',      // 빠른 생성
  quality: 'standard',  // hd 아님
  format: 'webp'        // 압축 효율
};
```

### 7.2 예상 처리 시간

| 단계 | 예상 시간 |
|-----|---------|
| 녹음 업로드 | 1-2초 |
| Whisper STT | 3-5초 |
| GPT 분석 | 2-3초 |
| DALL-E 생성 | 10-20초 |
| DB 저장 | <1초 |
| **총** | **15-30초** |

---

## 8. 비용

### 8.1 API 비용 (1회당)

| API | 비용 | 비고 |
|-----|-----|-----|
| Whisper | $0.018 | 3분 기준 |
| GPT-4o-mini | $0.005 | ~500 토큰 |
| DALL-E 3 | $0.040 | 512x512 |
| **총** | **$0.063** | |

### 8.2 월간 비용 예상

| 시나리오 | 일기 수 | 비용 |
|---------|--------|------|
| 100 DAU × 1회 | 3,000/월 | $189 |
| 500 DAU × 1회 | 15,000/월 | $945 |
| 1000 DAU × 1회 | 30,000/월 | $1,890 |

### 8.3 비용 제어

- OpenAI 월간 한도 설정 ($100)
- 일일 사용량 제한 (3회)
- 비용 급증 시 Discord 알림

---

## 9. Svelte 5 문법 가이드

### 9.1 상태 관리 ($state)

```svelte
<script lang="ts">
  // Svelte 5 runes 문법
  let isRecording = $state(false);
  let duration = $state(0);
  let audioBlob = $state<Blob | null>(null);
</script>
```

### 9.2 파생 상태 ($derived)

```svelte
<script lang="ts">
  let duration = $state(0);
  
  // 자동으로 duration 변경 시 재계산
  let formattedTime = $derived(
    `${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')}`
  );
  
  let isValidDuration = $derived(duration >= 3 && duration <= 300);
</script>
```

### 9.3 이펙트 ($effect)

```svelte
<script lang="ts">
  let isRecording = $state(false);
  let duration = $state(0);
  let timer: number;
  
  // isRecording 변경 시 자동 실행
  $effect(() => {
    if (isRecording) {
      timer = setInterval(() => {
        duration += 1;
      }, 1000);
    }
    
    // cleanup 함수
    return () => {
      if (timer) clearInterval(timer);
    };
  });
</script>
```

### 9.4 Props ($props)

```svelte
<!-- JournalCard.svelte -->
<script lang="ts">
  interface Props {
    imageUrl: string;
    summary: string;
    emotion: string;
    createdAt: string;
    onShare?: () => void;
  }
  
  let { imageUrl, summary, emotion, createdAt, onShare } = $props<Props>();
</script>
```

### 9.5 이벤트 핸들링 (Svelte 5)

```svelte
<script lang="ts">
  let count = $state(0);
  
  function handleClick() {
    count += 1;
  }
</script>

<!-- Svelte 5: onclick (소문자) -->
<button onclick={handleClick}>
  클릭: {count}
</button>

<!-- 인라인도 가능 -->
<button onclick={() => count += 1}>
  클릭: {count}
</button>
```

### 9.6 Snippet (재사용 가능한 마크업)

```svelte
<script lang="ts">
  let items = $state(['사과', '바나나', '딸기']);
</script>

{#snippet listItem(item: string)}
  <li class="p-2 hover:bg-gray-100">{item}</li>
{/snippet}

<ul>
  {#each items as item}
    {@render listItem(item)}
  {/each}
</ul>
```

### 9.7 Store 대신 $state 사용

```typescript
// src/lib/stores/user.svelte.ts (Svelte 5)
class UserStore {
  nickname = $state('');
  isLoggedIn = $state(false);
  
  login(name: string) {
    this.nickname = name;
    this.isLoggedIn = true;
  }
  
  logout() {
    this.nickname = '';
    this.isLoggedIn = false;
  }
}

export const userStore = new UserStore();
```

```svelte
<!-- 사용 -->
<script lang="ts">
  import { userStore } from '$lib/stores/user.svelte';
</script>

<p>안녕, {userStore.nickname}!</p>
<button onclick={() => userStore.logout()}>로그아웃</button>
```

### 9.8 비동기 상태 패턴

```svelte
<script lang="ts">
  type LoadingState = 'idle' | 'loading' | 'success' | 'error';
  
  let state = $state<LoadingState>('idle');
  let data = $state<string | null>(null);
  let error = $state<string | null>(null);
  
  async function fetchData() {
    state = 'loading';
    error = null;
    
    try {
      const res = await fetch('/api/data');
      data = await res.json();
      state = 'success';
    } catch (e) {
      error = e.message;
      state = 'error';
    }
  }
</script>

{#if state === 'loading'}
  <p>로딩 중...</p>
{:else if state === 'error'}
  <p>에러: {error}</p>
{:else if state === 'success'}
  <p>데이터: {data}</p>
{/if}
```
