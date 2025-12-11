/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;

// 캐시 이름
const CACHE_NAME = `voice-journal-cache-${version}`;

// 캐시할 파일들
const ASSETS = [
	...build, // 빌드된 앱
	...files  // static 폴더의 파일들
];

// 설치 시 캐시
sw.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(CACHE_NAME).then((cache) => {
			return cache.addAll(ASSETS);
		}).then(() => {
			sw.skipWaiting();
		})
	);
});

// 활성화 시 이전 캐시 삭제
sw.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((keys) => {
			return Promise.all(
				keys
					.filter((key) => key !== CACHE_NAME)
					.map((key) => caches.delete(key))
			);
		}).then(() => {
			sw.clients.claim();
		})
	);
});

// 네트워크 요청 처리
sw.addEventListener('fetch', (event) => {
	const url = new URL(event.request.url);

	// 외부 API 요청 (Supabase 등)은 서비스 워커가 처리하지 않음
	if (url.origin !== sw.location.origin) {
		return;
	}

	// 내부 API 요청은 네트워크 우선
	if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/auth/')) {
		event.respondWith(
			fetch(event.request).catch(() => {
				return new Response(
					JSON.stringify({ success: false, error: 'OFFLINE', message: '오프라인 상태예요' }),
					{ headers: { 'Content-Type': 'application/json' } }
				);
			})
		);
		return;
	}

	// 정적 리소스는 캐시 우선
	if (event.request.method === 'GET') {
		event.respondWith(
			caches.match(event.request).then((cached) => {
				if (cached) {
					return cached;
				}

				return fetch(event.request).then((response) => {
					// 성공적인 응답만 캐시
					if (response.status === 200) {
						const clone = response.clone();
						caches.open(CACHE_NAME).then((cache) => {
							cache.put(event.request, clone);
						});
					}
					return response;
				});
			})
		);
	}
});
