"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams, usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Calendar, 
  ShoppingBag, 
  Ticket, 
  TrendingUp, 
  HelpCircle, 
  Percent, 
  Tag, 
  CircleUser, 
  Building2, 
  Settings 
} from "lucide-react";

export default function AdminSidebar() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const secret = searchParams.get("secret") || "";

  const isTransactionsActive = pathname === "/admin";
  const isReferralActive = pathname === "/admin/referral";

  return (
    <aside className="hidden lg:flex w-64 border-r border-gray-100 bg-white flex-col justify-between py-6 shrink-0">
      <div className="flex flex-col gap-6">
        
        {/* Nav Group 1: General */}
        <div className="px-4">
          <Link 
            href={`/admin?secret=${secret}`}
            className="flex items-center gap-3 px-4 py-3 bg-[#FAF9FD] rounded-[12px] font-extrabold text-xs text-[#2C1F63] hover:bg-[#FAF9FD]/80 transition-all"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* Nav Group 2: Event Management */}
        <div className="flex flex-col gap-1.5">
          <span className="px-8 text-[9px] text-gray-400 font-extrabold uppercase tracking-widest">Event Management</span>
          <ul className="flex flex-col gap-1 px-4 text-xs font-bold text-gray-500">
            <li>
              <Link href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-50 hover:text-black transition-colors">
                <Calendar className="h-4 w-4" /> <span>Event Saya</span>
              </Link>
            </li>
            <li>
              <Link href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-50 hover:text-black transition-colors">
                <ShoppingBag className="h-4 w-4" /> <span>Pesanan</span>
              </Link>
            </li>
            <li>
              <Link href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-50 hover:text-black transition-colors">
                <Ticket className="h-4 w-4" /> <span>Check-in</span>
              </Link>
            </li>
            <li>
              <Link href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-50 hover:text-black transition-colors">
                <TrendingUp className="h-4 w-4" /> <span>Laporan Penjualan</span>
              </Link>
            </li>
            <li>
              <Link href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-50 hover:text-black transition-colors">
                <HelpCircle className="h-4 w-4" /> <span>Review</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Nav Group 3: Promosi */}
        <div className="flex flex-col gap-1.5">
          <span className="px-8 text-[9px] text-gray-400 font-extrabold uppercase tracking-widest">Promosi</span>
          <ul className="flex flex-col gap-1 px-4 text-xs font-bold text-gray-500">
            <li>
              <Link href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-50 hover:text-black transition-colors">
                <Percent className="h-4 w-4" /> <span>Promo & Diskon</span>
              </Link>
            </li>
            <li>
              <Link href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-50 hover:text-black transition-colors">
                <Image src="/window.svg" alt="Banner" width={16} height={16} className="h-4 w-4 opacity-50" /> <span>Banner</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Nav Group 4: Laporan */}
        <div className="flex flex-col gap-1.5">
          <span className="px-8 text-[9px] text-gray-400 font-extrabold uppercase tracking-widest">Laporan</span>
          <ul className="flex flex-col gap-1 px-4 text-xs font-bold text-gray-500">
            <li>
              <Link 
                href={`/admin?secret=${secret}`}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                  isTransactionsActive 
                    ? "bg-[#FAF8FE] border border-[#2C1F63]/20 text-[#2C1F63] shadow-sm hover:bg-[#FAF8FE]/80" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-black"
                }`}
              >
                <Image src="/file.svg" alt="File" width={16} height={16} className="h-4 w-4" /> 
                <span className="font-extrabold text-xs">Laporan Transaksi</span>
              </Link>
            </li>
            <li>
              <Link 
                href={`/admin/referral?secret=${secret}`}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all ${
                  isReferralActive 
                    ? "bg-[#FAF8FE] border border-[#2C1F63]/20 text-[#2C1F63] shadow-sm hover:bg-[#FAF8FE]/80" 
                    : "text-gray-500 hover:bg-gray-50 hover:text-black"
                }`}
              >
                <Tag className="h-4 w-4" /> 
                <span className="font-extrabold text-xs">Sistem Afiliasi</span>
              </Link>
            </li>
          </ul>
        </div>

        {/* Nav Group 5: Pengaturan */}
        <div className="flex flex-col gap-1.5">
          <span className="px-8 text-[9px] text-gray-400 font-extrabold uppercase tracking-widest">Pengaturan</span>
          <ul className="flex flex-col gap-1 px-4 text-xs font-bold text-gray-500">
            <li>
              <Link href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-50 hover:text-black transition-colors">
                <CircleUser className="h-4 w-4" /> <span>Profil EO</span>
              </Link>
            </li>
            <li>
              <Link href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-50 hover:text-black transition-colors">
                <Building2 className="h-4 w-4" /> <span>Rekening Bank</span>
              </Link>
            </li>
            <li>
              <Link href="#" className="flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-gray-50 hover:text-black transition-colors">
                <Settings className="h-4 w-4" /> <span>Pengaturan</span>
              </Link>
            </li>
          </ul>
        </div>

      </div>

      {/* Need Help Card Box */}
      <div className="px-4">
        <div className="p-4 bg-[#2C1F63] border border-[#2C1F63] rounded-xl shadow-sm text-center text-white flex flex-col gap-3">
          <span className="text-xs font-extrabold">Butuh Bantuan?</span>
          <p className="text-[10px] text-gray-200/90 font-medium leading-relaxed">Tim kami siap membantu kebutuhan event kamu.</p>
          <button className="w-full py-2 bg-white rounded-lg text-black font-extrabold text-[10px] shadow-sm hover:bg-gray-50 transition-all">
            Hubungi Kami
          </button>
        </div>
      </div>
    </aside>
  );
}
