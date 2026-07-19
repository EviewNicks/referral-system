import type { Metadata } from "next";
import { Epilogue } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const epilogue = Epilogue({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-epilogue",
});

export const metadata: Metadata = {
  title: "Kartjis - Your all in one ticketing solution",
  description: "Platform tiket online untuk semua jenis event di Indonesia. Beli tiket sat-set, tanpa ribet.",
  keywords: "Kartjis, tiket konser, event Indonesia, festival musik, seminar",
  openGraph: {
    title: "Kartjis - Your all in one ticketing solution",
    description: "Platform tiket online terpercaya untuk event Indonesia",
    url: "https://kartjis.id",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${epilogue.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-sans bg-white text-black">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
