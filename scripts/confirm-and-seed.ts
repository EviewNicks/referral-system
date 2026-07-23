import { prisma } from "../lib/prisma";

async function confirmAndSeed() {
  console.log("⚡ Memeriksa & Mengonfirmasi Email Akun di Database Supabase...");

  try {
    // 1. Auto-confirm ALL emails in auth.users table directly via SQL (bypass Supabase Auth Rate Limit & Email Confirmation Error)
    const updateCount = await prisma.$executeRawUnsafe(`
      UPDATE auth.users 
      SET email_confirmed_at = NOW() 
      WHERE email_confirmed_at IS NULL;
    `);

    console.log(`✅ Berhasil meng-konfirmasi ${updateCount} email di auth.users Supabase!`);

    // 2. Fetch all users from auth.users to display exact credentials
    const users: any = await prisma.$queryRawUnsafe(`
      SELECT id, email, email_confirmed_at, raw_user_meta_data 
      FROM auth.users;
    `);

    console.log("\n📋 DAFTAR AKUN AUTH DI DATABASE SUPABASE:");
    console.table(users);

  } catch (err) {
    console.error("❌ SQL Execution Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

confirmAndSeed();
