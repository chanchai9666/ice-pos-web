/**
 * Service Worker สำหรับ ICE POS Progressive Web App
 * นโยบาย:
 * 1. Static Assets (JS, CSS, Fonts, Images): Stale-While-Revalidate เพื่อโหลดรวดเร็ว
 * 2. API Requests (/api/*): NetworkOnly 100% ห้ามแคชเด็ดขาดเพื่อป้องกันสต็อกและยอดเงินผิดพลาด
 * 3. Non-GET Requests (POST, PUT, DELETE): ส่งตรงเครือข่ายเสมอ
 * 4. Update Lifecycle: รองรับ SKIP_WAITING เพื่ออัปเดตเวอร์ชันใหม่เมื่อแคชเชียร์ยืนยัน
 */

const CACHE_NAME = 'ice-pos-cache-v1';

// ไฟล์แกนหลักสำหรับ Pre-cache ตอน Install
const PRECACHE_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/apple-touch-icon.png',
];

// ติดตั้ง Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching partial warning:', err);
      });
    })
  );
});

// เปิดใช้งานและล้างแคชเวอร์ชันเก่า
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Clearing old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ดักจับการส่งข้อมูล (Fetch)
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // กฎข้อที่ 1: คำขอที่ไม่ใช่ GET (POST, PUT, DELETE, PATCH) ให้ส่งตรงไปยังเครือข่ายเสมอ
  if (request.method !== 'GET') {
    return;
  }

  // กฎข้อที่ 2: ห้ามแคช API ทุกเส้นเด็ดขาด (NetworkOnly)
  // ทั้ง Next.js internal API และ Backend External API
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.includes('/api/v1/') ||
    request.headers.get('accept')?.includes('application/json')
  ) {
    return;
  }

  // กฎข้อที่ 3: Static Assets & Web Shell ใช้กลยุทธ์ Stale-While-Revalidate
  // ส่งข้อมูลจากแคชทันทีหากมี พร้อมดึงเวอร์ชันใหม่จากเครือข่ายมาอัปเดตเบื้องหลัง
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(request);

      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          // เก็บลงแคชเฉพาะการตอบกลับที่สำเร็จ (status 200 และ type basic)
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            (networkResponse.type === 'basic' || networkResponse.type === 'cors')
          ) {
            cache.put(request, networkResponse.clone()).catch(() => {});
          }
          return networkResponse;
        })
        .catch(() => {
          // หากออฟไลน์และไม่มีในแคช ให้ปล่อยให้ error จัดการใน UI
          return cachedResponse;
        });

      return cachedResponse || fetchPromise;
    })
  );
});

// รอรับคำสั่ง SKIP_WAITING จากหน้าเว็บเพื่อสั่ง Activate ทันทีเมื่อผู้ใช้กดยืนยันอัปเดต
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
