import { prisma } from "../lib/prisma";

async function sqlSeedUsers() {
  console.log("⚡ Creating confirmed @gmail.com accounts directly via SQL...");

  try {
    // 1. Ensure pgcrypto extension exists for bcrypt password hashing
    await prisma.$executeRawUnsafe(`CREATE EXTENSION IF NOT EXISTS pgcrypto;`);

    // 2. Clean old test users
    await prisma.$executeRawUnsafe(`DELETE FROM auth.users WHERE email LIKE '%kartjis%' OR email LIKE '%@gmail.com%';`);

    // 3. Insert Admin Account (admin.kartjis@gmail.com)
    await prisma.$executeRawUnsafe(`
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'admin.kartjis@gmail.com',
        crypt('admin123456Password!', gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"role":"SUPER_ADMIN","name":"Admin Kartjis"}',
        NOW(),
        NOW()
      );
    `);
    console.log("✅ Admin Account inserted & confirmed: admin.kartjis@gmail.com");

    // 4. Insert Regular User Account (user.kartjis@gmail.com)
    await prisma.$executeRawUnsafe(`
      INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'user.kartjis@gmail.com',
        crypt('user123456Password!', gen_salt('bf')),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"role":"USER","name":"User Kartjis"}',
        NOW(),
        NOW()
      );
    `);
    console.log("✅ User Account inserted & confirmed: user.kartjis@gmail.com");

    const users: any = await prisma.$queryRawUnsafe(`SELECT id, email, email_confirmed_at, raw_user_meta_data FROM auth.users;`);
    console.log("\n📋 AKUN SEEDED DI SUPABASE DATABASE:");
    console.table(users);

  } catch (err) {
    console.error("❌ SQL Seed Error:", err);
  } finally {
    await prisma.$disconnect();
  }
}

sqlSeedUsers();
