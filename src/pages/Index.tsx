
import React, { useState, useEffect, useRef } from 'react';
import VoiceVisualizer from '@/components/VoiceVisualizer';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const Index = (): JSX.Element => {
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [state, setState] = useState<'disconnected' | 'connecting' | 'initializing' | 'listening' | 'thinking' | 'speaking'>('disconnected');
  const [micPermission, setMicPermission] = useState<boolean>(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  
  const requestMicrophoneAccess = async (): Promise<void> => {
    try {
      setState('connecting');
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      
      setState('initializing');
      
      // Create AudioContext
      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      
      // Create analyser
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;
      
      // Connect microphone to analyser
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      setMicPermission(true);
      setState('listening');
      
      toast({
        title: "Microphone connected",
        description: "Your voice will now animate the visualizer",
      });
      
      // Start audio analysis
      analyseAudio();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setState('disconnected');
      toast({
        variant: "destructive",
        title: "Microphone access denied",
        description: "Please allow microphone access to use the voice visualizer",
      });
    }
  };
  
  const analyseAudio = (): void => {
    if (!analyserRef.current) return;
    
    const analyser = analyserRef.current;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    
    const updateAudioLevel = (): void => {
      analyser.getByteFrequencyData(dataArray);
      
      // Calculate average volume level
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      
      const average = sum / dataArray.length;
      
      // Normalize to range between -1 and 1 for the visualizer
      const normalizedLevel = (average / 128) - 1;
      
      // Set the audio level for visualization
      setAudioLevel(normalizedLevel);
      
      // Simple voice activity detection
      if (average > 40) {
        setState('speaking');
      } else if (average > 10) {
        setState('listening');
      } else {
        // Only reset to listening if we were speaking
        if (state === 'speaking') {
          setState('listening');
        }
      }
      
      // Continue updating
      requestAnimationFrame(updateAudioLevel);
    };
    
    updateAudioLevel();
  };
  
  const stopMicrophone = (): void => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      mediaStreamRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    analyserRef.current = null;
    setMicPermission(false);
    setState('disconnected');
    setAudioLevel(0);
    
    toast({
      title: "Microphone disconnected",
      description: "Voice visualization stopped",
    });
  };
  
  // Cleanup on unmount
  useEffect(() => {
    return (): void => {
      stopMicrophone();
    };
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white">
      <h1 className="text-4xl font-bold mb-8">Assistant Vocal</h1>
      
      <div className="mb-8">
        <VoiceVisualizer 
          size={400} 
          state={state} 
          audioLevel={audioLevel} 
        />
      </div>
      
      <div className="flex gap-4 mb-6">
        {!micPermission ? (
          <Button 
            onClick={requestMicrophoneAccess}
            size="lg"
          >
            Activer le microphone
          </Button>
        ) : (
          <Button 
            onClick={stopMicrophone}
            variant="destructive"
            size="lg"
          >
            Désactiver le microphone
          </Button>
        )}
      </div>
      
      <div className="text-xl">
        État actuel: <span className="font-semibold">{state}</span>
      </div>
    </div>
  );
};

export default Index;
