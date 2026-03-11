import type { Metadata, Viewport } from "next"; // Προσθήκη Viewport
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Ρυθμίσεις για να μην κάνει zoom ο χρήστης και να φαίνεται σαν Native App
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#000000",
};

export const metadata: Metadata = {
  title: "Nectar",
  description: "The Digital Sommelier",
  manifest: "/manifest.json", // Σύνδεση με το αρχείο που φτιάξαμε
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Nectar",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Apple icon για να φαίνεται ωραίο στο iPhone */}
        <link rel="apple-touch-icon" href="/favicon.ico" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black`}
      >
        {children}
      </body>
    </html>
  );
}