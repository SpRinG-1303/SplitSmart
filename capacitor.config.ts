import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.splitsmart.10f50a79637741b7979d900243abc22e',
  appName: 'Smart Expense Splitter',
  webDir: 'dist',
  server: {
    url: 'https://10f50a79-6377-41b7-979d-900243abc22e.splitsmart.com?forceHideBadge=true',
    cleartext: true,
  },
};

export default config;
