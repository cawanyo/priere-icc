"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { motion } from "framer-motion";

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2, // Delay between each child element appearing
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 }, // Start slightly lower and invisible
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.5} 
  },
};

const imageVariants = {
  hidden: { opacity: 0, x: 50 }, // Slide in from right
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.8,  delay: 0.2 } 
  },
};

export default function Home() {
  return (
    <>
      <section className="grid md:grid-cols-2 gap-8 items-center max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 overflow-hidden">
        {/* Left content - Staggered Text */}
        <motion.div 
          className="text-center md:text-left"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 
            className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-indigo-900 leading-tight mb-4"
            variants={itemVariants}
          >
            Bienvenue sur la plateforme du <br className="hidden sm:inline" /> Ministère de la prière
          </motion.h1>
          
          <motion.p 
            className="text-gray-700 mb-6 text-sm sm:text-base md:text-lg"
            variants={itemVariants}
          >
            Rejoignez-nous dans un espace bienveillant où vous pourrez partager vos demandes de prière, consulter les prières de la communauté et
            recevoir des notifications en temps opportun. Encourageons-nous mutuellement dans la foi et l'espérance.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row sm:justify-center md:justify-start gap-4"
            variants={itemVariants}
          >
            <Link href="/prayer">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="text-xs sm:text-base bg-pink-500 text-white px-6 py-2 rounded-lg shadow hover:bg-pink-600 w-full sm:w-auto">
                  Soumettre un sujet
                </Button>
              </motion.div>
            </Link>
            
            <Link href="/presentation">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button className="text-xs sm:text-base bg-blue-100 text-blue-800 px-6 py-2 rounded-lg hover:bg-blue-200 w-full sm:w-auto">
                  Plus d'information
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </motion.div>

        {/* Right image/illustration - Floating Animation */}
        <motion.div 
          className="w-full flex justify-center"
          variants={imageVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.img
            src="/assets/images/illustration.png"
            alt="Illustration of prayer platform"
            className="max-w-xs sm:max-w-md w-full"
            // Continuous floating animation
            animate={{ y: [0, -15, 0] }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      </section>
    </>
  );
}