import idb from 'idb';

const staticCacheName = 'restaurant-reviews-static';

const dataBase = idb.open('restaurant-db', 1, upgradeDB => {
  switch (upgradeDB.oldVersion) {
    case 0:
      upgradeDB.createObjectStore('restaurants');
  }
});

const indexedDbKeyValue = {
  get(key) {
    return dataBase.then(db => {
      return db
        .transaction('restaurants')
        .objectStore('restaurants')
        .get(key);
    });
  },
  set(key, val) {
    return dataBase.then(db => {
      const trans = db.transaction('restaurants', 'readwrite');
      trans.objectStore('restaurants').put(val, key);
      return trans.complete;
    });
  }
};

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(staticCacheName).then(cache => {
        return cache.addAll([
          '/index.html',
          '/css/styles.css',
          '/js/dbhelper.js',
          '/js/register_sw.js',
          '/js/main.js',
          '/js/restaurant_info.js',
          '/data/restaurants.json',
          '/restaurant.html?id=1',
          '/restaurant.html?id=2',
          '/restaurant.html?id=3',
          '/restaurant.html?id=4',
          '/restaurant.html?id=5',
          '/restaurant.html?id=6',
          '/restaurant.html?id=7',
          '/restaurant.html?id=8',
          '/restaurant.html?id=9',
          '/restaurant.html?id=10',
        ]).catch(error => {
          console.log('Cache failed: ' + error);
        });
      })
  );
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const requestUrl = new URL(request.url);

  if (requestUrl.port === '1337') {
    event.respondWith(indexedDbResponse(request));
  }
  else {
    event.respondWith(cacheResponse(request));
  }
});

function indexedDbResponse(request) {

  return indexedDbKeyValue.get('restaurants')
    .then(restaurants => {
      return (
        restaurants ||
        fetch(request)
          .then(response => response.json())
          .then(json => {
            indexedDbKeyValue.set('restaurants', json);
            return json;
          })
      );
    })
    .then(response => new Response(JSON.stringify(response)))
    .catch(error => {
      return new Response(error, {
        status: 404,
        statusText: 'request invalid'
      });
    });

    function cacheResponse(request) {
      return caches.match(request).then(response => {
        return response || fetch(request).then(fetchResponse => {
          return caches.open(staticCacheName).then(cache => {
            if (!fetchResponse.url.includes('browser-sync')) {
              cache.put(request, fetchResponse.clone());
            }
            return fetchResponse;
          });
        });
      }).catch(error => {
        return new Response(error, {
          status: 404,
          statusText: 'Not connected to the internet'
        });
      });

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName.startsWith('restaurant-reviews-static-') && cacheName !== offlineCache;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});