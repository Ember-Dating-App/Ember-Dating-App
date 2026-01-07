import { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VoiceMessage = ({ audioUrl, duration, isOwn }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [waveform, setWaveform] = useState([]);
  const audioRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    // Generate waveform visualization
    const bars = 40;
    const wave = Array.from({ length: bars }, () => 
      0.3 + Math.random() * 0.7
    );
    setWaveform(wave);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => {
      setCurrentTime(audio.currentTime);
      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(updateTime);
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('ended', handleEnded);
    
    if (isPlaying) {
      updateTime();
    }

    return () => {
      audio.removeEventListener('ended', handleEnded);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`flex items-center gap-3 p-3 rounded-2xl max-w-sm ${
      isOwn ? 'bg-primary text-primary-foreground' : 'bg-muted'
    }`}>
      <audio ref={audioRef} src={audioUrl} />
      
      <Button
        size="icon"
        variant="ghost"
        onClick={togglePlay}
        className={`rounded-full w-10 h-10 flex-shrink-0 ${
          isOwn ? 'hover:bg-primary-foreground/20' : 'hover:bg-background'
        }`}
      >
        {isPlaying ? (
          <Pause className="w-5 h-5" fill="currentColor" />
        ) : (
          <Play className="w-5 h-5" fill="currentColor" />
        )}
      </Button>

      <div className="flex-1 min-w-0">
        {/* Waveform visualization */}
        <div className="flex items-center gap-0.5 h-8 mb-1">
          {waveform.map((height, i) => {
            const isPlayed = (i / waveform.length) * 100 < progress;
            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isPlayed 
                    ? isOwn ? 'bg-primary-foreground' : 'bg-primary'
                    : isOwn ? 'bg-primary-foreground/30' : 'bg-muted-foreground/30'
                }`}
                style={{ height: `${height * 100}%` }}
              />
            );
          })}
        </div>
        
        <div className="flex justify-between text-xs opacity-70">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </div>
  );
};

export default VoiceMessage;