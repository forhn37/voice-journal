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

	// 모든 API 요청과 데이터 요청은 서비스 워커가 처리하지 않음 (네트워크 직접 사용)
	if (
		url.pathname.startsWith('/api/') ||
		url.pathname.startsWith('/auth/') ||
		url.pathname.includes('__data.json') ||
		event.request.method !== 'GET'
	) {
		// 서비스 워커가 처리하지 않고 네트워크로 직접 전달
		return;
	}

	// 정적 파일만 캐시 사용 (빌드된 파일들)
	// SvelteKit 페이지 요청(/, /calendar 등)은 항상 네트워크로 최신 데이터 가져오기
	if (event.request.method === 'GET') {
		event.respondWith(
			caches.match(event.request).then((cached) => {
				// 캐시에 있으면 (빌드된 정적 파일)
				if (cached) {
					return cached;
				}

				// 캐시에 없으면 네트워크 요청
				// 하지만 캐시에 추가는 하지 않음 (동적 페이지는 항상 최신 데이터 필요)
				return fetch(event.request);
			})
		);
	}
});
