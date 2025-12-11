# Playwright E2E 테스트

Voice Journal의 End-to-End 테스트 스위트입니다.

## 테스트 실행

```bash
# 모든 테스트 실행 (headless)
npm test

# UI 모드로 테스트 실행 (대화형)
npm run test:ui

# 브라우저를 보면서 테스트 실행
npm run test:headed

# 디버그 모드
npm run test:debug

# 테스트 리포트 보기
npm run test:report
```

## 테스트 파일 구조

- **auth.spec.ts** - 인증 관련 테스트 (로그인, 회원가입, 리다이렉트)
- **navigation.spec.ts** - 네비게이션 및 라우팅 테스트
- **responsive.spec.ts** - 반응형 디자인 테스트 (다양한 뷰포트)
- **accessibility.spec.ts** - 접근성 테스트 (키보드, 스크린리더, 색상 대비)

## 브라우저 테스트 환경

- **Desktop**: Chromium, Firefox, Webkit (Safari)
- **Mobile**: Pixel 5 (Android), iPhone 12 (iOS)

## 작성 예정 테스트

- [ ] 전체 플로우 테스트 (회원가입 → 온보딩 → 일기 작성)
- [ ] 녹음 기능 테스트 (마이크 권한 모킹 필요)
- [ ] 캘린더 및 일기 조회 테스트
- [ ] 설정 페이지 테스트
- [ ] 에러 처리 테스트

## 주의 사항

- 현재 테스트는 **비인증 상태**에서 접근 가능한 페이지만 포함
- 인증이 필요한 페이지는 테스트 계정 설정 필요
- 녹음 기능 테스트는 마이크 권한 모킹 필요 (추후 구현)

## 로컬 개발 서버

테스트 실행 시 자동으로 `npm run dev` 서버가 시작됩니다.
포트: `http://localhost:5173`

## CI/CD

- GitHub Actions에서 자동으로 실행 가능
- 실패 시 스크린샷/비디오 자동 저장
- 테스트 리포트 아티팩트로 업로드
