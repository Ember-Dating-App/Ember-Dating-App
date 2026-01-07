import { useState, useRef, useEffect } from 'react';
import { Mic, StopCircle, Trash2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VoiceRecorder = ({ onSend, onCancel }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const MAX_RECORDING_TIME = 120; // 2 minutes in seconds

  useEffect(() => {
    return () => {
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Set up audio context for visualization
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= MAX_RECORDING_TIME - 1) {
            stopRecording();
            return MAX_RECORDING_TIME;
          }
          return prev + 1;
        });
      }, 1000);
      
      // Start audio level visualization
      visualizeAudio();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check your permissions.');
    }
  };

  const visualizeAudio = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    
    const update = () => {
      if (!isRecording) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
      setAudioLevel(average / 255); // Normalize to 0-1
      
      animationFrameRef.current = requestAnimationFrame(update);
    };
    
    update();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onSend(audioBlob, recordingTime);
    }
  };

  const handleCancel = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    onCancel();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-3 p-4 bg-muted/30 rounded-xl border border-muted">
      {isRecording ? (
        <div className="flex items-center gap-3">
          {/* Animated waveform */}
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-primary rounded-full transition-all duration-100"
                style={{
                  height: `${12 + audioLevel * 20 * (1 + Math.sin(Date.now() / 100 + i))}px`
                }}
              />
            ))}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Recording...</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatTime(recordingTime)} / {formatTime(MAX_RECORDING_TIME)}
            </p>
          </div>
          
          <Button
            size="icon"
            variant="destructive"
            onClick={stopRecording}
            className="rounded-full"
          >
            <StopCircle className="w-5 h-5" />
          </Button>
        </div>
      ) : audioUrl ? (
        <div className="flex items-center gap-3">
          <audio src={audioUrl} controls className="flex-1 h-10" />
          <div className="text-xs text-muted-foreground">
            {formatTime(recordingTime)}
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleCancel}
          >
            <Trash2 className="w-5 h-5" />
          </Button>
          <Button
            size="icon"
            onClick={handleSend}
            className="ember-gradient rounded-full ember-glow"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Button
            onClick={startRecording}
            className="ember-gradient rounded-full w-12 h-12 ember-glow"
          >
            <Mic className="w-6 h-6" />
          </Button>
          <div className="flex-1">
            <p className="text-sm font-medium">Record Voice Message</p>
            <p className="text-xs text-muted-foreground">Max {formatTime(MAX_RECORDING_TIME)}</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancel}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;