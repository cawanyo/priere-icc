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
  title: "Ministère de la prière",
  description: "ICC Toulouse - Plateforme de sujets de prière et témoignages.",
  icons: {
    icon: '/image.png', // Path to your favicon in /public
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