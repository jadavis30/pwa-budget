const CACHE_NAME = 'budget-cache';
const DATA_CACHE_NAME = 'data-budget-cache';

const FILES_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/css/style.css',
    '/js/idb.js',
    '/js/index.js',
    '/icons/icon-72x72.png',
    '/icons/icon-96x96.png',
    '/icons/icon-128x128.png',
    '/icons/icon-144x144.png',
    '/icons/icon-152x152.png',
    '/icons/icon-192x192.png',
    '/icons/icon-384x384.png',
    '/icons/icon-512x512.png'
];

//Install the service worker
self.addEventListener('install', function(evt) {
    evt.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log('Your files were pre-cached successfully!');
            return cache.addAll(FILES_TO_CACHE);
        })
    );
});

 //Activate the service worker and remove old data from the cache
 self.addEventListener('activate', function(evt) {
    evt.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(
                keyList.map(key => {
                    if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
                        console.log('Removing old cache data', key);
                        return caches.delete(key);
                    }    
                })
            )    
        })
    );
}); 

//Intercept fetch requests
self.addEventListener('fetch', function(evt) {
    if (evt.request.url.includes('/api/')) {
        console.log('fetch request: ' + evt.request.url)
        if (evt.request.method === 'POST') {
            return;
        }
        evt.respondWith(
            caches
            .open(DATA_CACHE_NAME)
            .then(cache => {
                return fetch(evt.request)
                    .then(response => {
                        if (response.status === 200) {
                            console.log('Successful request, cloning data to cache');
                            cache.put(evt.request.url, response.clone());
                        }
                        return response;    
                    })
                    .catch(err => {
                        console.log('You are offline, data is being managed by the cache');
                        return cache.match(evt.request);
                    });
                })
                .catch(err => {console.log(err)})        
        );
        return;
    };
    evt.respondWith(
        fetch(evt.request).catch(function() {
            return caches.match(evt.request).then(function(response) {
                if (response) {
                    return response;
                } else if (evt.request.headers.get('accept').includes('text/html')) {
                    return caches.match('/');
                }
            });
        })
    );
});