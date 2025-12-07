import { useEffect, useRef, useState } from 'react';

export function useAudio(audioSrc, options = {}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(options.volume || 0.3);

  useEffect(() => {
    if (!audioSrc) return;

    const audio = new Audio(audioSrc);
    audio.loop = options.loop || false;
    audio.volume = volume;
    audioRef.current = audio;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [audioSrc, options.loop]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const play = () => {
    if (audioRef.current && !isPlaying) {
      audioRef.current.play().catch(error => {
        console.log("Audio autoplay prevented:", error.message);
      });
      setIsPlaying(true);
    }
  };

  const pause = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return { play, pause, stop, setVolume, isPlaying };
}

export function useAudioManager() {
  const [musicVolume, setMusicVolume] = useState(() => {
    const saved = localStorage.getItem('musicVolume');
    return saved ? parseFloat(saved) : 0.3;
  });

  const [sfxVolume, setSfxVolume] = useState(() => {
    const saved = localStorage.getItem('sfxVolume');
    return saved ? parseFloat(saved) : 0.4;
  });

  const updateMusicVolume = (value) => {
    setMusicVolume(value);
    localStorage.setItem('musicVolume', value.toString());
  };

  const updateSfxVolume = (value) => {
    setSfxVolume(value);
    localStorage.setItem('sfxVolume', value.toString());
  };

  return {
    musicVolume,
    sfxVolume,
    setMusicVolume: updateMusicVolume,
    setSfxVolume: updateSfxVolume,
  };
}