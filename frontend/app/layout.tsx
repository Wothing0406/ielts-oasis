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

const safeJsonStringify = (obj: any) => 
  JSON.stringify(obj)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');


export const metadata: Metadata = {
  title: "IELTS Oasis - Your Zen Learning Space",
  description: "Ghé IELTS Oasis ủ một tách trà Matcha cực chill 🍵 Học từ vựng thông minh SRS, chấm Writing AI siêu tốc và luyện nghe đọc chủ động cùng bé mầm học tập nha!",
  keywords: [
    "luyện thi ielts",
    "ielts online",
    "chấm ielts writing ai",
    "học từ vựng ielts",
    "srs vocabulary",
    "ielts oasis",
    "luyện thi ielts miễn phí",
    "matcha lens",
    "writing sanctuary",
    "matcha radio"
  ],
  icons: {
    icon: "/logoweb.png",
  },
  openGraph: {
    title: "IELTS Oasis - Your Zen Learning Space",
    description: "Ghé IELTS Oasis ủ một tách trà Matcha cực chill 🍵 Học từ vựng thông minh SRS, chấm Writing AI siêu tốc và luyện nghe đọc chủ động cùng bé mầm học tập nha!",
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
    description: "Ghé IELTS Oasis ủ một tách trà Matcha cực chill 🍵 Học từ vựng thông minh SRS, chấm Writing AI siêu tốc và luyện nghe đọc chủ động cùng bé mầm học tập nha!",
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonStringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "IELTS Oasis",
              "operatingSystem": "All",
              "applicationCategory": "EducationalApplication",
              "description": "Ghé IELTS Oasis ủ một tách trà Matcha cực chill 🍵 Học từ vựng thông minh SRS, chấm Writing AI siêu tốc và luyện nghe đọc chủ động cùng bé mầm học tập nha!",
              "url": "https://ieltsoasis.site",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "VND"
              },
              "featureList": [
                "Matcha Lens: Quét ảnh học từ vựng với AI & YOLOv8",
                "Writing Sanctuary: Chấm essay IELTS AI chi tiết theo 4 tiêu chí",
                "Matcha Radio: Tạo bài luyện nghe từ video YouTube",
                "Matcha Book: Luyện đọc hiểu, dịch nhanh từ vựng",
                "Vocabulary Lab: Ôn tập từ vựng bằng phương pháp SRS",
                "Wordle Matcha Game: Trò chơi đoán từ vựng IELTS vui nhộn"
              ]
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: safeJsonStringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "url": "https://ieltsoasis.site",
              "name": "IELTS Oasis",
              "potentialAction": {
                "@type": "SearchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": "https://ieltsoasis.site/search?q={search_term_string}"
                },
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
      </head>
      <body className={`${lexend.variable} ${quicksand.variable} font-sans antialiased bg-[#FFFDF5] text-[#5D4037]`}>
        <MotionProvider>
          {children}
        </MotionProvider>
      </body>
    </html>
  );
}
