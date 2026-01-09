import { useEffect } from 'react';
import { messaging, getToken, onMessage } from '../firebase';
import axios from 'axios';
import { toast } from 'sonner';
import { API } from '../App';

// Play notification sound
function playNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const duration = 0.5;
    
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const oscillator3 = audioContext.createOscillator();
    
    const gainNode = audioContext.createGain();
    const masterGain = audioContext.createGain();
    
    // Pleasant chord (C major)
    oscillator1.frequency.value = 523.25; // C5
    oscillator2.frequency.value = 659.25; // E5
    oscillator3.frequency.value = 783.99; // G5
    
    oscillator1.type = 'sine';
    oscillator2.type = 'sine';
    oscillator3.type = 'sine';
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    oscillator3.connect(gainNode);
    
    gainNode.connect(masterGain);
    masterGain.connect(audioContext.destination);
    
    masterGain.gain.value = 0.3; // 30% volume
    
    const now = audioContext.currentTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(1, now + 0.05);
    gainNode.gain.linearRampToValueAtTime(1, now + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);
    
    oscillator1.start(now);
    oscillator2.start(now);
    oscillator3.start(now);
    
    oscillator1.stop(now + duration);
    oscillator2.stop(now + duration);
    oscillator3.stop(now + duration);
  } catch (error) {
    console.error('Could not play notification sound:', error);
  }
}

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
              { headers }
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
          
          // Play custom notification sound
          playNotificationSound();
          
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
              icon: '/icons/icon-192.webp',
              badge: '/icons/icon-96.webp',
              tag: data.tag || 'ember-notification',
              image: data.sender_photo || null,
              requireInteraction: false,
              vibrate: [200, 100, 200],
              silent: false, // Allow sound
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
