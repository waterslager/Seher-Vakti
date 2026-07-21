const CACHE_NAME = 'kiyamul-leyl-v2';
const APP_SHELL = [
    './index.html',
    './manifest.json',
    './192.png',
    './512.png'
];

self.addEventListener('install', (event) => {
    // Her dosyayı {cache:"reload"} ile çekip önbelleğe koyuyoruz; böylece
    // GitHub Pages'in kısa süreli CDN önbelleğine takılıp az bayat bir
    // kopyanın precache'e girme ihtimali tamamen ortadan kalkıyor.
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) =>
            Promise.all(APP_SHELL.map((url) =>
                fetch(url, { cache: 'reload' }).then((res) => cache.put(url, res))
            ))
        )
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const url = new URL(event.request.url);

    // Namaz vakti API isteklerine (farklı origin) hiç dokunma, tarayıcı bu
    // isteği normal şekilde, SW araya girmeden yürütsün — her zaman canlı veri çeksin.
    if (url.origin !== self.location.origin) return;

    // Aynı-origin dosyalar (index.html vb.) için "önce ağ, olmazsa önbellek"
    // stratejisi: online iken her zaman en güncel sürüm gösterilir; kod
    // güncellemesi yayınladığında kullanıcı BİR SONRAKİ açılışı beklemeden,
    // İLK açılışta yeni sürümü görür. Sadece tamamen offline kalınırsa
    // önbellekteki son bilinen sürüm devreye girer.
    event.respondWith(
        fetch(event.request, { cache: 'no-store' }).catch(() => caches.match(event.request))
    );
});
