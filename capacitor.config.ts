import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Configuração do Capacitor para gerar o APK Android do Vende Fácil Pro.
 *
 * Modo híbrido: o APK é uma "casca" nativa que carrega a versão publicada
 * do app (https://app-vendas-produtores-e-afiliados.lovable.app). Assim,
 * todas as atualizações que você fizer no Lovable aparecem no APK
 * automaticamente, sem precisar recompilar.
 */
const config: CapacitorConfig = {
  appId: "app.vendefacilpro",
  appName: "Vende Fácil Pro",
  webDir: ".output/public",
  server: {
    url: "https://app-vendas-produtores-e-afiliados.lovable.app",
    cleartext: false,
    androidScheme: "https",
  },
  android: {
    allowMixedContent: false,
    backgroundColor: "#0b0b12",
  },
};

export default config;
