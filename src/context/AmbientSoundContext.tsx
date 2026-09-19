"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";

export type SoundType = "none" | "rain" | "fire";

interface AmbientSoundContextType {
  activeSound: SoundType;
  volume: number;
  handleToggleSound: (type: SoundType) => void;
  setVolume: (volume: number) => void;
  stopCurrentSound: () => void;
}

const AmbientSoundContext = createContext<AmbientSoundContextType | undefined>(undefined);

export function AmbientSoundProvider({ children }: { children: React.ReactNode }) {
  const [activeSound, setActiveSound] = useState<SoundType>("none");
  const [volume, setVolume] = useState<number>(0.35);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const sourceNodeRef = useRef<AudioNode | null>(null);
  const filterNodeRef = useRef<BiquadFilterNode | null>(null);

  // Initialize or resume AudioContext
  const getAudioContext = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      audioCtxRef.current = new AudioCtx();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const stopCurrentSound = () => {
    if (sourceNodeRef.current) {
      try {
        (sourceNodeRef.current as any).stop?.();
        sourceNodeRef.current.disconnect();
      } catch {}
      sourceNodeRef.current = null;
    }
  };

  const playRain = () => {
    const ctx = getAudioContext();
    stopCurrentSound();

    // Create brown noise for realistic rainfall
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02; // Brown noise
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    // Filter to simulate soft raindrops
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(800, ctx.currentTime);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);

    whiteNoise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    whiteNoise.start();
    sourceNodeRef.current = whiteNoise;
    gainNodeRef.current = gainNode;
    filterNodeRef.current = filter;
  };

  const playFire = () => {
    const ctx = getAudioContext();
    stopCurrentSound();

    // Low rumble + crackle noise
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      const crackle = Math.random() > 0.995 ? (Math.random() * 2 - 1) * 2 : 0;
      output[i] = (Math.random() * 2 - 1) * 0.15 + crackle;
    }

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(500, ctx.currentTime);
    filter.Q.setValueAtTime(1.2, ctx.currentTime);

    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(volume * 1.3, ctx.currentTime);

    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    noise.start();
    sourceNodeRef.current = noise;
    gainNodeRef.current = gainNode;
    filterNodeRef.current = filter;
  };

  const handleToggleSound = (type: SoundType) => {
    if (activeSound === type) {
      stopCurrentSound();
      setActiveSound("none");
    } else {
      setActiveSound(type);
      if (type === "rain") playRain();
      if (type === "fire") playFire();
    }
  };

  // Adjust volume on the fly
  useEffect(() => {
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(volume, audioCtxRef.current.currentTime);
    }
  }, [volume]);

  // Clean up on provider unmount
  useEffect(() => {
    return () => {
      stopCurrentSound();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  return (
    <AmbientSoundContext.Provider
      value={{
        activeSound,
        volume,
        handleToggleSound,
        setVolume,
        stopCurrentSound,
      }}
    >
      {children}
    </AmbientSoundContext.Provider>
  );
}

export function useAmbientSound() {
  const context = useContext(AmbientSoundContext);
  if (!context) {
    throw new Error("useAmbientSound must be used within an AmbientSoundProvider");
  }
  return context;
}
