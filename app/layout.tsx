import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { Header } from "@/components/Home/Header";
import Footer from "@/components/Home/Footer";
import { Suspense } from "react";
import { LoadingOverlay } from "@/components/LoadingOverlay";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "Ministère de la Prière ICC",
  description: "Rejoignez la communauté de prière.",
  // Ajoutez ceci :
  openGraph: {
    title: "Ministère de la Prière ICC",
    description: "Rejoignez la communauté de prière.",
    url: "",
    siteName: "ICC Prière",
    images: [
      {
        url: "icc.jpeg", // Chemin vers votre image dans public/
        width: 1200,
        height: 630,
        alt: "Aperçu du Ministère de la Prière",
      },
    ],
    locale: "fr_FR",
    type: "website",
  },
};


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // ADD THIS PROP: suppressHydrationWarning
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <Providers>
          <div className="min-h-screen w-full flex flex-col justify-between">
            <Suspense fallback={<LoadingOverlay />}>
              <Header />
            </Suspense>
            <main className=""> 
              {children}
            </main>
            <Footer/>
          </div>
        </Providers>
      </body>
    </html>
  );
}