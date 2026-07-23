import { createClient } from "@supabase/supabase-js";
import { prisma } from "../lib/prisma";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function seedUsers() {
  console.log("🌱 Seed Akun Auth di Supabase...");

  // 1. Akun Admin (SUPER_ADMIN)
  const adminEmail = "admin.kartjis@gmail.com";
  const adminPassword = "admin123456Password!";

  const { data: adminData, error: adminErr } = await supabase.auth.signUp({
    email: adminEmail,
    password: adminPassword,
    options: {
      data: {
        role: "SUPER_ADMIN",
        name: "Admin Kartjis",
      },
    },
  });

  if (adminErr) {
    console.log(`ℹ️ Info Admin (${adminEmail}): ${adminErr.message}`);
  } else {
    console.log(`✅ Akun Admin Berhasil Dibuat: ${adminEmail}`);
  }

  // 2. Akun User Regular (USER)
  const userEmail = "user.kartjis@gmail.com";
  const userPassword = "user123456Password!";

  const { data: userData, error: userErr } = await supabase.auth.signUp({
    email: userEmail,
    password: userPassword,
    options: {
      data: {
        role: "USER",
        name: "User Kartjis",
      },
    },
  });

  if (userErr) {
    console.log(`ℹ️ Info User (${userEmail}): ${userErr.message}`);
  } else {
    console.log(`✅ Akun User Berhasil Dibuat: ${userEmail}`);
  }

  // 3. AUTO-CONFIRM EMAILS IN SUPABASE DATABASE (BYPASS EMAIL CONFIRMATION ERROR)
  try {
    console.log("⚡ Mengaktifkan Status Email Confirmed secara langsung di database Supabase...");
    await prisma.$executeRawUnsafe(`
      UPDATE auth.users 
      SET email_confirmed_at = NOW() 
      WHERE email IN ('admin.kartjis@gmail.com', 'user.kartjis@gmail.com');
    `);
    console.log("🎉 SUCCESS: Email otomatis ter-konfirmasi (email_confirmed_at updated)!");
  } catch (sqlErr) {
    console.error("⚠️ Gagal meng-update status email_confirmed_at via SQL:", sqlErr);
  }

  console.log("\n=======================================================");
  console.log("🔑 KREDENSIAL AKUN TERVERIFIKASI & SIAP DIGUNAKAN:");
  console.log("1. AKUN ADMIN:");
  console.log("   • Email    : admin.kartjis@gmail.com");
  console.log("   • Password : admin123456Password!");
  console.log("   • Role     : SUPER_ADMIN (Redirect ke /admin)");
  console.log("\n2. AKUN USER:");
  console.log("   • Email    : user.kartjis@gmail.com");
  console.log("   • Password : user123456Password!");
  console.log("   • Role     : USER (Redirect ke Beranda /)");
  console.log("=======================================================\n");

  await prisma.$disconnect();
}

seedUsers();
