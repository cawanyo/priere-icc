"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Trash2, Pause, Play } from "lucide-react";
import { AudioPlayer } from "./audio-player";

interface AudioRecorderProps {
  onAudioCaptured: (audioBlob: Blob | null) => void;
}

export function AudioRecorder({ onAudioCaptured }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false); // Nouvel état
  const [audioURL, setAudioURL] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const mimeTypeRef = useRef<string>("audio/webm"); 

  const getSupportedMimeType = () => {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/mp4",
      "audio/ogg",
      "audio/wav",
      "audio/aac",
    ];
    for (const type of types) {
      if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    return "audio/webm";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getSupportedMimeType();
      mimeTypeRef.current = mimeType;

      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType });
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeTypeRef.current });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        onAudioCaptured(blob);
        chunksRef.current = [];
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setIsPaused(false);
    } catch (err) {
      console.error("Erreur micro:", err);
      alert("Impossible d'accéder au micro.");
    }
  };

  // Nouvelle fonction pour gérer la Pause/Reprise
  const togglePause = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        setIsPaused(false);
      } else {
        mediaRecorderRef.current.pause();
        setIsPaused(true);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const deleteRecording = () => {
    if (audioURL) URL.revokeObjectURL(audioURL);
    setAudioURL(null);
    onAudioCaptured(null);
  };

  return (
    <div className="flex flex-col gap-3">
      {!audioURL ? (
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors touch-manipulation">
            
            {!isRecording ? (
                // --- Mode Initial : Bouton Enregistrer ---
                <Button
                    type="button"
                    onClick={startRecording}
                    className="rounded-full h-14 w-14 flex items-center justify-center shadow-lg bg-pink-600 hover:bg-pink-700 hover:scale-105 transition-all"
                >
                    <Mic className="h-7 w-7" />
                </Button>
            ) : (
                // --- Mode Enregistrement : Boutons Pause & Stop ---
                <div className="flex items-center gap-6">
                    {/* Bouton Pause / Reprendre */}
                    <Button
                        type="button"
                        onClick={togglePause}
                        variant="outline"
                        className="rounded-full h-12 w-12 border-2 border-indigo-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300"
                        title={isPaused ? "Reprendre" : "Pause"}
                    >
                        {isPaused ? <Play className="h-5 w-5 fill-current" /> : <Pause className="h-5 w-5 fill-current" />}
                    </Button>

                    {/* Bouton Stop (Terminer) */}
                    <Button
                        type="button"
                        onClick={stopRecording}
                        variant="destructive"
                        className="rounded-full h-16 w-16 shadow-xl animate-in zoom-in duration-300 flex items-center justify-center bg-red-600 hover:bg-red-700"
                        title="Terminer l'enregistrement"
                    >
                        <Square className="h-6 w-6 fill-current" />
                    </Button>
                </div>
            )}

            <div className="text-xs text-muted-foreground font-medium mt-4 flex items-center gap-2">
                {isRecording ? (
                    isPaused ? (
                        <span className="text-indigo-600 font-bold animate-pulse">Enregistrement en pause</span>
                    ) : (
                        <span className="text-red-500 font-bold flex items-center gap-1.5">
                            <span className="relative flex h-2.5 w-2.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                            </span>
                            Enregistrement en cours...
                        </span>
                    )
                ) : (
                    "Appuyez pour enregistrer un audio"
                )}
            </div>
        </div>
      ) : (
        <div className="space-y-2">
            <AudioPlayer src={audioURL} />
            <div className="flex justify-end">
                <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={deleteRecording} 
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 text-xs h-8"
                >
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Supprimer et recommencer
                </Button>
            </div>
        </div>
      )}
    </div>
  );
}