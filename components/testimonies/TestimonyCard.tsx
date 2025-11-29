"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Play, Pause, Quote, Maximize2 } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

interface TestimonyImage {
  id: string;
  url: string;
}

interface TestimonyProps {
  testimony: {
    id: string;
    name: string;
    content: string | null;
    audioUrl: string | null;
    status: string;
    createdAt: Date;
    user?: { image: string | null } | null;
    images: TestimonyImage[];
  };
  showStatus?: boolean;
}

export function TestimonyCard({ testimony, showStatus = false }: TestimonyProps) {
  // États Audio
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  console.log(testimony.images)

  // --- Gestion Audio ---

  const toggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
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
    const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
    const newRate = rates[nextIndex];
    setPlaybackRate(newRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // --- Gestion Images ---

  const renderImages = () => {
    const images = testimony.images;
    if (!images || images.length === 0) return null;

    const count = images.length;

    const ImageItem = ({ src, className, isOverlay = false, moreCount = 0 }: any) => (
      <Dialog>
        <DialogTrigger asChild>
          <div className={`relative cursor-pointer overflow-hidden ${className}`}>
            <Image 
                src={src} 
                alt="Témoignage" 
                fill 
                className="object-cover hover:scale-105 transition-transform duration-500" 
            />
            {isOverlay && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-bold text-xl backdrop-blur-sm">
                    +{moreCount}
                </div>
            )}
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/90 border-none">
            <div className="relative h-[80vh] w-full">
                <Image src={src} alt="Full view" fill className="object-contain" />
            </div>
        </DialogContent>
      </Dialog>
    );

    if (count === 1) {
      return (
        <div className="h-64 w-full rounded-xl overflow-hidden mt-3">
            <ImageItem src={images[0].url} className="h-full w-full" />
        </div>
      );
    }

    if (count === 2) {
      return (
        <div className="grid grid-cols-2 gap-2 mt-3 h-48">
            <ImageItem src={images[0].url} className="rounded-l-xl h-full w-full" />
            <ImageItem src={images[1].url} className="rounded-r-xl h-full w-full" />
        </div>
      );
    }

    if (count >= 3) {
      return (
        <div className="grid grid-cols-2 gap-2 mt-3 h-48">
            <ImageItem src={images[0].url} className="rounded-l-xl h-full w-full" />
            <div className="grid grid-rows-2 gap-2 h-full">
                <ImageItem src={images[1].url} className="rounded-tr-xl h-full w-full" />
                <ImageItem 
                    src={images[2].url} 
                    className="rounded-br-xl h-full w-full" 
                    isOverlay={count > 3} 
                    moreCount={count - 3} 
                />
            </div>
        </div>
      );
    }
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-all duration-300 border-gray-100 overflow-hidden group">
      
      <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0 p-5">
        <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border bg-white ring-2 ring-pink-50">
                <AvatarImage src={testimony.user?.image || ""} />
                <AvatarFallback className="bg-gradient-to-br from-pink-500 to-rose-600 text-white font-bold text-xs">
                    {testimony.name.slice(0, 2).toUpperCase()}
                </AvatarFallback>
            </Avatar>
            <div>
                <p className="font-bold text-gray-900 leading-none">{testimony.name}</p>
                <p className="text-xs text-muted-foreground mt-1 font-medium">
                    {format(new Date(testimony.createdAt), "d MMMM yyyy", { locale: fr })}
                </p>
            </div>
        </div>
        {showStatus && (
            <Badge 
                variant={testimony.status === "APPROVED" ? "default" : "secondary"} 
                className={testimony.status === "APPROVED" ? "bg-green-600 hover:bg-green-700" : "bg-gray-100 text-gray-600"}
            >
                {testimony.status === "APPROVED" ? "Publié" : "En attente"}
            </Badge>
        )}
      </CardHeader>

      <CardContent className="flex-1 p-5 pt-0 space-y-4">
        
        {/* Contenu Texte */}
        {testimony.content && (
            <div className="relative pl-6">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-pink-200 to-transparent rounded-full" />
                <Quote className="h-4 w-4 text-pink-300 absolute -top-1 left-0 -ml-5 rotate-180" />
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {testimony.content}
                </p>
            </div>
        )}

        {/* Galerie Images */}
        {renderImages()}

        {/* Lecteur Audio Avancé */}
        {testimony.audioUrl && (
            <div className="mt-4 bg-indigo-50/80 backdrop-blur-sm p-3 rounded-xl border border-indigo-100 shadow-sm transition-all hover:bg-indigo-100/50 flex flex-col gap-2">
                
                <div className="flex items-center gap-3">
                    {/* Bouton Play/Pause */}
                    <Button 
                        size="icon" 
                        className="h-10 w-10 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-transform active:scale-95 shrink-0"
                        onClick={toggleAudio}
                    >
                        {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
                    </Button>
                    
                    {/* Infos et Barre de progression */}
                    <div className="flex-1 flex flex-col justify-center gap-1.5">
                        <div className="flex justify-between items-center text-[10px] font-bold text-indigo-400 uppercase tracking-wider px-1">
                            <span>Audio</span>
                            <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
                        </div>
                        
                        {/* Input Range customisé avec Tailwind */}
                        <div className="relative w-full h-2 flex items-center">
                            <input
                                type="range"
                                min={0}
                                max={duration || 100}
                                value={currentTime}
                                onChange={handleSeek}
                                className="absolute w-full h-1.5 bg-indigo-200 rounded-full appearance-none cursor-pointer z-20 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
                            />
                            {/* Barre visuelle personnalisée */}
                            <div className="absolute w-full h-1.5 bg-indigo-200 rounded-full overflow-hidden pointer-events-none z-10">
                                <div 
                                    className="h-full bg-indigo-600 rounded-full transition-all duration-100 ease-linear"
                                    style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Bouton Vitesse */}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={changePlaybackRate}
                        className="h-8 px-2 text-[10px] font-bold text-indigo-600 bg-indigo-100/50 hover:bg-indigo-200 min-w-[2.5rem] rounded-md"
                        title="Vitesse de lecture"
                    >
                        {playbackRate}x
                    </Button>
                </div>
                
                <audio 
                    ref={audioRef} 
                    src={testimony.audioUrl} 
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={() => setIsPlaying(false)} 
                    className="hidden" 
                />
            </div>
        )}
      </CardContent>
    </Card>
  );
}