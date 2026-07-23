"use server";

// ponytail: Payout Module Server Actions - Ultra-lean Server Actions untuk manajemen klaim & persetujuan payout
import { prisma } from "@/lib/prisma";

export type PayoutRequestInput = {
  affiliateId: string;
  amount: number;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  notes?: string;
};

// 1. Request Payout Action (Affiliator Side)
export async function requestPayoutAction(input: PayoutRequestInput) {
  try {
    if (!input.affiliateId || input.amount <= 0) {
      return { success: false, message: "Nominal penarikan komisi tidak valid." };
    }

    const affiliate = await prisma.affiliates.findUnique({
      where: { id: input.affiliateId },
      include: {
        affiliate_logs: true,
        payout_requests: true,
      },
    });

    if (!affiliate) {
      return { success: false, message: "Partner afiliasi tidak ditemukan." };
    }

    // ponytail: Hitung Total Earning & Total Payout yang sedang PENDING / APPROVED
    const totalEarnings = affiliate.affiliate_logs.reduce((acc, log) => {
      const comm = (Number(log.total_amount) * (affiliate.commission_rate || 15)) / 100;
      return acc + comm;
    }, 0);

    const existingPayouts = affiliate.payout_requests.reduce((acc, req) => {
      if (req.status === "PENDING" || req.status === "APPROVED") {
        return acc + Number(req.amount);
      }
      return acc;
    }, 0);

    const availableBalance = totalEarnings - existingPayouts;

    if (input.amount > availableBalance) {
      return {
        success: false,
        message: `Saldo komisi tidak mencukupi. Komisi tersedia: Rp ${availableBalance.toLocaleString("id-ID")}`,
      };
    }

    // Standardize bank info from input or fallback to existing default
    const bankName = input.bankName || affiliate.bank_name || "-";
    const accountNumber = input.accountNumber || affiliate.bank_account_number || "-";
    const accountName = input.accountName || affiliate.bank_account_name || affiliate.name;

    // Save/Update default bank details on affiliate if provided
    if (input.bankName || input.accountNumber || input.accountName) {
      await prisma.affiliates.update({
        where: { id: input.affiliateId },
        data: {
          bank_name: bankName,
          bank_account_number: accountNumber,
          bank_account_name: accountName,
        },
      });
    }

    // Create payout request entry
    const newPayout = await prisma.payout_requests.create({
      data: {
        affiliate_id: input.affiliateId,
        amount: BigInt(input.amount),
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName,
        status: "PENDING",
        notes: input.notes || null,
      },
    });

    return {
      success: true,
      payoutId: newPayout.id,
      message: "Pengajuan penarikan komisi berhasil dikirim!",
    };
  } catch (error) {
    console.error("❌ Error requesting payout:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan saat mengajukan payout.",
    };
  }
}

// 2. Fetch Payout History Action (Admin / Affiliator)
export async function getPayoutHistoryAction(affiliateId?: string) {
  try {
    const where = affiliateId ? { affiliate_id: affiliateId } : {};
    const requests = await prisma.payout_requests.findMany({
      where,
      include: {
        affiliates: true,
      },
      orderBy: { created_at: "desc" },
    });

    const serialized = requests.map((req) => ({
      id: req.id,
      affiliateId: req.affiliate_id,
      affiliateName: req.affiliates.name,
      affiliateCode: req.affiliates.code,
      amount: Number(req.amount),
      bankName: req.bank_name,
      accountNumber: req.account_number,
      accountName: req.account_name,
      status: req.status,
      proofUrl: req.proof_url,
      notes: req.notes,
      createdAt: req.created_at ? req.created_at.toISOString() : new Date().toISOString(),
    }));

    return { success: true, data: serialized };
  } catch (error) {
    console.error("❌ Error fetching payout history:", error);
    return { success: false, data: [] };
  }
}

// 3. Approve Payout Action (Admin Side)
export async function approvePayoutAction(payoutId: string, proofUrl?: string, notes?: string) {
  try {
    await prisma.payout_requests.update({
      where: { id: payoutId },
      data: {
        status: "APPROVED",
        proof_url: proofUrl || null,
        notes: notes || "Pencairan komisi telah disetujui & ditransfer.",
        updated_at: new Date(),
      },
    });

    return { success: true, message: "Pengajuan penarikan komisi berhasil disetujui." };
  } catch (error) {
    console.error("❌ Error approving payout:", error);
    return { success: false, message: "Gagal menyetujui payout." };
  }
}

// 4. Reject Payout Action (Admin Side)
export async function rejectPayoutAction(payoutId: string, notes?: string) {
  try {
    await prisma.payout_requests.update({
      where: { id: payoutId },
      data: {
        status: "REJECTED",
        notes: notes || "Pengajuan penarikan ditolak.",
        updated_at: new Date(),
      },
    });

    return { success: true, message: "Pengajuan penarikan komisi telah ditolak." };
  } catch (error) {
    console.error("❌ Error rejecting payout:", error);
    return { success: false, message: "Gagal menolak payout." };
  }
}

// 5. Admin Direct Payout Action
export async function adminCreatePayoutAction(input: PayoutRequestInput & { proofUrl?: string }) {
  try {
    if (!input.affiliateId || input.amount <= 0) {
      return { success: false, message: "Nominal penarikan komisi tidak valid." };
    }

    const affiliate = await prisma.affiliates.findUnique({
      where: { id: input.affiliateId },
      include: {
        affiliate_logs: true,
        payout_requests: true,
      },
    });

    if (!affiliate) {
      return { success: false, message: "Partner afiliasi tidak ditemukan." };
    }

    const bankName = input.bankName || affiliate.bank_name || "BCA";
    const accountNumber = input.accountNumber || affiliate.bank_account_number || "-";
    const accountName = input.accountName || affiliate.bank_account_name || affiliate.name;

    const newPayout = await prisma.payout_requests.create({
      data: {
        affiliate_id: input.affiliateId,
        amount: BigInt(input.amount),
        bank_name: bankName,
        account_number: accountNumber,
        account_name: accountName,
        status: "APPROVED",
        proof_url: input.proofUrl || null,
        notes: input.notes || "Pencairan komisi langsung oleh Admin.",
      },
    });

    return {
      success: true,
      payoutId: newPayout.id,
      message: "Pencairan komisi berhasil diproses & dicatat!",
    };
  } catch (error) {
    console.error("❌ Error admin creating payout:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : "Terjadi kesalahan saat memproses pencairan komisi.",
    };
  }
}
