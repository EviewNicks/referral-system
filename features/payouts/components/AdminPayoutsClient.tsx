"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Landmark, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Filter, 
  RotateCcw, 
  ChevronLeft, 
  ChevronRight,
  ExternalLink,
  Check,
  X,
  FileText
} from "lucide-react";
import { formatRupiah, formatDate } from "@/lib/utils";
import { approvePayoutAction, rejectPayoutAction } from "../actions";

export type PayoutItem = {
  id: string;
  affiliateId: string;
  affiliateName: string;
  affiliateCode: string;
  amount: number;
  bankName: string;
  accountNumber: string;
  accountName: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  proofUrl: string | null;
  notes: string | null;
  createdAt: string;
};

export default function AdminPayoutsClient({ initialData, secret }: { initialData: PayoutItem[]; secret: string }) {
  const [items, setItems] = useState<PayoutItem[]>(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modal State for Approving
  const [selectedApproveItem, setSelectedApproveItem] = useState<PayoutItem | null>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [approveNotes, setApproveNotes] = useState("");
  const [submittingApprove, setSubmittingApprove] = useState(false);

  // Modal State for Rejecting
  const [selectedRejectItem, setSelectedRejectItem] = useState<PayoutItem | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [submittingReject, setSubmittingReject] = useState(false);

  // Compute Metrics
  const pendingItems = items.filter((i) => i.status === "PENDING");
  const approvedItems = items.filter((i) => i.status === "APPROVED");
  const rejectedItems = items.filter((i) => i.status === "REJECTED");

  const totalPendingAmount = pendingItems.reduce((acc, i) => acc + i.amount, 0);
  const totalApprovedAmount = approvedItems.reduce((acc, i) => acc + i.amount, 0);

  // Filtered List
  const filteredItems = items.filter((item) => {
    const matchesSearch = 
      item.affiliateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.affiliateCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.bankName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.accountNumber.includes(searchQuery);

    const matchesStatus = 
      statusFilter === "all" ? true : item.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApproveItem || submittingApprove) return;
    setSubmittingApprove(true);

    try {
      const res = await approvePayoutAction(selectedApproveItem.id, proofUrl, approveNotes);
      if (res.success) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === selectedApproveItem.id
              ? { ...i, status: "APPROVED", proofUrl: proofUrl || null, notes: approveNotes || null }
              : i
          )
        );
        setSelectedApproveItem(null);
        setProofUrl("");
        setApproveNotes("");
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error(err);
      alert("Gagal menyetujui payout.");
    } finally {
      setSubmittingApprove(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRejectItem || submittingReject) return;
    setSubmittingReject(true);

    try {
      const res = await rejectPayoutAction(selectedRejectItem.id, rejectNotes);
      if (res.success) {
        setItems((prev) =>
          prev.map((i) =>
            i.id === selectedRejectItem.id
              ? { ...i, status: "REJECTED", notes: rejectNotes || null }
              : i
          )
        );
        setSelectedRejectItem(null);
        setRejectNotes("");
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error(err);
      alert("Gagal menolak payout.");
    } finally {
      setSubmittingReject(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      {/* Top Header & Breadcrumbs */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          <Link href={`/admin?secret=${secret}`} className="hover:text-black hover:underline transition-colors">
            Dashboard
          </Link>{" "}
          &gt; Pencairan Komisi
        </span>
        <h2 className="text-2xl font-extrabold text-black tracking-tight uppercase mt-1">
          Manajemen Pencairan Komisi (Payouts)
        </h2>
        <p className="text-xs text-gray-500 font-bold">
          Kelola dan setujui klaim penarikan komisi partner afiliasi secara transparan.
        </p>
      </div>

      {/* Summary Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Pending */}
        <div className="bg-[#FFFBEB] border border-[#FDE68A]/70 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#D97706]">Menunggu Persetujuan</span>
            <div className="h-8 w-8 rounded-full bg-white border border-[#FDE68A] flex items-center justify-center text-[#D97706] shadow-xs">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="flex flex-col mt-3">
            <span className="text-2xl font-extrabold text-[#92400E]">
              {formatRupiah(totalPendingAmount)}
            </span>
            <span className="text-[11px] font-bold text-[#D97706] mt-0.5">
              {pendingItems.length} Klaim Menunggu
            </span>
          </div>
        </div>

        {/* Card 2: Approved */}
        <div className="bg-[#ECFDF5] border border-[#A7F3D0]/70 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#059669]">Total Ditransfer</span>
            <div className="h-8 w-8 rounded-full bg-white border border-[#A7F3D0] flex items-center justify-center text-[#059669] shadow-xs">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="flex flex-col mt-3">
            <span className="text-2xl font-extrabold text-[#065F46]">
              {formatRupiah(totalApprovedAmount)}
            </span>
            <span className="text-[11px] font-bold text-[#059669] mt-0.5">
              {approvedItems.length} Klaim Disetujui
            </span>
          </div>
        </div>

        {/* Card 3: Rejected */}
        <div className="bg-gray-50 border border-gray-200/80 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500">Klaim Ditolak</span>
            <div className="h-8 w-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-400 shadow-xs">
              <XCircle className="h-4 w-4" />
            </div>
          </div>
          <div className="flex flex-col mt-3">
            <span className="text-2xl font-extrabold text-gray-700">
              {rejectedItems.length} Pengajuan
            </span>
            <span className="text-[11px] font-bold text-gray-400 mt-0.5">
              Ditolak dengan alasan
            </span>
          </div>
        </div>
      </div>

      {/* Main Table Block Container */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Section Header */}
        <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-black" />
            <h2 className="font-extrabold text-sm text-black uppercase tracking-tight">
              Daftar Pengajuan Penarikan Saldo
            </h2>
          </div>
          <span className="text-xs font-bold text-gray-400">
            Total {filteredItems.length} Data
          </span>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 border-b border-gray-100 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <Search className="h-3.5 w-3.5" />
              </span>
              <input
                type="text"
                placeholder="Cari Partner / Rekening..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#2C1F63] focus:ring-1 focus:ring-[#2C1F63] shadow-xs bg-white text-black"
              />
            </div>

            {/* Select Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold bg-white text-gray-700 focus:outline-none focus:border-[#2C1F63] shadow-xs cursor-pointer"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu Persetujuan</option>
              <option value="approved">Disetujui / Ditransfer</option>
              <option value="rejected">Ditolak</option>
            </select>
          </div>

          {/* Reset Action */}
          {(searchQuery || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setCurrentPage(1);
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-black bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer shadow-xs"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        {/* Table Body */}
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-2">
            <p className="text-sm font-bold text-gray-400">Tidak ada pengajuan pencairan komisi yang ditemukan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Partner Afiliasi</th>
                  <th className="px-6 py-3.5">Nominal Penarikan</th>
                  <th className="px-6 py-3.5">Rekening Tujuan</th>
                  <th className="px-6 py-3.5">Tanggal Pengajuan</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-semibold text-gray-600">
                {paginatedItems.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                    {/* Partner Name & Code */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-black">{item.affiliateName}</span>
                        <span className="text-[10px] font-extrabold text-[#7C3AED] uppercase">
                          {item.affiliateCode}
                        </span>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4 font-extrabold text-black">
                      {formatRupiah(item.amount)}
                    </td>

                    {/* Bank & Account Details */}
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-extrabold text-black">
                          {item.bankName} - {item.accountNumber}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400">
                          a.n. {item.accountName}
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 font-bold text-gray-500">
                      {formatDate(item.createdAt)}
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      {item.status === "PENDING" && (
                        <span className="px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-lg text-[10px] font-black text-amber-700 uppercase">
                          Menunggu
                        </span>
                      )}
                      {item.status === "APPROVED" && (
                        <span className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-[10px] font-black text-emerald-700 uppercase">
                          Disetujui
                        </span>
                      )}
                      {item.status === "REJECTED" && (
                        <span className="px-2.5 py-1 bg-rose-50 border border-rose-200 rounded-lg text-[10px] font-black text-rose-700 uppercase">
                          Ditolak
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-center">
                      {item.status === "PENDING" ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedApproveItem(item)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-[#059669] hover:bg-[#047857] text-white rounded-lg text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                            title="Setujui dan Transfer Payout"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Setujui</span>
                          </button>
                          <button
                            onClick={() => setSelectedRejectItem(item)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-lg text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                            title="Tolak Pengajuan Payout"
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>Tolak</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-gray-400">
                          {item.proofUrl && (
                            <a
                              href={item.proofUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#7C3AED] hover:underline flex items-center gap-1"
                            >
                              <span>Bukti</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                          {!item.proofUrl && <span>Selesai</span>}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center text-xs font-bold text-gray-400">
            <span>
              Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredItems.length)} dari {filteredItems.length}
            </span>
            <div className="flex items-center gap-1 text-black">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-7 w-7 border border-gray-200 rounded flex items-center justify-center bg-white shadow-xs hover:bg-gray-50 transition-all disabled:opacity-50 cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-7 w-7 border border-gray-200 rounded flex items-center justify-center bg-white shadow-xs hover:bg-gray-50 transition-all disabled:opacity-50 cursor-pointer"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Approve Modal Dialog */}
      {selectedApproveItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-sm text-black uppercase">Konfirmasi Setujui Payout</h3>
              <button onClick={() => setSelectedApproveItem(null)} className="text-gray-400 hover:text-black">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl p-3 text-xs flex flex-col gap-1 text-[#065F46]">
              <span className="font-extrabold">
                {selectedApproveItem.affiliateName} ({selectedApproveItem.affiliateCode})
              </span>
              <span className="font-bold">Nominal: {formatRupiah(selectedApproveItem.amount)}</span>
              <span className="text-[11px]">
                Rekening: {selectedApproveItem.bankName} - {selectedApproveItem.accountNumber} (a.n. {selectedApproveItem.accountName})
              </span>
            </div>

            <form onSubmit={handleApproveSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">URL Bukti Transfer (Opsional)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#2C1F63]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">Catatan Tambahan (Opsional)</label>
                <textarea
                  placeholder="Catatan transfer..."
                  value={approveNotes}
                  onChange={(e) => setApproveNotes(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#2C1F63] min-h-[70px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedApproveItem(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingApprove}
                  className="px-4 py-2 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {submittingApprove ? "Memproses..." : "Konfirmasi Setujui"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal Dialog */}
      {selectedRejectItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl max-w-md w-full p-6 shadow-xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-sm text-black uppercase">Tolak Pengajuan Payout</h3>
              <button onClick={() => setSelectedRejectItem(null)} className="text-gray-400 hover:text-black">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs flex flex-col gap-1 text-rose-800">
              <span className="font-extrabold">
                {selectedRejectItem.affiliateName} ({selectedRejectItem.affiliateCode})
              </span>
              <span className="font-bold">Nominal: {formatRupiah(selectedRejectItem.amount)}</span>
            </div>

            <form onSubmit={handleRejectSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-700">Alasan Penolakan</label>
                <textarea
                  required
                  placeholder="Misal: Nomor rekening tidak cocok dengan nama akun..."
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  className="px-3 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#2C1F63] min-h-[80px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRejectItem(null)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submittingReject}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {submittingReject ? "Memproses..." : "Tolak Pengajuan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
