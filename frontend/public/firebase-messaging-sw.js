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
  const notificationBody = payload.notification.body || '';
  
  // Premium notification styling
  const notificationOptions = {
    body: notificationBody,
    icon: '../icons/icon-192.webp',
    badge: '../icons/icon-96.webp',
    image: payload.data?.image || null, // Optional large image
    tag: payload.data?.tag || 'ember-notification',
    renotify: true,
    requireInteraction: false, // Auto-dismiss after timeout
    vibrate: [200, 100, 200], // Vibration pattern
    data: payload.data,
    actions: [
      {
        action: 'view',
        title: '💬 View Message',
        icon: '../icons/icon-96.webp'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '../icons/icon-96.webp'
      }
    ],
    // Premium styling with colors
    dir: 'auto',
    timestamp: Date.now()
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  // Close notification
  event.notification.close();

  const data = event.notification.data;
  const action = event.action;
  
  // Handle action buttons
  if (action === 'close') {
    return;
  }
  
  let urlToOpen = '/';

  if (data) {
    if (data.type === 'new_message' && data.match_id) {
      urlToOpen = `/messages/${data.match_id}`;
    } else if (data.type === 'new_match' && data.match_id) {
      urlToOpen = `/messages/${data.match_id}`;
    } else if (data.type === 'new_like') {
      urlToOpen = '/likes';
    } else if (data.type === 'video_call' && data.match_id) {
      urlToOpen = `/messages/${data.match_id}`;
    }
  }

  // Open or focus window
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if not already open
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
