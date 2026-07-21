import Link from "next/link";
import Image from "next/image";
import { Search, Bell, ChevronDown } from "lucide-react";

export default function AdminHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <Image 
            src="/logo/logo.png" 
            alt="Kartjis Logo" 
            width={28} 
            height={28} 
            className="h-7 w-7 object-contain rounded-md"
          />
          <span className="font-extrabold text-lg tracking-wider text-black">
            KARTJIS.ID
          </span>
        </Link>
      </div>

      {/* Global Search Box */}
      <div className="hidden md:flex max-w-md flex-1 px-8">
        <div className="relative w-full flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="cari event, acara, dll..."
            className="w-full h-10 pl-10 pr-4 bg-gray-50 border border-gray-200 rounded-full text-xs font-bold focus:outline-none focus:bg-white shadow-sm focus:shadow-none transition-all"
          />
        </div>
      </div>

      {/* User Right Profile Actions */}
      <div className="flex items-center gap-4">
        <button className="relative h-9 w-9 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50 transition-all">
          <Bell className="h-4 w-4" />
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-[#E7222E] rounded-full text-[8px] font-extrabold text-white flex items-center justify-center shadow-sm">
            12
          </span>
        </button>
        
        <div className="h-9 w-px bg-gray-300" />
        
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 bg-[#EBF5FF] border border-gray-200 rounded-full flex items-center justify-center font-extrabold shadow-sm">
            EO
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-[11px] font-extrabold text-black leading-none">EO Universe</span>
            <span className="text-[9px] text-gray-400 font-bold">Admin</span>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400 hidden lg:block" />
        </div>
      </div>
    </header>
  );
}
