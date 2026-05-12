import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { NotificationProvider } from "@/components/providers/notification-provider";
import { SystemPreferencesProvider } from "@/components/providers/system-preferences-provider";
import { CustomThemeProvider } from "@/components/providers/theme-provider-custom";
import { ThemeScript } from "@/components/providers/theme-script";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import "./globals.css";

export const metadata: Metadata = {
  title: "InfraOS",
  description: "Controle interno de O.S. de infra",
  manifest: "/manifest.webmanifest",
  themeColor: "#0f172a",
  appleWebApp: {
    capable: true,
    title: "InfraOS",
    statusBarStyle: "black-translucent"
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-title": "InfraOS",
    "apple-mobile-web-app-status-bar-style": "black-translucent"
  }
};


export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0f172a"
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ThemeScript />
        <ErrorBoundary>
          <CustomThemeProvider defaultTheme="default">
            <SystemPreferencesProvider>
              <NotificationProvider>{children}</NotificationProvider>
            </SystemPreferencesProvider>
          </CustomThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
