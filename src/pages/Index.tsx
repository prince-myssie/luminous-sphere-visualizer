
import React, { useState, useEffect } from 'react';
import VoiceVisualizer from '@/components/VoiceVisualizer';

const Index = (): JSX.Element => {
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [state, setState] = useState<'disconnected' | 'connecting' | 'initializing' | 'listening' | 'thinking' | 'speaking'>('disconnected');
  
  // Simuler les changements d'état pour la démo
  useEffect(() => {
    const states: Array<'disconnected' | 'connecting' | 'initializing' | 'listening' | 'thinking' | 'speaking'> = [
      'disconnected', 'connecting', 'initializing', 'listening', 'thinking', 'speaking'
    ];
    
    let currentIndex = 0;
    
    const stateInterval = setInterval(() => {
      currentIndex = (currentIndex + 1) % states.length;
      setState(states[currentIndex]);
    }, 3000);
    
    // Simuler les changements de niveau audio
    const audioInterval = setInterval(() => {
      // Valeur entre -1 et 1
      const newLevel = Math.sin(Date.now() / 1000) * 0.5 + Math.random() * 0.5;
      setAudioLevel(newLevel);
    }, 100);
    
    return (): void => {
      clearInterval(stateInterval);
      clearInterval(audioInterval);
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
      
      <div className="text-xl">
        État actuel: <span className="font-semibold">{state}</span>
      </div>
    </div>
  );
};

export default Index;
