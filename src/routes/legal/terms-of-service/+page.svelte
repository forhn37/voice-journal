<script lang="ts">
</script>

<svelte:head>
	<title>이용약관 - Voice Journal</title>
</svelte:head>

<div class="min-h-screen bg-(--color-background) py-8 px-4 pb-20 overflow-y-auto">
	<div class="max-w-3xl mx-auto bg-(--color-surface) rounded-2xl shadow-sm p-8">
		<!-- 헤더 -->
		<div class="mb-8">
			<a href="/settings" class="inline-flex items-center text-sm text-(--color-text-muted) hover:text-(--color-primary) mb-4">
				<svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
				</svg>
				설정으로 돌아가기
			</a>
			<h1 class="text-3xl font-bold text-(--color-text)">이용약관</h1>
			<p class="text-sm text-(--color-text-muted) mt-2">최종 업데이트: 2025년 12월 11일</p>
		</div>

		<!-- 내용 -->
		<div class="prose prose-sm max-w-none text-(--color-text)">
			<section class="mb-8">
				<h2 class="text-xl font-semibold mb-4">제1조 (목적)</h2>
				<p class="text-(--color-text-muted)">
					본 약관은 Voice Journal("서비스")이 제공하는 음성 일기 작성 서비스의 이용과 관련하여
					서비스와 이용자의 권리, 의무 및 책임 사항을 규정함을 목적으로 합니다.
				</p>
			</section>

			<section class="mb-8">
				<h2 class="text-xl font-semibold mb-4">제2조 (정의)</h2>
				<ul class="list-decimal pl-6 space-y-2 text-(--color-text-muted)">
					<li><strong>서비스</strong>: Voice Journal이 제공하는 음성 일기 작성, AI 분석, 이미지 생성 등의 모든 서비스를 의미합니다.</li>
					<li><strong>이용자</strong>: 본 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.</li>
					<li><strong>회원</strong>: 서비스에 회원가입을 한 후 지속적으로 서비스를 이용할 수 있는 자를 말합니다.</li>
					<li><strong>일기</strong>: 이용자가 음성으로 작성한 내용을 AI가 분석하여 생성한 텍스트 및 이미지를 포함한 콘텐츠를 말합니다.</li>
				</ul>
			</section>

			<section class="mb-8">
				<h2 class="text-xl font-semibold mb-4">제3조 (약관의 게시와 개정)</h2>
				<ol class="list-decimal pl-6 space-y-2 text-(--color-text-muted)">
					<li>서비스는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 내에 게시합니다.</li>
					<li>서비스는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.</li>
					<li>약관이 개정되는 경우, 서비스는 개정 내용과 적용 일자를 명시하여 서비스 내 공지사항을 통해 공지합니다.</li>
					<li>이용자가 개정 약관의 적용에 동의하지 않는 경우 서비스 이용을 중단하고 회원 탈퇴를 할 수 있습니다.</li>
				</ol>
			</section>

			<section class="mb-8">
				<h2 class="text-xl font-semibold mb-4">제4조 (회원가입)</h2>
				<ol class="list-decimal pl-6 space-y-2 text-(--color-text-muted)">
					<li>이용자는 서비스가 정한 가입 양식에 따라 회원정보를 기입한 후 본 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.</li>
					<li>서비스는 다음 각 호의 경우 회원가입을 승인하지 않을 수 있습니다:
						<ul class="list-disc pl-6 mt-2 space-y-1">
							<li>타인의 명의를 이용하여 신청한 경우</li>
							<li>회원정보를 허위로 기재한 경우</li>
							<li>사회의 안녕질서 또는 미풍양속을 저해할 목적으로 신청한 경우</li>
							<li>기타 서비스가 정한 이용신청 요건이 미비한 경우</li>
						</ul>
					</li>
				</ol>
			</section>

			<section class="mb-8">
				<h2 class="text-xl font-semibold mb-4">제5조 (서비스의 제공)</h2>
				<ol class="list-decimal pl-6 space-y-2 text-(--color-text-muted)">
					<li>서비스는 다음과 같은 서비스를 제공합니다:
						<ul class="list-disc pl-6 mt-2 space-y-1">
							<li>음성 녹음 및 텍스트 변환 (STT)</li>
							<li>AI 기반 일기 분석 (감정, 요약, 장면 추출)</li>
							<li>AI 기반 이미지 생성</li>
							<li>일기 저장 및 조회</li>
							<li>캘린더 뷰</li>
							<li>연속 작성 스트릭 기능</li>
						</ul>
					</li>
					<li>서비스는 무료로 제공되며, 일일 사용량 제한(3회)이 있습니다.</li>
					<li>서비스는 필요한 경우 서비스 내용을 변경할 수 있으며, 변경 사항은 사전에 공지합니다.</li>
				</ol>
			</section>

			<section class="mb-8">
				<h2 class="text-xl font-semibold mb-4">제6조 (서비스의 중단)</h2>
				<ol class="list-decimal pl-6 space-y-2 text-(--color-text-muted)">
					<li>서비스는 다음 각 호의 경우 서비스 제공을 일시적으로 중단할 수 있습니다:
						<ul class="list-disc pl-6 mt-2 space-y-1">
							<li>시스템 점검, 유지보수, 업데이트가 필요한 경우</li>
							<li>천재지변, 국가비상사태 등 불가항력적 사유가 발생한 경우</li>
							<li>서비스 제공을 위한 제3자 서비스(OpenAI, Supabase 등)에 장애가 발생한 경우</li>
						</ul>
					</li>
					<li>서비스는 서비스 중단 시 사전에 공지하며, 불가피한 경우 사후에 공지할 수 있습니다.</li>
				</ol>
			</section>

			<section class="mb-8">
				<h2 class="text-xl font-semibold mb-4">제7조 (이용자의 의무)</h2>
				<ol class="list-decimal pl-6 space-y-2 text-(--color-text-muted)">
					<li>이용자는 다음 행위를 하여서는 안 됩니다:
						<ul class="list-disc pl-6 mt-2 space-y-1">
							<li>타인의 정보 도용</li>
							<li>서비스의 정보를 이용한 영리 행위</li>
							<li>타인의 명예를 손상시키거나 불이익을 주는 행위</li>
							<li>음란물이나 불법적인 내용을 게시하는 행위</li>
							<li>서비스의 안정적 운영을 방해하는 행위</li>
							<li>서비스의 정보를 무단으로 수집, 저장, 공개하는 행위</li>
						</ul>
					</li>
					<li>이용자는 본인의 계정 정보를 철저히 관리해야 하며, 타인에게 양도하거나 대여할 수 없습니다.</li>
				</ol>
			</section>

			<section class="mb-8">
				<h2 class="text-xl font-semibold mb-4">제8조 (저작권)</h2>
				<ol class="list-decimal pl-6 space-y-2 text-(--color-text-muted)">
					<li>서비스가 작성한 저작물에 대한 저작권 및 기타 지적재산권은 서비스에 귀속됩니다.</li>
					<li>이용자가 작성한 일기 콘텐츠에 대한 저작권은 이용자에게 있습니다.</li>
					<li>AI가 생성한 이미지의 저작권은 이용자에게 귀속되며, 서비스는 서비스 제공 및 개선 목적으로만 사용할 수 있습니다.</li>
					<li>이용자는 서비스 내 공유 기능을 통해 본인의 일기를 SNS 등에 공유할 수 있습니다.</li>
				</ol>
			</section>

			<section class="mb-8">
				<h2 class="text-xl font-semibold mb-4">제9조 (면책 조항)</h2>
				<ol class="list-decimal pl-6 space-y-2 text-(--color-text-muted)">
					<li>서비스는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우 책임이 면제됩니다.</li>
					<li>서비스는 이용자의 귀책사유로 인한 서비스 이용 장애에 대하여 책임을 지지 않습니다.</li>
					<li>서비스는 이용자가 작성한 콘텐츠의 내용에 대해 책임을 지지 않습니다.</li>
					<li>AI가 생성한 분석 결과 및 이미지는 참고용이며, 서비스는 그 정확성이나 완전성을 보장하지 않습니다.</li>
					<li>서비스는 제3자가 제공하는 서비스(OpenAI, Supabase 등)의 장애로 인한 손해에 대해 책임을 지지 않습니다.</li>
				</ol>
			</section>

			<section class="mb-8">
				<h2 class="text-xl font-semibold mb-4">제10조 (분쟁 해결)</h2>
				<ol class="list-decimal pl-6 space-y-2 text-(--color-text-muted)">
					<li>서비스와 이용자 간 발생한 분쟁에 관한 소송은 대한민국 법을 준거법으로 합니다.</li>
					<li>서비스와 이용자 간 발생한 분쟁에 관한 소송은 민사소송법상의 관할법원에 제소합니다.</li>
				</ol>
			</section>

			<section class="mb-8">
				<h2 class="text-xl font-semibold mb-4">제11조 (회원 탈퇴 및 자격 상실)</h2>
				<ol class="list-decimal pl-6 space-y-2 text-(--color-text-muted)">
					<li>회원은 언제든지 서비스에 회원 탈퇴를 요청할 수 있으며, 서비스는 즉시 회원 탈퇴를 처리합니다.</li>
					<li>회원이 다음 각 호의 사유에 해당하는 경우 서비스는 회원 자격을 제한 또는 정지시킬 수 있습니다:
						<ul class="list-disc pl-6 mt-2 space-y-1">
							<li>가입 신청 시 허위 내용을 등록한 경우</li>
							<li>다른 사람의 서비스 이용을 방해하거나 그 정보를 도용하는 경우</li>
							<li>서비스를 이용하여 법령과 본 약관이 금지하는 행위를 하는 경우</li>
						</ul>
					</li>
				</ol>
			</section>

			<section>
				<h2 class="text-xl font-semibold mb-4">부칙</h2>
				<p class="text-(--color-text-muted)">본 약관은 2025년 12월 11일부터 적용됩니다.</p>
			</section>
		</div>
	</div>
</div>
