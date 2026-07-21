"use client";

import React, { useState, useEffect } from "react";
import { DollarSign, Tag, Calendar, Download, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AffiliateLog } from "../types";
import { getAffiliateReportsAction, exportReportsToCSVAction } from "../actions";
import { formatRupiah, formatDate } from "@/lib/utils";

type AffiliateReportsProps = {
  events: Array<{ id: string; code: string; name: string }>;
};

export default function AffiliateReports({ events }: AffiliateReportsProps) {
  const [reports, setReports] = useState<AffiliateLog[]>([]);
  const [filteredReports, setFilteredReports] = useState<AffiliateLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters State
  const [filterCode, setFilterCode] = useState("all");
  const [filterEvent, setFilterEvent] = useState("all");

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAffiliateReportsAction();
      if (res.success && res.data) {
        setReports(res.data);
        setFilteredReports(res.data);
      } else {
        setError(res.message || "Gagal memuat laporan transaksi.");
      }
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Apply filters client-side
  useEffect(() => {
    let list = [...reports];
    
    if (filterCode !== "all") {
      list = list.filter((r) => r.affiliate_code === filterCode);
    }
    
    if (filterEvent !== "all") {
      // match by event name or slug
      const matchingEvent = events.find(e => e.id === filterEvent);
      if (matchingEvent) {
        list = list.filter((r) => r.event_name === matchingEvent.name);
      }
    }

    setFilteredReports(list);
  }, [reports, filterCode, filterEvent, events]);

  const handleExportCSV = async () => {
    try {
      const res = await exportReportsToCSVAction();
      if (res.success && res.csvString) {
        // Trigger download
        const blob = new Blob([res.csvString], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `laporan-afiliasi-${new Date().toISOString().slice(0, 10)}.csv`);
        link.style.visibility = "hidden";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert(res.message || "Gagal membuat CSV.");
      }
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat mengekspor laporan.");
    }
  };

  // Calculations
  const totalTransactionsCount = filteredReports.length;
  const totalRevenue = filteredReports.reduce((sum, item) => sum + item.total_amount, 0);

  // Extract unique affiliate codes for filter dropdown
  const uniqueCodes = Array.from(new Set(reports.map(r => r.affiliate_code)));

  return (
    <div className="flex flex-col gap-5">
      {/* 2 Stats Mini Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-[#EFF6FF] border border-blue-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider">Tiket Rujukan Terjual</span>
            <span className="text-xl font-extrabold text-[#2C1F63]">{totalTransactionsCount} Transaksi</span>
          </div>
          <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-blue-600 shadow-xs border border-blue-100">
            <Tag className="h-5 w-5" />
          </div>
        </div>

        <div className="bg-[#ECFDF5] border border-emerald-100 rounded-2xl p-4 flex items-center justify-between shadow-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">Total Pembayaran Terlacak</span>
            <span className="text-xl font-extrabold text-[#2C1F63]">{formatRupiah(totalRevenue)}</span>
          </div>
          <div className="h-10 w-10 bg-white rounded-full flex items-center justify-center text-emerald-600 shadow-xs border border-emerald-100">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Filter and Export Bar */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter Affiliator */}
          <div className="flex flex-col gap-1 min-w-[150px]">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Affiliator</label>
            <select
              value={filterCode}
              onChange={(e) => setFilterCode(e.target.value)}
              className="text-xs font-semibold rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 focus:outline-none"
            >
              <option value="all">Semua Kode</option>
              {uniqueCodes.map(code => (
                <option key={code} value={code}>{code}</option>
              ))}
            </select>
          </div>

          {/* Filter Event */}
          <div className="flex flex-col gap-1 min-w-[180px]">
            <label className="text-[10px] font-bold text-gray-500 uppercase">Event</label>
            <select
              value={filterEvent}
              onChange={(e) => setFilterEvent(e.target.value)}
              className="text-xs font-semibold rounded-xl border border-gray-200 bg-white px-2.5 py-1.5 focus:outline-none"
            >
              <option value="all">Semua Event</option>
              {events.map(evt => (
                <option key={evt.id} value={evt.id}>{evt.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={fetchReports}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors cursor-pointer border border-gray-200 bg-white shadow-xs"
            title="Refresh Laporan"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          
          <Button
            onClick={handleExportCSV}
            disabled={loading || filteredReports.length === 0}
            variant="default"
            className="rounded-xl border border-black bg-[#CAFF04] hover:bg-[#b0df03] text-black font-extrabold text-xs h-9 px-4 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            <span>Ekspor CSV</span>
          </Button>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white border border-gray-200/80 rounded-2xl p-4 shadow-xs flex flex-col gap-4">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-start gap-2 text-sm font-semibold">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && reports.length === 0 ? (
          <div className="py-10 text-center text-xs text-gray-400 font-bold">
            Memuat laporan transaksi...
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="py-10 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center text-center gap-2">
            <div className="h-10 w-10 bg-gray-50 rounded-full flex items-center justify-center border border-gray-200 text-gray-400">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h4 className="text-xs font-bold text-gray-700">Tidak Ada Transaksi Afiliasi</h4>
              <p className="text-[10px] text-gray-400 font-semibold">Belum ada pembelian tiket melalui link rujukan partner Anda.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200/80 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-200 font-bold text-gray-500">
                  <th className="p-3">Tanggal</th>
                  <th className="p-3">Pembeli</th>
                  <th className="p-3">Event</th>
                  <th className="p-3">Kode Rujukan</th>
                  <th className="p-3 text-right">Pembayaran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredReports.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50/40 transition-colors font-semibold text-gray-700">
                    <td className="p-3 text-gray-500">
                      {item.created_at ? formatDate(item.created_at) : "-"}
                    </td>
                    <td className="p-3 font-extrabold text-[#2C1F63]">{item.buyer_name}</td>
                    <td className="p-3 text-gray-800">{item.event_name}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 border border-blue-200 text-blue-700">
                        {item.affiliate_code}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold text-gray-900">
                      {formatRupiah(item.total_amount)}
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
