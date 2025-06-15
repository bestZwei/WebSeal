import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "WebSeal - 专业的网页存证工具",
  description: "使用先进的盲水印技术为网页快照添加时间戳和自定义文字水印，确保网页内容的真实性和完整性，适用于法律存证、网页归档等场景。",
  keywords: ["网页存证", "盲水印", "网页快照", "法律存证", "网页归档", "数字水印"],
  authors: [{ name: "WebSeal Team" }],
  creator: "WebSeal Team",
  publisher: "WebSeal Team",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://webseal.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "WebSeal - 专业的网页存证工具",
    description: "使用先进的盲水印技术为网页快照添加时间戳和自定义文字水印",
    url: "https://webseal.vercel.app",
    siteName: "WebSeal",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "WebSeal - 专业的网页存证工具",
      },
    ],
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "WebSeal - 专业的网页存证工具",
    description: "使用先进的盲水印技术为网页快照添加时间戳和自定义文字水印",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#2563eb" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
