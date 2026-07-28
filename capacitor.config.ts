import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.vendafacilpro.app",
  appName: "Vende Fácil Pro",
  webDir: "public",
  server: {
    url: "https://vendefacillapp.com.br",
    cleartext: false,
    androidScheme: "https",
    allowNavigation: [
      "vendefacillapp.com.br",
      "*.vendefacillapp.com.br",
      "app-vendas-produtores-e-afiliados.lovable.app",
      "*.lovable.app",
      "*.supabase.co",
      "pay.hotmart.com",
      "*.hotmart.com",
    ],
  },
  android: {
    buildPath: "android",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: "#0F172A",
    },
  },
};

export default config;
