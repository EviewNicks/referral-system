import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { Calendar, Clock, MapPin, Ticket, ShieldCheck, Mail, Phone, User, ArrowLeft, Printer } from "lucide-react";
import { formatDate, formatTime, formatRupiah } from "@/lib/utils";

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function OrderDetailPage({ params }: PageProps) {
  const { id: orderId } = await params;

  // Fetch the order with associated tickets, ticket categories, and events
  const order = await prisma.orders.findUnique({
    where: { id: orderId },
    include: {
      tickets: {
        include: {
          ticket_categories: true,
          events: true,
        },
      },
    },
  });

  if (!order) {
    notFound();
  }

  const tickets = order.tickets;
  const firstTicket = tickets[0];
  const event = firstTicket?.events;

  const totalTickets = tickets.length;
  const subtotal = Number(order.subtotal_amount || 0n);
  const totalAdminFee = Number(order.admin_fees || 0n);
  const grandTotal = Number(order.total_amount);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 print:py-0">
      
      {/* Header bar - hidden in print */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 print:hidden">
        <Link 
          href="/" 
          className="flex items-center gap-1.5 text-sm font-bold text-gray-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali ke Beranda
        </Link>
        
        <a
          href="javascript:window.print()"
          className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-black rounded-full font-bold text-sm shadow-[3px_3px_0px_#000] hover:translate-x-px hover:translate-y-px hover:shadow-none transition-all cursor-pointer select-none"
        >
          <Printer className="h-4 w-4" /> Cetak Tiket (PDF)
        </a>
      </div>

      {/* Main Container */}
      <div className="flex flex-col gap-8">
        
        {/* Receipt Header Card */}
        <div className="bg-white border-2 border-black rounded-[24px] p-6 shadow-[5px_5px_0px_#000] flex flex-col sm:flex-row justify-between gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Tanda Terima Resmi</span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#2C1F63]">{order.id}</h1>
            <p className="text-xs text-gray-500 font-semibold flex items-center gap-1">
              Diterbitkan pada {formatDate(order.date)} pukul {formatTime(order.date)}
            </p>
          </div>

          <div className="flex flex-col sm:items-end justify-between gap-4">
            {/* Status Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E8F8F0] border border-[#10B981] text-[#047857] rounded-full text-xs font-bold w-fit">
              <ShieldCheck className="h-4 w-4 text-[#10B981]" />
              <span>Pembayaran Sukses</span>
            </div>
            
            {/* Total Paid */}
            <div className="flex flex-col sm:items-end">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Total Pembayaran</span>
              <span className="text-xl font-extrabold text-[#2E4EEA]">{formatRupiah(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Invoice breakdown - hidden in print unless needed, here shown cleanly */}
        <div className="bg-gray-50 border-2 border-black rounded-[20px] p-5 shadow-[4px_4px_0px_#000]">
          <h3 className="font-extrabold text-sm text-black mb-4 uppercase tracking-wider">Rincian Pembelian</h3>
          <div className="flex flex-col gap-3 font-semibold text-xs sm:text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Subtotal Tiket ({totalTickets}x)</span>
              <span className="text-black font-extrabold">{formatRupiah(subtotal)}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200 pb-3">
              <span>Biaya Layanan / Admin Fee</span>
              <span className="text-black font-extrabold">{formatRupiah(totalAdminFee)}</span>
            </div>
            <div className="flex justify-between text-black font-extrabold text-sm sm:text-base pt-1">
              <span>Total Bayar</span>
              <span className="text-[#2E4EEA] font-extrabold">{formatRupiah(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* Affiliate Tracking Notice (Fase 1 Verify) */}
        {order.affiliate_code && (
          <div className="bg-[#EBF5FF] border-2 border-[#2E4EEA] rounded-[16px] p-4 flex items-center gap-3 shadow-[3px_3px_0px_#2E4EEA] print:hidden">
            <Ticket className="h-5 w-5 text-[#2E4EEA]" />
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Kode Afiliasi Terdeteksi</span>
              <span className="text-sm font-extrabold text-[#2E4EEA]">{order.affiliate_code}</span>
            </div>
          </div>
        )}

        {/* Event Banner Card */}
        {event && (
          <div className="bg-white border-2 border-black rounded-[20px] p-4 shadow-[4px_4px_0px_#000] flex flex-col sm:flex-row gap-5 items-center">
            <div className="relative h-24 w-40 rounded-[12px] overflow-hidden border-2 border-black bg-gray-900 shrink-0">
              <Image
                src={event.thumbnail_image || "/images/placeholder.png"}
                alt={event.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1.5 w-full">
              <h2 className="text-lg font-extrabold text-black">{event.name}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-gray-400" />
                  <span>{formatDate(event.start_date)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <span>{formatTime(event.start_date)} WIB</span>
                </div>
                <div className="flex items-center gap-1.5 sm:col-span-2">
                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                  <span className="truncate">{event.location}, {event.city}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* E-Tickets Divider */}
        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t-2 border-dashed border-gray-400"></div>
          <span className="flex-shrink mx-4 text-xs font-extrabold text-gray-400 uppercase tracking-widest">E-Tiket Pengunjung</span>
          <div className="flex-grow border-t-2 border-dashed border-gray-400"></div>
        </div>

        {/* E-Ticket Cards list */}
        <div className="flex flex-col gap-6 print:gap-12">
          {tickets.map((ticket, index) => (
            <div 
              key={ticket.id}
              className="bg-white border-2 border-black rounded-[24px] shadow-[5px_5px_0px_#000] overflow-hidden flex flex-col md:flex-row divide-y-2 md:divide-y-0 md:divide-x-2 divide-dashed divide-black relative print:break-inside-avoid print:shadow-none print:border-2"
            >
              
              {/* Left Side: Ticket Main Info */}
              <div className="flex-1 p-6 flex flex-col gap-6 justify-between">
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-widest">
                      Kategori Tiket #{index + 1}
                    </span>
                    <span className="px-2 py-0.5 bg-[#CAFF04] border border-black rounded text-[10px] font-bold text-black uppercase">
                      {ticket.ticket_categories.name}
                    </span>
                  </div>
                  <h3 className="text-xl font-extrabold text-black">{event?.name}</h3>
                </div>

                {/* Visitor metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-gray-100 pt-4 text-xs">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <User className="h-3 w-3" /> Nama Lengkap
                    </span>
                    <span className="font-extrabold text-black">{ticket.customer_name}</span>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Mail className="h-3 w-3" /> Email
                    </span>
                    <span className="font-extrabold text-black truncate">{ticket.customer_email}</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <Phone className="h-3 w-3" /> No. Handphone
                    </span>
                    <span className="font-extrabold text-black">{ticket.customer_phone_number}</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                      Gender
                    </span>
                    <span className="font-extrabold text-black">{ticket.customer_gender}</span>
                  </div>
                </div>
              </div>

              {/* Right Side: QR Code Area */}
              <div className="w-full md:w-64 p-6 bg-gray-50 flex flex-col items-center justify-center gap-4 shrink-0">
                {/* Simulated SVG QR Code */}
                <div className="bg-white p-2 border-2 border-black rounded-[16px] shadow-[3px_3px_0px_#000] print:shadow-none">
                  <svg className="w-28 h-28 p-1 bg-white shrink-0" viewBox="0 0 100 100" aria-label="QR Code">
                    {/* QR Code corner positioning finders */}
                    <rect x="5" y="5" width="20" height="20" fill="black" />
                    <rect x="10" y="10" width="10" height="10" fill="white" />
                    <rect x="75" y="5" width="20" height="20" fill="black" />
                    <rect x="80" y="10" width="10" height="10" fill="white" />
                    <rect x="5" y="75" width="20" height="20" fill="black" />
                    <rect x="10" y="80" width="10" height="10" fill="white" />
                    {/* Simulated pixel noise grid */}
                    <rect x="35" y="35" width="30" height="30" fill="black" />
                    <rect x="40" y="40" width="10" height="10" fill="white" />
                    <rect x="50" y="50" width="15" height="15" fill="black" />
                    <rect x="15" y="45" width="10" height="10" fill="black" />
                    <rect x="45" y="15" width="15" height="10" fill="black" />
                    <rect x="75" y="45" width="15" height="15" fill="black" />
                    <rect x="45" y="75" width="15" height="15" fill="black" />
                    <rect x="25" y="25" width="10" height="10" fill="black" />
                    <rect x="65" y="25" width="10" height="10" fill="black" />
                    <rect x="25" y="65" width="10" height="10" fill="black" />
                  </svg>
                </div>
                
                {/* Unique Ticket Code */}
                <div className="text-center flex flex-col gap-0.5">
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Kode Tiket</span>
                  <span className="text-sm font-mono font-extrabold text-[#2C1F63] tracking-wide">{ticket.code}</span>
                </div>
              </div>

            </div>
          ))}
        </div>

      </div>

    </div>
  );
}
