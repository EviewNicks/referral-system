"use server";

import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { Affiliate, AffiliateLog } from "./types";

// 1. Get all affiliates with aggregated sales and event count stats
export async function getAffiliatesAction(): Promise<{ success: boolean; data?: Affiliate[]; message?: string }> {
  try {
    const list = await prisma.affiliates.findMany({
      include: {
        affiliate_logs: {
          select: {
            event_id: true,
            total_amount: true,
          }
        }
      },
      orderBy: { created_at: "desc" },
    });
    
    return {
      success: true,
      data: list.map(a => {
        const totalSales = a.affiliate_logs.reduce((acc, log) => acc + Number(log.total_amount), 0);
        const uniqueEventsCount = new Set(a.affiliate_logs.map(log => log.event_id)).size;
        const totalCommission = Math.round(totalSales * (a.commission_rate / 100));

        return {
          id: a.id,
          name: a.name,
          code: a.code,
          whatsapp: a.whatsapp,
          email: a.email,
          commission_rate: a.commission_rate,
          is_active: a.is_active,
          created_at: a.created_at ? a.created_at.toISOString() : null,
          active_events_count: uniqueEventsCount,
          total_sales: totalSales,
          total_commission: totalCommission,
        };
      }),
    };
  } catch (error) {
    console.error("❌ Error fetching affiliates:", error);
    return { success: false, message: "Gagal mengambil daftar affiliator." };
  }
}

// 2. Create new affiliate with custom or auto-generated code
export async function createAffiliateAction(
  name: string,
  email?: string,
  customCode?: string,
  whatsapp?: string,
  commissionRate: number = 15,
  isActive: boolean = true
): Promise<{ success: boolean; message: string }> {
  try {
    if (!name || name.trim() === "") {
      return { success: false, message: "Nama affiliator tidak boleh kosong." };
    }

    let code = customCode?.trim();
    if (!code) {
      // Auto-generate code if none provided
      const cleanName = name.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 10);
      const suffix = crypto.randomBytes(2).toString("hex").toUpperCase();
      code = `AF-KRTJ-${cleanName}-${suffix}`;
    } else {
      // Validate custom code
      if (code.includes(" ")) {
        return { success: false, message: "Kode rujukan tidak boleh mengandung spasi." };
      }
      
      // Check code uniqueness
      const existing = await prisma.affiliates.findUnique({
        where: { code: code }
      });
      if (existing) {
        return { success: false, message: `Kode rujukan "${code}" sudah terdaftar oleh partner lain.` };
      }
    }

    await prisma.affiliates.create({
      data: {
        name: name,
        email: email || null,
        code: code,
        whatsapp: whatsapp || null,
        commission_rate: commissionRate,
        is_active: isActive,
      },
    });

    return {
      success: true,
      message: "Affiliator sukses ditambahkan!",
    };
  } catch (error) {
    console.error("❌ Error creating affiliate:", error);
    return { success: false, message: "Gagal menambahkan affiliator." };
  }
}

// 3. Toggle affiliate status
export async function toggleAffiliateStatusAction(id: string, currentStatus: boolean): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.affiliates.update({
      where: { id: id },
      data: { is_active: !currentStatus },
    });
    return {
      success: true,
      message: `Affiliator berhasil ${!currentStatus ? "diaktifkan" : "dinonaktifkan"}!`,
    };
  } catch (error) {
    console.error("❌ Error toggling affiliate status:", error);
    return { success: false, message: "Gagal merubah status affiliator." };
  }
}

// 4. Delete an affiliate partner
export async function deleteAffiliateAction(id: string): Promise<{ success: boolean; message: string }> {
  try {
    await prisma.affiliates.delete({
      where: { id: id },
    });
    return { success: true, message: "Affiliator berhasil dihapus!" };
  } catch (error) {
    console.error("❌ Error deleting affiliate:", error);
    return { success: false, message: "Gagal menghapus affiliator." };
  }
}

// 5. Fetch transactions reports linked to affiliates
export async function getAffiliateReportsAction(): Promise<{ success: boolean; data?: AffiliateLog[]; message?: string }> {
  try {
    const logs = await prisma.affiliate_logs.findMany({
      include: {
        affiliates: true,
        events: true,
        orders: {
          include: {
            tickets: {
              select: {
                customer_name: true,
              },
              take: 1,
            },
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    const reports: AffiliateLog[] = logs.map((log) => {
      const buyerName = log.orders?.tickets[0]?.customer_name || "Pembeli";
      return {
        id: log.id,
        created_at: log.created_at ? log.created_at.toISOString() : null,
        buyer_name: buyerName,
        event_name: log.events?.name || "Event",
        affiliate_code: log.affiliates?.code || "Direct",
        total_amount: Number(log.total_amount),
      };
    });

    return {
      success: true,
      data: reports,
    };
  } catch (error) {
    console.error("❌ Error fetching affiliate reports:", error);
    return { success: false, message: "Gagal memuat laporan transaksi afiliasi." };
  }
}

// 6. Export reports to CSV string representation
export async function exportReportsToCSVAction(): Promise<{ success: boolean; csvString?: string; message?: string }> {
  try {
    const res = await getAffiliateReportsAction();
    if (!res.success || !res.data) {
      return { success: false, message: res.message || "Gagal mengambil data untuk diekspor." };
    }

    const headers = ["Tanggal", "Pembeli", "Event", "Kode Rujukan", "Total Pembayaran (Rp)"];
    const rows = res.data.map(item => [
      item.created_at ? new Date(item.created_at).toLocaleString("id-ID") : "-",
      item.buyer_name,
      item.event_name,
      item.affiliate_code,
      item.total_amount.toString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    return {
      success: true,
      csvString: csvContent,
    };
  } catch (error) {
    console.error("❌ Error exporting affiliate reports to CSV:", error);
    return { success: false, message: "Gagal mengekspor laporan ke CSV." };
  }
}
