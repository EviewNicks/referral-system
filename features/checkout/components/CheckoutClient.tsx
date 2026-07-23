"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Minus, 
  Plus, 
  User, 
  Mail, 
  Phone, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck
} from "lucide-react";
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

  const ticketSubtotal = forms.reduce((sum, f) => sum + f.price, 0);
  const adminFeePerTicket = event.admin_fee || 10000;
  const totalAdminFee = forms.length * adminFeePerTicket;
  const grandTotal = ticketSubtotal + totalAdminFee;

  const isValidWhatsAppNumber = (phone: string) => {
    if (!phone) return false;
    const clean = phone.replace(/[^0-9]/g, "");
    return /^(?:62|0)8[1-9][0-9]{7,12}$/.test(clean);
  };

  const isFormValid = () => {
    if (!agreed) return false;
    if (forms.length === 0) return false;
    return forms.every(f => 
      f.customerName.trim() !== "" &&
      f.customerEmail.trim() !== "" &&
      isValidWhatsAppNumber(f.customerPhone) &&
      f.customerBirthDate.trim() !== "" &&
      f.customerGender !== ""
    );
  };

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
        customerBirthDate: f.customerBirthDate,
        customerGender: f.customerGender,
        ticketCategoryId: f.ticketCategoryId,
        price: f.price,
      })),
      refCode: refCode || undefined
    };

    const res = await createOrderAction(payload);
    setIsSubmitting(false);

    if (res.success && res.orderId) {
      setSuccessOrder(res.orderId);
      sessionStorage.removeItem(`affil_${event.id}`);
    } else {
      setErrorMsg(res.message || "Gagal membuat pesanan. Silakan coba lagi.");
    }
  };

  if (successOrder) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4">
        <div className="bg-white border-2 border-black rounded-[24px] p-8 max-w-lg w-full text-center shadow-[6px_6px_0px_#000] flex flex-col items-center gap-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="h-16 w-16 bg-[#CAFF04] rounded-full border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_#000]">
            <ShieldCheck className="h-8 w-8 text-black" />
          </div>
          
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-black text-[#2C1F63]">Pesanan Berhasil!</h2>
            <p className="text-xs text-gray-500 font-bold">
              Terima kasih telah melakukan pemesanan. E-Tiket Anda telah terbit dan siap digunakan.
            </p>
          </div>

          <div className="p-4 bg-[#FAF9FD] rounded-xl border border-gray-200 w-full flex flex-col gap-1.5 text-left">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-wider">Order ID</span>
            <span className="text-sm font-black text-[#2C1F63] font-mono">{successOrder}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <Button
              onClick={() => router.push(`/orders/${successOrder}`)}
              className="flex-1 py-3 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-black text-xs rounded-xl shadow-sm transition-all"
            >
              Lihat Detail E-Tiket
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push("/")}
              className="py-3 font-bold text-xs rounded-xl border-2 border-gray-200"
            >
              Kembali ke Beranda
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        
        <div className="flex flex-col gap-2 mb-8">
          <h1 className="text-2xl font-black text-[#2C1F63]">Checkout Tiket</h1>
          <p className="text-xs text-gray-500 font-bold">Lengkapi data pemesan untuk melanjutkan transaksi</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {forms.length > 1 && (
              <div className="p-4 bg-white border-2 border-gray-100 rounded-xl shadow-sm flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700">Samakan semua data pengunjung dengan Pemesan Pertama?</span>
                <input 
                  type="checkbox" 
                  checked={useOneData} 
                  onChange={(e) => handleUseOneDataChange(e.target.checked)}
                  className="h-4 w-4 accent-[#2C1F63] rounded cursor-pointer"
                />
              </div>
            )}

            {forms.map((form, index) => {
              const isPhoneInvalid = form.customerPhone.trim() !== "" && !isValidWhatsAppNumber(form.customerPhone);
              return (
                <div key={index} className="p-6 bg-white border-2 border-gray-100 rounded-2xl shadow-sm flex flex-col gap-5">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <span className="text-xs font-black text-[#2C1F63] uppercase tracking-wider">
                      Tiket #{index + 1} — {form.ticketCategoryName}
                    </span>
                    <span className="text-xs font-extrabold text-gray-500">
                      {formatRupiah(form.price)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                        <User className="h-3.5 w-3.5 text-gray-400" /> Nama Lengkap <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="text"
                        placeholder="Nama sesuai identitas"
                        value={form.customerName}
                        onChange={(e) => handleInputChange(index, "customerName", e.target.value)}
                        disabled={useOneData && index > 0}
                        className="border-2 border-gray-200 focus-visible:border-black rounded-[10px]"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                        <Mail className="h-3.5 w-3.5 text-gray-400" /> Email <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="email"
                        placeholder="email@contoh.com"
                        value={form.customerEmail}
                        onChange={(e) => handleInputChange(index, "customerEmail", e.target.value)}
                        disabled={useOneData && index > 0}
                        className="border-2 border-gray-200 focus-visible:border-black rounded-[10px]"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                        <Phone className="h-3.5 w-3.5 text-gray-400" /> No. WhatsApp <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="tel"
                        placeholder="08123456789"
                        value={form.customerPhone}
                        onChange={(e) => handleInputChange(index, "customerPhone", e.target.value)}
                        disabled={useOneData && index > 0}
                        className={`border-2 rounded-[10px] ${
                          isPhoneInvalid 
                            ? "border-red-500 focus-visible:border-red-600 bg-red-50/20" 
                            : "border-gray-200 focus-visible:border-black"
                        }`}
                        required
                      />
                      {isPhoneInvalid && (
                        <span className="text-[10px] text-red-500 font-bold">
                          Format WhatsApp tidak valid
                        </span>
                      )}
                    </div>

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
              );
            })}

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
