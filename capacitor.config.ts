import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jamapantel.photomentor',
  appName: 'PhotoMentor',
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
  // Android-specific configuration
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true
  },
  // Add iOS-specific configuration
  ios: {
    scheme: 'Photo Mentor',
    webContentsDebuggingEnabled: true,
    allowsLinkPreview: false
  }
};

export default config;