import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { 
  Calendar, 
  ShoppingBag, 
  Filter, 
  RotateCcw, 
  FileDown,
  ArrowUpRight,
  CreditCard,
  ChevronDown,
  Ticket,
  TrendingUp,
  Users,
  HelpCircle
} from "lucide-react";
import { formatRupiah, formatDate, formatTime } from "@/lib/utils";
import { ChartLineDotsCustom, ChartPieDonutText } from "@/features/admin";

type PageProps = {
  searchParams: Promise<{
    secret?: string;
    status?: string;
    event?: string;
    affiliate?: string;
  }>;
};

export default async function AdminDashboardPage({ searchParams }: PageProps) {
  const { secret, status, event, affiliate } = await searchParams;

  // 1. Authenticate using process.env.ADMIN_SECRET_KEY
  if (!secret || secret !== process.env.ADMIN_SECRET_KEY) {
    notFound(); // Redirects to standard 404 page to mask route existence
  }

  // 2. Fetch all orders with tickets and events
  const orders = await prisma.orders.findMany({
    orderBy: {
      date: "desc",
    },
    include: {
      tickets: {
        include: {
          ticket_categories: true,
          events: true,
        },
      },
    },
  });

  // 3. Filter orders based on queries
  let filteredOrders = [...orders];

  if (status && status !== "all") {
    const statusId = status === "success" ? 2 : 1;
    filteredOrders = filteredOrders.filter(o => o.order_status_id === statusId);
  }

  if (event && event !== "all") {
    filteredOrders = filteredOrders.filter(o => o.tickets[0]?.event_id === event);
  }

  if (affiliate && affiliate !== "all") {
    if (affiliate === "with") {
      filteredOrders = filteredOrders.filter(o => o.affiliate_code !== null);
    } else if (affiliate === "without") {
      filteredOrders = filteredOrders.filter(o => o.affiliate_code === null);
    }
  }

  // 4. Compute metrics (Success direct or pending)
  const successOrders = orders.filter(o => o.order_status_id === 2);
  const totalRevenue = successOrders.reduce((sum, order) => sum + Number(order.total_amount), 0);
  const totalTicketsSold = successOrders.reduce((sum, order) => sum + order.tickets.length, 0);
  const totalTransactionsCount = successOrders.length;
  
  const withAffilCount = successOrders.filter(o => o.affiliate_code !== null).length;
  const withoutAffilCount = successOrders.filter(o => o.affiliate_code === null).length;

  // 5. Generate daily transaction comparison for past 30 days
  const last30Days = Array.from({ length: 30 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - idx));
    return d;
  });

  const dailyTrendData = last30Days.map((date) => {
    const dateStr = date.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
    const dayOrders = successOrders.filter((o) => {
      const oDate = new Date(o.date);
      return (
        oDate.getDate() === date.getDate() &&
        oDate.getMonth() === date.getMonth() &&
        oDate.getFullYear() === date.getFullYear()
      );
    });

    const denganAfiliasi = dayOrders.filter((o) => o.affiliate_code !== null).length;
    const tanpaAfiliasi = dayOrders.filter((o) => o.affiliate_code === null).length;

    return {
      date: dateStr,
      denganAfiliasi,
      tanpaAfiliasi,
    };
  });

  // Extract unique events for the filter dropdown
  const uniqueEventsMap = new Map();
  orders.forEach(o => {
    const firstTicket = o.tickets[0];
    if (firstTicket?.events) {
      uniqueEventsMap.set(firstTicket.events.id, firstTicket.events.name);
    }
  });
  const eventList = Array.from(uniqueEventsMap.entries()).map(([id, name]) => ({ id, name }));

  // Helper to resolve deterministic payment method for dev demo
  const getPaymentMethod = (orderId: string) => {
    const code = orderId.charCodeAt(5) || 0;
    if (code % 4 === 0) return "QRIS";
    if (code % 4 === 1) return "BCA";
    if (code % 4 === 2) return "DANA";
    return "MANDIRI";
  };

  return (
    <>
          
          {/* Dashboard Title & Top breadcrumbs */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Dashboard &gt; Transaksi
              </span>
              <h2 className="text-2xl font-extrabold text-black tracking-tight uppercase">
                Dashboard Transaksi
              </h2>
              <p className="text-xs text-gray-500 font-bold">
                Ringkasan semua transaksi tiket secara real-time, termasuk dengan dan tanpa kode afiliasi.
              </p>
            </div>

            {/* Date filter & Export button */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-xl font-bold text-xs shadow-sm">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>01 Jul 2026 - 30 Jul 2026</span>
                <ChevronDown className="h-3 w-3 text-gray-400" />
              </div>
              
              <button className="flex items-center gap-2 px-3 py-2 bg-white border border-[#2C1F63] rounded-xl font-bold text-xs text-[#2C1F63] shadow-sm hover:bg-[#FAF9FD] transition-all">
                <FileDown className="h-4 w-4" />
                <span>Export Laporan</span>
              </button>
            </div>
          </div>

          {/* 3. METRICS STATS CARDS ROW (5 columns) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Card 1: Total Transaksi */}
            <div className="bg-[#F5F3FF] border border-[#E9D5FF]/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-[110px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-[#7C3AED] uppercase tracking-wider">Total Transaksi</span>
                <div className="h-7 w-7 rounded-full bg-white border border-black/5 flex items-center justify-center shadow-xs">
                  <ShoppingBag className="h-3.5 w-3.5 text-[#7C3AED]" />
                </div>
              </div>
              <div className="flex flex-col mt-2">
                <span className="text-2xl font-extrabold text-black">{totalTransactionsCount.toLocaleString()}</span>
                <span className="text-[10px] text-[#04A157] font-extrabold mt-0.5">▲ 18% dari periode lalu</span>
              </div>
            </div>

            {/* Card 2: Total Tiket Terjual */}
            <div className="bg-[#EFF6FF] border border-[#BFDBFE]/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-[110px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-[#2563EB] uppercase tracking-wider">Total Tiket Terjual</span>
                <div className="h-7 w-7 rounded-full bg-white border border-black/5 flex items-center justify-center shadow-xs">
                  <Ticket className="h-3.5 w-3.5 text-[#2563EB]" />
                </div>
              </div>
              <div className="flex flex-col mt-2">
                <span className="text-2xl font-extrabold text-black">{totalTicketsSold.toLocaleString()}</span>
                <span className="text-[10px] text-[#04A157] font-extrabold mt-0.5">▲ 21% dari periode lalu</span>
              </div>
            </div>

            {/* Card 3: Total Pembayaran */}
            <div className="bg-[#ECFDF5] border border-[#A7F3D0]/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-[110px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-[#059669] uppercase tracking-wider">Total Pembayaran</span>
                <div className="h-7 w-7 rounded-full bg-white border border-black/5 flex items-center justify-center shadow-xs">
                  <TrendingUp className="h-3.5 w-3.5 text-[#059669]" />
                </div>
              </div>
              <div className="flex flex-col mt-2">
                <span className="text-lg font-extrabold text-black leading-tight">{formatRupiah(totalRevenue)}</span>
                <span className="text-[10px] text-[#04A157] font-extrabold mt-1">▲ 17% dari periode lalu</span>
              </div>
            </div>

            {/* Card 4: Transaksi dengan Afiliasi */}
            <div className="bg-[#FFFBEB] border border-[#FDE68A]/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-[110px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-[#D97706] uppercase tracking-wider">Dengan Afiliasi</span>
                <div className="h-7 w-7 rounded-full bg-white border border-black/5 flex items-center justify-center shadow-xs">
                  <Users className="h-3.5 w-3.5 text-[#D97706]" />
                </div>
              </div>
              <div className="flex flex-col mt-2">
                <span className="text-2xl font-extrabold text-black">{withAffilCount.toLocaleString()}</span>
                <span className="text-[10px] text-[#04A157] font-extrabold mt-0.5">▲ 16% dari periode lalu</span>
              </div>
            </div>

            {/* Card 5: Transaksi tanpa Afiliasi */}
            <div className="bg-[#FEF2F2] border border-[#FECACA]/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-[110px]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-[#DC2626] uppercase tracking-wider">Tanpa Afiliasi</span>
                <div className="h-7 w-7 rounded-full bg-white border border-black/5 flex items-center justify-center shadow-xs">
                  <CreditCard className="h-3.5 w-3.5 text-[#DC2626]" />
                </div>
              </div>
              <div className="flex flex-col mt-2">
                <span className="text-2xl font-extrabold text-black">{withoutAffilCount.toLocaleString()}</span>
                <span className="text-[10px] text-[#04A157] font-extrabold mt-0.5">▲ 20% dari periode lalu</span>
              </div>
            </div>

          </div>

          {/* 4. CHARTS VISUAL SECTION GRID (2 Column / 1 Column) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* Panel Left: Daily line chart */}
            <div className="lg:col-span-2">
              <ChartLineDotsCustom data={dailyTrendData} />
            </div>

            {/* Panel Right: Composition donut chart */}
            <div className="lg:col-span-1">
              <ChartPieDonutText 
                denganAfiliasiCount={withAffilCount} 
                tanpaAfiliasiCount={withoutAffilCount} 
              />
            </div>

          </div>

          {/* 5. FILTER OPTIONS AND DROPDOWNS CONTROL */}
          <form method="GET" action="/admin" className="w-full flex flex-wrap items-center justify-between gap-4 p-4 bg-white border border-gray-200/60 rounded-xl shadow-sm">
            <input type="hidden" name="secret" value={secret} />

            <div className="flex flex-wrap items-center gap-3">
              
              {/* Filter 1: Status */}
              <div className="flex flex-col gap-1">
                <label htmlFor="filter-status" className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Status Pembayaran</label>
                <select 
                  id="filter-status"
                  name="status" 
                  defaultValue={status || "all"}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold shadow-sm focus:outline-none focus:border-[#2C1F63] cursor-pointer"
                >
                  <option value="all">Semua Status</option>
                  <option value="success">Selesai</option>
                  <option value="pending">Menunggu</option>
                </select>
              </div>

              {/* Filter 2: Metode */}
              <div className="flex flex-col gap-1">
                <label htmlFor="filter-payment" className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Metode Pembayaran</label>
                <select 
                  id="filter-payment"
                  name="payment_method" 
                  defaultValue="all"
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold shadow-sm focus:outline-none focus:border-[#2C1F63] cursor-pointer"
                >
                  <option value="all">Semua Metode</option>
                  <option value="qris">QRIS</option>
                  <option value="bca">BCA</option>
                  <option value="dana">DANA</option>
                  <option value="mandiri">MANDIRI</option>
                </select>
              </div>

              {/* Filter 3: Event */}
              <div className="flex flex-col gap-1">
                <label htmlFor="filter-event" className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Event</label>
                <select 
                  id="filter-event"
                  name="event" 
                  defaultValue={event || "all"}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold shadow-sm focus:outline-none focus:border-[#2C1F63] cursor-pointer max-w-[200px]"
                >
                  <option value="all">Semua Event</option>
                  {eventList.map((e) => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              {/* Filter 4: Afiliasi */}
              <div className="flex flex-col gap-1">
                <label htmlFor="filter-affiliate" className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Afiliasi</label>
                <select 
                  id="filter-affiliate"
                  name="affiliate" 
                  defaultValue={affiliate || "all"}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold shadow-sm focus:outline-none focus:border-[#2C1F63] cursor-pointer"
                >
                  <option value="all">Semua</option>
                  <option value="with">Dengan Afiliasi</option>
                  <option value="without">Tanpa Afiliasi</option>
                </select>
              </div>

            </div>

            {/* Actions: Filter & Reset buttons */}
            <div className="flex items-center gap-2 self-end mt-2 sm:mt-0">
              <Link 
                href={`/admin?secret=${secret}`}
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors shadow-sm"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset</span>
              </Link>
              
              <button 
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 bg-[#2C1F63] text-white border border-[#2C1F63] rounded-lg text-xs font-extrabold shadow-sm hover:bg-[#20164e] transition-all cursor-pointer"
              >
                <Filter className="h-3.5 w-3.5" />
                <span>Filter</span>
              </button>
            </div>
          </form>

          {/* 6. MAIN DATA TABLE BLOCK CARD */}
          <div className="bg-white border border-gray-200/60 rounded-2xl shadow-sm overflow-hidden">
            
            {/* Header Title inside card */}
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-black uppercase tracking-wide">
                Daftar Transaksi
              </h3>
              <span className="text-[10px] text-gray-400 font-extrabold uppercase">
                Menampilkan {filteredOrders.length} Transaksi
              </span>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="p-16 text-center flex flex-col items-center gap-3">
                <HelpCircle className="h-10 w-10 text-gray-300" />
                <p className="text-xs font-bold text-gray-400">Tidak ada transaksi yang cocok dengan kriteria filter.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-black font-extrabold text-[10px] text-gray-500 uppercase">
                      <th className="p-4 pl-6">Tanggal Transaksi</th>
                      <th className="p-4">Event</th>
                      <th className="p-4">Kode Afiliasi</th>
                      <th className="p-4 text-center">Tiket</th>
                      <th className="p-4">Total Pembayaran</th>
                      <th className="p-4">Metode Pembayaran</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 pr-6 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y border-black font-semibold text-xs text-gray-700">
                    {filteredOrders.map((order) => {
                      const firstTicket = order.tickets[0];
                      const eventObj = firstTicket?.events;
                      const eventName = eventObj?.name || "Event Tidak Diketahui";
                      const eventCity = eventObj?.city || "Lokasi Online";
                      const eventDate = eventObj?.start_date ? formatDate(eventObj.start_date) : "N/A";
                      
                      const paymentMethod = getPaymentMethod(order.id);

                      return (
                        <tr key={order.id} className="hover:bg-[#FAF9FD]/40 transition-colors">
                          
                          {/* 1. Date of Transaction */}
                          <td className="p-4 pl-6 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5 text-gray-400" />
                              <div className="flex flex-col">
                                <span className="font-extrabold text-black">{formatDate(order.date)}</span>
                                <span className="text-[10px] text-gray-400 font-bold">{formatTime(order.date)} WIB</span>
                              </div>
                            </div>
                          </td>

                          {/* 2. Event artwork + name */}
                          <td className="p-4 min-w-[240px]">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 relative bg-gray-100 border border-black rounded overflow-hidden shrink-0">
                                {eventObj?.thumbnail_image ? (
                                  <Image
                                    src={eventObj.thumbnail_image}
                                    alt={eventName}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center text-[9px] font-extrabold bg-[#EBF5FF]">TKT</div>
                                )}
                              </div>
                              <div className="flex flex-col leading-tight max-w-[180px]">
                                <span className="font-extrabold text-black truncate" title={eventName}>{eventName}</span>
                                <span className="text-[9px] text-gray-400 font-bold truncate">{eventDate} • {eventCity}</span>
                              </div>
                            </div>
                          </td>

                          {/* 3. Combined Affiliate Code */}
                          <td className="p-4">
                            {order.affiliate_code ? (
                              <span className="px-2 py-1 bg-blue-50 border border-blue-200 rounded text-[9px] font-extrabold text-[#2C1F63] uppercase tracking-wide">
                                {order.affiliate_code}
                              </span>
                            ) : (
                              <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wide">
                                Direct
                              </span>
                            )}
                          </td>

                          {/* 4. Ticket count */}
                          <td className="p-4 text-center font-extrabold text-black">
                            {order.tickets.length}
                          </td>

                          {/* 5. Total Paid */}
                          <td className="p-4 font-extrabold text-black">
                            {formatRupiah(Number(order.total_amount))}
                          </td>

                          {/* 6. Payment Provider Styled Badges */}
                          <td className="p-4">
                            {paymentMethod === "QRIS" && (
                              <span className="px-2 py-0.5 bg-gradient-to-r from-teal-50 to-blue-50 border border-gray-200 rounded text-[9px] font-extrabold tracking-wider shadow-sm">
                                <span className="text-[#1A9FE1]">Q</span>
                                <span className="text-[#E7222E]">R</span>
                                <span className="text-[#FAB715]">I</span>
                                <span className="text-[#00A157]">S</span>
                              </span>
                            )}
                            {paymentMethod === "BCA" && (
                              <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 rounded text-[9px] font-extrabold text-[#0066AE]">
                                BCA
                              </span>
                            )}
                            {paymentMethod === "DANA" && (
                              <span className="px-2 py-0.5 bg-sky-50 border border-sky-200 rounded text-[9px] font-extrabold text-[#118EEA]">
                                DANA
                              </span>
                            )}
                            {paymentMethod === "MANDIRI" && (
                              <span className="px-2 py-0.5 bg-amber-50 border border-amber-200 rounded text-[9px] font-extrabold text-[#FFC000]">
                                MANDIRI
                              </span>
                            )}
                          </td>

                          {/* 7. Status Badge */}
                          <td className="p-4">
                            {order.order_status_id === 2 ? (
                              <span className="px-2 py-0.5 bg-[#E8F8F0] border border-[#10B981] rounded-full text-[9px] font-extrabold text-[#047857] uppercase tracking-wide">
                                Selesai
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-[#FEF9C3] border border-[#F59E0B] rounded-full text-[9px] font-extrabold text-[#D97706] uppercase tracking-wide">
                                Menunggu
                              </span>
                            )}
                          </td>

                          {/* 8. Action button opens visitor tickets route */}
                          <td className="p-4 pr-6 text-center">
                            <Link 
                              href={`/orders/${order.id}`}
                              target="_blank"
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-[#2C1F63]/30 rounded-lg text-[10px] font-extrabold text-[#2C1F63] hover:bg-[#FAF9FD] transition-colors shadow-sm active:translate-y-px transition-all"
                            >
                              <span>Detail</span>
                              <ArrowUpRight className="h-3 w-3" />
                            </Link>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination bar mockup */}
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold text-gray-400">
              <span>Menampilkan 1 - {filteredOrders.length} dari {filteredOrders.length} transaksi</span>
              <div className="flex items-center gap-1.5 text-black">
                <button className="h-7 w-7 border border-gray-200 rounded flex items-center justify-center bg-white shadow-sm hover:bg-gray-50 transition-colors">&lt;</button>
                <button className="h-7 w-7 border border-[#2C1F63] rounded flex items-center justify-center bg-[#2C1F63] text-white shadow-sm">1</button>
                <button className="h-7 w-7 border border-gray-200 rounded flex items-center justify-center bg-white shadow-sm hover:bg-gray-50 transition-colors">&gt;</button>
              </div>
            </div>

          </div>
        </>
      );
    }
