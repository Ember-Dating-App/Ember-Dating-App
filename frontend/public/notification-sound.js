// Custom notification sound for Ember Dating App
// Creates a pleasant notification sound using Web Audio API

function createEmberNotificationSound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const duration = 0.5;
    
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const oscillator3 = audioContext.createOscillator();
    
    const gainNode = audioContext.createGain();
    const masterGain = audioContext.createGain();
    
    oscillator1.frequency.value = 523.25;
    oscillator2.frequency.value = 659.25;
    oscillator3.frequency.value = 783.99;
    
    oscillator1.type = 'sine';
    oscillator2.type = 'sine';
    oscillator3.type = 'sine';
    
    oscillator1.connect(gainNode);
    oscillator2.connect(gainNode);
    oscillator3.connect(gainNode);
    
    gainNode.connect(masterGain);
    masterGain.connect(audioContext.destination);
    
    masterGain.gain.value = 0.3;
    
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
    
    return audioContext;
  } catch (error) {
    console.error('Error creating notification sound:', error);
    return null;
  }
}
