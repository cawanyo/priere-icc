"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Image as ImageIcon, X, UploadCloud } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface ImageUploaderProps {
  files: File[]; // Props reçues du parent
  onChange: (files: File[]) => void; // Fonction pour remonter les changements
}

export function ImageUploader({ files, onChange }: ImageUploaderProps) {
  const [previews, setPreviews] = useState<{file: File, url: string}[]>([]);

  // Générer les URLs de prévisualisation quand les fichiers changent
  useEffect(() => {
    const newPreviews = files.map(file => ({
        file,
        url: URL.createObjectURL(file)
    }));
    setPreviews(newPreviews);

    // Cleanup function
    return () => {
        newPreviews.forEach(p => URL.revokeObjectURL(p.url));
    };
  }, [files]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Ajouter les nouveaux fichiers aux anciens
    onChange([...files, ...acceptedFiles]);
  }, [files, onChange]);

  const removeFile = (indexToRemove: number) => {
    const newFiles = files.filter((_, index) => index !== indexToRemove);
    onChange(newFiles);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: { 'image/*': [] },
    multiple: true
  });

  return (
    <div className="space-y-4">
      {/* Zone de Drop */}
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200
            ${isDragActive ? "border-indigo-500 bg-indigo-50/50 scale-[0.99]" : "border-gray-200 hover:border-indigo-300 hover:bg-gray-50"}`}
      >
        <input {...getInputProps()} />
        <div className={`p-3 rounded-full shadow-sm transition-colors ${isDragActive ? "bg-white text-indigo-600" : "bg-gray-100 text-gray-500"}`}>
            {isDragActive ? <UploadCloud className="h-6 w-6" /> : <ImageIcon className="h-6 w-6" />}
        </div>
        <div className="text-center space-y-1">
            <p className="text-sm font-medium text-gray-700">
                {isDragActive ? "Lâchez pour ajouter" : "Cliquez ou glissez des photos"}
            </p>
            <p className="text-xs text-muted-foreground">PNG, JPG (Max 5MB)</p>
        </div>
      </div>

      {/* Grille de Prévisualisation */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
            {previews.map((preview, idx) => (
                <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 group bg-white shadow-sm">
                    <Image src={preview.url} alt="Preview" fill className="object-cover" />
                    
                    {/* Overlay et Bouton Supprimer */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-start justify-end p-1">
                        <Button
                            type="button"
                            size="icon"
                            variant="destructive"
                            className="h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm scale-90 group-hover:scale-100"
                            onClick={() => removeFile(idx)}
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>
      )}
    </div>
  );
}