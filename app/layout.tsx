import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0a0c0e",
};

export const metadata: Metadata = {
  title: "NDMU Systems Status",
  description: "Unofficial real-time uptime monitor for Notre Dame of Marbel University (NDMU) web systems — university website, school management system, SATP, and alumni portal.",
  keywords: ["NDMU", "Notre Dame Marbel", "uptime monitor", "system status", "ndmu.edu.ph", "sms.ndmu.edu.ph", "satp.ndmu.edu.ph"],
  authors: [{ name: "NDMU Systems Status" }],
  robots: { index: true, follow: true },
  openGraph: {
    title: "NDMU Systems Status",
    description: "Unofficial uptime monitor for NDMU web systems.",
    type: "website",
    locale: "en_PH",
    siteName: "NDMU Systems Status",
  },
  twitter: {
    card: "summary_large_image",
    title: "NDMU Systems Status",
    description: "Unofficial uptime monitor for NDMU web systems.",
  },
  icons: {
    icon: "/favicon.ico",
  },
  verification: {
    google: "16rXjwyBkAYfPRI89bm4PXafKYbai-naKjMI1txQUFs",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "NDMU Systems Status",
              "description": "Unofficial uptime monitor for Notre Dame of Marbel University web systems.",
              "url": "https://ndmu-status.vercel.app",
            }),
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}