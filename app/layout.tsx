import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import { Header } from "@/components/Home/Header";
import Footer from "@/components/Home/Footer";
import { Suspense } from "react";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { PwaManager } from "@/components/pwa/PwaManager";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#312e81",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Ministère de la Prière ICC",
  description: "Rejoignez la communauté de prière.",
  manifest: "/manifest.webmanifest",
  applicationName: "Prière ICC",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Prière ICC",
    startupImage: ["/icons/icon-512x512.png"],
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/icons/icon-192x192.png",
  },
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
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.webmanifest" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Prière ICC" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <Providers>
          <div className="min-h-screen min-h-[100dvh] w-full flex flex-col bg-white">
            <Suspense fallback={<LoadingOverlay />}>
              <Header />
            </Suspense>
            {/* Espaceur fixe pour compenser le Header fixe et éviter tout saut au scroll */}
            <div className="h-14 sm:h-16 w-full shrink-0 safe-padding-top" aria-hidden="true" />
            <main className="flex-1 w-full"> 
              {children}
            </main>
            <Footer/>
          </div>
          <PwaManager />
        </Providers>
      </body>
    </html>
  );
}