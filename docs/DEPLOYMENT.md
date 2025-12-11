# Voice Journal Vercel 배포 가이드

## 배포 전 체크리스트

### ✅ 완료된 사항
- [x] Vercel 어댑터 설정 (`@sveltejs/adapter-vercel`)
- [x] 프로덕션 빌드 테스트 완료
- [x] 환경변수 목록 정리

### 📋 필요한 환경변수

배포 시 Vercel Dashboard에서 다음 환경변수를 설정해야 합니다:

```
OPENAI_API_KEY=sk-...
PUBLIC_SUPABASE_URL=https://xxx.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ...
SUPABASE_SECRET_KEY=eyJ...
PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx (선택사항)
```

---

## 배포 방법 1: Vercel CLI (추천)

### 1. Vercel에 로그인

```bash
vercel login
```

이메일로 로그인하거나 GitHub 계정으로 연동

### 2. 프로젝트 배포

```bash
vercel
```

인터랙티브 질문에 답변:
- **Set up and deploy?** → Yes
- **Which scope?** → 본인 계정 선택
- **Link to existing project?** → No (처음 배포시)
- **Project name?** → voice-journal (또는 원하는 이름)
- **In which directory?** → ./ (현재 디렉토리)
- **Override settings?** → No

### 3. 환경변수 설정

Vercel Dashboard에서 환경변수 추가:
1. https://vercel.com/dashboard 접속
2. 프로젝트 선택
3. Settings → Environment Variables
4. 위의 환경변수들을 모두 추가
   - **Environment**: Production, Preview, Development 모두 선택
   - **Value**: 각 환경변수 값 입력

### 4. 프로덕션 배포

환경변수 설정 후 다시 배포:

```bash
vercel --prod
```

---

## 배포 방법 2: GitHub 연동 (자동 배포)

### 1. GitHub 저장소에 푸시

```bash
git add .
git commit -m "feat: 프로덕션 배포 준비"
git push origin main
```

### 2. Vercel Dashboard에서 프로젝트 Import

1. https://vercel.com/new 접속
2. **Import Git Repository** 선택
3. GitHub 저장소 연결
4. **voice-journal** 저장소 선택
5. **Framework Preset**: SvelteKit (자동 감지됨)
6. **Environment Variables** 섹션에서 환경변수 추가
7. **Deploy** 클릭

### 3. 자동 배포 확인

이후 `main` 브랜치에 푸시할 때마다 자동으로 배포됩니다.

---

## 배포 후 확인 사항

### 1. 기본 기능 테스트

- [ ] 로그인/회원가입 동작
- [ ] 음성 녹음 → 텍스트 변환
- [ ] AI 분석 → 이미지 생성
- [ ] 일기 저장 및 조회
- [ ] 캘린더 뷰
- [ ] 설정 페이지

### 2. 모바일 테스트

- [ ] iPhone Safari
- [ ] Android Chrome
- [ ] 마이크 권한 요청 동작
- [ ] 반응형 레이아웃

### 3. 에러 모니터링

- [ ] Sentry에서 에러 로그 확인
- [ ] Vercel Logs에서 서버 로그 확인

---

## Vercel 설정 최적화

### vercel.json 현재 설정

```json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "sveltekit",
  "outputDirectory": ".svelte-kit"
}
```

### 추가 권장 설정

필요시 `vercel.json`에 추가:

```json
{
  "functions": {
    "api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

---

## 도메인 설정 (선택)

### 커스텀 도메인 연결

1. Vercel Dashboard → Settings → Domains
2. **Add Domain** 클릭
3. 도메인 입력 (예: voice-journal.com)
4. DNS 레코드 설정:
   - **A Record**: 76.76.21.21
   - **CNAME**: cname.vercel-dns.com

---

## 문제 해결

### 빌드 실패 시

1. 로컬에서 `npm run build` 성공 확인
2. Vercel Logs에서 에러 확인
3. 환경변수 누락 여부 확인

### 런타임 에러 시

1. Sentry 대시보드 확인
2. Vercel Functions Logs 확인
3. 환경변수 값 올바른지 확인

### API 요청 실패 시

- `OPENAI_API_KEY` 유효한지 확인
- Supabase RLS 정책 확인
- CORS 설정 확인

---

## 배포 완료 후

### URL 확인

프로덕션 URL: `https://voice-journal.vercel.app` (또는 커스텀 도메인)

### 다음 단계

1. 실제 유저 테스트
2. 피드백 수집
3. 법적 문서 페이지 추가 (개인정보처리방침, 이용약관)
4. Phase 2 기능 개발

---

## 참고 링크

- [Vercel SvelteKit 배포 가이드](https://vercel.com/docs/frameworks/sveltekit)
- [Vercel 환경변수 설정](https://vercel.com/docs/projects/environment-variables)
- [Supabase + Vercel 연동](https://supabase.com/docs/guides/getting-started/tutorials/with-sveltekit)
