"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { Calendar, Clock, MapPin, Share2, Link2, MessageCircle, Minus, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, formatTime, formatRupiah } from "@/lib/utils";

type TicketCategory = {
  id: string;
  name: string;
  price: number;
  stock: number;
  maximum_tickets_per_transaction: number;
};

type EventDetail = {
  id: string;
  name: string;
  code: string;
  category: string | null;
  city: string;
  province: string;
  location: string;
  location_link: string;
  description: string | null;
  thumbnail_image: string | null;
  detail_image: string | null;
  start_date: Date | string | null;
  end_date: Date | string | null;
  contact_person: string | null;
  ticket_categories: TicketCategory[];
};

type EventDetailClientProps = {
  event: EventDetail;
};

export default function EventDetailClient({ event }: EventDetailClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [shareTooltip, setShareTooltip] = useState(false);
  const [shareUrls, setShareUrls] = useState({
    twitter: "",
    facebook: "",
    whatsapp: "",
  });

  // Capture Affiliate Code (?AFFIL=code) and store in sessionStorage
  useEffect(() => {
    const affil = searchParams.get("AFFIL");
    if (affil) {
      sessionStorage.setItem(`affil_${event.id}`, affil);
      console.log(`Captured Affiliate Code: ${affil} for event ${event.id}`);
    }
  }, [searchParams, event.id]);

  // Set share links on client side to avoid hydration mismatch
  useEffect(() => {
    const currentUrl = typeof window !== "undefined" ? window.location.href : "";
    setShareUrls({
      twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}&text=${encodeURIComponent(event.name)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`,
      whatsapp: `https://api.whatsapp.com/send?text=${encodeURIComponent(`${event.name} - Beli tiket di: ${currentUrl}`)}`,
    });
  }, [event.name]);

  // Handle quantity changes
  const handleIncrement = (ticketId: string, maxPerTx: number, stock: number) => {
    const currentQty = quantities[ticketId] || 0;
    const allowedMax = Math.min(maxPerTx, stock);
    if (currentQty < allowedMax) {
      setQuantities({
        ...quantities,
        [ticketId]: currentQty + 1,
      });
    }
  };

  const handleDecrement = (ticketId: string) => {
    const currentQty = quantities[ticketId] || 0;
    if (currentQty > 0) {
      setQuantities({
        ...quantities,
        [ticketId]: currentQty - 1,
      });
    }
  };

  // Calculations
  const totalQuantity = Object.values(quantities).reduce((a, b) => a + b, 0);
  const totalPrice = event.ticket_categories.reduce((sum, category) => {
    const qty = quantities[category.id] || 0;
    return sum + qty * category.price;
  }, 0);

  // Get cheapest ticket price for the header display
  const cheapestTicket = event.ticket_categories.length > 0
    ? Math.min(...event.ticket_categories.map(tc => tc.price))
    : null;

  // Copy Link function
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareTooltip(true);
    setTimeout(() => setShareTooltip(false), 2000);
  };

  // Scroll to Tickets helper
  const scrollToTickets = () => {
    const element = document.getElementById("tickets-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Checkout redirect
  const handleCheckout = () => {
    if (totalQuantity === 0) return;
    
    // Prepare checkout parameters
    const items = Object.entries(quantities)
      .filter(([_, qty]) => qty > 0)
      .map(([id, qty]) => `${id}:${qty}`)
      .join(",");

    const affiliateCode = sessionStorage.getItem(`affil_${event.id}`) || "";
    
    let url = `/checkout?event=${event.id}&tickets=${encodeURIComponent(items)}`;
    if (affiliateCode) {
      url += `&ref=${encodeURIComponent(affiliateCode)}`;
    }
    
    router.push(url);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 relative">
      
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-6 font-semibold">
        <Link2 className="h-4 w-4 text-gray-400" />
        <span className="hover:text-black cursor-pointer" onClick={() => router.push("/")}>Home</span>
        <span>/</span>
        <span>Event</span>
        <span>/</span>
        <span className="text-black truncate max-w-[200px] sm:max-w-none">{event.name}</span>
      </nav>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Share Bar + Poster Frame (lg:col-span-7) */}
        <div className="lg:col-span-7 flex gap-4 xl:gap-8 items-start">
          
          {/* Sticky Share Sidebar (Desktop Only) */}
          <div className="hidden sm:flex flex-col items-center gap-3 sticky top-24 pt-4">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider vertical-text mb-2">Share</span>
            <button 
              onClick={handleCopyLink}
              className="p-3 bg-white border-2 border-black rounded-full shadow-[2px_2px_0px_#000] hover:translate-x-px hover:translate-y-px hover:shadow-none active:bg-gray-50 transition-all cursor-pointer relative"
              title="Copy Link"
            >
              <Link2 className="h-4 w-4 text-black" />
              {shareTooltip && (
                <span className="absolute left-14 top-1/2 -translate-y-1/2 bg-black text-white text-[10px] font-bold px-2 py-1 rounded whitespace-nowrap shadow-md">
                  Tersalin!
                </span>
              )}
            </button>
            <a 
              href={shareUrls.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-white border-2 border-black rounded-full shadow-[2px_2px_0px_#000] hover:translate-x-px hover:translate-y-px hover:shadow-none active:bg-gray-50 flex items-center justify-center transition-all cursor-pointer"
              title="Share to Twitter"
            >
              <svg className="h-4 w-4 fill-current text-black" viewBox="0 0 24 24">
                <path d="M18.2 2.4h3.3L14.3 11l8.5 11.3h-6.7L11 15.8l-6 6.5H1.6l7.7-8.8L1.3 2.4H8l4.6 6.1 5.6-6.1zm-1.2 17.6h1.8L7.1 4.3H5.1l11.9 15.7z" />
              </svg>
            </a>
            <a 
              href={shareUrls.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-white border-2 border-black rounded-full shadow-[2px_2px_0px_#000] hover:translate-x-px hover:translate-y-px hover:shadow-none active:bg-gray-50 flex items-center justify-center transition-all cursor-pointer"
              title="Share to Facebook"
            >
              <svg className="h-4 w-4 fill-current text-black" viewBox="0 0 24 24">
                <path d="M9 8H7v3h2v9h3v-9h3l.5-3H12V6c0-.9.1-1.2 1-1.2h2V1h-3c-3 0-4 1.8-4 4.5V8z" />
              </svg>
            </a>
            <a 
              href={shareUrls.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 bg-white border-2 border-black rounded-full shadow-[2px_2px_0px_#000] hover:translate-x-px hover:translate-y-px hover:shadow-none active:bg-gray-50 transition-all cursor-pointer"
              title="Share to WhatsApp"
            >
              <MessageCircle className="h-4 w-4 text-black" />
            </a>
          </div>

          {/* Poster Frame */}
          <div className="flex-1 flex flex-col gap-6">
            <div className="bg-[#CAFF04] p-3 sm:p-4 border-2 border-black rounded-[24px] shadow-[6px_6px_0px_#000] overflow-hidden">
              <div className="relative aspect-[16/10] w-full rounded-[18px] overflow-hidden border-2 border-black bg-gray-900">
                <Image
                  src={event.thumbnail_image || "/images/placeholder.png"}
                  alt={event.name}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            {/* Organizer Block */}
            <div className="flex items-center gap-3 p-4 bg-white border-2 border-black rounded-[16px] shadow-[4px_4px_0px_#000]">
              <div className="h-10 w-10 rounded-full bg-[#DF135C] flex items-center justify-center border border-black shadow-[2px_2px_0px_#000]">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Diselenggarakan Oleh</span>
                <div className="flex items-center gap-1">
                  <span className="font-extrabold text-sm text-[#2C1F63]">
                    {event.contact_person || "PT Jonly Indonesia"}
                  </span>
                  <span className="bg-[#CAFF04] text-black rounded-full p-0.5 border border-black scale-75">
                    <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                      <path d="M0 11l2-2 5 5L18 3l2 2L7 18z" />
                    </svg>
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Event Details & Action (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col gap-6 sticky lg:top-24">
          
          {/* Title */}
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-black leading-tight">
            {event.name}
          </h1>

          {/* Badges Container */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap gap-2.5">
              {/* Date Badge */}
              <div className="inline-flex items-center gap-2 bg-[#CAFF04]/10 border border-[#CAFF04] text-[#374151] rounded-full px-4 py-2 text-xs sm:text-sm font-bold shadow-[2px_2px_0px_#CAFF04]">
                <Calendar className="h-4 w-4 text-green-700" />
                <span>
                  {formatDate(event.start_date)}
                  {event.end_date && ` - ${formatDate(event.end_date)}`}
                </span>
              </div>
              {/* Time Badge */}
              <div className="inline-flex items-center gap-2 bg-gray-50 border border-gray-200 text-[#374151] rounded-full px-4 py-2 text-xs sm:text-sm font-bold shadow-[2px_2px_0px_#E5E7EB]">
                <Clock className="h-4 w-4 text-gray-500" />
                <span>
                  {formatTime(event.start_date)}
                  {event.end_date && ` - ${formatTime(event.end_date)}`}
                </span>
              </div>
            </div>
            
            {/* Venue Badge */}
            <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 text-[#374151] rounded-[12px] p-3 text-xs sm:text-sm font-bold shadow-[2px_2px_0px_#E5E7EB]">
              <MapPin className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div className="flex flex-col">
                <span className="text-black">{event.location}</span>
                <span className="text-gray-400 font-semibold text-xs mt-0.5">{event.city}, {event.province}</span>
              </div>
            </div>
          </div>

          {/* Sticky/Direct Checkout Banner CTA */}
          {cheapestTicket !== null && (
            <Button
              onClick={scrollToTickets}
              variant="primary"
              size="lg"
              className="w-full bg-[#2C1F63] hover:bg-[#1f1647] text-white border-2 border-black rounded-full shadow-[4px_4px_0px_#FFBC05] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] font-extrabold text-base transition-all h-12 py-3"
            >
              Beli Kartjis {formatRupiah(cheapestTicket)}
            </Button>
          )}

        </div>

      </div>

      {/* Description Section */}
      <section className="mt-12 pt-8 border-t border-gray-100">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#2C1F63] mb-4">
          Description
        </h2>
        <div className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-4xl whitespace-pre-line">
          {event.description || "Tidak ada deskripsi untuk event ini."}
        </div>
      </section>

      {/* Ticket Selection Section */}
      <section id="tickets-section" className="mt-12 pt-8 border-t border-gray-100">
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#2C1F63] mb-6">
          Pilih Tiket
        </h2>

        {event.ticket_categories.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center max-w-xl">
            <p className="text-gray-500 font-bold">Saat ini belum ada tiket aktif yang dijual.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl">
            {event.ticket_categories.map((category) => {
              const currentQty = quantities[category.id] || 0;
              const maxAllowed = Math.min(category.maximum_tickets_per_transaction, category.stock);
              const isSoldOut = category.stock <= 0;

              return (
                <div 
                  key={category.id}
                  className="bg-white border-2 border-black rounded-[16px] p-5 shadow-[4px_4px_0px_#000] flex flex-col justify-between gap-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <h3 className="font-extrabold text-lg text-black">{category.name}</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-base font-extrabold text-[#2E4EEA]">
                        {formatRupiah(category.price)}
                      </span>
                      {category.stock < 10 && !isSoldOut && (
                        <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded border border-red-200">
                          Sisa {category.stock} tiket!
                        </span>
                      )}
                      {isSoldOut && (
                        <span className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded border border-gray-300">
                          Habis Terjual
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 font-semibold mt-1">
                      Maksimal {category.maximum_tickets_per_transaction} tiket per transaksi
                    </span>
                  </div>

                  {/* Quantity Counter */}
                  <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-2">
                    <span className="text-xs text-gray-500 font-bold">Jumlah Tiket</span>
                    
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={() => handleDecrement(category.id)}
                        disabled={currentQty === 0 || isSoldOut}
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-md border-2 border-black disabled:opacity-30 disabled:pointer-events-none hover:bg-gray-50"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-6 text-center text-sm font-extrabold text-black select-none">
                        {currentQty}
                      </span>
                      <Button
                        onClick={() => handleIncrement(category.id, category.maximum_tickets_per_transaction, category.stock)}
                        disabled={currentQty >= maxAllowed || isSoldOut}
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-md border-2 border-black disabled:opacity-30 disabled:pointer-events-none hover:bg-gray-50"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Sticky Bottom Summary (Triggers when tickets selected) */}
      {totalQuantity > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-black p-4 z-40 shadow-md">
          <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex flex-col items-center sm:items-start">
              <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">
                Total Pilihan ({totalQuantity} Tiket)
              </span>
              <span className="text-xl font-extrabold text-[#2E4EEA] mt-0.5">
                {formatRupiah(totalPrice)}
              </span>
            </div>
            
            <Button
              onClick={handleCheckout}
              variant="default"
              shape="pill"
              size="lg"
              className="bg-[#CAFF04] hover:bg-[#b0df03] text-black border-2 border-black px-8 font-extrabold w-full sm:w-auto shadow-[3px_3px_0px_#000] active:translate-y-px"
            >
              Pesan Sekarang
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
