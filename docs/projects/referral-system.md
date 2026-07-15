# Feature Detail Docs: Referral & Affiliate System (Tracking Only)

**Dokumen ini ditujukan untuk Tim Teknis Kartjis.id**

**Versi:** 1.0**Tanggal:** 8 Juli 2026**Penulis:** Business & Technology Strategy Analyst (Manus AI)

---

## 1. Pendahuluan

Dokumen ini menjelaskan detail teknis dan fungsionalitas untuk pengembangan fitur Referral & Affiliate System tahap 1, yaitu **"Tracking Only"**. Fitur ini bertujuan untuk memungkinkan Event Organizer (EO) melacak penjualan tiket yang berasal dari partner afiliasi mereka (influencer, komunitas, dll.) tanpa mempengaruhi harga tiket atau sistem komisi otomatis. Komisi akan dihitung dan dibayarkan secara manual oleh EO di luar sistem Kartjis.id.

**Teknologi yang Digunakan:**

- **Frontend:** Next.js

- **Backend:** Golang

- **Database:** Supabase (PostgreSQL)

## 2. Masalah yang Diselesaikan

- **Kurangnya Visibilitas:** EO kesulitan melacak secara akurat efektivitas promosi dari partner afiliasi mereka.

- **Keterbatasan Pertumbuhan Organik:** Kartjis.id belum memiliki mekanisme terstruktur untuk mendorong promosi dari pihak ketiga secara terukur.

- **Biaya Akuisisi Pelanggan (CAC) Tinggi:** Ketergantungan pada iklan berbayar tanpa memanfaatkan kekuatan *word-of-mouth* atau *influencer marketing*.

## 3. Solusi yang Diusulkan (Tahap 1: Tracking Only)

Kartjis.id akan menyediakan fitur di mana EO dapat membuat kode afiliasi unik untuk partner mereka. Kode ini akan disematkan dalam URL event. Ketika pembeli mengklik URL tersebut dan melakukan pembelian, sistem akan mencatat transaksi tersebut sebagai hasil dari afiliasi tertentu. Harga tiket tidak akan terpengaruh oleh kode ini.

## 4. User Flow

### 4.1. Flow Event Organizer (EO)

1. **Login ke Dashboard EO:** EO masuk ke dashboard Kartjis.id.

1. **Akses Menu Affiliator:** EO menavigasi ke menu baru bernama **[Affiliator]**.

1. **Tambah Affiliator Baru:** EO mengklik tombol "Tambah Affiliator" dan mengisi nama partner (misal: "Budi Influencer").

1. **Sistem Generate Kode:** Sistem secara otomatis menghasilkan kode afiliasi unik (misal: `AF-KRTJ-BUDI`).

1. **Daftar Affiliator:** EO melihat daftar affiliator yang sudah terdaftar beserta kode unik mereka.

1. **Generate Affiliate Link:** EO menavigasi ke halaman detail event mereka. Di sana, akan ada tombol atau opsi **"Generate Affiliate Link"**.

1. **Pilih Affiliator:** EO memilih affiliator dari daftar yang sudah dibuat.

1. **Salin Link:** Sistem menghasilkan URL event dengan parameter afiliasi (misal: `kartjis.id/event/konser-a?AFFIL=AF-KRTJ-BUDI`). EO menyalin link ini.

1. **Distribusi Link:** EO mengirimkan link tersebut kepada partner afiliasi (misal: via WhatsApp).

### 4.2. Flow Affiliator (Partner)

1. **Menerima Link:** Affiliator (misal: Budi) menerima link khusus dari EO.

1. **Promosi:** Budi menyebarkan link tersebut kepada audiensnya (teman, komunitas, pengikut media sosial) dengan ajakan untuk membeli tiket.

### 4.3. Flow Pembeli (End User)

1. **Klik Link:** Pembeli mengklik link afiliasi yang dibagikan oleh Affiliator.

1. **Landing Page Event:** Browser membuka halaman detail event di Kartjis.id. Frontend Next.js secara *hidden* menangkap parameter `AFFIL=AF-KRTJ-BUDI` dari URL dan menyimpannya di `sessionStorage` browser.

1. **Proses Pembelian:** Pembeli melanjutkan proses pemilihan tiket, pengisian data diri, dan checkout seperti biasa.

1. **Pencatatan Afiliasi:** Saat pembayaran berhasil dan sistem memproses `createOrder`, kode afiliasi yang tersimpan di `sessionStorage` akan disertakan dalam payload transaksi ke Backend Golang.

1. **Transaksi Tercatat:** Backend Golang mencatat detail transaksi beserta `affiliate_id` yang terkait ke dalam tabel `affiliate_logs`.

## 5. Rancangan Sistem Table (Database Schema)

Berikut adalah penambahan tabel dan modifikasi pada tabel yang sudah ada di Supabase (PostgreSQL):

### 5.1. Tabel Baru: `affiliates`

| Kolom | Tipe Data | Constraint | Deskripsi |
| --- | --- | --- | --- |
| `id` | `UUID` | `PRIMARY KEY`, `gen_random_uuid()` | ID unik untuk setiap affiliator. |
| `eo_id` | `UUID` | `FOREIGN KEY` ke `event_organizers.id` | ID Event Organizer yang memiliki affiliator ini. |
| `name` | `VARCHAR(255)` | `NOT NULL` | Nama lengkap atau nama alias affiliator. |
| `code` | `VARCHAR(50)` | `NOT NULL`, `UNIQUE` | Kode afiliasi unik yang di-generate otomatis oleh sistem. |
| `whatsapp` | `VARCHAR(20)` | `NULLABLE` | Nomor WhatsApp affiliator (opsional, untuk koordinasi manual). |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT now()` | Waktu pembuatan record. |
| `updated_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT now()` | Waktu terakhir record diperbarui. |

**Catatan:** `eo_id` akan merujuk ke tabel `event_organizers` yang diasumsikan sudah ada dan memiliki `id` bertipe `UUID`.

### 5.2. Tabel Baru: `affiliate_logs`

| Kolom | Tipe Data | Constraint | Deskripsi |
| --- | --- | --- | --- |
| `id` | `UUID` | `PRIMARY KEY`, `gen_random_uuid()` | ID unik untuk setiap log transaksi afiliasi. |
| `affiliate_id` | `UUID` | `FOREIGN KEY` ke `affiliates.id` | ID affiliator yang terkait dengan transaksi ini. |
| `order_id` | `VARCHAR(255)` | `FOREIGN KEY` ke `orders.id` | ID pesanan (order) yang berhasil. |
| `event_id` | `VARCHAR(255)` | `FOREIGN KEY` ke `events.id` | ID event yang terkait dengan transaksi. |
| `total_amount` | `BIGINT` | `NOT NULL` | Total jumlah pembayaran untuk order ini (saat transaksi terjadi). |
| `created_at` | `TIMESTAMP WITH TIME ZONE` | `DEFAULT now()` | Waktu transaksi dicatat. |

### 5.3. Modifikasi Tabel `orders` (Opsional, untuk konsistensi)

Untuk konsistensi dan kemudahan pelaporan di masa depan, disarankan untuk menambahkan kolom `affiliate_id` ke tabel `orders`.

| Kolom | Tipe Data | Constraint | Deskripsi |
| --- | --- | --- | --- |
| `affiliate_id` | `UUID` | `NULLABLE`, `FOREIGN KEY` ke `affiliates.id` | ID affiliator yang membawa order ini (jika ada). |

## 6. Rancangan UI/UX Halaman Dashboard (untuk EO)

![|width=693,height=300,id=lnJ7vYXTqe4bhpFRXd8hZc](https://private-us-east-1.manuscdn.com/user_upload_by_module/feedback/310519663666190692/lwthyRpCljRUBmEr.png?Expires=1814985335&Signature=bdoF6ih95HJvlooTsdvPMF~oHpIW8Lx9GWPjOROUAqxdFEJJK~C-awM4WrE-OuR7LwQ53dRga-BwyX6joUbsBoOvn3g4TDsAbsd2cRU3qFnhUj9B1-uwCTtc5NWD5Y~qwdqKPzy69Wrn9vKtLKSMH1jMtpbeLwjIZ3qJ1FCy02DMQ3oGcF-U9jyOJO14X~1GLogcB58162v2ubpSmnOzMbwZ86lTdoVlVo0t0GuULATBwahwgmft89n4N6lrz4jh4874wpGMFclIkewKZtGDJ9K4vWfsxl1flKpK545gJ7NWzFe9WolXimNlsTjp7V-~5Fa2Ek5FiRGCBRWPlXunzA__&Key-Pair-Id=K2HSFNDJXOU9YS)

0.1 halaman dashbaord affiliator

![|width=722,height=291,id=D05PSwBdAEHcbPtcJobtab](https://private-us-east-1.manuscdn.com/user_upload_by_module/feedback/310519663666190692/VdGJOuOPRHWHCJgA.png?Expires=1814985839&Signature=lj1jlyt2dqC~a-YNcBdecmPD86M1gTajTW6cRE3N5TtsN5T99tliiudJwd~CWWFtzlWzGNmL81rvKqbflaXJYGQysD7zRynRNXV1rCOAMCOZNn4dxFmmYydqKtYCLCy5eRAYoPLBXaUvRhzvTlKRCclesEdS0Gux~Hwdj7kD7q5ouRc9vtfMJ71QqtV2Oi86QVATzvCK3QAc8Kyhr4kuUQJ9uT6ymcPBJ3Do2b2E7Fb7VzJ~lECovuz2r0mDMl8wcfNnNC5cqJZa~YSnL2yPCHf~zDEL2pO6grHKtzxyz5s6cslueJ8gV3aXnxr7rW2gUSPUGRs7qH0EoM1bjArsXw__&Key-Pair-Id=K2HSFNDJXOU9YS)

0.2 halaman detail affiliator transaksi

![|width=736,height=361,id=NCkzaLE4V7TPrLSpnsME1P](https://private-us-east-1.manuscdn.com/user_upload_by_module/feedback/310519663666190692/aQxtqAEAjSqDyfkd.png?Expires=1814985981&Signature=V1TncrvYEocNgohrWICzlMgpsOqG6Jij2vi0B86qTkRYjqcFYpSuwbUepyJZ5qr6vWBdf5BqAWaz9YQf2DYXrVxu0MB9R4zbhR5C3NmutZfXYHHWO~TUNqFN1IdAyTRw6A00zkDnhNPhcR-qPjJ7fE2AwE6FajSLmygD6QTK1kh57691n3TYOvFS9gTpz3iY~kEIDQNePTC-jtZ9L6n5nCDi0zc1fCFCrUYVJ~Db47ZNNMCCyaXaYUNI~4BNw2VNtvTs3XQyAGLoJdxUEM7X1x6PXpvrJJn4WHRhonK8gIFBi3z8NzziBo~LYwx-NGZYyfvx626V2JWfQVK7LC49qg__&Key-Pair-Id=K2HSFNDJXOU9YS)

0.3 halaman create a

### 6.1. Menu Baru: `[Affiliator]`

- **Lokasi:** Akan muncul sebagai menu baru di navigasi sidebar dashboard EO/admin.

- **Tampilan Awal:** Menampilkan daftar semua affiliator yang terdaftar di bawah EO tersebut.
  - Kolom: Nama Affiliator, Kode Afiliasi, Tanggal Dibuat.
  - Tombol: "Tambah Affiliator", "Edit", "Hapus".

### 6.2. Form "Tambah Affiliator"

- **Input:** Hanya field "Nama Affiliator".

- **Proses:** Setelah submit, sistem akan otomatis menghasilkan kode unik dan menampilkannya di daftar.

### 6.3. Opsi "Generate Affiliate Link" di Halaman Event Detail (Dashboard EO)

- **Lokasi:** Pada halaman detail event di dashboard EO, akan ada tombol atau bagian khusus untuk "Affiliate Link".

- **Fungsionalitas:** Ketika diklik, akan muncul modal/dropdown yang memungkinkan EO memilih salah satu affiliator dari daftar mereka.

- **Output:** Setelah memilih, sistem akan menampilkan link afiliasi lengkap yang siap disalin (misal: `kartjis.id/event/[event-slug]?AFFIL=[affiliate-code]`).

### 6.4. Laporan Transaksi Afiliasi

- **Lokasi:** Di dalam menu **[Affiliator]**, akan ada tab atau sub-menu "Laporan Transaksi".

- **Tampilan:** Menampilkan daftar transaksi yang berhasil menggunakan kode afiliasi dari EO tersebut.
  - Kolom: Tanggal Transaksi, Nama Pembeli, Nama Event, Kode Afiliasi, Total Pembayaran.
  - Filter: Berdasarkan Affiliator, Event, atau Rentang Tanggal.
  - Opsi Export: Tombol untuk mengunduh laporan dalam format CSV/Excel untuk rekonsiliasi manual.

- **Lokasi:** Pada halaman detail event di dashboard EO, akan ada tombol atau bagian khusus untuk "Affiliate Link".

- **Fungsionalitas:** Ketika diklik, akan muncul modal/dropdown yang memungkinkan EO memilih salah satu affiliator dari daftar mereka.

- **Output:** Setelah memilih, sistem akan menampilkan link afiliasi lengkap yang siap disalin (misal: `kartjis.id/event/[event-slug]?AFFIL=[affiliate-code]`).

## 7. Ruang Lingkup Teknis Implementasi

### 7.1. Frontend (Next.js)

- **URL Parsing:** Mengambil parameter `AFFIL` dari URL (`window.location.search`).

- **State Management:** Menyimpan kode afiliasi di `sessionStorage` atau React Context/Zustand setelah parsing URL. Ini memastikan kode tetap ada selama sesi browser aktif untuk tab tersebut.

- **Checkout Payload:** Menambahkan `affiliate_code` ke payload API `createOrder` jika ada di state.

- **Dashboard EO:** Membuat halaman baru `/dashboard/affiliates` dan komponen UI untuk manajemen affiliator (daftar, tambah, edit, hapus), serta halaman/komponen untuk menampilkan laporan transaksi afiliasi.

- **Event Detail Page (EO):** Menambahkan fungsionalitas untuk generate affiliate link.

### 7.2. Backend (Golang)

- **API ****`POST /affiliates`****:** Untuk membuat affiliator baru (auto-generate kode).

- **API ****`GET /affiliates`****:** Untuk mengambil daftar affiliator milik EO.

- **API ****`PUT /affiliates/{id}`**** & ****`DELETE /affiliates/{id}`****:** Untuk mengelola affiliator.

- **Modifikasi API ****`POST /orders`**** (atau ****`createOrder`****):** Menerima `affiliate_code` dari frontend. Jika ada, lakukan lookup `affiliate_id` dari tabel `affiliates`.

- **Logika Pencatatan:** Setelah order berhasil dibuat dan dibayar, masukkan record baru ke tabel `affiliate_logs` dengan `affiliate_id`, `order_id`, `event_id`, dan `total_amount`.

- **API ****`GET /affiliate-reports`****:** Untuk menampilkan laporan transaksi afiliasi per EO (mengambil data dari `affiliate_logs`).

### 7.3. Database (Supabase/PostgreSQL)

- Membuat tabel `affiliates` dan `affiliate_logs` sesuai skema di atas.

- Menambahkan `affiliate_id` ke tabel `orders` (opsional, namun direkomendasikan).

- Memastikan indeks yang tepat pada kolom `code` di `affiliates` dan `affiliate_id`, `order_id`, `event_id` di `affiliate_logs` untuk performa query.

---

Dokumen ini telah mencakup semua detail yang kita diskusikan. Silakan review dan berikan masukan Anda. Setelah ini disetujui, kita bisa melanjutkan ke tahap implementasi.