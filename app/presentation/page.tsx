'use client'
import Image from "next/image";
import { motion } from "framer-motion";
import ProgramCard from "@/components/presentation/ProgramCard";
export default function Home() {
  
  // Données des programmes (basées sur vos images)
  const programs = [
    {
        title: "Intercession",
        content: "Rejoignez l'armée des intercesseurs pour porter les fardeaux de l'église et des nations dans la prière.",
        image: "/assets/images/intercession.jpg",
    },
    {
        title: "24h non ztop",
        content: "Un temps intense de prière ininterrompue pour briser les chaînes et proclamer la victoire.",
        image: "/assets/images/24h.jpg",
    },
    {
        title: "21 Jours ",
        content: "Jeune et prière.",
        image: "/assets/images/travail.jpg",
    },

  ];

  return (
    <>
      {/* SECTION HERO */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        {/* Image de fond avec un zoom lent et continu (effet Ken Burns) */}
        <motion.div
          className="absolute inset-0 w-full h-full"
          initial={{ scale: 1 }}
          animate={{ scale: 1.1 }}
          transition={{ 
            duration: 20, 
            repeat: Infinity, 
            repeatType: "reverse", 
            ease: "linear" 
          }}
        >
          <Image
            src="/assets/images/bg.jpg"
            alt="Groupe de prière"
            fill
            className="object-cover"
            priority // Charge l'image en priorité pour éviter le clignotement
          />
        </motion.div>

        {/* Overlay dégradé pour la lisibilité */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Texte par-dessus l'image */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto text-white">
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-6xl font-serif font-bold mb-4 drop-shadow-lg"
          >
            Une Église en Prière
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-lg md:text-xl italic font-light text-gray-100"
          >
            "La prière est la respiration de l'âme."
          </motion.p>
        </div>
      </section>

      {/* NOUVELLE SECTION : PROGRAMMES */}
      <section className="bg-gray-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
                <motion.h2 
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-3xl md:text-4xl font-serif font-bold text-indigo-900 mb-4"
                >
                    Nos Programmes de Prière
                </motion.h2>
                <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="h-1 w-20 bg-pink-500 mx-auto rounded-full" 
                />
                <motion.p 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 }}
                    className="text-gray-600 mt-6 max-w-2xl mx-auto"
                >
                    Découvrez les différents temps de mobilisation spirituelle conçus pour chaque aspect de votre vie et de celle de l'église.
                </motion.p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {programs.map((prog, index) => (
                    <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <ProgramCard 
                            image={prog.image}
                            alt={prog.title}
                            title={prog.title}
                            content={prog.content}
                        />
                    </motion.div>
                ))}
            </div>
        </div>
      </section>
    </>
  );
}