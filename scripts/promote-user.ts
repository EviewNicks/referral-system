import { prisma } from "../lib/prisma";

const targetEmail = process.argv[2] || "maguru255@gmail.com";
const newRole = process.argv[3] || "SUPER_ADMIN";

async function promoteUser() {
  console.log(`🚀 Mengubah role pengguna: ${targetEmail} -> ${newRole}...`);

  try {
    const updatedCount = await prisma.$executeRawUnsafe(`
      UPDATE auth.users 
      SET raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb), 
        '{role}', 
        '"${newRole}"'
      )
      WHERE email = '${targetEmail}';
    `);

    if (updatedCount > 0) {
      console.log(`✅ BERHASIL! Role pengguna ${targetEmail} telah diubah menjadi ${newRole}.`);
    } else {
      console.log(`⚠️ Email ${targetEmail} tidak ditemukan di tabel auth.users.`);
    }

    const users: any = await prisma.$queryRawUnsafe(`
      SELECT id, email, raw_user_meta_data->>'role' as role, raw_user_meta_data->>'name' as name
      FROM auth.users
      WHERE email = '${targetEmail}';
    `);
    console.table(users);

  } catch (err) {
    console.error("❌ Gagal mengupdate role:", err);
  } finally {
    await prisma.$disconnect();
  }
}

promoteUser();
