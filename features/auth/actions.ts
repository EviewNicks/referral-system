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

export async function forgotPasswordAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  if (!email) {
    return { success: false, message: "Email wajib diisi." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "https://kartjis.netlify.app"}/reset-password`,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return { 
      success: true, 
      message: "Instruksi reset password telah dikirimkan ke e-mail Anda. Silakan periksa kotak masuk." 
    };
  } catch (err) {
    return {
      success: false,
      message: err instanceof Error ? err.message : "Terjadi kesalahan saat meminta reset password.",
    };
  }
}

export async function updatePasswordAction(prevState: any, formData: FormData) {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return { success: false, message: "Semua field wajib diisi." };
  }

  if (password !== confirmPassword) {
    return { success: false, message: "Password dan konfirmasi password tidak cocok." };
  }

  if (password.length < 8) {
    return { success: false, message: "Password minimal 8 karakter." };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      return { success: false, message: error.message };
    }

    redirect("/login?reset=success");
  } catch (err) {
    if (err instanceof Error && err.message.includes("NEXT_REDIRECT")) {
      throw err;
    }
    return {
      success: false,
      message: err instanceof Error ? err.message : "Gagal memperbarui password.",
    };
  }
}

