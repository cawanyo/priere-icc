"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Trash2 } from "lucide-react";
import { AudioPlayer } from "./audio-player"; // Import du lecteur

interface AudioRecorderProps {
  onAudioCaptured: (audioBlob: Blob | null) => void;
}

export function AudioRecorder({ onAudioCaptured }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioURL(url);
        onAudioCaptured(blob);
        chunksRef.current = [];
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Erreur micro:", err);
      alert("Impossible d'accéder au micro.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const deleteRecording = () => {
    setAudioURL(null);
    onAudioCaptured(null);
  };

  return (
    <div className="flex flex-col gap-3">
      {!audioURL ? (
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors">
            <Button
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            variant={isRecording ? "destructive" : "default"}
            className={`rounded-full h-14 w-14 flex items-center justify-center shadow-lg transition-all ${isRecording ? "animate-pulse scale-110" : "bg-pink-600 hover:bg-pink-700 hover:scale-105"}`}
            >
            {isRecording ? <Square className="h-6 w-6 fill-current" /> : <Mic className="h-7 w-7" />}
            </Button>
            <p className="text-xs text-muted-foreground font-medium mt-3">
                {isRecording ? "Enregistrement en cours..." : "Appuyez pour enregistrer un audio"}
            </p>
        </div>
      ) : (
        <div className="space-y-2">
            {/* Lecteur Complet */}
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