import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, X } from 'lucide-react';
import { useAuth, API } from '@/App';
import { useWebSocket } from '@/contexts/WebSocketContext';
import axios from 'axios';
import { toast } from 'sonner';

export const VideoCall = ({ callData, onEnd }) => {
  const { user } = useAuth();
  const { lastMessage, sendMessage } = useWebSocket();
  const [callStatus, setCallStatus] = useState(callData?.status || 'connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);

  const token = localStorage.getItem('ember_token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  // Use TURN servers from call data or fetch from API
  const getConfiguration = () => {
    const iceServers = callData?.ice_servers || [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      },
      {
        urls: 'turn:openrelay.metered.ca:443',
        username: 'openrelayproject',
        credential: 'openrelayproject'
      }
    ];
    return { iceServers };
  };

  useEffect(() => {
    if (callData?.call_id) {
      initializeCall();
    }
    return () => {
      cleanup();
    };
  }, [callData]);

  useEffect(() => {
    if (lastMessage?.type === 'webrtc_signal' && lastMessage.call_id === callData?.call_id) {
      handleSignal(lastMessage);
    } else if (lastMessage?.type === 'call_ended' && lastMessage.call_id === callData?.call_id) {
      cleanup();
      onEnd?.();
    } else if (lastMessage?.type === 'call_answered' && lastMessage.call_id === callData?.call_id) {
      setCallStatus('connected');
    } else if (lastMessage?.type === 'call_rejected' && lastMessage.call_id === callData?.call_id) {
      toast.error('Call was declined');
      cleanup();
      onEnd?.();
    }
  }, [lastMessage]);

  const initializeCall = async () => {
    try {
      // Get local media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: callData.call_type === 'video',
        audio: true
      });
      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection with TURN servers
      peerConnectionRef.current = new RTCPeerConnection(getConfiguration());

      // Add local tracks
      stream.getTracks().forEach(track => {
        peerConnectionRef.current.addTrack(track, stream);
      });

      // Handle remote tracks
      peerConnectionRef.current.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Handle ICE candidates
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal('ice-candidate', event.candidate);
        }
      };

      // If we're the caller, create and send offer
      if (callData.is_caller) {
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        sendSignal('offer', offer);
      }

      setCallStatus('ringing');
    } catch (error) {
      console.error('Failed to initialize call:', error);
      toast.error('Failed to access camera/microphone');
      onEnd?.();
    }
  };

  const handleSignal = async (signal) => {
    if (!peerConnectionRef.current) return;

    try {
      if (signal.signal_type === 'offer') {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal.data));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        sendSignal('answer', answer);
        setCallStatus('connected');
      } else if (signal.signal_type === 'answer') {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(signal.data));
        setCallStatus('connected');
      } else if (signal.signal_type === 'ice-candidate') {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(signal.data));
      }
    } catch (error) {
      console.error('Error handling signal:', error);
    }
  };

  const sendSignal = async (signalType, data) => {
    try {
      await axios.post(`${API}/calls/${callData.call_id}/signal`, {
        signal_type: signalType,
        data
      }, { headers, withCredentials: true });
    } catch (error) {
      console.error('Failed to send signal:', error);
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const endCall = async () => {
    try {
      await axios.post(`${API}/calls/${callData.call_id}/end`, {}, { headers, withCredentials: true });
    } catch (error) {
      console.error('Failed to end call:', error);
    }
    cleanup();
    onEnd?.();
  };

  const cleanup = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" data-testid="video-call">
      {/* Remote Video (Full screen) */}
      <div className="flex-1 relative">
        {callData.call_type === 'video' ? (
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-ember-dark to-card">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-4 ring-4 ring-primary">
                <img
                  src={callData.other_user?.photo || 'https://via.placeholder.com/128'}
                  alt={callData.other_user?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-2xl font-bold text-white">{callData.other_user?.name}</h2>
              <p className="text-muted-foreground mt-2">
                {callStatus === 'ringing' ? 'Ringing...' : 
                 callStatus === 'connecting' ? 'Connecting...' : 'Connected'}
              </p>
            </div>
          </div>
        )}

        {/* Local Video (Picture-in-picture) */}
        {callData.call_type === 'video' && (
          <div className="absolute top-4 right-4 w-32 h-44 rounded-2xl overflow-hidden shadow-lg border-2 border-white/20">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Call status indicator */}
        {callStatus !== 'connected' && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="animate-pulse text-white text-lg">
              {callStatus === 'ringing' ? 'Ringing...' : 'Connecting...'}
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="h-24 bg-black/80 backdrop-blur-xl flex items-center justify-center gap-6">
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
            isMuted ? 'bg-red-500' : 'bg-muted hover:bg-muted/80'
          }`}
          data-testid="mute-btn"
        >
          {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
        </button>

        {callData.call_type === 'video' && (
          <button
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isVideoOff ? 'bg-red-500' : 'bg-muted hover:bg-muted/80'
            }`}
            data-testid="video-toggle-btn"
          >
            {isVideoOff ? <VideoOff className="w-6 h-6 text-white" /> : <Video className="w-6 h-6 text-white" />}
          </button>
        )}

        <button
          onClick={endCall}
          className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
          data-testid="end-call-btn"
        >
          <PhoneOff className="w-6 h-6 text-white" />
        </button>
      </div>
    </div>
  );
};

export const IncomingCallModal = ({ callData, onAnswer, onReject }) => {
  return (
    <Dialog open={!!callData}>
      <DialogContent className="bg-card border-border max-w-sm text-center">
        <div className="py-6">
          <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 ring-4 ring-primary animate-pulse">
            <img
              src={callData?.caller?.photo || 'https://via.placeholder.com/96'}
              alt={callData?.caller?.name}
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="text-xl font-bold">{callData?.caller?.name}</h2>
          <p className="text-muted-foreground">
            Incoming {callData?.call_type === 'video' ? 'video' : 'voice'} call...
          </p>

          <div className="flex justify-center gap-6 mt-8">
            <button
              onClick={onReject}
              className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
              data-testid="reject-call-btn"
            >
              <PhoneOff className="w-7 h-7 text-white" />
            </button>
            <button
              onClick={onAnswer}
              className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
              data-testid="answer-call-btn"
            >
              {callData?.call_type === 'video' ? (
                <Video className="w-7 h-7 text-white" />
              ) : (
                <Phone className="w-7 h-7 text-white" />
              )}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoCall;
