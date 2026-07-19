"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, User, Mail, Phone, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatRupiah } from "@/lib/utils";
import { createOrderAction } from "../actions";

type TicketType = {
  id: string;
  name: string;
  price: number;
};

type EventDetail = {
  id: string;
  name: string;
  city: string;
  location: string;
  thumbnail_image: string | null;
  admin_fee: number | null;
};

type CheckoutClientProps = {
  event: EventDetail;
  ticketsToBuy: Array<{
    category: TicketType;
    quantity: number;
  }>;
  refCode?: string;
};

type PassengerForm = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerBirthDate: string;
  customerGender: string;
  ticketCategoryId: string;
  ticketCategoryName: string;
  price: number;
};

export default function CheckoutClient({ event, ticketsToBuy, refCode }: CheckoutClientProps) {
  const router = useRouter();
  const [forms, setForms] = useState<PassengerForm[]>(() => {
    const list: PassengerForm[] = [];
    ticketsToBuy.forEach((item) => {
      for (let i = 0; i < item.quantity; i++) {
        list.push({
          customerName: "",
          customerEmail: "",
          customerPhone: "",
          customerBirthDate: "",
          customerGender: "",
          ticketCategoryId: item.category.id,
          ticketCategoryName: item.category.name,
          price: item.category.price,
        });
      }
    });
    return list;
  });
  const [useOneData, setUseOneData] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleUseOneDataChange = (checked: boolean) => {
    setUseOneData(checked);
    if (checked && forms.length > 1) {
      const source = forms[0];
      setForms(prev =>
        prev.map((form, index) =>
          index === 0 ? form : {
            ...form,
            customerName: source.customerName,
            customerEmail: source.customerEmail,
            customerPhone: source.customerPhone,
            customerBirthDate: source.customerBirthDate,
            customerGender: source.customerGender,
          }
        )
      );
    }
  };

  const handleInputChange = (index: number, field: keyof PassengerForm, value: string) => {
    setForms(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      
      // If we change form 0 and useOneData is checked, propagate to other forms immediately
      if (useOneData && index === 0) {
        for (let i = 1; i < copy.length; i++) {
          copy[i] = {
            ...copy[i],
            [field]: value
          };
        }
      }
      return copy;
    });
  };

  const handleGenderSelect = (index: number, gender: string) => {
    handleInputChange(index, "customerGender", gender);
  };

  // Calculations
  const ticketSubtotal = forms.reduce((sum, f) => sum + f.price, 0);
  const adminFeePerTicket = event.admin_fee || 10000;
  const totalAdminFee = forms.length * adminFeePerTicket;
  const grandTotal = ticketSubtotal + totalAdminFee;

  // Validation
  const isFormValid = () => {
    if (!agreed) return false;
    if (forms.length === 0) return false;
    return forms.every(f => 
      f.customerName.trim() !== "" &&
      f.customerEmail.trim() !== "" &&
      f.customerPhone.trim() !== "" &&
      f.customerBirthDate.trim() !== "" &&
      f.customerGender !== ""
    );
  };

  // Submit checkout
  const handleSubmit = async () => {
    if (!isFormValid()) return;
    setIsSubmitting(true);
    setErrorMsg(null);

    const payload = {
      eventId: event.id,
      totalPrice: grandTotal,
      adminFee: totalAdminFee,
      tickets: forms.map(f => ({
        customerName: f.customerName,
        customerEmail: f.customerEmail,
        customerPhone: f.customerPhone,
        customerGender: f.customerGender,
        customerBirthDate: f.customerBirthDate,
        ticketCategoryId: f.ticketCategoryId,
        price: f.price,
      })),
      refCode: refCode || undefined
    };

    const res = await createOrderAction(payload);
    setIsSubmitting(false);

    if (res.success && res.orderId) {
      setSuccessOrder(res.orderId);
      // Remove affiliate code from session storage after success
      sessionStorage.removeItem(`affil_${event.id}`);
    } else {
      setErrorMsg(res.message || "Gagal membuat pesanan. Silakan coba lagi.");
    }
  };

  // Render Success Modal State
  if (successOrder) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="bg-white border-2 border-black rounded-[24px] p-8 max-w-lg w-full text-center shadow-[6px_6px_0px_#000] flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="h-16 w-16 bg-[#CAFF04] rounded-full border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
            <CheckCircle2 className="h-10 w-10 text-black" />
          </div>
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-extrabold text-black">Pemesanan Berhasil!</h1>
            <p className="text-sm text-gray-500 font-semibold">
              Rincian e-ticket telah dikirimkan ke e-mail masing-masing pengunjung.
            </p>
          </div>
          
          {/* Order ID Banner */}
          <div className="w-full bg-gray-50 border-2 border-black rounded-[16px] p-4 flex flex-col gap-1 shadow-[2px_2px_0px_#000]">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">ID Pemesanan</span>
            <span className="text-xl font-extrabold text-[#2C1F63] tracking-wide">{successOrder}</span>
          </div>

          <div className="w-full flex flex-col gap-3 mt-2">
            <Link href={`/orders/${successOrder}`} className="w-full">
              <Button variant="default" className="w-full border-2 border-black font-extrabold bg-[#CAFF04] hover:bg-[#b0df03] text-black shadow-[2px_2px_0px_#000] cursor-pointer">
                Lihat E-Tiket Saya
              </Button>
            </Link>
            <Link href="/" className="w-full text-center text-xs font-bold text-gray-500 hover:text-black transition-colors">
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header breadcrumb & navigation */}
      <div className="flex items-center justify-between mb-8">
        <button 
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm font-bold text-gray-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </button>
        
        {/* Step Indicator (Static) */}
        <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-400 select-none">
          <span className="text-[#2E4EEA]">Personal Information</span>
          <span>&gt;&gt;</span>
          <span>Checkout</span>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 text-red-700 rounded-[12px] flex items-start gap-2.5 font-semibold text-sm">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Forms */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Quick Copy Feature Banner */}
          {forms.length > 1 && (
            <div className="bg-[#EBF5FF] border-2 border-[#2E4EEA] rounded-[16px] p-4 flex items-center justify-between shadow-[3px_3px_0px_#2E4EEA]">
              <div className="flex flex-col gap-0.5">
                <h4 className="font-extrabold text-sm text-[#2E4EEA]">Lebih cepat dengan satu data!</h4>
                <p className="text-xs text-blue-800 font-semibold">Gunakan informasi pengunjung pertama untuk seluruh tiket lainnya.</p>
              </div>
              <input
                type="checkbox"
                id="one-data"
                checked={useOneData}
                onChange={(e) => handleUseOneDataChange(e.target.checked)}
                className="h-5 w-5 rounded border-2 border-black focus:ring-[#2E4EEA] text-[#2E4EEA] cursor-pointer"
              />
            </div>
          )}

          {/* Passenger Forms List */}
          {forms.map((form, index) => (
            <div 
              key={index}
              className="bg-white border-2 border-black rounded-[20px] p-5 sm:p-6 shadow-[5px_5px_0px_#000] flex flex-col gap-5"
            >
              <h3 className="font-extrabold text-base sm:text-lg text-[#2C1F63]">
                Personal Information #{index + 1}: {form.ticketCategoryName}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name field */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-gray-400" /> Nama Lengkap <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="nama lengkap"
                    value={form.customerName}
                    onChange={(e) => handleInputChange(index, "customerName", e.target.value)}
                    disabled={useOneData && index > 0}
                    className="border-2 border-gray-200 focus-visible:border-black rounded-[10px]"
                    required
                  />
                </div>

                {/* Email field */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <Mail className="h-3.5 w-3.5 text-gray-400" /> Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="email"
                    value={form.customerEmail}
                    onChange={(e) => handleInputChange(index, "customerEmail", e.target.value)}
                    disabled={useOneData && index > 0}
                    className="border-2 border-gray-200 focus-visible:border-black rounded-[10px]"
                    required
                  />
                </div>

                {/* Phone Number field */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <Phone className="h-3.5 w-3.5 text-gray-400" /> Phone Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="tel"
                    placeholder="phone number"
                    value={form.customerPhone}
                    onChange={(e) => handleInputChange(index, "customerPhone", e.target.value)}
                    disabled={useOneData && index > 0}
                    className="border-2 border-gray-200 focus-visible:border-black rounded-[10px]"
                    required
                  />
                </div>

                {/* Date of Birth field */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" /> Tanggal Lahir <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="date"
                    value={form.customerBirthDate}
                    onChange={(e) => handleInputChange(index, "customerBirthDate", e.target.value)}
                    disabled={useOneData && index > 0}
                    className="border-2 border-gray-200 focus-visible:border-black rounded-[10px]"
                    required
                  />
                </div>
              </div>

              {/* Gender Radio Choice field */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-700">
                  Jenis Kelamin <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  <button
                    type="button"
                    onClick={() => handleGenderSelect(index, "Laki-Laki")}
                    disabled={useOneData && index > 0}
                    className={`flex items-center justify-center gap-1.5 py-2.5 border-2 rounded-[10px] font-bold text-sm transition-all select-none cursor-pointer ${
                      form.customerGender === "Laki-Laki"
                        ? "bg-black text-white border-black"
                        : "bg-white text-gray-600 border-gray-200 hover:border-black"
                    }`}
                  >
                    ♂️ Laki-Laki
                  </button>
                  <button
                    type="button"
                    onClick={() => handleGenderSelect(index, "Perempuan")}
                    disabled={useOneData && index > 0}
                    className={`flex items-center justify-center gap-1.5 py-2.5 border-2 rounded-[10px] font-bold text-sm transition-all select-none cursor-pointer ${
                      form.customerGender === "Perempuan"
                        ? "bg-black text-white border-black"
                        : "bg-white text-gray-600 border-gray-200 hover:border-black"
                    }`}
                  >
                    ♀️ Perempuan
                  </button>
                </div>
              </div>

            </div>
          ))}

          {/* Terms checkbox */}
          <div className="flex items-start gap-2.5 p-2 mb-6">
            <input
              type="checkbox"
              id="agreed"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="h-5 w-5 mt-0.5 rounded border-2 border-black focus:ring-[#2C1F63] text-[#2C1F63] cursor-pointer"
            />
            <label htmlFor="agreed" className="text-xs text-gray-600 font-semibold leading-relaxed cursor-pointer select-none">
              By clicking this &quot;CheckBox&quot; you have agreed to <Link href="/terms" className="text-[#2E4EEA] underline font-bold">Terms & Condition</Link> and <Link href="/privacy" className="text-[#2E4EEA] underline font-bold">Privacy Policy</Link> of Kartjis.
            </label>
          </div>

        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:col-span-4 sticky lg:top-24 flex flex-col gap-6">
          <div className="bg-white border-2 border-black rounded-[20px] p-5 shadow-[5px_5px_0px_#000] flex flex-col gap-5">
            <h3 className="font-extrabold text-base sm:text-lg text-black">
              Pesanan anda
            </h3>

            {/* Horizontal Mini Event Card */}
            <div className="flex gap-3 p-3 bg-gray-50 border-2 border-black rounded-[14px]">
              <div className="relative h-12 w-20 rounded-[8px] overflow-hidden border border-black shrink-0 bg-gray-200">
                <Image
                  src={event.thumbnail_image || "/images/placeholder.png"}
                  alt={event.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col min-w-0 justify-center gap-0.5">
                <h4 className="font-extrabold text-xs sm:text-sm text-black truncate">{event.name}</h4>
                <span className="text-[10px] text-gray-400 font-bold truncate">{event.location}</span>
              </div>
            </div>

            {/* Ticket breakdown list */}
            <div className="flex flex-col gap-3 border-t border-b border-gray-100 py-4 font-semibold text-xs sm:text-sm text-gray-600">
              {ticketsToBuy.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span>{item.category.name}</span>
                  <div className="flex items-center gap-4 text-black">
                    <span>{item.quantity}x</span>
                    <span className="font-extrabold">{formatRupiah(item.category.price * item.quantity)}</span>
                  </div>
                </div>
              ))}

              {/* Admin fee row */}
              <div className="flex justify-between items-center pt-2">
                <span>Admin Fee ({forms.length}x)</span>
                <span className="font-extrabold text-black">{formatRupiah(totalAdminFee)}</span>
              </div>
            </div>

            {/* Total Row */}
            <div className="flex justify-between items-center">
              <span className="text-sm font-extrabold text-black">Total ({forms.length} Kartjis)</span>
              <span className="text-lg font-extrabold text-[#2E4EEA]">
                {formatRupiah(grandTotal)}
              </span>
            </div>

            {/* Submit Button */}
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid() || isSubmitting}
              className="w-full h-12 bg-white text-black border-2 border-black shadow-[3px_3px_0px_#000] disabled:opacity-30 disabled:pointer-events-none hover:bg-black hover:text-white transition-all font-extrabold text-sm rounded-full flex items-center justify-center cursor-pointer select-none"
            >
              {isSubmitting ? "Memproses..." : "Beli Kartjis Sekarang"}
            </Button>

          </div>
        </div>

      </div>

    </div>
  );
}
