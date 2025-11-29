import { Heart } from 'lucide-react'
import React from 'react'

export default function ImageLeft() {
  return (
    <div className="hidden bg-muted lg:block relative h-full overflow-hidden">
          <img
          src="/assets/images/24h.jpg"
          alt="Hands praying over a Bible"
          className="h-full w-full object-cover transition-transform duration-[20s] hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex flex-col justify-end p-12 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-6 h-6 text-primary fill-primary" />
            <span className="text-lg font-serif font-bold">Ministère de la Prière</span> 
          </div>
          <blockquote className="space-y-2">
            <p className="text-lg font-medium leading-relaxed">
              &ldquo;Ne vous inquiétez de rien; mais en toute chose faites connaître vos besoins à Dieu par des prières et des supplications, avec des actions de grâces.&rdquo;
            </p>
            <footer className="text-sm opacity-80">
              Philippiens 4:6
            </footer>
          </blockquote>
        </div>
      </div>
  )
}
