# Kartjis Clone + Referral System — Master Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Load executing-plans to implement this plan task-by-task.

**Goal:** Membangun clone fungsional Kartjis.id (landing page, event detail, checkout) sebagai fondasi, kemudian mengembangkan fitur Referral & Affiliate System di atasnya.

**Architecture:** Next.js 15 App Router dengan React Server Components untuk data fetching, Server Actions untuk mutasi. Prisma ORM terhubung ke Supabase PostgreSQL existing (introspect schema, kemudian extend dengan tabel affiliasi baru). Design system faithful ke kartjis.id: primary `#2C1F63`, secondary `#FFC351`, font GT Walsheim Pro / Inter fallback.

**Tech Stack:** Next.js 16.2.10, React 19, TypeScript, Tailwind CSS v4, Prisma ORM, Supabase (PostgreSQL)

---

## Ringkasan Fase

| Fase | Nama | Halaman / Fitur | Status |
|------|------|-----------------|--------|
| **Fase 1** | Kartjis Core Clone | Landing Page, Event Listing, Event Detail, Checkout | 🔲 Todo |
| **Fase 2** | Referral & Affiliate System | Dashboard EO Affiliator, Tracking, Laporan | 🔲 Todo |

---

# FASE 1: Kartjis Core Clone

## Overview Fase 1

Fase 1 membangun tiga alur pengguna utama yang menjadi prasyarat untuk mengintegrasikan referral system:

1. **Landing Page** → showcase event aktif
2. **Event Detail** → info event + pilih tiket + capture `?AFFIL=` param
3. **Checkout** → form data pembeli + submit order (dengan `affiliate_code` dari sessionStorage)

Tanpa Fase 1, tidak ada "transaksi" yang bisa ditracking oleh sistem afiliasi.

---

## Task 1: Setup Proyek & Koneksi Database

**Files:**
- Create: `prisma/schema.prisma`
- Create: `.env.local`
- Create: `src/lib/prisma.ts`
- Modify: `package.json`

**Konteks:**
Database yang digunakan adalah Supabase PostgreSQL **existing** dari kartjis.id (sudah ada tabel `events`, `ticket_categories`, `orders`, `tickets`, `users`, dll). Kita akan **introspect** schema-nya dengan Prisma, bukan membuat ulang dari awal.

Supabase memberikan **dua** connection string:
- **Transaction Pooler** (port 6543) → untuk runtime queries (digunakan di `DATABASE_URL`)
- **Direct Connection** (port 5432) → untuk migrations & `prisma db pull` (digunakan di `DIRECT_URL`)

**Step 1: Install Prisma**

```bash
npm install prisma @prisma/client
npx prisma init
```

Expected output: Folder `prisma/` terbuat dengan `schema.prisma` kosong.

**Step 2: Konfigurasi `.env.local`**

```env
# Runtime queries (Transaction Pooler - port 6543)
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Migrations & db pull (Direct Connection - port 5432)
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"
```

**Step 3: Update `prisma/schema.prisma` untuk dual URL**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

**Step 4: Introspect schema existing dari Supabase**

```bash
npx prisma db pull
```

Expected: `prisma/schema.prisma` terisi dengan semua model dari existing DB.

**Step 5: Generate Prisma Client**

```bash
npx prisma generate
```

Expected output: `✔ Generated Prisma Client`

**Step 6: Buat Prisma singleton di `src/lib/prisma.ts`**

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Step 7: Commit**

```bash
git add prisma/ src/lib/prisma.ts .env.local
git commit -m "chore: setup Prisma ORM with Supabase connection"
```

---

## Task 2: Design System & Global Styles

**Files:**
- Modify: `src/app/globals.css`
- Create: `src/components/ui/Button.tsx`
- Create: `src/components/ui/Badge.tsx`
- Create: `src/components/layout/Navbar.tsx`
- Create: `src/components/layout/Footer.tsx`
- Modify: `src/app/layout.tsx`

**Konteks:**
Kartjis.id menggunakan design system berikut (diambil dari source website):
- **Primary**: `#2C1F63` (deep purple)
- **Secondary**: `#FFC351` (amber/gold)
- **Blue**: `#2979C1`
- **Green**: `#28DCA6`
- **Font**: GT Walsheim Pro / Inter sebagai fallback
- **Border radius**: `12px` untuk cards, `999px` untuk pill buttons

**Step 1: Update `src/app/globals.css`**

```css
@import "tailwindcss";

@theme {
  --color-primary: #2C1F63;
  --color-primary-soft: #F0EBFA;
  --color-secondary: #FFC351;
  --color-blue: #2979C1;
  --color-green: #28DCA6;
  --color-red-soft: #FF7474;
  --color-grey: #D6D6D6;
  --color-text-grey: #A6A6A6;
  --font-sans: "Inter", system-ui, sans-serif;
  --radius-card: 12px;
  --radius-pill: 999px;
}

* { box-sizing: border-box; }

body {
  font-family: var(--font-sans);
  background-color: #f8f8f8;
  color: #1E1E1E;
}
```

**Step 2: Update `src/app/layout.tsx`**

```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kartjis - Your all in one ticketing solution",
  description: "Platform tiket online untuk semua jenis event di Indonesia",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={inter.className}>
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

**Step 3: Buat Navbar faithful ke kartjis.id**

Logo Kartjis di kiri, navigasi + tombol "Jual Tiket" di kanan. Background putih, border-bottom subtle.

**Step 4: Buat Footer**

Grid 4 kolom: tentang, fitur, dukungan, sosial media. Background `#2C1F63`, teks putih.

**Step 5: Commit**

```bash
git add src/
git commit -m "feat: design system tokens, Navbar, and Footer"
```

---

## Task 3: Landing Page (`/`)

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/components/event/EventCard.tsx`
- Create: `src/components/home/HeroSection.tsx`
- Create: `src/components/home/FeaturedEvents.tsx`
- Create: `src/components/home/CTABanner.tsx`

**Konteks:**
Struktur tabel `events` yang relevan:
```
id, name, code, city, province, location, description,
thumbnail_image, start_date, end_date, event_status_id, category
```
Event aktif = `event_status_id = 1`. Fetch langsung di Server Component.

**Step 1: Fetch events di `src/app/page.tsx`**

```typescript
import { prisma } from "@/lib/prisma";
import HeroSection from "@/components/home/HeroSection";
import FeaturedEvents from "@/components/home/FeaturedEvents";
import CTABanner from "@/components/home/CTABanner";

async function getActiveEvents() {
  return prisma.events.findMany({
    where: { event_status_id: 1 },
    select: {
      id: true, name: true, code: true, city: true,
      thumbnail_image: true, start_date: true, category: true,
    },
    orderBy: { start_date: "asc" },
    take: 6,
  });
}

export default async function Home() {
  const events = await getActiveEvents();
  return (
    <>
      <HeroSection />
      <FeaturedEvents events={events} />
      <CTABanner />
    </>
  );
}
```

**Step 2: Buat `EventCard`**

Card dengan thumbnail, badge kategori, nama event, tanggal + kota. Link ke `/events/[code]`.

**Step 3: Buat `HeroSection`**

Full-width, background `#2C1F63`, headline putih, tombol CTA `#FFC351`.

**Step 4: Verifikasi di browser**

```bash
npm run dev
```

Buka `http://localhost:3000` → event dari Supabase harus tampil.

**Step 5: Commit**

```bash
git commit -m "feat: landing page with live events from Supabase"
```

---

## Task 4: Event Detail Page (`/events/[slug]`)

**Files:**
- Create: `src/app/events/[slug]/page.tsx`
- Create: `src/app/events/[slug]/loading.tsx`
- Create: `src/components/event/TicketSelector.tsx`
- Create: `src/components/event/EventInfo.tsx`
- Create: `src/components/event/AffiliateCapture.tsx` ← **titik integrasi kritis Fase 2**

**Konteks:**
- `slug` = `events.code` (contoh: `KONSER-JAKARTA-2026`)
- `AffiliateCapture` adalah invisible Client Component yang capture `?AFFIL=` dari URL → simpan ke `sessionStorage`
- `TicketSelector` adalah Client Component interaktif dengan counter tiket

**Step 1: Buat `AffiliateCapture` (Client Component)**

```typescript
"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export default function AffiliateCapture() {
  const searchParams = useSearchParams();
  useEffect(() => {
    const affiliateCode = searchParams.get("AFFIL");
    if (affiliateCode) {
      sessionStorage.setItem("affiliate_code", affiliateCode);
    }
  }, [searchParams]);
  return null;
}
```

**Step 2: Buat halaman Event Detail**

```typescript
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function EventDetailPage({ params }: { params: { slug: string } }) {
  const event = await prisma.events.findFirst({
    where: { code: params.slug, event_status_id: 1 },
    include: {
      ticket_categories: {
        where: { ticket_category_status_id: 1 },
        orderBy: { price: "asc" },
      },
    },
  });
  if (!event) notFound();

  return (
    <div>
      <AffiliateCapture />
      <EventInfo event={event} />
      <TicketSelector ticketCategories={event.ticket_categories} eventSlug={params.slug} />
    </div>
  );
}
```

**Step 3: Buat `TicketSelector` — sticky bottom bar dengan counter per kategori**

State lokal untuk quantity. Tombol "Lanjut Beli" → redirect ke `/events/[slug]/checkout?tickets=ID:QTY`.

**Step 4: Commit**

```bash
git commit -m "feat: event detail page, ticket selector, and AffiliateCapture component"
```

---

## Task 5: Checkout Page (`/events/[slug]/checkout`)

**Files:**
- Create: `src/app/events/[slug]/checkout/page.tsx`
- Create: `src/app/events/[slug]/checkout/success/page.tsx`
- Create: `src/components/checkout/BuyerForm.tsx`
- Create: `src/components/checkout/OrderSummary.tsx`
- Create: `src/actions/createOrder.ts`

**Konteks:**
- Form buyer per tiket: nama, email, no. HP, gender (sesuai tabel `tickets`)
- `admin_fee = 10000` (dari `events.admin_fee`)
- `affiliate_code` dibaca dari `sessionStorage` lalu disertakan di payload `createOrder`
- Payment di-mock untuk Fase 1: setelah submit langsung redirect ke `/success`

**Step 1: Buat Server Action `createOrder`**

```typescript
"use server";
import { prisma } from "@/lib/prisma";

type TicketInput = {
  ticket_category_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone_number: string;
  customer_gender: string;
};

export async function createOrder(input: {
  event_id: string;
  tickets: TicketInput[];
  affiliate_code?: string; // ← KRITIS: dikirim dari frontend, digunakan di Fase 2
}) {
  // TODO Fase 2: lookup affiliates.code dan catat ke affiliate_logs
  // Fase 1: cukup buat orders + tickets
  const orderId = `ORD-${Date.now()}`;
  // ... implementasi lengkap
  return { orderId };
}
```

**Step 2: Buat `BuyerForm` (Client Component)**

Form dinamis per tiket yang dipilih. Baca `sessionStorage.affiliate_code` → teruskan ke `createOrder`.

**Step 3: Buat `OrderSummary`**

Sidebar dengan breakdown: tiket, admin fee, total.

**Step 4: Buat halaman sukses dummy**

```typescript
export default function SuccessPage() {
  return (
    <div className="text-center py-16">
      <h1>Pembelian Berhasil! 🎉</h1>
      <p>Tiket akan dikirim ke email kamu.</p>
    </div>
  );
}
```

**Step 5: Commit**

```bash
git commit -m "feat: checkout page with buyer form, order creation, and affiliate_code passthrough"
```

---

## Task 6: Event Listing Page (`/events`)

**Files:**
- Create: `src/app/events/page.tsx`
- Create: `src/components/event/EventGrid.tsx`
- Create: `src/components/event/SearchFilter.tsx`

**Step 1: Server Component dengan search params**

```typescript
async function getEvents(q?: string, category?: string) {
  return prisma.events.findMany({
    where: {
      event_status_id: 1,
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      ...(category ? { category } : {}),
    },
    orderBy: { start_date: "asc" },
  });
}

export default async function EventsPage({ searchParams }) {
  const events = await getEvents(searchParams.q, searchParams.category);
  return (
    <>
      <SearchFilter />
      <EventGrid events={events} />
    </>
  );
}
```

**Step 2: `SearchFilter` — update URL params saat search/filter**

**Step 3: Commit**

```bash
git commit -m "feat: event listing page with search and category filter"
```

---

## Task 7: Polish & Testing Fase 1

**Files:**
- Create: `src/app/not-found.tsx`
- Create: `src/app/error.tsx`

**Step 1: Tambah dynamic metadata untuk Event Detail**

```typescript
export async function generateMetadata({ params }) {
  const event = await getEventBySlug(params.slug);
  return {
    title: `${event.name} — Kartjis`,
    description: event.description?.slice(0, 160),
    openGraph: { images: [event.thumbnail_image].filter(Boolean) },
  };
}
```

**Step 2: Test seluruh user flow**

```
[ ] Landing page load & tampilkan events dari Supabase
[ ] Klik event → masuk ke Event Detail
[ ] Akses URL dengan ?AFFIL=TEST123 → sessionStorage tersimpan
[ ] Pilih tiket → klik Lanjut Beli → masuk ke Checkout
[ ] Isi form → submit → redirect ke halaman sukses
[ ] affiliate_code ter-pass ke createOrder payload
```

**Step 3: Commit akhir Fase 1**

```bash
git commit -m "feat: complete Phase 1 — Kartjis core clone ready"
```

---

# FASE 2: Referral & Affiliate System

> **Prasyarat:** Fase 1 HARUS complete. Seluruh flow transaksi sudah berjalan.

## Task 8: Migrasi DB — Tabel Affiliasi

**Files:**
- Modify: `prisma/schema.prisma`

Tambah model `affiliates` dan `affiliate_logs` sesuai spesifikasi di `docs/projects/referral-system.md`.

```bash
npx prisma migrate dev --name add_affiliate_tables
```

```bash
git commit -m "feat: add affiliates and affiliate_logs tables"
```

---

## Task 9: Integrasi `affiliate_code` di `createOrder`

Update Server Action `src/actions/createOrder.ts`:
- Lookup `affiliates` by `code`
- Catat ke `affiliate_logs` jika valid

```bash
git commit -m "feat: record affiliate_logs on successful order"
```

---

## Task 10: Dashboard EO — Manajemen Affiliator

**Files:**
- Create: `src/app/dashboard/affiliates/page.tsx`
- Create: `src/actions/affiliate.ts`

Fitur: CRUD affiliator + Generate Affiliate Link (modal + copy link).

```bash
git commit -m "feat: EO dashboard — affiliate management with link generator"
```

---

## Task 11: Laporan Transaksi Afiliasi

**Files:**
- Create: `src/app/dashboard/affiliates/reports/page.tsx`

Fitur: tabel transaksi, filter, export CSV.

```bash
git commit -m "feat: affiliate transaction report with CSV export"
```

---

## Task 12: End-to-End Testing & Polish Fase 2

```
[ ] EO buat affiliator → kode auto-generated
[ ] EO generate link → URL berisi ?AFFIL=...
[ ] User klik link → sessionStorage tersimpan
[ ] User checkout → affiliate_logs tercatat
[ ] Laporan EO menampilkan transaksi affiliator
```

```bash
git commit -m "feat: complete Phase 2 — Referral & Affiliate System"
```

---

## Eksekusi Plan

**Dua opsi eksekusi:**

**1. Subagent-Driven (session ini)** — Dispatch fresh subagent per task, review antar task. **REQUIRED:** Switch Antigravity ke **Fast Mode**.

**2. Parallel Session (terpisah)** — Buka session baru, load executing-plans skill, eksekusi batch dengan checkpoint.
