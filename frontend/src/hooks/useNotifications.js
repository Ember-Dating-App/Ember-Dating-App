import { useEffect } from 'react';
import { messaging, getToken, onMessage } from '../firebase';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '../App';

export function useNotifications(user) {
  useEffect(() => {
    if (!user) return;

    const setupNotifications = async () => {
      try {
        // Request permission
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          console.log('Notification permission granted');
          
          // Register service worker
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('Service Worker registered:', registration);
          
          // Get FCM token
          const token = await getToken(messaging, {
            vapidKey: 'ojInXOVYwOJlEjP0LyNC10OJzPsJYEEVWBy2QR6a36Q',
            serviceWorkerRegistration: registration
          });
          
          if (token) {
            console.log('FCM Token:', token);
            
            // Send token to backend
            const headers = {
              Authorization: `Bearer ${localStorage.getItem('ember_token')}`
            };
            
            await axios.post(`${API}/notifications/register-token`, 
              { token },
              { headers, withCredentials: true }
            );
            
            console.log('Token registered with backend');
          }
        } else {
          console.log('Notification permission denied');
        }
        
        // Handle foreground messages
        onMessage(messaging, (payload) => {
          console.log('Foreground message received:', payload);
          
          const { title, body } = payload.notification;
          const data = payload.data || {};
          
          // Show premium toast notification with Ember styling
          toast(title, {
            description: body,
            duration: 6000,
            className: 'ember-notification',
            style: {
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)',
            },
            action: data.match_id ? {
              label: '💬 View',
              onClick: () => {
                window.location.href = `/messages/${data.match_id}`;
              }
            } : undefined,
            icon: data.sender_photo ? (
              <img 
                src={data.sender_photo} 
                alt="Profile" 
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '2px solid white'
                }}
              />
            ) : '💬'
          });
          
          // Show browser notification if tab is not focused
          if (document.hidden && Notification.permission === 'granted') {
            const notif = new Notification(title, {
              body: body,
              icon: '/ember-icon-192.png',
              badge: '/ember-badge.png',
              tag: data.tag || 'ember-notification',
              image: data.sender_photo || null,
              requireInteraction: false,
              vibrate: [200, 100, 200],
              data: data
            });
            
            notif.onclick = () => {
              window.focus();
              if (data.match_id) {
                window.location.href = `/messages/${data.match_id}`;
              }
              notif.close();
            };
          }
        });
        
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };

    setupNotifications();
  }, [user]);

  return null;
}

export default useNotifications;
