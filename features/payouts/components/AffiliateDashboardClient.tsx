"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Landmark, 
  Wallet, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Copy, 
  Check, 
  PlusCircle, 
  X,
  FileText,
  TrendingUp,
  ArrowLeft
} from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { requestPayoutAction } from "../actions";

export type AffiliatePortalProps = {
  affiliate: {
    id: string;
    name: string;
    code: string;
    email: string | null;
    whatsapp: string | null;
    commissionRate: number;
    bankName: string | null;
    accountNumber: string | null;
    accountName: string | null;
  };
  stats: {
    totalEarnings: number;
    paidAmount: number;
    pendingAmount: number;
    availableBalance: number;
  };
  payoutHistory: Array<{
    id: string;
    amount: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    proofUrl: string | null;
    notes: string | null;
    createdAt: string;
  }>;
};

export default function AffiliateDashboardClient({ affiliate, stats, payoutHistory }: AffiliatePortalProps) {
  const [history, setHistory] = useState(payoutHistory);
  const [availableBalance, setAvailableBalance] = useState(stats.availableBalance);
  const [copied, setCopied] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form States
  const [amount, setAmount] = useState<number | "">("");
  const [bankName, setBankName] = useState(affiliate.bankName || "BCA");
  const [accountNumber, setAccountNumber] = useState(affiliate.accountNumber || "");
  const [accountName, setAccountName] = useState(affiliate.accountName || affiliate.name);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const referralUrl = `https://referral-system.vercel.app/events/MARS9?ref=${affiliate.code}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmitPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const reqAmount = Number(amount);

    if (!reqAmount || reqAmount <= 0) {
      alert("Masukkan nominal penarikan komisi yang valid.");
      return;
    }

    if (reqAmount > availableBalance) {
      alert(`Nominal melebihi saldo tersedia (Rp ${availableBalance.toLocaleString("id-ID")}).`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await requestPayoutAction({
        affiliateId: affiliate.id,
        amount: reqAmount,
        bankName,
        accountNumber,
        accountName,
        notes,
      });

      if (res.success && res.payoutId) {
        alert(res.message);
        setHistory([
          {
            id: res.payoutId,
            amount: reqAmount,
            bankName,
            accountNumber,
            accountName,
            status: "PENDING",
            proofUrl: null,
            notes: notes || null,
            createdAt: new Date().toISOString(),
          },
          ...history,
        ]);
        setAvailableBalance((prev) => prev - reqAmount);
        setIsModalOpen(false);
        setAmount("");
        setNotes("");
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat mengajukan payout.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9FD] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        
        {/* Top Navbar Brand & Back button */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-black">
            <ArrowLeft className="h-4 w-4" />
            <span>Kembali ke Kartjis.id</span>
          </Link>
          <span className="text-xs font-black text-[#7C3AED] bg-purple-50 border border-purple-200 px-3 py-1 rounded-full uppercase tracking-wider">
            Portal Mandiri Afiliator
          </span>
        </div>

        {/* Dashboard Title Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-extrabold text-black tracking-tight uppercase">
              Dasbor Partner Afiliasi
            </h1>
            <p className="text-xs text-gray-500 font-bold">
              Pantau performa komisi penjualan rujukan Anda dan ajukan pencairan dana secara mandiri.
            </p>
          </div>

          <button
            onClick={handleCopyLink}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#2C1F63] hover:bg-[#201549] text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer active:scale-95"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? "Link Rujukan Tersalin!" : "Salin Link Rujukan"}</span>
          </button>
        </div>

        {/* Single Unified Container (Light Purple Background) */}
        <div className="bg-[#F5F3FF] border border-[#E9D5FF]/70 rounded-2xl p-6 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#E9D5FF]/70">
            
            {/* Section 1: Profil Affiliator */}
            <div className="flex flex-col justify-between pb-4 lg:pb-0 lg:pr-6 gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Partner Afiliasi</span>
                <h3 className="text-lg font-extrabold text-[#2C1F63] leading-tight truncate mt-0.5">
                  {affiliate.name}
                </h3>
                <p className="text-xs font-bold text-purple-700/70 truncate">
                  {affiliate.email || "Email tidak dikonfigurasi"}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E9D5FF]/60 mt-1">
                <span className="px-2.5 py-1 text-xs font-black text-[#2C1F63] bg-white border border-[#E9D5FF] rounded-lg shadow-xs uppercase tracking-wider">
                  {affiliate.code}
                </span>
                <span className="text-xs font-extrabold text-[#059669]">
                  Bagi Hasil {affiliate.commissionRate}%
                </span>
              </div>
            </div>

            {/* Section 2: Total Pendapatan */}
            <div className="flex flex-col justify-between py-4 lg:py-0 lg:px-6 gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-500">Total Akumulasi Komisi</span>
                <div className="h-8 w-8 rounded-full bg-white border border-[#E9D5FF] flex items-center justify-center text-[#7C3AED] shadow-xs">
                  <TrendingUp className="h-4 w-4" />
                </div>
              </div>
              <span className="text-xl font-extrabold text-[#2C1F63]">
                {formatRupiah(stats.totalEarnings)}
              </span>
            </div>

            {/* Section 3: Total Ditransfer */}
            <div className="flex flex-col justify-between py-4 lg:py-0 lg:px-6 gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-500">Komisi Telah Dicairkan</span>
                <div className="h-8 w-8 rounded-full bg-white border border-[#E9D5FF] flex items-center justify-center text-[#059669] shadow-xs">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <span className="text-xl font-extrabold text-[#2C1F63]">
                {formatRupiah(stats.paidAmount)}
              </span>
            </div>

            {/* Section 4: Saldo Komisi Siap Ditarik */}
            <div className="flex flex-col justify-between pt-4 lg:pt-0 lg:pl-6 gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#D97706]">Saldo Siap Ditarik</span>
                <div className="h-8 w-8 rounded-full bg-white border border-[#E9D5FF] flex items-center justify-center text-[#D97706] shadow-xs">
                  <Wallet className="h-4 w-4" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xl font-extrabold text-[#2C1F63]">
                  {formatRupiah(availableBalance)}
                </span>
                <button
                  onClick={() => setIsModalOpen(true)}
                  disabled={availableBalance <= 0}
                  className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                >
                  <PlusCircle className="h-3.5 w-3.5" />
                  <span>Cairkan Komisi</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Payout Requests History Section */}
        <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
            <FileText className="h-5 w-5 text-black" />
            <h2 className="font-extrabold text-sm text-black uppercase tracking-tight">
              Riwayat Penarikan Komisi
            </h2>
          </div>

          {history.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center justify-center gap-2">
              <p className="text-sm font-bold text-gray-400">Belum ada riwayat penarikan saldo komisi.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="px-6 py-3.5">Tanggal Pengajuan</th>
                    <th className="px-6 py-3.5">Nominal Penarikan</th>
                    <th className="px-6 py-3.5">Rekening Tujuan</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5">Catatan / Bukti</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-600">
                  {history.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-black">{formatDate(item.createdAt)}</td>
                      <td className="px-6 py-3.5 font-extrabold text-black">{formatRupiah(item.amount)}</td>
                      <td className="px-6 py-3.5">
                        <div className="flex flex-col">
                          <span className="font-extrabold text-black">{item.bankName} - {item.accountNumber}</span>
                          <span className="text-[10px] text-gray-400 font-bold">a.n. {item.accountName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5">
                        {item.status === "PENDING" && (
                          <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-[10px] font-black text-amber-700 uppercase">
                            Menunggu Persetujuan
                          </span>
                        )}
                        {item.status === "APPROVED" && (
                          <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] font-black text-emerald-700 uppercase">
                            Disetujui / Ditransfer
                          </span>
                        )}
                        {item.status === "REJECTED" && (
                          <span className="px-2.5 py-1 bg-rose-50 border border-rose-200 rounded-lg text-[10px] font-black text-rose-700 uppercase">
                            Ditolak
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-gray-500 font-medium">
                        {item.proofUrl ? (
                          <a
                            href={item.proofUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#7C3AED] hover:underline font-bold"
                          >
                            Lihat Bukti Transfer
                          </a>
                        ) : (
                          item.notes || "-"
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Dialog Request Payout */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-6 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="font-extrabold text-sm text-black uppercase">Formulir Penarikan Saldo Komisi</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-black">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs flex justify-between items-center text-[#2C1F63]">
                <span className="font-bold">Saldo Komisi Tersedia:</span>
                <span className="font-extrabold text-sm">{formatRupiah(availableBalance)}</span>
              </div>

              <form onSubmit={handleSubmitPayout} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700">Nominal Penarikan (Rp)</label>
                  <input
                    type="number"
                    required
                    min={10000}
                    max={availableBalance}
                    placeholder="Misal: 500000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : "")}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#2C1F63]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-700">Nama Bank</label>
                    <input
                      type="text"
                      required
                      placeholder="BCA / Mandiri / BRI"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#2C1F63]"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-gray-700">Nomor Rekening</label>
                    <input
                      type="text"
                      required
                      placeholder="1234567890"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#2C1F63]"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700">Atas Nama Rekening</label>
                  <input
                    type="text"
                    required
                    placeholder="Nama Pemilik Rekening"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#2C1F63]"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-700">Catatan (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Catatan untuk admin..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#2C1F63]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    {submitting ? "Mengirim..." : "Kirim Pengajuan"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
