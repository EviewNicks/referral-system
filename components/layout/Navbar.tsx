"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Navbar() {
  const pathname = usePathname();

  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Left Side: Logo */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo/logo.png"
              alt="Kartjis Logo"
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
              priority
            />
            <span className="font-extrabold text-lg tracking-wider text-black">
              KARTJIS.ID
            </span>
          </Link>
        </div>

        {/* Center: Search Bar */}
        <div className="hidden max-w-md flex-1 px-8 md:block">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 h-4 w-4 text-gray-400" />
            <Input
              type="search"
              placeholder="Cari event seru di sini..."
              className="w-full rounded-full pl-10 pr-4 bg-gray-50 border-[#E5E7EB] focus-visible:bg-white"
            />
          </div>
        </div>

        {/* Right Side: Nav Links */}
        <nav className="flex items-center gap-3">
          <Link
            href="/"
            className={`text-sm font-bold transition-colors hover:text-black ${
              pathname === "/" ? "text-[#2E4EEA]" : "text-gray-600"
            }`}
          >
            Beranda
          </Link>
          <Link href="/events">
            <Button variant="outline" shape="pill" size="sm">
              Jelajahi Event
            </Button>
          </Link>
          <Link href="/events?action=create">
            <Button variant="outline" shape="pill" size="sm" className="hidden sm:inline-flex">
              Buat Event
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="default" shape="pill" size="sm">
              Masuk
            </Button>
          </Link>
        </nav>

      </div>
    </header>
  );
}
