import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.vendafacilpro.app",
  appName: "Vende Fácil Pro",
  webDir: "public",
  server: {
    url: "https://app-vendas-produtores-e-afiliados.lovable.app",
    cleartext: false,
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
