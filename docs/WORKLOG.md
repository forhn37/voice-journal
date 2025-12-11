# Voice Journal 작업 로그

## 2025-12-11 (수) - Day 14: Vercel 배포 및 성능 최적화

### 작업 시간
- 총 5시간

### 주요 작업

#### 1. Vercel 배포 성공 🚀
- Vercel 프로젝트 생성 및 GitHub 연동
- 환경변수 설정 (Supabase, OpenAI, Sentry)
- 프로덕션 빌드 및 배포 완료
- 프로덕션 URL: https://voice-journal-liart.vercel.app

#### 2. Service Worker 이슈 해결
**문제**:
- 로그인 후 다시 로그인 페이지로 리다이렉트됨
- Service Worker가 API 요청을 인터셉션하면서 인증 실패

**원인**:
- Service Worker의 fetch 이벤트 핸들러가 `/api/` 요청 처리
- POST 요청과 `__data.json` 요청을 잘못 처리

**해결**:
```typescript
// src/service-worker.ts
if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.includes('__data.json') ||
    event.request.method !== 'GET'
) {
    // Service Worker가 처리하지 않고 네트워크로 직접 전달
    return;
}
```

**추가 수정**:
- 동적 페이지 캐싱 제거 (닉네임 변경 등 최신 데이터 필요)
- 빌드된 정적 파일만 캐시 사용

#### 3. 성능 최적화 (핵심!)

##### 문제 분석
**초기 상태**:
- `__data.json` 요청 시간: 1,420ms (1.42초)
- Waiting for server response: 790ms

**원인**:
1. Vercel Lambda: 미국 동부 (기본값)
2. Supabase: 싱가포르
3. 거리: 약 12,000km → RTT 200~400ms
4. `getUser()` API 호출: 매 요청마다 Supabase에 인증 검증 (500~800ms)

##### 해결 방법

**1) Vercel Lambda를 서울로 이동**
```json
// vercel.json
{
  "regions": ["icn1"]  // 서울 리전
}
```

**효과**:
- 서울 Lambda ↔ 싱가포르 Supabase: ~50ms RTT
- 미국 Lambda ↔ 싱가포르 Supabase: ~200~400ms RTT

**2) 조건부 getUser() API 호출**
```typescript
// src/hooks.server.ts
const expiresAt = session.expires_at ?? 0;
const now = Math.floor(Date.now() / 1000);
const hoursUntilExpiry = (expiresAt - now) / 3600;

// 1시간 이내 만료 예정이면 getUser()로 검증 (보안)
// 아니면 세션 정보만 사용 (성능)
if (hoursUntilExpiry < 1) {
    const { data: { user }, error } = await event.locals.supabase.auth.getUser();
    if (error) return { session: null, user: null };
    return { session, user };
}

// 토큰이 충분히 유효하면 API 호출 생략
return { session, user: session.user };
```

**효과**:
- 대부분의 요청: Supabase API 호출 1회 절약 (500~800ms 절약)
- 보안 유지: 만료 임박 시에만 재검증

**3) UX 개선**
```svelte
<!-- src/routes/+layout.svelte -->
{#if $navigating}
    <div class="loading-bar"></div>
{/if}
```

```svelte
<!-- src/lib/components/BottomNav.svelte -->
<a href="/calendar" data-sveltekit-preload-data="hover">
```

##### 성능 개선 결과

| 항목 | 이전 | 현재 | 개선율 |
|-----|------|------|--------|
| **응답 시간** | 1,420ms | 250~320ms | **약 78% 감소** |
| **Cold Start** | 1,420ms | ~500ms | **약 3배 개선** |
| **Warm Start** | ~500ms | ~100ms | **약 5배 개선** |

### 기술 학습

#### Vercel 아키텍처
- **Edge Network**: 전세계 300+ 위치에 정적 파일 자동 배포
- **Serverless Functions**: `regions` 설정으로 Lambda 실행 위치 지정
- **무료 플랜 제한**: 1개 리전만 선택 가능

#### SvelteKit 데이터 로딩
- **첫 페이지 로드**: HTML에 데이터 포함
- **SPA 네비게이션**: `__data.json`으로 JSON만 가져옴
- **Service Worker**: `__data.json`은 캐시하면 안됨 (항상 최신 데이터 필요)

#### 인증 최적화
- **getSession()**: 쿠키에서 읽기 (빠름, ~5ms)
- **getUser()**: Supabase API 호출 (느림, ~500~800ms)
- **트레이드오프**: 보안 vs 성능

### 다음 할 일
- [ ] 개인정보처리방침 페이지 작성
- [ ] 이용약관 페이지 작성
- [ ] 공유 기능 구현
- [ ] 커스텀 도메인 연결 (선택)

### 배운 점
1. **지역 선택의 중요성**: Lambda와 DB의 물리적 거리가 성능에 큰 영향
2. **인증 최적화**: 매 요청마다 API 호출은 비효율적, 조건부 검증으로 개선
3. **Service Worker 주의**: 동적 데이터는 캐시하면 안됨
4. **측정의 중요성**: Network 탭으로 병목 지점 정확히 파악

### 커밋 내역
```
perf: 성능 최적화 - Lambda 서울 리전 전환 및 인증 개선
fix: navigating을 올바른 모듈에서 import
```

---

## 이전 작업 로그

### 2025-12-10 (화) - Day 13: UI/UX 다듬기
- 반응형 디자인 점검
- 애니메이션 추가
- 로딩 스켈레톤
- SSR 적용

### 2025-12-09 (월) - Day 12: 에러 처리 + 입력 검증
- 에러 UI 컴포넌트
- 각 단계별 에러 처리
- 재시도 로직
- 일일 사용량 제한 (3회)

### 2025-12-08 (일) - Day 10-11: 스트릭 시스템 + 설정
- 스트릭 계산 함수
- 스트릭 UI
- 설정 페이지 (닉네임, 알림 시간)

### 2025-12-07 (토) - Day 9: 일기 저장/조회 + 캘린더
- 일기 저장 로직
- 캘린더 페이지
- 일기 상세 페이지

### 2025-12-06 (금) - Day 8: Supabase 연동
- Supabase 프로젝트 생성
- DB 테이블 생성
- RLS 정책 설정
- 로그인/회원가입 UI

### 2025-12-05 (목) - Day 7: 로딩 경험
- LoadingCharacter 컴포넌트
- 로딩 단계별 메시지
- 캐릭터 애니메이션

### 2025-12-04 (수) - Day 6: DALL-E 이미지 생성
- 이미지 생성 API
- 감정별 스타일 적용
- 결과 화면 UI

### 2025-12-03 (화) - Day 5: GPT 분석 연동
- 분석 프롬프트 작성
- GPT-4o-mini 호출
- JSON 응답 파싱

### 2025-12-02 (월) - Day 4: Whisper API 연동
- STT API 구현
- 오디오 파일 검증
- 에러 핸들링

### 2025-12-01 (일) - Day 3: 음성 녹음 기능
- RecordButton 컴포넌트
- MediaRecorder API 래퍼
- 녹음 상태 관리

### 2025-11-30 (토) - Day 2: 온보딩 플로우
- 온보딩 3단계 구현
- 닉네임 입력
- 알림 시간 선택

### 2025-11-29 (금) - Day 1: 프로젝트 셋업
- SvelteKit 프로젝트 생성
- TailwindCSS 설정
- Sentry 설정
- 기본 레이아웃
