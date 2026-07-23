import { createClient } from "@supabase/supabase-js";
import { prisma } from "../lib/prisma";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function reseedGmail() {
  console.log("🧹 Membersihkan akun lama & mendaftarkan akun @gmail.com...");

  try {
    // 1. Delete old test users from auth.users directly via SQL
    await prisma.$executeRawUnsafe(`DELETE FROM auth.users WHERE email LIKE '%kartjis%';`);
    console.log("✅ Data akun auth lama berhasil dibersihkan!");
  } catch (e) {
    console.log("Info clean:", e);
  }

  // 2. Create admin.kartjis@gmail.com
  const adminEmail = "admin.kartjis@gmail.com";
  const adminPassword = "admin123456Password!";

  const { error: adminErr } = await supabase.auth.signUp({
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
    console.log(`Admin signUp info: ${adminErr.message}`);
  }

  // 3. Create user.kartjis@gmail.com
  const userEmail = "user.kartjis@gmail.com";
  const userPassword = "user123456Password!";

  const { error: userErr } = await supabase.auth.signUp({
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
    console.log(`User signUp info: ${userErr.message}`);
  }

  // 4. Auto confirm email_confirmed_at via SQL directly
  await prisma.$executeRawUnsafe(`
    UPDATE auth.users 
    SET email_confirmed_at = NOW() 
    WHERE email IN ('admin.kartjis@gmail.com', 'user.kartjis@gmail.com');
  `);

  console.log("\n🎉 SUCCESS: Akun @gmail.com berhasil dibuat & ter-konfirmasi!");

  const users: any = await prisma.$queryRawUnsafe(`SELECT id, email, email_confirmed_at, raw_user_meta_data FROM auth.users;`);
  console.table(users);

  await prisma.$disconnect();
}

reseedGmail();
