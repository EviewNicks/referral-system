import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getPayoutHistoryAction } from "@/features/payouts";
import AffiliateDashboardClient from "@/features/payouts/components/AffiliateDashboardClient";

type PageProps = {
  searchParams: Promise<{
    code?: string;
  }>;
};

export default async function AffiliateDashboardPage({ searchParams }: PageProps) {
  const { code } = await searchParams;

  // Fetch target affiliate by code, or fallback to first affiliate in DB for demo
  const affiliate = code
    ? await prisma.affiliates.findUnique({
        where: { code },
        include: { affiliate_logs: true, payout_requests: true },
      })
    : await prisma.affiliates.findFirst({
        include: { affiliate_logs: true, payout_requests: true },
      });

  if (!affiliate) {
    notFound();
  }

  // Calculate Metrics
  const totalEarnings = affiliate.affiliate_logs.reduce((acc, log) => {
    const comm = (Number(log.total_amount) * (affiliate.commission_rate || 15)) / 100;
    return acc + comm;
  }, 0);

  const paidAmount = affiliate.payout_requests
    .filter((req) => req.status === "APPROVED")
    .reduce((acc, req) => acc + Number(req.amount), 0);

  const pendingAmount = affiliate.payout_requests
    .filter((req) => req.status === "PENDING")
    .reduce((acc, req) => acc + Number(req.amount), 0);

  const availableBalance = Math.max(0, totalEarnings - paidAmount - pendingAmount);

  // Fetch payout history for this affiliate
  const payoutHistoryRes = await getPayoutHistoryAction(affiliate.id);
  const payoutHistory = payoutHistoryRes.success ? payoutHistoryRes.data : [];

  return (
    <AffiliateDashboardClient
      affiliate={{
        id: affiliate.id,
        name: affiliate.name,
        code: affiliate.code,
        email: affiliate.email,
        whatsapp: affiliate.whatsapp,
        commissionRate: affiliate.commission_rate || 15,
        bankName: affiliate.bank_name,
        accountNumber: affiliate.bank_account_number,
        accountName: affiliate.bank_account_name,
      }}
      stats={{
        totalEarnings,
        paidAmount,
        pendingAmount,
        availableBalance,
      }}
      payoutHistory={payoutHistory}
    />
  );
}
