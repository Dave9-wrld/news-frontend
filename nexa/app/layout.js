import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import { AudioProvider } from "@/lib/AudioContext";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: `${SITE_NAME} | Real-Time News & Intelligence`,
  description: "Real-time global news journal covering world headlines, technology, business markets, science, and verified international reporting.",
  openGraph: {
    title: `${SITE_NAME} | Real-Time News & Intelligence`,
    description: "Real-time global news journal covering world headlines, technology, business markets, and verified international reporting.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#f8faf9] text-[#112117] selection:bg-[#16834f]/20 selection:text-[#16834f]">
        <AudioProvider>{children}</AudioProvider>
      </body>
    </html>
  );
}
