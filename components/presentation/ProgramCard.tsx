// components/Home/ProgramCard.tsx
"use client";

import Image from 'next/image';
import React from 'react';
import { motion } from 'framer-motion';

interface ProgramCardProps {
    image: string;
    alt: string;
    title?: string; // Ajout du titre dynamique
    content: string;
}

export default function ProgramCard({ image, alt, title, content }: ProgramCardProps) {
  return (
    <motion.div
        whileHover={{ y: -10 }} // Petit effet de levitation au survol
        className="relative rounded-2xl overflow-hidden shadow-xl group h-96 w-full cursor-pointer"
    >
        <Image
            src={image}
            alt={alt}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {/* Gradient pour lisibilité du texte */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />
        
        <div className="absolute bottom-0 p-6 text-white w-full transform transition-transform duration-300">
            <h3 className="text-2xl font-serif font-bold mb-3 text-primary-foreground">{title}</h3>
            <p className="text-sm text-gray-200 line-clamp-3 leading-relaxed">
                {content}
            </p>
        </div>
    </motion.div>
  );
}