import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.doorguard.app',
  appName: 'DoorGuard',
  webDir: 'dist',
  server: {
    url: 'https://doorguard.vercel.app',
    cleartext: true
  }
};

export default config;