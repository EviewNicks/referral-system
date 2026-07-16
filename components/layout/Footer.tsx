import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full bg-[#0B0A0F] text-gray-400 py-12 border-t border-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Column 1: Brand Info */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/logo/logo.png"
                alt="Kartjis Logo"
                width={28}
                height={28}
                className="h-7 w-7 object-contain brightness-100"
              />
              <span className="font-extrabold text-lg tracking-wider text-white">
                KARTJIS.ID
              </span>
            </Link>
            <p className="text-sm max-w-sm leading-relaxed text-gray-500">
              Kartjis adalah platform e-ticketing all-in-one terpercaya di Indonesia. Beli tiket konser, festival musik, pameran seni, hingga event religi secara instan, aman, dan sat-set.
            </p>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-white font-bold text-sm tracking-wide uppercase">Navigasi</h4>
            <ul className="flex flex-col gap-2 text-sm">
              <li>
                <Link href="/" className="hover:text-white transition-colors">Beranda</Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-white transition-colors">Jelajahi Event</Link>
              </li>
              <li>
                <Link href="/events?category=music" className="hover:text-white transition-colors">Konser Musik</Link>
              </li>
              <li>
                <Link href="/events?category=art" className="hover:text-white transition-colors">Pameran Seni</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Support */}
          <div className="flex flex-col gap-3">
            <h4 className="text-white font-bold text-sm tracking-wide uppercase">Hubungi Kami</h4>
            <ul className="flex flex-col gap-2 text-sm text-gray-500">
              <li>📍 Makassar, Sulawesi Selatan</li>
              <li>📧 support@kartjis.id</li>
              <li>📞 +62 812-3456-7890</li>
            </ul>
          </div>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-900 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-gray-600">
          <p>&copy; {new Date().getFullYear()} KARTJIS.ID. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/terms" className="hover:text-gray-400">Syarat & Ketentuan</Link>
            <Link href="/privacy" className="hover:text-gray-400">Kebijakan Privasi</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
