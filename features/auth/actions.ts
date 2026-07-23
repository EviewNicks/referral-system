"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { success: false, message: "Email dan password wajib diisi." };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      let msg = error.message || "Gagal masuk. Periksa email dan password.";
      if (msg.toLowerCase().includes("invalid login")) {
        msg = "Email atau password salah. Belum punya akun? Silakan daftar terlebih dahulu.";
      } else if (msg.toLowerCase().includes("email not confirmed")) {
        msg = "Email belum dikonfirmasi. Hubungi administrator.";
      }
      return { success: false, message: msg };
    }

    const role = data.user?.user_metadata?.role || "USER";

    if (role === "SUPER_ADMIN" || role === "ADMIN") {
      redirect("/admin");
    } else {
      redirect("/");
    }
  } catch (err) {
    // Next.js redirect throws a special error, rethrow it
    if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
      throw err;
    }
    return {
      success: false,
      message: err instanceof Error ? err.message : "Terjadi kesalahan internal saat login.",
    };
  }
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function registerAction(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!name || !email || !password) {
    return { success: false, message: "Semua field wajib diisi." };
  }

  if (password.length < 8) {
    return { success: false, message: "Password minimal 8 karakter." };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { role: "USER", name },
      },
    });

    if (error) {
      return { success: false, message: error.message };
    }

    if (!data.user) {
      return { success: false, message: "Gagal membuat akun. Silakan coba lagi." };
    }

    // Auto-confirm email via SQL — bypass Supabase email confirmation requirement
    try {
      await prisma.$executeRaw`
        UPDATE auth.users 
        SET email_confirmed_at = NOW() 
        WHERE id = ${data.user.id}::uuid
        AND email_confirmed_at IS NULL
      `;
    } catch {
      // Non-blocking: if SQL confirm fails, user can still try to login
    }

    redirect("/login?registered=true");
  } catch (err) {
    if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
      throw err;
    }
    return {
      success: false,
      message: err instanceof Error ? err.message : "Terjadi kesalahan saat mendaftar.",
    };
  }
}
