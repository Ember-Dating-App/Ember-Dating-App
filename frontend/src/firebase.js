import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyB9MqwSIY7CCPvUmjLIyxyRBCDO5LjCfcE",
  authDomain: "ember-dating-app-o1bbl7.firebaseapp.com",
  projectId: "ember-dating-app-o1bbl7",
  storageBucket: "ember-dating-app-o1bbl7.firebasestorage.app",
  messagingSenderId: "500598992310",
  appId: "1:500598992310:web:689eb7679e4e4ca64aa517",
  measurementId: "G-E15T3MKHJE"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export { messaging, getToken, onMessage };
