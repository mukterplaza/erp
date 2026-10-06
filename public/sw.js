/* INSAF ERP PWA service worker.
 * কোনো authenticated page, API response বা ব্যক্তিগত তথ্য cache করা হয় না।
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// Navigation সবসময় network থেকে যাবে। ইন্টারনেট না থাকলে
// হাজিরা/ERP data সফলভাবে পাওয়া বা জমা হয়েছে বলে দেখানো হবে না।
self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;

  event.respondWith(
    fetch(event.request).catch(
      () =>
        new Response(
          `<!doctype html>
          <html lang="bn">
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <title>ইন্টারনেট সংযোগ নেই — INSAF ERP</title>
            </head>
            <body style="font-family:sans-serif;text-align:center;padding:40px;background:#f1f5f9;color:#0f172a">
              <h1>ইন্টারনেট সংযোগ নেই</h1>
              <p>INSAF ERP-তে হাজিরা ও অন্যান্য তথ্য জমা দিতে ইন্টারনেট প্রয়োজন।</p>
              <p>সংযোগ ফিরে এলে পেজটি আবার খুলুন।</p>
            </body>
          </html>`,
          {
            status: 503,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "no-store",
            },
          }
        )
    )
  );
});