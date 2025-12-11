<script lang="ts">
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>개인정보처리방침 - Voice Journal</title>
</svelte:head>

<div class="min-h-screen bg-(--color-background) py-8 px-4">
	<div class="max-w-3xl mx-auto bg-(--color-surface) rounded-2xl shadow-sm p-8">
		<!-- 헤더 -->
		<div class="mb-8">
			<a href="/settings" class="inline-flex items-center text-sm text-(--color-text-muted) hover:text-(--color-primary) mb-4">
				<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				설정으로 돌아가기
			</a>
			<h1 class="text-3xl font-bold text-(--color-text)">개인정보처리방침</h1>
			<p class="text-sm text-(--color-text-muted) mt-2">최종 업데이트: 2025년 12월 11일</p>
		</div>

		<!-- 내용 -->
		<div class="prose prose-sm max-w-none text-(--color-text)">
			<section class="mb-8">
				<h2 class="text-xl font-semibold mb-4">1. 개인정보의 수집 및 이용 목적</h2>
				<p class="mb-4">Voice Journal("서비스")은 다음의 목적을 위해 개인정보를 수집 및 이용합니다:</p>
				<ul class="list-disc pl-6 space-y-2 text-(--color-text-muted)">
					<li>회원 가입 및 관리</li>
					<li>음성 일기 작성 서비스 제공</li>
					<li>AI 분석 및 이미지 생성 서비스 제공</li>
					<li>서비스 개선 및 맞춤형 서비스 제공</li>
					<li>고객 문의 대응</li>
				</ul>
			</section>

			<section class="mb-8">
				<h2 class="text-xl font-semibold mb-4">2. 수집하는 개인정보 항목</h2>

				<h3 class="text-lg font-semibold mt-6 mb-3">필수 항목</h3>
				<ul class="list-disc pl-6 space-y-2 text-(--color-text-muted)">
					<li><strong>이메일 주소</strong>: 계정 생성 및 로그인</li>
					<li><strong>닉네임</strong>: 서비스 내 사용자 식별</li>
					<li><strong>음성 데이터</strong>: 음성을 텍스트로 변환 (STT)</li>
					<li><strong>일기 텍스트</strong>: AI 분석 및 이미지 생성</li>
					<li><strong>생성된 이미지</strong>: 일기 저장 및 조회</li>
				</ul>

				<h3 class="text-lg font-semibold mt-6 mb-3">선택 항목</h3>
				<ul class="list-disc pl-6 space-y-2 text-(--color-text-muted)">
					<li><strong>알림 시간 설정</strong>: 일기 작성 리마인더 (향후 제공 예정)</li>
				</ul>

				<h3 class="text-lg font-semibold mt-6 mb-3">자동 수집 항목</h3>
				<ul class="list-disc pl-6 space-y-2 text-(--color-text-muted)">
					<li>서비스 이용 기록 (일기 작성 일시, 감정 데이터)</li>
					<li>접속 IP 주소, 브라우저 정보 (오류 모니터링 목적)</li>
				</ul>
			</section>

			<section class="mb-8">
				<h2 class="text-xl font-semibold mb-4">3. 개인정보의 제3자 제공</h2>
				<p class="mb-4">서비스는 다음의 제3자에게 개인정보를 제공합니다:</p>

				<div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
					<h3 class="font-semibold mb-2">OpenAI (미국)</h3>
					<ul class="text-sm space-y-1 text-(--color-text-muted)">
						<li><strong>제공 목적</strong>: 음성을 텍스트로 변환 (Whisper), AI 분석 (GPT), 이미지 생성 (DALL-E)</li>
						<li><strong>제공 항목</strong>: 음성 데이터, 일기 텍스트</li>
						<li><strong>보유 기간</strong>: 처리 즉시 삭제 (OpenAI 정책에 따름)</li>
					</ul>
				</div>

				<div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
					<h3 class="font-semibold mb-2">Supabase (미국)</h3>
					<ul class="text-sm space-y-1 text-(--color-text-muted)">
						<li><strong>제공 목적</strong>: 데이터베이스 및 인증 서비스</li>
						<li><strong>제공 항목</strong>: 이메일, 닉네임, 일기 데이터</li>
						<li><strong>보유 기간</strong>: 회원 탈퇴 시까지</li>
					</ul>
				</div>

				<div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
					<h3 class="font-semibold mb-2">Sentry (미국)</h3>
					<ul class="text-sm space-y-1 text-(--color-text-muted)">
						<li><strong>제공 목적</strong>: 오류 모니터링 및 서비스 안정성 확보</li>
						<li><strong>제공 항목</strong>: IP 주소, 브라우저 정보, 오류 로그</li>
						<li><strong>보유 기간</strong>: 90일</li>
					</ul>
				</div>
			</section>

			<section class="mb-8">
				<h2 class="text-xl font-semibold mb-4">4. 개인정보의 보유 및 이용 기간</h2>
				<ul class="list-disc pl-6 space-y-2 text-(--color-text-muted)">
					<li><strong>회원 정보</strong>: 회원 탈퇴 시까지</li>
					<li><strong>일기 데이터</strong>: 회원 탈퇴 또는 삭제 요청 시까지</li>
					<li><strong>음성 데이터</strong>: 텍스트 변환 후 즉시 삭제</li>
					<li><strong>법령에 따른 보존</strong>: 관련 법령에 따라 일정 기간 보존</li>
				</ul>
			</section>

			<section class="mb-8">
				<h2 class="text-xl font-semibold mb-4">5. 개인정보의 파기 절차 및 방법</h2>
				<p class="mb-4"><strong>파기 절차</strong></p>
				<ul class="list-disc pl-6 space-y-2 text-(--color-text-muted) mb-4">
					<li>이용자가 회원 탈퇴를 요청하면 즉시 파기합니다</li>
					<li>법령에 따라 보존해야 하는 정보는 별도 DB로 분리 보관 후 기간 만료 시 파기합니다</li>
				</ul>

				<p class="mb-4"><strong>파기 방법</strong></p>
				<ul class="list-disc pl-6 space-y-2 text-(--color-text-muted)">
					<li>전자적 파일: 복구 불가능한 방법으로 영구 삭제</li>
					<li>종이 문서: 분쇄 또는 소각</li>
				</ul>
			</section>

			<section class="mb-8">
				<h2 class="text-xl font-semibold mb-4">6. 이용자의 권리와 행사 방법</h2>
				<p class="mb-4">이용자는 언제든지 다음의 권리를 행사할 수 있습니다:</p>
				<ul class="list-disc pl-6 space-y-2 text-(--color-text-muted)">
					<li><strong>개인정보 열람 요구</strong>: 설정 페이지에서 확인 가능</li>
					<li><strong>개인정보 수정 요구</strong>: 설정 페이지에서 닉네임 수정 가능</li>
					<li><strong>개인정보 삭제 요구</strong>: 일기 삭제 기능 이용 (향후 제공 예정)</li>
					<li><strong>회원 탈퇴</strong>: 설정 > 계정 삭제 (향후 제공 예정)</li>
				</ul>
			</section>

			<section class="mb-8">
				<h2 class="text-xl font-semibold mb-4">7. 개인정보 보호책임자</h2>
				<p class="mb-4">개인정보 처리에 관한 문의사항은 아래로 연락 주시기 바랍니다:</p>
				<div class="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
					<ul class="text-sm space-y-1 text-(--color-text-muted)">
						<li><strong>담당자</strong>: Voice Journal 운영팀</li>
						<li><strong>이메일</strong>: privacy@voice-journal.com (예시)</li>
					</ul>
				</div>
			</section>

			<section class="mb-8">
				<h2 class="text-xl font-semibold mb-4">8. 개인정보 처리방침의 변경</h2>
				<p class="text-(--color-text-muted)">
					본 개인정보처리방침은 법령, 정책 또는 보안기술의 변경에 따라 내용이 추가, 삭제 및 수정될 수 있으며,
					변경 사항은 서비스 내 공지사항을 통해 안내합니다.
				</p>
			</section>

			<section class="mb-8">
				<h2 class="text-xl font-semibold mb-4">9. 쿠키 사용</h2>
				<p class="mb-4">서비스는 다음의 목적으로 쿠키를 사용합니다:</p>
				<ul class="list-disc pl-6 space-y-2 text-(--color-text-muted)">
					<li><strong>인증 쿠키</strong>: 로그인 상태 유지</li>
					<li><strong>기능 쿠키</strong>: 사용자 설정 저장 (다크모드 등)</li>
				</ul>
				<p class="mt-4 text-(--color-text-muted)">
					이용자는 브라우저 설정을 통해 쿠키를 거부할 수 있으나, 이 경우 일부 서비스 이용에 제한이 있을 수 있습니다.
				</p>
			</section>

			<section>
				<h2 class="text-xl font-semibold mb-4">10. 부칙</h2>
				<p class="text-(--color-text-muted)">본 개인정보처리방침은 2025년 12월 11일부터 적용됩니다.</p>
			</section>
		</div>
	</div>
</div>
