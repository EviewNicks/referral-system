# Implementation Plan - Admin Dashboard and Customer E-Ticket Detail Pages (Optimized via Ponytail)

## Goal Description
Sebelum melangkah ke Fase 2 (Referral & Affiliate System), kita akan menambahkan dua halaman utama dengan arsitektur super-lean (bebas dari over-engineering):
1. **Admin Dashboard (`/admin`)**: Menampilkan daftar transaksi tiket yang masuk. Dilengkapi dengan autentikasi berbasis parameter rahasia di URL (`?secret=...`). Jika parameter salah atau kosong, sistem akan memicu `notFound()` (404) demi keamanan maksimal.
2. **Customer E-Ticket View (`/orders/[id]`)**: Halaman detail tanda terima & tiket digital pembeli setelah checkout berhasil. Setiap tiket yang dibeli akan ditampilkan sebagai kartu brutalist individual lengkap dengan data pengunjung dan simulated QR Code.

### Rekomendasi Ponytail (Lean Architecture):
- **Tanpa Client Form untuk Admin**: Autentikasi admin ditangani 100% di sisi server. Cukup menggunakan query string URL rahasia, sehingga meniadakan interaksi client-side form login, state input sandi, dan penyimpanan `sessionStorage`.
- **E-Tiket Murni Server Component**: Halaman `/orders/[id]` dikembangkan sebagai Server Component murni yang langsung merender antarmuka brutalist dan gambar SVG simulated QR Code, memangkas kebutuhan Client Component terpisah.

---

## User Review Required
> [!IMPORTANT]
> **Modifikasi Skema Database**: Kita akan menambahkan kolom `affiliate_code` (opsional) di tabel `orders` melalui file `schema.prisma` dan menyelaraskannya ke database lokal menggunakan `npx prisma db push`. Ini diperlukan agar kode referral (`ref`) yang dikirim dari checkout dapat disimpan secara permanen di database sejak sekarang.
>
> **Variabel Lingkungan Baru**: Tambahkan `ADMIN_SECRET_KEY=2453ard` ke dalam file `.env` Anda untuk mengaktifkan akses dashboard.

---

## Open Questions
*Tidak ada.*

---

## Proposed Changes

### Database Layer
---
#### [MODIFY] `prisma/schema.prisma`
Menambahkan kolom `affiliate_code` ke dalam model `orders`:
```prisma
model orders {
  id                  String                @id @db.VarChar(255)
  date                DateTime              @db.Timestamptz(6)
  total_amount        BigInt
  admin_fees          BigInt?
  entry_by            String?               @db.VarChar(255)
  order_status_id     Int
  customer_id         String?               @db.VarChar(255)
  payment_url         String?               @db.VarChar(1000)
  expired_date        DateTime?             @db.Timestamptz(6)
  deleted             Boolean?
  deleted_at          DateTime?             @db.Timestamptz(6)
  deleted_by          String?
  promo_id            String?               @db.VarChar(255)
  promo_code          String?               @db.VarChar(255)
  subtotal_amount     BigInt?
  discount_amount     BigInt?               @default(0)
  affiliate_code      String?               @db.VarChar(255) // Kolom baru untuk Fase 1 & 2
  // ... (relations)
}
```

### Checkout API Layer
---
#### [MODIFY] `app/checkout/actions.ts`
Memodifikasi logika penyimpanan order agar menangkap `refCode` dan menyimpannya ke kolom `affiliate_code` yang baru:
```typescript
      const newOrder = await tx.orders.create({
        data: {
          id: orderId,
          date: date,
          total_amount: BigInt(input.totalPrice),
          subtotal_amount: BigInt(input.totalPrice - input.adminFee),
          admin_fees: BigInt(input.adminFee),
          discount_amount: BigInt(0),
          order_status_id: 2,
          affiliate_code: input.refCode || null, // Simpan kode referral ke DB
        },
      });
```

---
#### [MODIFY] `components/event/CheckoutClient.tsx`
Mengubah tautan sukses di dialog konfirmasi agar mengarah ke halaman E-Ticket yang baru dibuat (`/orders/[order_id]`), bukan sekadar kembali ke Beranda:
```diff
-          <div className="w-full flex gap-3 mt-2">
-            <Link href="/" className="flex-1">
-              <Button variant="default" className="w-full border-2 border-black font-extrabold bg-[#CAFF04] hover:bg-[#b0df03] text-black">
-                Kembali ke Beranda
-              </Button>
-            </Link>
-          </div>
+          <div className="w-full flex flex-col gap-3 mt-2">
+            <Link href={`/orders/${successOrder}`} className="w-full">
+              <Button variant="default" className="w-full border-2 border-black font-extrabold bg-[#CAFF04] hover:bg-[#b0df03] text-black shadow-[2px_2px_0px_#000]">
+                Lihat E-Tiket Saya
+              </Button>
+            </Link>
+            <Link href="/" className="w-full text-center text-xs font-bold text-gray-500 hover:text-black transition-colors">
+              Kembali ke Beranda
+            </Link>
+          </div>
```

### Customer E-Ticket Page
---
#### [NEW] `app/orders/[id]/page.tsx`
Server Component murni untuk menampilkan receipt & e-ticket digital pembeli:
- Mengambil data pesanan, tiket, dan event dari database.
- Merender antarmuka tanda terima brutalist dan visualisasi simulated QR Code menggunakan custom SVG berpiksel langsung di server, tanpa ada client-side JavaScript.

### Admin Dashboard Page
---
#### [NEW] `app/admin/page.tsx`
Server Component murni untuk halaman admin:
- Membaca parameter query `secret` dari URL.
- Memverifikasi kecocokan `secret` dengan `process.env.ADMIN_SECRET_KEY`. Jika tidak cocok atau kosong, memicu fungsi `notFound()` dari Next.js (menyembunyikan rute dari publik).
- Jika cocok, menarik daftar transaksi (`orders`), data tiket (`tickets`), dan merender dashboard admin secara utuh langsung dari server.

---
#### [NEW] `components/admin/AdminDashboardClient.tsx`
Tampilan dashboard admin brutalist:
- Kartu statistik utama: Pendapatan kotor, tiket terjual, total pesanan.
- Tabel daftar transaksi lengkap dengan kolom `Referral Code` bertanda badge biru jika terdeteksi.
- Modal Detail Pemesan: Saat mengklik baris transaksi, admin dapat melihat data diri pembeli untuk setiap tiket di pesanan tersebut.

---

## Verification Plan

### Manual Verification
1. **Push Skema Database**: Jalankan `npx prisma db push` untuk memperbarui tabel orders di PostgreSQL lokal.
2. **Setup Env**: Tambahkan `ADMIN_SECRET_KEY=2453ard` di file `.env`.
3. **Simulasi Checkout**:
   - Beli tiket dengan mengakses detail event menggunakan affiliate link, misal: `/events/MARS9?AFFIL=BUDI-INFLUENCER`.
   - Lakukan checkout hingga selesai.
   - Di modal sukses, klik tombol **"Lihat E-Tiket Saya"**. Pastikan dialihkan ke `/orders/KRTJ-XXXX` dan menampilkan simulated QR Code & data pengunjung yang benar.
4. **Verifikasi Admin Dashboard**:
   - Buka `/admin?secret=2453ard` dan pastikan masuk ke dashboard.
   - Verifikasi apakah transaksi yang baru saja dibeli terdaftar di tabel dengan kolom Referral Code bertuliskan `BUDI-INFLUENCER`.
   - Buka `/admin` tanpa parameter secret dan pastikan memunculkan halaman 404 Not Found.
