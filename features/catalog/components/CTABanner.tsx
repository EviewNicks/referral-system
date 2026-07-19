import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CTABanner() {
  return (
    <section className="w-full bg-[#2E4EEA] text-white border-2 border-black rounded-[16px] p-6 sm:p-10 shadow-[6px_6px_0px_#000] flex flex-col md:flex-row items-center justify-between gap-6 my-8 overflow-hidden relative">
      {/* Decorative patterns */}
      <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
      <div className="absolute left-1/3 bottom-0 w-24 h-24 bg-[#CAFF04]/10 rounded-full blur-lg pointer-events-none" />

      {/* Text Info */}
      <div className="flex flex-col gap-2 max-w-lg text-center md:text-left z-10">
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
          Beli Tiket Sat-Set, Tanpa Ribet!
        </h2>
        <p className="text-sm text-blue-100 font-medium">
          Dapatkan akses langsung ke event-event terbaik pilihanmu secara aman. Proses instan langsung kirim ke e-mail.
        </p>
      </div>

      {/* CTA Button */}
      <div className="z-10">
        <Link href="/events">
          <Button variant="default" shape="pill" size="lg" className="bg-[#CAFF04] hover:bg-[#b0df03] text-black border-2 border-black font-extrabold px-8">
            Jelajahi Event Sekarang
          </Button>
        </Link>
      </div>
    </section>
  );
}
