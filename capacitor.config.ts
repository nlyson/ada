import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jamapantel.photomentor',
  appName: 'Photo Mentor',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    allowNavigation: ['*'],
    cleartext: true
  },
  plugins: {
    CapacitorHttp: {
      enabled: true
    }
  },
  // Add this for Android-specific handling
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  }
};

export default config;