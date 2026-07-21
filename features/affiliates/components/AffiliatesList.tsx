"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  Plus, 
  Search, 
  Eye,
  RefreshCw, 
  X, 
  User, 
  Phone, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  CheckCircle,
  Mail,
  Percent,
  Sparkles,
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Affiliate } from "../types";
import { 
  getAffiliatesAction, 
  createAffiliateAction, 
  deleteAffiliateAction,
  toggleAffiliateStatusAction 
} from "../actions";
import { formatRupiah, formatDate } from "@/lib/utils";
import GenerateLinkModal from "./GenerateLinkModal";

type AffiliatesListProps = {
  events: Array<{ id: string; code: string; name: string }>;
};

export default function AffiliatesList({ events }: AffiliatesListProps) {
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "active" | "inactive"
  const [sortBy, setSortBy] = useState("newest"); // "newest" | "oldest" | "sales-desc" | "name-asc"

  // Modal Registration Form States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPartnerName, setNewPartnerName] = useState("");
  const [newPartnerEmail, setNewPartnerEmail] = useState("");
  const [newPartnerCode, setNewPartnerCode] = useState("");
  const [newPartnerCommission, setNewPartnerCommission] = useState<number>(15);
  const [newPartnerStatus, setNewPartnerStatus] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Link Modal State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<Affiliate | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const fetchAffiliates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAffiliatesAction();
      if (res.success && res.data) {
        setAffiliates(res.data);
      } else {
        setError(res.message || "Gagal mengambil data affiliator.");
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartnerName.trim()) {
      setFormError("Nama partner wajib diisi.");
      return;
    }
    if (!newPartnerEmail.trim()) {
      setFormError("Email partner wajib diisi.");
      return;
    }
    if (!newPartnerCode.trim()) {
      setFormError("Kode rujukan wajib diisi.");
      return;
    }
    if (newPartnerCode.includes(" ")) {
      setFormError("Kode rujukan tidak boleh mengandung spasi.");
      return;
    }

    setFormError(null);
    setIsSubmitting(true);
    try {
      const res = await createAffiliateAction(
        newPartnerName,
        newPartnerEmail,
        newPartnerCode,
        undefined, // whatsapp
        newPartnerCommission,
        newPartnerStatus
      );
      if (res.success) {
        // Reset form states
        setNewPartnerName("");
        setNewPartnerEmail("");
        setNewPartnerCode("");
        setNewPartnerCommission(15);
        setNewPartnerStatus(true);
        setIsAddModalOpen(false);
        fetchAffiliates();
      } else {
        setFormError(res.message || "Gagal menyimpan data partner.");
      }
    } catch (err) {
      console.error(err);
      setFormError("Gagal menyimpan data partner.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Automated smart code generator matching [FirstName][CurrentYear]
  const handleGenerateCode = () => {
    if (!newPartnerName.trim()) {
      alert("Masukkan nama partner terlebih dahulu untuk membuat kode rujukan.");
      return;
    }
    const cleanFirstName = newPartnerName
      .trim()
      .split(" ")[0]
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase();
    const currentYear = new Date().getFullYear(); // e.g. 2026
    setNewPartnerCode(`${cleanFirstName}${currentYear}`);
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await toggleAffiliateStatusAction(id, currentStatus);
      if (res.success) {
        fetchAffiliates();
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error(err);
      alert("Gagal mengubah status partner.");
    }
  };

  const handleDeletePartner = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus partner afiliasi ini?")) return;
    try {
      const res = await deleteAffiliateAction(id);
      if (res.success) {
        fetchAffiliates();
      } else {
        alert(res.message);
      }
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus partner.");
    }
  };

  const openLinkModal = (partner: Affiliate) => {
    setSelectedAffiliate(partner);
    setIsLinkModalOpen(true);
  };

  // Helper to extract initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // 1. Deriving Stats dynamically
  const totalAffiliators = affiliates.length;
  const activeAffiliators = affiliates.filter(a => a.is_active).length;
  const totalSales = affiliates.reduce((acc, a) => acc + (a.total_sales || 0), 0);
  const totalCommissions = affiliates.reduce((acc, a) => acc + (a.total_commission || 0), 0);

  // 2. Client-side Search and Filter logic
  const filteredAffiliates = affiliates
    .filter(a => {
      const matchesSearch = 
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.email && a.email.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = 
        statusFilter === "all" ||
        (statusFilter === "active" && a.is_active) ||
        (statusFilter === "inactive" && !a.is_active);

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      }
      if (sortBy === "sales-desc") {
        return (b.total_sales || 0) - (a.total_sales || 0);
      }
      if (sortBy === "name-asc") {
        return a.name.localeCompare(b.name);
      }
      return 0;
    });

  // 3. Pagination calculations
  const totalPages = Math.ceil(filteredAffiliates.length / itemsPerPage) || 1;
  const paginatedAffiliates = filteredAffiliates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="flex flex-col gap-6">
      
      {/* HEADER ACTION AREA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[#2C1F63] tracking-tight uppercase">
            Affiliator Dashboard
          </h2>
          <p className="text-xs text-gray-500 font-semibold mt-0.5">
            Kelola semua affiliator dan pantau performa penjualan mereka.
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="rounded-xl border border-black bg-[#CAFF04] hover:bg-[#b0df03] text-black font-extrabold text-xs h-10 flex items-center justify-center gap-1.5 px-4 cursor-pointer transition-all shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Affiliator</span>
        </Button>
      </div>

      {/* METRIC STATS CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Affiliator */}
        <div className="bg-[#F5F3FF] border border-[#E9D5FF]/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-[#7C3AED] uppercase tracking-wider">Total Affiliator</span>
            <div className="h-7 w-7 rounded-full bg-white border border-black/5 flex items-center justify-center shadow-xs">
              <Users className="h-3.5 w-3.5 text-[#7C3AED]" />
            </div>
          </div>
          <div className="flex flex-col mt-2">
            <span className="text-2xl font-extrabold text-black">{totalAffiliators}</span>
            <span className="text-[10px] text-[#04A157] font-extrabold mt-0.5">▲ 12% dari bulan lalu</span>
          </div>
        </div>

        {/* Card 2: Affiliator Aktif */}
        <div className="bg-[#ECFDF5] border border-[#A7F3D0]/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-[#059669] uppercase tracking-wider">Affiliator Aktif</span>
            <div className="h-7 w-7 rounded-full bg-white border border-black/5 flex items-center justify-center shadow-xs">
              <CheckCircle className="h-3.5 w-3.5 text-[#059669]" />
            </div>
          </div>
          <div className="flex flex-col mt-2">
            <span className="text-2xl font-extrabold text-black">{activeAffiliators}</span>
            <span className="text-[10px] text-[#04A157] font-extrabold mt-0.5">▲ 8% dari bulan lalu</span>
          </div>
        </div>

        {/* Card 3: Total Penjualan */}
        <div className="bg-[#FFFBEB] border border-[#FDE68A]/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-[#D97706] uppercase tracking-wider">Total Penjualan</span>
            <div className="h-7 w-7 rounded-full bg-white border border-black/5 flex items-center justify-center shadow-xs">
              <ShoppingBag className="h-3.5 w-3.5 text-[#D97706]" />
            </div>
          </div>
          <div className="flex flex-col mt-2">
            <span className="text-lg font-extrabold text-black leading-tight">{formatRupiah(totalSales)}</span>
            <span className="text-[10px] text-[#04A157] font-extrabold mt-1">▲ 24% dari bulan lalu</span>
          </div>
        </div>

        {/* Card 4: Komisi Dibayarkan */}
        <div className="bg-[#FEF2F2] border border-[#FECACA]/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between min-h-[110px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-extrabold text-[#DC2626] uppercase tracking-wider">Komisi Dibayarkan</span>
            <div className="h-7 w-7 rounded-full bg-white border border-black/5 flex items-center justify-center shadow-xs">
              <TrendingUp className="h-3.5 w-3.5 text-[#DC2626]" />
            </div>
          </div>
          <div className="flex flex-col mt-2">
            <span className="text-lg font-extrabold text-black leading-tight">{formatRupiah(totalCommissions)}</span>
            <span className="text-[10px] text-[#04A157] font-extrabold mt-1">▲ 18% dari bulan lalu</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH ROW */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Search Bar Input */}
        <div className="relative w-full md:max-w-xs flex items-center">
          <Search className="absolute left-3.5 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Cari affiliator..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 h-10 text-xs font-semibold rounded-xl border border-gray-200"
          />
        </div>

        {/* Dropdown filters and export actions */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Dropdown Filter */}
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-extrabold text-gray-600 shadow-sm">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer pr-1"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </div>

          {/* Sort By Dropdown Filter */}
          <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-extrabold text-gray-600 shadow-sm">
            <span>Urutkan:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent focus:outline-none cursor-pointer pr-1"
            >
              <option value="newest">Terbaru</option>
              <option value="oldest">Terlama</option>
              <option value="sales-desc">Penjualan Tertinggi</option>
              <option value="name-asc">Nama (A-Z)</option>
            </select>
          </div>

          {/* Extra Options Button */}
          <button 
            onClick={fetchAffiliates}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-[#2C1F63] rounded-xl font-bold text-xs text-[#2C1F63] shadow-sm hover:bg-[#FAF9FD] transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* DATA TABLE SECTION */}
      <div className="bg-white border border-gray-200/80 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2 m-4 text-xs font-semibold">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && affiliates.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-400 font-bold flex flex-col items-center justify-center gap-2">
            <RefreshCw className="h-8 w-8 animate-spin text-[#2C1F63]" />
            <span>Memuat data affiliator...</span>
          </div>
        ) : paginatedAffiliates.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center gap-3">
            <Users className="h-10 w-10 text-gray-300" />
            <p className="text-xs font-bold text-gray-400">Tidak ada affiliator yang cocok dengan kriteria filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-black font-extrabold text-[10px] text-gray-500 uppercase">
                  <th className="p-4 pl-6">Nama Affiliator</th>
                  <th className="p-4">Kode Afiliasi</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Event Aktif</th>
                  <th className="p-4 text-right">Total Penjualan</th>
                  <th className="p-4 text-right">Komisi (%)</th>
                  <th className="p-4">Tanggal Dibuat</th>
                  <th className="p-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {paginatedAffiliates.map((partner) => (
                  <tr key={partner.id} className="hover:bg-gray-50/30 transition-colors text-xs font-bold text-gray-700">
                    
                    {/* User profile with initials avatar */}
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-[#FAF8FE] border border-[#2C1F63]/10 flex items-center justify-center font-extrabold text-[#2C1F63] text-xs">
                          {getInitials(partner.name)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-extrabold text-black text-sm">{partner.name}</span>
                          <span className="text-[10px] text-gray-400 font-bold">{partner.email || "Tanpa Email"}</span>
                        </div>
                      </div>
                    </td>

                    {/* Affiliate code highlighted */}
                    <td className="p-4">
                      <span className="font-extrabold text-xs text-[#2C1F63]">
                        {partner.code}
                      </span>
                    </td>

                    {/* Dynamic pill active badge */}
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border ${
                        partner.is_active 
                          ? "bg-green-50 text-green-700 border-green-200" 
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}>
                        {partner.is_active ? "Aktif" : "Nonaktif"}
                      </span>
                    </td>

                    {/* Event count */}
                    <td className="p-4 text-center text-sm font-extrabold">
                      {partner.active_events_count || 0}
                    </td>

                    {/* Total Sales */}
                    <td className="p-4 text-right font-extrabold text-black">
                      {formatRupiah(partner.total_sales || 0)}
                    </td>

                    {/* Commission */}
                    <td className="p-4 text-right font-extrabold text-[#2C1F63] text-sm">
                      {formatRupiah(partner.total_commission || 0)} <span className="text-[9px] text-gray-400 font-bold">({partner.commission_rate}%)</span>
                    </td>

                    {/* Date Created */}
                    <td className="p-4 text-gray-500 font-bold text-[11px]">
                      {partner.created_at ? formatDate(partner.created_at) : "-"}
                    </td>

                    {/* Action buttons */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        
                        {/* Toggle active state */}
                        <button
                          onClick={() => handleToggleStatus(partner.id, partner.is_active)}
                          className="p-1.5 hover:bg-gray-50 border border-gray-200 rounded-lg text-gray-500 hover:text-black transition-colors cursor-pointer"
                          title={partner.is_active ? "Nonaktifkan Partner" : "Aktifkan Partner"}
                        >
                          {partner.is_active ? (
                            <ToggleRight className="h-4 w-4 text-[#059669]" />
                          ) : (
                            <ToggleLeft className="h-4 w-4 text-gray-400" />
                          )}
                        </button>

                        {/* View Detail Partner */}
                        <Link
                          href={`/admin/referral/${partner.code}`}
                          className="p-1.5 hover:bg-gray-50 border border-gray-200 rounded-lg text-gray-500 hover:text-[#7C3AED] transition-colors cursor-pointer"
                          title="Lihat Detail"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION STATUS BAR */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold text-gray-400">
          <span>Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredAffiliates.length)} dari {filteredAffiliates.length} affiliator</span>
          <div className="flex items-center gap-1.5 text-black">
            <button 
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="h-7 w-7 border border-gray-200 rounded flex items-center justify-center bg-white shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              &lt;
            </button>
            <button className="h-7 w-7 border border-[#2C1F63] rounded flex items-center justify-center bg-[#2C1F63] text-white shadow-sm">
              {currentPage}
            </button>
            <button 
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="h-7 w-7 border border-gray-200 rounded flex items-center justify-center bg-white shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DIALOG: REGISTER NEW AFFILIATOR (MATCHING MOCKUP 100%) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white w-full max-w-md border border-gray-200/80 rounded-2xl shadow-xl p-5 flex flex-col gap-5 relative animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-1">
              <div>
                <h3 className="text-lg font-extrabold text-[#2C1F63]">
                  Tambah Affiliator
                </h3>
                <p className="text-xs text-gray-500 font-semibold mt-0.5">
                  Buat affiliator baru untuk membantu mempromosikan event Anda.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setFormError(null);
                }}
                className="h-8 w-8 hover:bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:text-black transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleAddPartner} className="flex flex-col gap-4">
              
              {/* Field 1: Nama */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold text-gray-700">
                  Nama Affiliator <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  placeholder="Masukkan nama affiliator"
                  value={newPartnerName}
                  onChange={(e) => setNewPartnerName(e.target.value)}
                  className="text-xs font-semibold rounded-xl border border-gray-200 focus:border-[#2C1F63]"
                />
              </div>

              {/* Field 2: Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  required
                  placeholder="Masukkan email affiliator"
                  value={newPartnerEmail}
                  onChange={(e) => setNewPartnerEmail(e.target.value)}
                  className="text-xs font-semibold rounded-xl border border-gray-200 focus:border-[#2C1F63]"
                />
              </div>

              {/* Field 3: Kode Afiliasi with Generate Otomatis */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold text-gray-700">
                  Kode Afiliasi <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    required
                    placeholder="Masukkan kode affiliator"
                    value={newPartnerCode}
                    onChange={(e) => setNewPartnerCode(e.target.value.toUpperCase().replace(/\s/g, ""))}
                    className="text-xs font-semibold rounded-xl border border-gray-200 focus:border-[#2C1F63] flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleGenerateCode}
                    variant="outline"
                    className="shrink-0 rounded-xl border border-[#2C1F63]/30 font-extrabold text-[#2C1F63] hover:bg-[#FAF8FE] flex items-center gap-1.5 text-xs px-3 h-[42px] cursor-pointer"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-[#2C1F63]" />
                    <span>Generate Otomatis</span>
                  </Button>
                </div>
                <span className="text-[10px] text-gray-400 font-semibold mt-0.5">
                  Kode harus unik, tanpa spasi, dan mudah dibagikan.
                </span>
              </div>

              {/* Field 4: Komisi (%) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold text-gray-700">
                  Komisi (%) <span className="text-red-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    required
                    placeholder="Contoh: 10"
                    value={newPartnerCommission}
                    onChange={(e) => setNewPartnerCommission(Number(e.target.value))}
                    className="text-xs font-semibold rounded-xl border border-gray-200 focus:border-[#2C1F63] pr-8"
                  />
                  <Percent className="absolute right-3 h-4 w-4 text-gray-400" />
                </div>
                <span className="text-[10px] text-gray-400 font-semibold mt-0.5">
                  Persentase komisi yang akan diterima affiliator dari setiap transaksi.
                </span>
              </div>

              {/* Field 5: Status Dropdown Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-extrabold text-gray-700">Status</label>
                <select
                  value={newPartnerStatus ? "true" : "false"}
                  onChange={(e) => setNewPartnerStatus(e.target.value === "true")}
                  className="w-full text-xs font-semibold rounded-xl border border-gray-200 bg-white px-3 py-2.5 focus:border-[#2C1F63] focus:outline-none transition-colors"
                >
                  <option value="true">Aktif</option>
                  <option value="false">Nonaktif</option>
                </select>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2 text-xs font-semibold">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Action Buttons Footer */}
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 mt-2">
                <Button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setFormError(null);
                  }}
                  variant="outline"
                  className="rounded-xl border border-gray-300 font-bold px-4 text-xs h-10 text-gray-700 hover:bg-gray-50 cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-[#FF9F00] hover:bg-[#e08b00] text-white font-extrabold text-xs h-10 px-5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Affiliator"}
                </Button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Link Generator Modal */}
      {selectedAffiliate && (
        <GenerateLinkModal
          isOpen={isLinkModalOpen}
          onClose={() => {
            setIsLinkModalOpen(false);
            setSelectedAffiliate(null);
          }}
          affiliateName={selectedAffiliate.name}
          affiliateCode={selectedAffiliate.code}
          events={events}
        />
      )}
    </div>
  );
}
