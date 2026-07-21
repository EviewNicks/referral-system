# Affiliate Detail Page & Table Action Refactor Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Load executing-plans to implement this plan task-by-task.

**Goal:** Build the dynamic affiliate detail view page accessed by unique affiliate code (`/admin/referral/[code]`) showing header metrics and referred order lists, and replace link/delete actions with a view detail eye icon button in the main table list.

**Architecture:** Retrieve affiliate data on the server component based on path parameters, calculate dynamic summary statistics, and render a high-fidelity tabular log of transactions. Refactor row actions in the main listing to route to the detail page.

**Tech Stack:** React, Next.js App Router, Prisma ORM, Lucide Icons, Tailwind CSS, TypeScript.

---

### Task 1: Refactor Main Table Actions in AffiliatesList
**Files:**
*   Modify: `features/affiliates/components/AffiliatesList.tsx`

**Step 1: Write the failing test / Verify current action imports**
Ensure that the `Eye` icon is imported from `lucide-react` at the top of the file, and that `Link2` and `Trash2` icon imports are removed or cleaned up.

**Step 2: Run verification to check imports compile**
Run: `npx tsc --noEmit`
Expected: PASS (if imports compile correctly).

**Step 3: Modify implementation of table action buttons**
Modify the action column cell in `features/affiliates/components/AffiliatesList.tsx` (around lines 489-504) to look like:
```typescript
{/* View Detail Partner */}
<Link
  href={`/admin/referral/${partner.code}`}
  className="p-1.5 hover:bg-gray-50 border border-gray-200 rounded-lg text-gray-500 hover:text-[#7C3AED] transition-colors cursor-pointer"
  title="Lihat Detail"
>
  <Eye className="h-4 w-4" />
</Link>
```
Make sure `Link` is imported from `next/link`. Remove the `handleDeletePartner` trigger and unused `Trash2` / `Link2` icons.

**Step 4: Verify compilation**
Run: `npx tsc --noEmit`
Expected: PASS.

**Step 5: Commit**
```bash
git add features/affiliates/components/AffiliatesList.tsx
git commit -m "refactor(affiliates): replace link and delete actions with eye detail button"
```

---

### Task 2: Create getAffiliateDetailAction Server Action
**Files:**
*   Modify: `features/affiliates/actions.ts`

**Step 1: Verify type signature of new action**
Ensure we export `getAffiliateDetailAction(code: string)` returning details and transactions matching the code.

**Step 2: Implement server-side retrieval action**
Add the following action to `features/affiliates/actions.ts`:
```typescript
export async function getAffiliateDetailAction(code: string) {
  try {
    const affiliate = await prisma.affiliates.findUnique({
      where: { code },
    });
    if (!affiliate) {
      return { success: false, message: "Partner tidak ditemukan." };
    }

    const logs = await prisma.affiliate_logs.findMany({
      where: { affiliate_id: affiliate.id },
      include: {
        orders: {
          include: {
            tickets: true
          }
        }
      },
      orderBy: { created_at: "desc" },
    });

    const parsedLogs = logs.map(log => ({
      id: log.id,
      orderId: log.order_id,
      buyerName: log.orders?.buyer_name || "-",
      createdAt: log.created_at,
      ticketQty: log.orders?.tickets?.length || 0,
      totalAmount: Number(log.total_amount),
      commission: Math.round(Number(log.total_amount) * (affiliate.commission_rate / 100)),
    }));

    const totalTransactions = parsedLogs.length;
    const totalEarnings = parsedLogs.reduce((sum, item) => sum + item.commission, 0);

    return {
      success: true,
      data: {
        affiliate: {
          id: affiliate.id,
          name: affiliate.name,
          code: affiliate.code,
          email: affiliate.email,
          commissionRate: affiliate.commission_rate,
          isActive: affiliate.is_active,
          createdAt: affiliate.created_at,
        },
        stats: {
          totalTransactions,
          totalEarnings,
        },
        transactions: parsedLogs,
      }
    };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Terjadi kesalahan server saat mengambil detail partner." };
  }
}
```

**Step 3: Verify TypeScript compilation**
Run: `npx tsc --noEmit`
Expected: PASS.

**Step 4: Commit**
```bash
git add features/affiliates/actions.ts
git commit -m "feat(affiliates): add getAffiliateDetailAction server action"
```

---

### Task 3: Create AffiliateDetailClient Component
**Files:**
*   Create: `features/affiliates/components/AffiliateDetailClient.tsx`

**Step 1: Write component interface and skeleton**
Create `features/affiliates/components/AffiliateDetailClient.tsx` with headers, stat cards, and transaction list.

**Step 2: Implement full neobrutalism UI styled panel**
```typescript
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Landmark, ShoppingBag, Percent, Calendar, FileText, ToggleLeft, ToggleRight } from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { toggleAffiliateStatusAction } from "../actions";

type TransactionItem = {
  id: string;
  orderId: string;
  buyerName: string;
  createdAt: Date;
  ticketQty: number;
  totalAmount: number;
  commission: number;
};

type AffiliateDetailProps = {
  data: {
    affiliate: {
      id: string;
      name: string;
      code: string;
      email: string | null;
      commissionRate: number;
      isActive: boolean;
      createdAt: Date;
    };
    stats: {
      totalTransactions: number;
      totalEarnings: number;
    };
    transactions: TransactionItem[];
  };
};

export default function AffiliateDetailClient({ data }: AffiliateDetailProps) {
  const { affiliate, stats, transactions } = data;
  const [isActive, setIsActive] = useState(affiliate.isActive);
  const [toggling, setToggling] = useState(false);

  const handleToggleStatus = async () => {
    if (toggling) return;
    setToggling(true);
    try {
      const res = await toggleAffiliateStatusAction(affiliate.id, !isActive);
      if (res.success) {
        setIsActive(!isActive);
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error(err);
      alert("Gagal mengubah status.");
    } finally {
      setToggling(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      {/* Back navigation */}
      <div className="flex items-center gap-2">
        <Link
          href="/admin/referral"
          className="h-9 px-3 border-2 border-black rounded-xl bg-white hover:bg-gray-50 flex items-center justify-center gap-1.5 text-xs font-bold text-black shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-px hover:translate-y-px transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Kembali</span>
        </Link>
      </div>

      {/* Header Info */}
      <div className="bg-white border-2 border-black rounded-[20px] p-6 shadow-[4px_4px_0px_#000] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-extrabold text-black">{affiliate.name}</h1>
            <span className="px-3 py-1 text-xs font-extrabold text-[#7C3AED] bg-[#FAF8FE] border border-[#7C3AED]/20 rounded-full uppercase">
              {affiliate.code}
            </span>
          </div>
          <p className="text-xs font-bold text-gray-500">
            {affiliate.email || "Tidak ada email"} • Terdaftar pada {formatDate(affiliate.createdAt)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-extrabold text-gray-700">Status Aktif</span>
          <button
            onClick={handleToggleStatus}
            disabled={toggling}
            className={`cursor-pointer transition-opacity ${toggling ? "opacity-50" : ""}`}
          >
            {isActive ? (
              <ToggleRight className="h-8 w-8 text-[#059669]" />
            ) : (
              <ToggleLeft className="h-8 w-8 text-gray-400" />
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Earnings */}
        <div className="bg-white border-2 border-black rounded-[16px] p-5 shadow-[4px_4px_0px_#000] flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-gray-400">Total Komisi</span>
            <span className="text-xl font-extrabold text-[#2C1F63]">
              {formatRupiah(stats.totalEarnings)}
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#FAF8FE] border border-[#7C3AED]/25 flex items-center justify-center text-[#7C3AED]">
            <Landmark className="h-5 w-5" />
          </div>
        </div>

        {/* Total Transactions */}
        <div className="bg-white border-2 border-black rounded-[16px] p-5 shadow-[4px_4px_0px_#000] flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-gray-400">Total Transaksi</span>
            <span className="text-xl font-extrabold text-black">
              {stats.totalTransactions} Pesanan
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#FFF9E6] border border-[#FFBC05]/25 flex items-center justify-center text-[#FFBC05]">
            <ShoppingBag className="h-5 w-5" />
          </div>
        </div>

        {/* Commission Rate */}
        <div className="bg-white border-2 border-black rounded-[16px] p-5 shadow-[4px_4px_0px_#000] flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-gray-400">Bagi Hasil Komisi</span>
            <span className="text-xl font-extrabold text-[#2E4EEA]">
              {affiliate.commissionRate}%
            </span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-[#EBF0FF] border border-[#2E4EEA]/25 flex items-center justify-center text-[#2E4EEA]">
            <Percent className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="bg-white border-2 border-black rounded-[20px] shadow-[4px_4px_0px_#000] overflow-hidden">
        <div className="p-5 border-b-2 border-black bg-gray-50 flex items-center gap-2">
          <FileText className="h-5 w-5 text-black" />
          <h2 className="font-extrabold text-sm text-black">Riwayat Transaksi</h2>
        </div>

        {transactions.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center justify-center gap-2">
            <p className="text-sm font-bold text-gray-400">Belum ada transaksi rujukan untuk partner ini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Order ID</th>
                  <th className="px-6 py-3.5">Nama Pembeli</th>
                  <th className="px-6 py-3.5">Tanggal</th>
                  <th className="px-6 py-3.5 text-center">Jumlah Tiket</th>
                  <th className="px-6 py-3.5 text-right">Nominal Transaksi</th>
                  <th className="px-6 py-3.5 text-right">Komisi ({affiliate.commissionRate}%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-600">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <Link
                        href={`/orders/${tx.orderId}`}
                        target="_blank"
                        className="font-extrabold text-[#2E4EEA] hover:underline"
                      >
                        {tx.orderId}
                      </Link>
                    </td>
                    <td className="px-6 py-3.5 font-bold text-black">{tx.buyerName}</td>
                    <td className="px-6 py-3.5 flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-gray-400" />
                      <span>{formatDate(tx.createdAt)}</span>
                    </td>
                    <td className="px-6 py-3.5 text-center font-bold text-black">{tx.ticketQty}</td>
                    <td className="px-6 py-3.5 text-right font-bold text-black">
                      {formatRupiah(tx.totalAmount)}
                    </td>
                    <td className="px-6 py-3.5 text-right font-extrabold text-[#059669]">
                      {formatRupiah(tx.commission)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
```

**Step 3: Export component in index entrypoint**
Add the new component export to `features/affiliates/index.ts`.

**Step 4: Verify TypeScript compilation**
Run: `npx tsc --noEmit`
Expected: PASS.

**Step 5: Commit**
```bash
git add features/affiliates/components/AffiliateDetailClient.tsx features/affiliates/index.ts
git commit -m "feat(affiliates): implement AffiliateDetailClient presentation component"
```

---

### Task 4: Create Dynamic Page Route
**Files:**
*   Create: `app/admin/referral/[code]/page.tsx`

**Step 1: Create dynamic server page route**
Create `app/admin/referral/[code]/page.tsx` with dynamic routing matching the directory structure.

**Step 2: Implement RSC parameter fetching**
```typescript
import React from "react";
import { notFound } from "next/navigation";
import { getAffiliateDetailAction } from "@/features/affiliates/actions";
import AffiliateDetailClient from "@/features/affiliates/components/AffiliateDetailClient";

type PageProps = {
  params: Promise<{
    code: string;
  }>;
};

export default async function AffiliateDetailPage({ params }: PageProps) {
  const { code } = await params;
  const res = await getAffiliateDetailAction(code);

  if (!res.success || !res.data) {
    notFound();
  }

  return <AffiliateDetailClient data={res.data as any} />;
}
```

**Step 3: Verify TypeScript compilation**
Run: `npx tsc --noEmit`
Expected: PASS.

**Step 4: Run production build compilation**
Run: `npm run build`
Expected: PASS (build completes with 0 errors).

**Step 5: Commit**
```bash
git add app/admin/referral/\[code\]/page.tsx
git commit -m "feat(referral): add dynamic affiliate detail page route"
```
