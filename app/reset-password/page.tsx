"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import { updatePasswordAction } from "@/features/auth/actions";

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    try {
      const res = await updatePasswordAction(null, formData);
      if (res && !res.success) {
        setErrorMsg(res.message);
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
        return;
      }
      setErrorMsg("Gagal memperbarui password. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#2C1F63] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden font-sans">
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-white border border-gray-100 rounded-3xl p-8 shadow-2xl z-10 flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <Link href="/" className="flex items-center gap-2 mb-1">
            <Image src="/logo/logo.png" alt="Kartjis Logo" width={36} height={36} className="h-9 w-9 object-contain rounded-lg" />
            <span className="font-black text-xl tracking-wider text-black">KARTJIS.ID</span>
          </Link>
          <h1 className="text-xl font-extrabold text-black tracking-tight">Setel Ulang Password</h1>
          <p className="text-xs text-gray-500 font-medium leading-relaxed">
            Masukkan password baru Anda di bawah ini untuk mengamankan akun.
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs font-bold text-rose-700 text-center">
            {errorMsg}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-extrabold text-gray-700">Password Baru</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                required
                placeholder="Minimal 8 karakter"
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#2C1F63] text-black transition-all"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 text-gray-400 hover:text-black transition-colors">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-extrabold text-gray-700">Konfirmasi Password Baru</label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3.5 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                name="confirmPassword"
                required
                placeholder="Ulangi password baru"
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:bg-white focus:border-[#2C1F63] text-black transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#2C1F63] hover:bg-[#201549] text-white rounded-xl text-xs font-extrabold shadow-md transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-50"
          >
            <span>{loading ? "Memproses..." : "Simpan Password Baru"}</span>
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </form>

        {/* Navigation Link */}
        <div className="text-center border-t border-gray-100 pt-4">
          <Link href="/login" className="text-xs font-bold text-gray-500 hover:text-[#2C1F63] transition-colors">
            Kembali ke Halaman Login
          </Link>
        </div>

      </div>
    </div>
  );
}
