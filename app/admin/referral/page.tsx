import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AffiliatesList, AffiliateReports } from "@/features/affiliates";

type PageProps = {
  searchParams: Promise<{
    secret?: string;
  }>;
};

export default async function AdminReferralPage({ searchParams }: PageProps) {
  const { secret } = await searchParams;

  // 1. Authenticate using process.env.ADMIN_SECRET_KEY
  if (!secret || secret !== process.env.ADMIN_SECRET_KEY) {
    notFound(); // Redirects to standard 404 page to mask route existence
  }

  // 2. Fetch all active events for links generation selection
  const allEvents = await prisma.events.findMany({
    where: {
      event_status_id: 1, // Published
    },
    select: {
      id: true,
      code: true,
      name: true,
    },
  });

  return (
    <>
      {/* Dashboard Title & Top breadcrumbs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            Dashboard &gt; Afiliasi
          </span>
          <h2 className="text-2xl font-extrabold text-black tracking-tight uppercase">
            Sistem Afiliasi & Rujukan
          </h2>
          <p className="text-xs text-gray-500 font-bold">
            Kelola partner afiliasi Anda, buat link promosi khusus, dan pantau log penjualan tiket secara real-time.
          </p>
        </div>
      </div>

      {/* Affiliates Management List Component */}
      <AffiliatesList events={allEvents} />

      <div className="border-t border-gray-200/50 my-2" />

      {/* Affiliate Sales Reports */}
      <div>
        <h3 className="text-lg font-extrabold text-[#2C1F63] mb-1 uppercase tracking-tight">
          Laporan Transaksi Rujukan
        </h3>
        <p className="text-xs text-gray-500 font-bold mb-4">
          Daftar transaksi penjualan tiket yang berhasil dirujuk oleh partner afiliasi Anda.
        </p>
        <AffiliateReports events={allEvents} />
      </div>
    </>
  );
}
