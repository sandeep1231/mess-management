import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.messmanagement',
  appName: 'Mess Management',
  webDir: 'dist/client/browser',
  server: {
    androidScheme: 'https'
  }
};

export default config;
