import type { Metadata } from "next";
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
  }
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
