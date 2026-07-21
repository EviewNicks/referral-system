# Implementation Plan - Redesign Admin Dashboard (/admin)

## Goal Description
Kita akan merombak halaman Admin Dashboard (`/admin`) agar selaras dengan **Kartjis Design System** sesuai dengan spesifikasi visual mockup [dashbaord-transaksi.png](file:///D:/2-Project/referral-system/docs/design/page/dashbaord-transaksi.png). Perubahan ini meliputi penyatuan tata letak bersidebar, integrasi kartu statistik baru, penerapan grafik analitik kustom (Line Chart & Donut Chart), filtrasi dinamis, serta penyederhanaan data tabel.

---

## Sesi 1: Deskripsi Desain & UX (Descriptive Design)

### 1. Tata Letak Dashboard Global (Sidebar & Top Bar)
*   Halaman akan disematkan ke dalam layout panel EO Universe yang ber-sidebar di sisi kiri dan area konten berlatar belakang abu-abu sangat muda di sisi kanan.
*   Sidebar akan menampilkan logo `KARTJIS.ID` dan grup menu, menyorot pilihan aktif **[Laporan Transaksi]** di bawah grup menu **[AFFILIATE]**.
*   Top Bar memuat bilah pencarian global statis, tombol aksen kuning *"Jelajahi Event"*, *"Buat Event"*, serta informasi profil pengguna *"EO Universe Admin"*.

### 2. Evaluasi Kolom Tabel (Penyederhanaan)
*   **Kolom yang Dihapus**: Kolom `Tipe Transaksi` (Dengan/Tanpa Afiliasi) dihapus karena bersifat redundant.
*   **Kolom yang Digabungkan**: Penggunaan kode afiliasi kini langsung terwakili di kolom `Kode Afiliasi`. Transaksi dengan afiliasi akan merender badge berwarna ungu (misal: `ANDI2024`), sementara transaksi langsung akan menampilkan badge abu-abu tipis `Direct`.
*   **Aksi Detail**: Tombol **Detail** pada kolom ujung kanan akan mengarahkan pengguna secara langsung ke halaman tiket pengunjung di `/orders/[order_id]` (membuka tab baru).

### 3. Grafik & Analitik Dinamis (Charts)
*   **Line Chart (Perbandingan Transaksi)**: Menggunakan komponen [line-chart-custom-dots.tsx](file:///D:/2-Project/referral-system/components/shadcn-component/chart/line-chart-custom-dots.tsx) yang dimodifikasi untuk menerima data dinamis. Grafik ini akan menampilkan grafik tren harian jumlah transaksi "Dengan Afiliasi" vs "Tanpa Afiliasi" selama 30 hari terakhir.
*   **Donut Chart (Komposisi Transaksi)**: Menggunakan komponen [pie-chart-donut.tsx](file:///D:/2-Project/referral-system/components/shadcn-component/chart/pie-chart-donut.tsx) yang dimodifikasi. Di bagian tengah donat akan menampilkan total keseluruhan transaksi (misal: `1.245`), dengan pembagian persen (%) komposisi antara pesanan via afiliator vs pesanan langsung.

---

## Sesi 2: Detail Teknis Implementasi (Technical Design)

### 1. Modifikasi Database Query di `/app/admin/page.tsx`
*   Kita akan melakukan query data pesanan beserta relasi `tickets` dan `transactions` (untuk menampilkan logo metode pembayaran):
```typescript
  const orders = await prisma.orders.findMany({
    orderBy: { date: "desc" },
    include: {
      tickets: {
        include: {
          ticket_categories: true,
          events: true,
        }
      },
      // Mengambil transaksi untuk menampilkan metode pembayaran (BCA, QRIS, dll.)
      transactions: true, 
    },
  });
```

### 2. Penghitungan Data Analitik (Aggregations)
*   **Metrik Statistik**:
    *   `Total Pembayaran`: Sum of `total_amount` dari seluruh orders.
    *   `Total Tiket Terjual`: Sum of tickets length.
    *   `Transaksi dengan Afiliasi`: Count of orders where `affiliate_code !== null`.
    *   `Transaksi tanpa Afiliasi`: Count of orders where `affiliate_code === null`.
*   **Data Chart Line**:
    *   Mengelompokkan jumlah transaksi harian selama 30 hari ke belakang menjadi format data: `{ date: "01 Jul", denganAfiliasi: 12, tanpaAfiliasi: 8 }`.
*   **Data Chart Donut**:
    *   Format data:
        ```typescript
        const donutData = [
          { type: "dengan_afiliasi", value: countWithAffil, fill: "#2E4EEA" },
          { type: "tanpa_afiliasi", value: countWithoutAffil, fill: "#FF8C00" }
        ];
        ```

### 3. Kustomisasi Komponen Chart
Kita akan memodifikasi komponen chart bawaan agar menerima props dinamis dari Server Component sehingga grafik merepresentasikan data riil secara otomatis.

#### [MODIFY] `components/shadcn-component/chart/line-chart-custom-dots.tsx`
Mengubah komponen menjadi fungsi menerima parameter data dan config agar fleksibel:
```typescript
export function ChartLineDotsCustom({ data, config }: { data: any[], config: any }) {
  // Render recharts LineChart using dynamic data...
}
```

#### [MODIFY] `components/shadcn-component/chart/pie-chart-donut.tsx`
Mengubah komponen menjadi fungsi menerima total nilai dan data terstruktur:
```typescript
export function ChartPieDonutText({ data, config, total }: { data: any[], config: any, total: number }) {
  // Render recharts PieChart with dynamic labels...
}
```

---

## Verification Plan

### Manual Verification
1. **Verifikasi Tampilan Sidebar & Top Bar**: Buka `/admin?secret=2453ard`, pastikan tata letak dashboard 2-kolom ter-render secara utuh dan responsif.
2. **Uji Coba Render Grafik**:
   - Pastikan Line Chart ter-render dengan benar menampilkan data fluktuasi harian.
   - Pastikan Donut Chart menampilkan angka total pesanan di bagian tengahnya dengan persen pembagian yang presisi.
3. **Verifikasi Tabel Transaksi**:
   - Kolom "Tipe Transaksi" harus sudah hilang.
   - Kolom "Kode Afiliasi" menampilkan badge biru/ungu jika menggunakan referral, dan badge abu-abu `Direct` jika pesanan langsung.
   - Tombol **Detail** di ujung kanan saat diklik harus membuka halaman `/orders/[order_id]` di tab baru.
