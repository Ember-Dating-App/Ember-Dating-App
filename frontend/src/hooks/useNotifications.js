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
            vapidKey: 'BKVQv_6XJ3bCZXr8Y7vFjH8pE4PZK0ZzC7yX5w9lQ5rT3xY8wA6KjN9sP2rV4mD7', // You'll need to generate this in Firebase Console
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
          
          // Show toast notification
          toast(title, {
            description: body,
            duration: 5000,
            action: payload.data?.match_id ? {
              label: 'View',
              onClick: () => {
                window.location.href = `/messages/${payload.data.match_id}`;
              }
            } : undefined
          });
          
          // Show browser notification if tab is not focused
          if (document.hidden) {
            new Notification(title, {
              body: body,
              icon: '/ember-icon.png',
              badge: '/ember-badge.png'
            });
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
