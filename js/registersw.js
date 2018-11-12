if (navigator.serviceWorker) {
    navigator.serviceWorker.register('sw.js')
    .then(registration => {
        console.log(`Service worker registration is successful, scope is ${registration.scope}`);
    }).catch(error => {
        console.log(`Service worker registration has failed, error: ${error}`);
    });
}