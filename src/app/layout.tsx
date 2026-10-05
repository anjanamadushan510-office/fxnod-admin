import type { Metadata, Viewport } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import { headers } from "next/headers";
import "./globals.css";
import { Providers } from "./providers";
import { AdminGuard } from "@/components/auth/AdminGuard";

const manrope = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FXNOD — Admin",
  description: "FXNod admin console",
  // The console is not a public site.
  robots: { index: false, follow: false },
};

// viewport-fit=cover makes env(safe-area-inset-*) non-zero on notched phones.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a1535",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Reading the per-request CSP nonce (middleware.ts) is what makes every
  // route render per request, which Next needs in order to stamp the nonce on
  // its own scripts. Do not remove it without replacing the CSP.
  headers().get("x-nonce");

  return (
    <html lang="en" className={`${manrope.variable} ${jetbrainsMono.variable}`}>
      <body>
        <Providers>
          <AdminGuard>{children}</AdminGuard>
        </Providers>
      </body>
    </html>
  );
}
