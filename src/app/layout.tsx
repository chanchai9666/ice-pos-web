import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { AuthProvider } from "@/context/AuthContext";
import { LoadingOverlayProvider } from "@/context/LoadingOverlayContext";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { PwaNotificationBar } from "@/components/ui/PwaNotificationBar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

export const metadata: Metadata = {
  title: "ICE POS - ระบบขายหน้าร้านและจัดการคลังสินค้า",
  description: "ระบบจัดการขายหน้าร้าน (Point of Sale) และคลังสินค้า ICE POS",
  applicationName: "ICE POS",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ICE POS",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="th"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('ice_pos_theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);if(d){document.documentElement.classList.add('dark')}else{document.documentElement.classList.remove('dark')}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <ThemeProvider>
          <AuthProvider>
            <LoadingOverlayProvider>
              <PwaNotificationBar />
              {children}
              <LoadingOverlay />
            </LoadingOverlayProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
