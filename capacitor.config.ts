import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "mn.buunduu.surtsgaay",
  appName: "Бөөндөө Сурцгаая",
  webDir: "mobile-www",
  server: {
    url: process.env.CAP_SERVER_URL || "https://surtsgaay.buunduu.mn",
    cleartext: false,
  },
  android: { allowMixedContent: false },
  ios: { contentInset: "automatic", scheme: "Surtsgaay" },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1200,
      backgroundColor: "#1FB85A",
    },
    StatusBar: { style: "DEFAULT" },
  },
};

export default config;
