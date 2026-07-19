# Rencana Restrukturisasi Arsitektur (Modular Feature Architecture)

Dokumen ini merancang rencana migrasi kode dari struktur datar `/app` dan `/components` yang tersebar menjadi arsitektur modular berbasis fitur (`/features`) sesuai dengan panduan utama di [architecture.md](file:///D:/2-Project/referral-system/docs/guide/architecture.md).

---

## 1. Analisis Kesenjangan (Gap Analysis)

Saat ini, struktur direktori proyek masih datar dan mencampuradukkan domain bisnis di tingkat atas:
*   **`/components/event`** dan **`/components/home`** berisi komponen yang sebenarnya melayani fitur katalog dan checkout.
*   **`/components/shadcn-component/chart`** melayani visualisasi dashboard admin saja tetapi diletakkan di global components.
*   Halaman di dalam **`/app`** mengimpor file secara langsung dari folder global `/components/*` yang menyebabkan ketergantungan antar-folder menjadi tinggi dan sulit di-skala.

---

## 2. Pemetaan Target Fitur (`/features`)

Berdasarkan domain bisnis sistem rujukan tiket (Referral & Ticketing), kita membagi proyek ke dalam **4 modul fitur** utama:

| Nama Fitur | Deskripsi | File Asal (Komponen & Halaman) |
| :--- | :--- | :--- |
| **`catalog`** | Halaman utama, penelusuran event, carousel promo, dan detail informasi event. | - `components/event/EventCard.tsx`<br>- `components/event/EventDetailClient.tsx`<br>- `components/home/CTABanner.tsx`<br>- `components/home/EventCarousel.tsx`<br>- `components/home/EventCarouselClient.tsx`<br>- `components/home/NearbyEvents.tsx`<br>- Halaman: `app/page.tsx`, `app/events/[slug]/page.tsx` |
| **`checkout`** | Proses pembelian tiket, formulir data pembeli, rujukan kode referral, dan API pemesanan tiket. | - `components/event/CheckoutClient.tsx`<br>- `app/checkout/actions.ts`<br>- Halaman: `app/checkout/page.tsx` |
| **`orders`** | Detail pemesanan, tiket elektronik pembeli, simulated QR code, dan print e-tiket. | - Halaman: `app/orders/[id]/page.tsx` |
| **`admin`** (Dashboard) | Halaman admin, saringan filter, tabel transaksi, dan panel chart visualisasi data. | - `components/shadcn-component/chart/line-chart-custom-dots.tsx`<br>- `components/shadcn-component/chart/pie-chart-donut.tsx`<br>- Halaman: `app/admin/page.tsx` |

*Catatan: Komponen global seperti `/components/layout` (`Navbar.tsx`, `Footer.tsx`) dan primitif UI shadcn (`/components/ui`) tetap dipertahankan di luar folder `/features` karena dipakai di seluruh aplikasi.*

---

## 3. Struktur Folder Target

Setelah migrasi selesai, folder `/features` akan berbentuk seperti berikut:

```
features/
├── catalog/
│   ├── components/
│   │   ├── EventCard.tsx
│   │   ├── EventDetailClient.tsx
│   │   ├── CTABanner.tsx
│   │   ├── EventCarousel.tsx
│   │   ├── EventCarouselClient.tsx
│   │   └── NearbyEvents.tsx
│   └── index.ts                # Ekspor komponen luar modul
├── checkout/
│   ├── components/
│   │   └── CheckoutClient.tsx
│   ├── actions.ts              # Server Actions checkout
│   └── index.ts
├── orders/
│   └── index.ts
└── admin/
    ├── components/
    │   ├── LineChartCustomDots.tsx
    │   └── PieChartDonut.tsx
    └── index.ts
```

Setiap file halaman di `/app` hanya akan mengimpor komponen dari entry point fitur masing-masing melalui entry point `@/features/[nama-fitur]`.

---

## 4. Rencana Tahapan Migrasi (Migration Steps)

### Langkah 1: Persiapan Folder Fitur
Buat struktur direktori baru di bawah root proyek:
```bash
mkdir -p features/catalog/components
mkdir -p features/checkout/components
mkdir -p features/orders/components
mkdir -p features/admin/components
```

### Langkah 2: Pemindahan File Komponen
Pindahkan komponen visual ke folder fitur yang sesuai:
*   Pindahkan `components/event/EventCard.tsx`, `EventDetailClient.tsx` serta seluruh isi `components/home/*` ke `features/catalog/components/`.
*   Pindahkan `components/event/CheckoutClient.tsx` ke `features/checkout/components/`.
*   Pindahkan `app/checkout/actions.ts` ke `features/checkout/actions.ts` (memisahkan logic backend action dari Next.js routing).
*   Pindahkan `components/shadcn-component/chart/line-chart-custom-dots.tsx` and `pie-chart-donut.tsx` ke `features/admin/components/` (sekaligus mengganti huruf depan nama file menjadi PascalCase: `LineChartCustomDots.tsx` dan `PieChartDonut.tsx`).

### Langkah 3: Membuat Entry Point (`index.ts`)
Buat file `index.ts` pada tiap folder fitur untuk mengontrol komponen mana yang boleh dikonsumsi oleh `/app`:
*   `features/catalog/index.ts`:
    ```typescript
    export { default as EventCard } from "./components/EventCard";
    export { default as EventDetailClient } from "./components/EventDetailClient";
    export { default as EventCarousel } from "./components/EventCarousel";
    export { default as NearbyEvents } from "./components/NearbyEvents";
    export { default as CTABanner } from "./components/CTABanner";
    ```
*   `features/checkout/index.ts`:
    ```typescript
    export { default as CheckoutClient } from "./components/CheckoutClient";
    export * from "./actions";
    ```
*   `features/admin/index.ts`:
    ```typescript
    export { ChartLineDotsCustom } from "./components/LineChartCustomDots";
    export { ChartPieDonutText } from "./components/PieChartDonut";
    ```

### Langkah 4: Pembersihan Folder Lama
Hapus folder komponen lama yang sudah kosong:
```bash
rm -rf components/event
rm -rf components/home
rm -rf components/shadcn-component
```

### Langkah 5: Pembaruan Path Impor (Import Path Updates)
Perbarui seluruh path referensi impor di dalam halaman `/app`:
1.  **`app/page.tsx`**:
    *   Dari: `@/components/home/EventCarousel` dll.
    *   Ke: `@/features/catalog`
2.  **`app/events/[slug]/page.tsx`**:
    *   Dari: `@/components/event/EventDetailClient`
    *   Ke: `@/features/catalog`
3.  **`app/checkout/page.tsx`**:
    *   Dari: `@/components/event/CheckoutClient`
    *   Ke: `@/features/checkout`
4.  **`app/admin/page.tsx`**:
    *   Dari: `@/components/shadcn-component/chart/...`
    *   Ke: `@/features/admin`

---

## 5. Verifikasi Keberhasilan (Verification Checklist)

Setelah pemindahan file, lakukan verifikasi berikut sebelum melakukan commit:
*   [ ] Jalankan build proyek: `npm run build` (memastikan tidak ada kesalahan import type safety TypeScript).
*   [ ] Pastikan server lokal dapat menyajikan halaman katalog, checkout, dan dashboard dengan lancar.
*   [ ] Periksa file yang dipindahkan untuk memastikan tidak ada import relatif (`../`) yang rusak.
