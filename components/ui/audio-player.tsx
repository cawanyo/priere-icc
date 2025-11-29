"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

interface AudioPlayerProps {
  src: string;
  className?: string;
}

export function AudioPlayer({ src, className }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const changePlaybackRate = () => {
    const rates = [1, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) audioRef.current.playbackRate = nextRate;
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div className={`bg-indigo-50/80 backdrop-blur-sm p-3 rounded-xl border border-indigo-100 shadow-sm flex flex-col gap-2 ${className}`}>
      <div className="flex items-center gap-3">
        <Button 
          type="button" // Important pour ne pas submit le formulaire
          size="icon" 
          className="h-10 w-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shrink-0"
          onClick={toggleAudio}
        >
          {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
        </Button>
        
        <div className="flex-1 flex flex-col justify-center gap-1.5">
          <div className="flex justify-between items-center text-[10px] font-bold text-indigo-400 uppercase tracking-wider px-1">
            <span>Audio</span>
            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>
          
          <div className="relative w-full h-2 flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="absolute w-full h-1.5 bg-indigo-200 rounded-full appearance-none cursor-pointer z-20 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
            />
            <div className="absolute w-full h-1.5 bg-indigo-200 rounded-full overflow-hidden pointer-events-none z-10">
              <div 
                className="h-full bg-indigo-600 rounded-full transition-all duration-100 ease-linear"
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={changePlaybackRate}
          className="h-8 px-2 text-[10px] font-bold text-indigo-600 bg-indigo-100/50 hover:bg-indigo-200 min-w-[2.5rem] rounded-md"
        >
          {playbackRate}x
        </Button>
      </div>
      
      <audio 
        ref={audioRef} 
        src={src} 
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)} 
        className="hidden" 
      />
    </div>
  );
}