import { prisma } from "../lib/prisma";

async function deleteUsers() {
  const targetEmails = ["admin.kartjis@gmail.com", "user.kartjis@gmail.com"];

  console.log(`🗑️ Menghapus akun test dari Supabase auth.users:`, targetEmails);

  try {
    const result = await prisma.$executeRawUnsafe(
      `DELETE FROM auth.users WHERE email IN ('admin.kartjis@gmail.com', 'user.kartjis@gmail.com')`
    );

    console.log(`✅ BERHASIL! Jumlah akun yang telah dihapus: ${result}`);
  } catch (error) {
    console.error("❌ Error menghapus akun:", error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteUsers();
