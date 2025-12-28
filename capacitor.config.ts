import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.priere.app',
  appName: 'prayer-icc',
  webDir: 'public',

  server: {
    // REPLACE THIS with your actual live URL (e.g., https://priere-icc.vercel.app)
    url: 'https://priere-icc.vercel.app', 
    cleartext: true,
    // Helps with Android debugging
    androidScheme: 'https' 
  }
};

export default config;
