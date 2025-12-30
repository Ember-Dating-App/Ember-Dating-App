// Firebase Cloud Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyB9MqwSIY7CCPvUmjLIyxyRBCDO5LjCfcE",
  authDomain: "ember-dating-app-o1bbl7.firebaseapp.com",
  projectId: "ember-dating-app-o1bbl7",
  storageBucket: "ember-dating-app-o1bbl7.firebasestorage.app",
  messagingSenderId: "500598992310",
  appId: "1:500598992310:web:689eb7679e4e4ca64aa517",
  measurementId: "G-E15T3MKHJE"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);
  
  const notificationTitle = payload.notification.title || 'Ember';
  const notificationOptions = {
    body: payload.notification.body || '',
    icon: '/ember-icon.png',
    badge: '/ember-badge.png',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();

  const data = event.notification.data;
  let urlToOpen = '/';

  if (data) {
    if (data.type === 'new_matches' && data.match_id) {
      urlToOpen = `/messages/${data.match_id}`;
    } else if (data.type === 'new_messages' && data.match_id) {
      urlToOpen = `/messages/${data.match_id}`;
    } else if (data.type === 'new_likes') {
      urlToOpen = '/likes';
    }
  }

  event.waitUntil(
    clients.openWindow(urlToOpen)
  );
});
