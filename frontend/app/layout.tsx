import type { Metadata } from "next";
import { Lexend, Quicksand } from "next/font/google";
import "./globals.css";
import { MotionProvider } from "@/components/MotionProvider";

const lexend = Lexend({ 
  subsets: ["latin", "vietnamese"],
  variable: '--font-lexend',
  weight: ['300', '400', '500', '600', '700', '800', '900']
});

const quicksand = Quicksand({ 
  subsets: ["latin", "vietnamese"],
  variable: '--font-quicksand',
  weight: ['300', '400', '500', '600', '700']
});

export const metadata: Metadata = {
  title: "IELTS Oasis - Your Zen Learning Space",
  description: "Premium IELTS learning platform with Matcha Latte aesthetics.",
  icons: {
    icon: "/logoweb.png",
  },
  openGraph: {
    title: "IELTS Oasis - Your Zen Learning Space",
    description: "Premium IELTS learning platform with Matcha Latte aesthetics.",
    url: "https://ieltsoasis.site",
    siteName: "IELTS Oasis",
    images: [
      {
        url: "https://ieltsoasis.site/banner.png",
        width: 1200,
        height: 630,
        alt: "IELTS Oasis Banner",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "IELTS Oasis - Your Zen Learning Space",
    description: "Premium IELTS learning platform with Matcha Latte aesthetics.",
    images: ["https://ieltsoasis.site/banner.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light" style={{ colorScheme: 'light' }}>
      <head>
        <meta name="color-scheme" content="light" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
      </head>
      <body className={`${lexend.variable} ${quicksand.variable} font-sans antialiased bg-[#FFFDF5] text-[#5D4037]`}>
        <MotionProvider>
          {children}
        </MotionProvider>
      </body>
    </html>
  );
}
