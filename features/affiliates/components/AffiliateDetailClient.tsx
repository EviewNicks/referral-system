"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Landmark, 
  ShoppingBag, 
  Percent, 
  Calendar, 
  FileText, 
  ToggleLeft, 
  ToggleRight, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Copy,
  Check,
  FileSpreadsheet,
  Download,
  Filter,
  RotateCcw
} from "lucide-react";
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
  const [copied, setCopied] = useState(false);

  // Search, Filter, and Pagination States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [dateRange, setDateRange] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const handleExportExcel = () => {
    alert("Fitur Export Excel (.xlsx) dipicu untuk data transaksi partner ini.");
  };

  const handleExportCSV = () => {
    alert("Fitur Export CSV (.csv) dipicu untuk data transaksi partner ini.");
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedEvent("");
    setSelectedStatus("");
    setDateRange("");
    setCurrentPage(1);
  };

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

  const handleCopyCode = () => {
    navigator.clipboard.writeText(affiliate.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Live client-side search query filtering
  const filteredTransactions = transactions.filter(tx => 
    tx.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.buyerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Paginate transactions
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex flex-col gap-6 w-full pb-10">
      {/* Dashboard Title & Top breadcrumbs */}
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
          <Link href="/admin/referral" className="hover:text-black hover:underline transition-colors">
            Dashboard &gt; Afiliasi
          </Link>{" "}
          &gt; Detail Partner
        </span>
        <h2 className="text-2xl font-extrabold text-black tracking-tight uppercase mt-1">
          Laporan Transaksi Afiliasi
        </h2>
        <p className="text-xs text-gray-500 font-bold">
          Detail rincian performa penjualan dan transaksi rujukan partner afiliasi.
        </p>
      </div>

      {/* Single Unified Container (Light Purple Background) with Vertical Separators */}
      <div className="bg-[#F5F3FF] border border-[#E9D5FF]/70 rounded-2xl p-6 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[#E9D5FF]/70">
          
          {/* Section 1: Profil Affiliator */}
          <div className="flex flex-col justify-between pb-4 lg:pb-0 lg:pr-6 gap-3">
            {/* Top Row: Nama Affiliator & Status Toggle Button */}
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-extrabold text-[#2C1F63] leading-tight truncate">
                {affiliate.name}
              </h3>
              <div className="flex items-center gap-1.5 bg-white border border-[#E9D5FF] rounded-full px-2.5 py-0.5 shadow-xs shrink-0">
                <span className="text-[10px] font-extrabold text-gray-600">Aktif</span>
                <button
                  onClick={handleToggleStatus}
                  disabled={toggling}
                  className="cursor-pointer transition-opacity"
                  style={{ opacity: toggling ? 0.5 : 1 }}
                >
                  {isActive ? (
                    <ToggleRight className="h-5 w-5 text-[#059669]" />
                  ) : (
                    <ToggleLeft className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Sub-text: Email / Gmail */}
            <p className="text-xs font-bold text-purple-700/70 truncate -mt-2">
              {affiliate.email || "Tidak ada email"}
            </p>

            {/* Bottom Div: Kode Afiliasi & Copy Button */}
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E9D5FF]/60 mt-1">
              <span className="px-2.5 py-1 text-xs font-black text-[#2C1F63] bg-white border border-[#E9D5FF] rounded-lg shadow-xs uppercase tracking-wider">
                {affiliate.code}
              </span>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 text-[11px] font-bold text-[#7C3AED] hover:text-[#6D28D9] bg-white border border-[#E9D5FF] px-2.5 py-1 rounded-lg shadow-xs transition-all cursor-pointer active:scale-95"
                title="Salin Kode Afiliasi"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[#059669]" />
                    <span className="text-[#059669]">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5 text-[#7C3AED]" />
                    <span>Salin Kode</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Section 2: Total Komisi */}
          <div className="flex flex-col justify-between py-4 lg:py-0 lg:px-6 gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-500">Total Komisi</span>
              <div className="h-8 w-8 rounded-full bg-white border border-[#E9D5FF] flex items-center justify-center text-[#7C3AED] shadow-xs">
                <Landmark className="h-4 w-4" />
              </div>
            </div>
            <span className="text-xl font-extrabold text-[#2C1F63]">
              {formatRupiah(stats.totalEarnings)}
            </span>
          </div>

          {/* Section 3: Total Transaksi */}
          <div className="flex flex-col justify-between py-4 lg:py-0 lg:px-6 gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-500">Total Transaksi</span>
              <div className="h-8 w-8 rounded-full bg-white border border-[#E9D5FF] flex items-center justify-center text-[#059669] shadow-xs">
                <ShoppingBag className="h-4 w-4" />
              </div>
            </div>
            <span className="text-xl font-extrabold text-[#2C1F63]">
              {stats.totalTransactions} Pesanan
            </span>
          </div>

          {/* Section 4: Bagi Hasil Komisi */}
          <div className="flex flex-col justify-between pt-4 lg:pt-0 lg:pl-6 gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-500">Bagi Hasil Komisi</span>
              <div className="h-8 w-8 rounded-full bg-white border border-[#E9D5FF] flex items-center justify-center text-[#D97706] shadow-xs">
                <Percent className="h-4 w-4" />
              </div>
            </div>
            <span className="text-xl font-extrabold text-[#2C1F63]">
              {affiliate.commissionRate}%
            </span>
          </div>

        </div>
      </div>

      {/* Transaction History Section */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Table Section Header with Export Buttons */}
        <div className="p-5 border-b border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-black" />
            <h2 className="font-extrabold text-sm text-black uppercase tracking-tight">Riwayat Transaksi</h2>
          </div>

          {/* Export Action Buttons (Excel & CSV) */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl hover:bg-[#D1FAE5] transition-all cursor-pointer shadow-xs active:scale-95"
              title="Export data ke Excel (.xlsx)"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span>Export Excel</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all cursor-pointer shadow-xs active:scale-95"
              title="Export data ke CSV (.csv)"
            >
              <Download className="h-3.5 w-3.5 text-gray-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Toolbar */}
        <div className="p-4 border-b border-gray-100 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400">
                <Search className="h-3.5 w-3.5" />
              </span>
              <input
                type="text"
                placeholder="Cari Order ID / Nama..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#2C1F63] focus:ring-1 focus:ring-[#2C1F63] shadow-xs bg-white text-black"
              />
            </div>

            {/* Select Event Dropdown */}
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold bg-white text-gray-700 focus:outline-none focus:border-[#2C1F63] shadow-xs cursor-pointer"
            >
              <option value="">Semua Event</option>
              <option value="prolog-fest">Prolog Fest 2026</option>
              <option value="mars9">Mars9 Concert</option>
              <option value="iceskating">Ice Skating Show</option>
            </select>

            {/* Rentang Tanggal Filter */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold bg-white text-gray-700 focus:outline-none focus:border-[#2C1F63] shadow-xs cursor-pointer"
            >
              <option value="">Semua Waktu</option>
              <option value="today">Hari Ini</option>
              <option value="7days">7 Hari Terakhir</option>
              <option value="30days">30 Hari Terakhir</option>
            </select>

            {/* Status Transaksi Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold bg-white text-gray-700 focus:outline-none focus:border-[#2C1F63] shadow-xs cursor-pointer"
            >
              <option value="">Semua Status</option>
              <option value="success">Berhasil</option>
              <option value="pending">Pending</option>
              <option value="failed">Gagal</option>
            </select>
          </div>

          {/* Action Buttons: Filter & Reset */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(1)}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white bg-[#2C1F63] hover:bg-[#201549] rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
            >
              <Filter className="h-3.5 w-3.5" />
              <span>Filter</span>
            </button>

            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-black bg-gray-100 hover:bg-gray-200 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95"
              title="Reset semua filter"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {transactions.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center justify-center gap-2">
            <p className="text-sm font-bold text-gray-400">Belum ada transaksi rujukan untuk partner ini.</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-10 text-center flex flex-col items-center justify-center gap-2">
            <p className="text-sm font-bold text-gray-400">Tidak ada transaksi yang cocok dengan pencarian.</p>
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
                {paginatedTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-3.5">
                      <a
                        href={`/orders/${tx.orderId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-extrabold text-[#2E4EEA] hover:underline"
                      >
                        {tx.orderId}
                      </a>
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

        {/* Pagination bar */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold text-gray-400">
            <span>
              Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} dari {filteredTransactions.length} transaksi
            </span>
            <div className="flex items-center gap-1 text-black">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="h-7 w-7 border border-gray-200 rounded flex items-center justify-center bg-white shadow-sm hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`h-7 w-7 border rounded font-extrabold text-xs flex items-center justify-center transition-all cursor-pointer ${
                        currentPage === pageNum
                          ? "bg-[#2C1F63] text-white border-[#2C1F63] shadow-sm"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 shadow-sm"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="h-7 w-7 border border-gray-200 rounded flex items-center justify-center bg-white shadow-sm hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
