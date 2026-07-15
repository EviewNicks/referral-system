# Fase 1: Kartjis Core Clone — Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Load executing-plans to implement this plan task-by-task.

**Goal:** Membangun clone faithful dari kartjis.id mencakup Landing Page, Event Detail, dan Checkout sebagai fondasi lengkap sebelum pengembangan fitur Referral System.

**Architecture:** Next.js 16 App Router — React Server Components untuk data fetching (landing, event detail), Client Components untuk interaktivitas (ticket selector, checkout form). Prisma ORM di-introspect dari Supabase PostgreSQL existing. No auth — semua halaman publik. UI dibangun di atas **shadcn/ui** base components yang di-override visual-nya sesuai Kartjis design system.

**Tech Stack:** Next.js 16.2.10, React 19, TypeScript, Tailwind CSS v4, Prisma ORM, Supabase PostgreSQL, shadcn/ui, `next/font` (Epilogue dari Google Fonts)

**Design Reference:**
- Layout & komponen: `docs/design/fase1/landing-page.png`, `kartjis-detail.png`, `kartjis-checkout.png`
- Color & typography: `docs/guide/design-system.md` + `docs/design/deisgn-ssytem kartjis.jpeg`
- Logo: `public/logo/logo.png`

**Path Convention:** ⚠️ Project menggunakan **flat structure tanpa `src/`**. Semua folder ada di root project:

```
referral-system/
├── app/              ← App Router (bukan src/app/)
│   ├── layout.tsx
│   ├── page.tsx
│   └── events/
│       └── [slug]/
│           ├── page.tsx
│           └── checkout/
├── components/       ← Komponen (bukan src/components/)
│   ├── ui/           ← shadcn/ui auto-generated, di-override visual
│   ├── layout/       ← Navbar, Footer
│   ├── home/         ← Komponen khusus landing page
│   ├── event/        ← Komponen event (card, detail, selector)
│   └── checkout/     ← Komponen checkout
├── lib/              ← Utilities (bukan src/lib/)
│   ├── prisma.ts
│   └── utils.ts
├── actions/          ← Server Actions
├── hooks/            ← Custom React hooks
├── types/            ← TypeScript types
└── prisma/           ← Prisma schema & migrations
```

**Import alias:** `@/*` → root project (bukan `src/`). Semua import menggunakan `@/lib/...`, `@/components/...`, dll.

---

## Task 1: Setup Project Structure, Prisma & shadcn/ui

**Files:**
- Move: `src/app/` → `app/` (pindah ke root)
- Delete: folder `src/` (setelah dipindah)
- Modify: `tsconfig.json` (fix path alias)
- Create: `prisma/schema.prisma`
- Create: `lib/prisma.ts`
- Create: `lib/utils.ts`

**Konteks:**
`.env.local` sudah ada dengan `DATABASE_URL` dan `DIRECT_URL`. Folder `src/app/` ada tapi kita pindahkan ke root. shadcn/ui diinstall untuk menyediakan base components (Button, Card, Input, dll) yang kemudian di-override visual sesuai Kartjis brutal design.

**Step 1: Pindahkan `src/app/` ke root `app/`**

Di Windows PowerShell:
```powershell
Move-Item -Path src\app -Destination app
Remove-Item -Recurse -Force src
```

Expected: Folder `app/` ada di root project, folder `src/` sudah tidak ada.

**Step 2: Fix path alias di `tsconfig.json`**

Ubah baris:
```json
"paths": {
  "@/*": ["./src/*"]
}
```
Menjadi:
```json
"paths": {
  "@/*": ["./*"]
}
```

Expected: Import `@/lib/...`, `@/components/...` sekarang resolve ke root project.

**Step 3: Install Prisma dependencies**

```bash
npm install @prisma/client
npm install --save-dev prisma tsx
```

Expected: `package.json` diupdate.

**Step 4: Inisialisasi Prisma**

```bash
npx prisma init --datasource-provider postgresql
```

Expected: Folder `prisma/` terbuat di root project.

**Step 5: Update `prisma/schema.prisma` untuk dual URL**

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

**Step 6: Introspect schema dari Supabase**

```bash
npx prisma db pull
```

Expected: `prisma/schema.prisma` terisi semua model existing (events, ticket_categories, orders, tickets, users, dll). Warning "some fields were not mapped" — normal, abaikan.

**Step 7: Generate Prisma Client**

```bash
npx prisma generate
```

Expected: `✔ Generated Prisma Client to ./node_modules/@prisma/client`

**Step 8: Buat `lib/prisma.ts` (Singleton — PENTING untuk Next.js)**

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

**Step 9: Buat `lib/utils.ts`**

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Diperlukan oleh shadcn/ui
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatTime(date: Date | string | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(date));
}
```

**Step 10: Install shadcn/ui**

```bash
npx shadcn@latest init
```

Saat ditanya, pilih:
- Style: **Default**
- Base color: **Neutral** (kita override nanti dengan Kartjis colors)
- CSS variables: **Yes**

Pastikan `components.json` mengarah ke `@/*` yang sudah difix (root-based).

**Step 11: Install shadcn components yang dibutuhkan Fase 1**

```bash
npx shadcn@latest add button card input badge separator skeleton
```

Expected: Folder `components/ui/` terbuat dengan file:
- `button.tsx`
- `card.tsx`
- `input.tsx`
- `badge.tsx`
- `separator.tsx`
- `skeleton.tsx`

**Step 12: Test koneksi DB**

Buat `scripts/test-db.ts`:
```typescript
import { prisma } from "../lib/prisma";

async function main() {
  const count = await prisma.events.count();
  console.log(`✅ Connected! Total events: ${count}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
```

```bash
npx tsx scripts/test-db.ts
```

Expected: `✅ Connected! Total events: [angka > 0]`

**Step 13: Verifikasi dev server berjalan**

```bash
npm run dev
```

Expected: Server berjalan di `http://localhost:3000` tanpa error. (Halaman masih kosong/Next.js default — normal.)

**Step 14: Commit**

```bash
git add app/ lib/ prisma/ components/ui/ scripts/ tsconfig.json components.json
git commit -m "chore: migrate to flat structure, setup Prisma + shadcn/ui"
```

---

## Task 2: Design System & Global Styles

**Files:**
- Modify: `app/globals.css`
- Modify: `app/layout.tsx`
- Create: `components/layout/Navbar.tsx`
- Create: `components/layout/Footer.tsx`
- Modify: `components/ui/button.tsx` (override visual sesuai Kartjis)
- Modify: `components/ui/card.tsx` (override visual sesuai Kartjis)
- Modify: `components/ui/badge.tsx` (override visual sesuai Kartjis)
- Modify: `components/ui/input.tsx` (override visual sesuai Kartjis)

**Konteks — Design System dari `docs/guide/design-system.md`:**

```
Font:        Epilogue (Google Fonts) — Regular 400, Medium 500, SemiBold 600, Bold 700
Primary:     Hitam #000000 (teks, border, background gelap)
White:       #FFFFFF (background utama, teks pada gelap)
Green:       #CAFF04 (CTA utama, highlight)
Blue:        #2E4EEA (elemen interaktif, badge)
Pink:        #DF135C (aksen sekunder, status aktif)
Yellow:      #FFBC05 (peringatan, notifikasi)
Red:         #FF3B30 (error)
Border:      Solid 1.5-2px black
Radius:      8px (input, badge) | 12px (card) | 16px (card besar) | 999px (pill button)
Shadow:      4px 4px 0px #000 (brutalist hard shadow)
```

**Strategi shadcn override:** shadcn/ui menggunakan CSS variables (`--primary`, `--background`, dll) yang didefinisikan di `globals.css`. Kita override variable-nya sesuai Kartjis — semua komponen shadcn yang sudah di-install otomatis mengikuti.

**Dari mockup `landing-page.png` — Navbar:**
- Background: putih, border-bottom 1px #E5E7EB
- Kiri: Logo `public/logo/logo.png` (height ~28px) + teks "KARTJIS.ID"
- Tengah: Search bar pill shape (placeholder: "cari event, acara, dll...")
- Kanan: Tombol "Beranda" (active state), "Jelajahi Event" (pill, border hitam + kuning hover), "Buat Event" (pill, border), "Masuk" (pill, border)

**Step 1: Update `app/globals.css`**

Override CSS variables shadcn/ui + tambah Kartjis brutal tokens:

```css
@import "tailwindcss";

@layer base {
  :root {
    /* shadcn/ui CSS variables — dioverride dengan Kartjis tokens */
    --background: 0 0% 100%;          /* #FFFFFF */
    --foreground: 0 0% 0%;            /* #000000 */
    --card: 0 0% 100%;
    --card-foreground: 0 0% 0%;
    --primary: 72 100% 51%;           /* #CAFF04 Brutal Green */
    --primary-foreground: 0 0% 0%;    /* hitam di atas hijau */
    --secondary: 226 79% 55%;         /* #2E4EEA Brutal Blue */
    --secondary-foreground: 0 0% 100%;
    --muted: 220 14% 96%;
    --muted-foreground: 220 9% 46%;
    --accent: 72 100% 51%;
    --accent-foreground: 0 0% 0%;
    --destructive: 4 91% 60%;         /* #FF3B30 Brutal Red */
    --destructive-foreground: 0 0% 100%;
    --border: 220 13% 91%;            /* #E5E7EB */
    --input: 220 13% 91%;
    --ring: 72 100% 51%;
    --radius: 0.75rem;                /* 12px — Kartjis default card radius */
  }
}

@theme {
  /* Brutal Palette — untuk digunakan via Tailwind class */
  --color-brutal-green:    #CAFF04;
  --color-brutal-blue:     #2E4EEA;
  --color-brutal-pink:     #DF135C;
  --color-brutal-yellow:   #FFBC05;
  --color-brutal-red:      #FF3B30;
  --color-brutal-orange:   #FF9500;
  --color-brutal-purple:   #6D05FF;
  --color-brutal-cyan:     #00FFFF;
  --color-brutal-black:    #000000;

  /* Typography */
  --font-sans: "Epilogue", system-ui, sans-serif;

  /* Radius Kartjis */
  --radius-sm:   8px;
  --radius-md:   12px;
  --radius-lg:   16px;
  --radius-pill: 999px;

  /* Shadow Brutalist */
  --shadow-brutal:    4px 4px 0px #000000;
  --shadow-brutal-sm: 2px 2px 0px #000000;
}

*, *::before, *::after {
  box-sizing: border-box;
}

body {
  font-family: var(--font-sans);
  background-color: #ffffff;
  color: #000000;
  min-height: 100vh;
}
```

**Step 2: Override shadcn `components/ui/button.tsx`**

Setelah `shadcn add button`, modifikasi variant untuk Kartjis style:
- `default` variant → background `#CAFF04` (brutal green), teks hitam, border hitam 2px, shadow brutal
- `outline` variant → border hitam 2px, no fill, hover fill hitam teks putih
- `ghost` variant → no border, hover bg gray-100
- radius → `rounded-[999px]` (pill) untuk action buttons, `rounded-[12px]` untuk form buttons

```typescript
// Tambahkan variant baru di buttonVariants:
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 font-semibold transition-all duration-150 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:   "bg-[#CAFF04] text-black border-2 border-black shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]",
        primary:   "bg-[#2C1F63] text-white border-2 border-black shadow-[2px_2px_0px_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]",
        outline:   "bg-white text-black border-2 border-black hover:bg-black hover:text-white",
        ghost:     "bg-transparent text-black hover:bg-gray-100 border-0",
        destructive: "bg-[#FF3B30] text-white border-2 border-black",
      },
      size: {
        default: "h-10 px-5 py-2 text-sm",
        sm:      "h-8 px-3 text-xs",
        lg:      "h-12 px-6 text-base",
        icon:    "h-10 w-10",
      },
      shape: {
        pill:    "rounded-[999px]",
        rounded: "rounded-[12px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "rounded",
    },
  }
);
```

**Step 3: Override shadcn `components/ui/card.tsx`**

```typescript
// Override Card styling untuk Kartjis brutal style
const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        // Kartjis card: border hitam 2px, radius 12px, shadow brutal on hover
        "rounded-[12px] border-2 border-[#E5E7EB] bg-white transition-all duration-200",
        "hover:border-black hover:shadow-[4px_4px_0px_#000]",
        className
      )}
      {...props}
    />
  )
);
```

**Step 4: Override shadcn `components/ui/badge.tsx`**

```typescript
// Badge sesuai kategori event — Kartjis menggunakan warna berbeda per kategori
const badgeVariants = cva(
  "inline-flex items-center rounded-[6px] border px-2 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default:   "border-[#2E4EEA] bg-[#2E4EEA]/10 text-[#2E4EEA]",
        music:     "border-[#2E4EEA] bg-[#2E4EEA]/10 text-[#2E4EEA]",
        sport:     "border-[#FFBC05] bg-[#FFBC05]/10 text-[#7a5a00]",
        religi:    "border-[#CAFF04] bg-[#CAFF04]/20 text-[#374151] border-[#6B7280]",
        art:       "border-[#DF135C] bg-[#DF135C]/10 text-[#DF135C]",
        seminar:   "border-[#6D05FF] bg-[#6D05FF]/10 text-[#6D05FF]",
        komunitas: "border-[#FF9500] bg-[#FF9500]/10 text-[#FF9500]",
        outline:   "border-[#E5E7EB] text-[#374151]",
      },
    },
    defaultVariants: { variant: "default" },
  }
);
```

**Step 5: Override shadcn `components/ui/input.tsx`**

```typescript
// Input sesuai Kartjis: border hitam 2px, radius 8px, focus ring brutal green
const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full rounded-[8px] border-2 border-[#E5E7EB] bg-white px-3 py-2 text-sm",
        "placeholder:text-[#9CA3AF]",
        "focus:border-black focus:outline-none focus:ring-2 focus:ring-[#CAFF04]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
```

**Step 6: Update `app/layout.tsx`**

```typescript
import type { Metadata } from "next";
import { Epilogue } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const epilogue = Epilogue({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-epilogue",
});

export const metadata: Metadata = {
  title: "Kartjis - Your all in one ticketing solution",
  description:
    "Kartjis adalah platform penjualan tiket online untuk berbagai jenis event di Indonesia. Beli tiket sat-set, tanpa ribet.",
  keywords: "Kartjis, tiket acara, event Indonesia, konser, festival, workshop",
  openGraph: {
    title: "Kartjis - Your all in one ticketing solution",
    description: "Platform tiket online terpercaya untuk event Indonesia",
    url: "https://kartjis.id",
    images: ["/images/og.png"],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={epilogue.variable}>
      <body className="font-[family-name:var(--font-epilogue)]">
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}
```

**Step 7: Buat `components/layout/Navbar.tsx`**

Faithful ke mockup `landing-page.png`:

```typescript
import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 h-[60px] flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/logo/logo.png"
            alt="Kartjis.ID"
            width={80}
            height={28}
            priority
          />
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#E5E7EB] bg-[#F8F8F8] text-sm text-[#9CA3AF]">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="cari event, acara, dll..."
              className="bg-transparent flex-1 outline-none text-[#111827] placeholder:text-[#9CA3AF]"
            />
          </div>
        </div>

        {/* Nav Actions */}
        <nav className="flex items-center gap-2 shrink-0">
          <Link
            href="/"
            className="px-4 py-2 rounded-full text-sm font-semibold bg-[#2C1F63] text-white"
          >
            Beranda
          </Link>
          <Link
            href="/events"
            className="px-4 py-2 rounded-full text-sm font-semibold border border-[#FFBC05] text-[#111827] hover:bg-[#FFBC05] transition-colors"
          >
            Jelajahi Event
          </Link>
          <Link
            href="#"
            className="px-4 py-2 rounded-full text-sm font-semibold border border-[#E5E7EB] text-[#111827] hover:bg-gray-50 transition-colors"
          >
            Buat Event
          </Link>
          <Link
            href="#"
            className="px-4 py-2 rounded-full text-sm font-semibold border border-[#E5E7EB] text-[#111827] hover:bg-gray-50 transition-colors"
          >
            Masuk
          </Link>
        </nav>
      </div>
    </header>
  );
}
```

**Step 8: Buat `components/layout/Footer.tsx`**

```typescript
import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#2C1F63] text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <Image src="/logo/logo.png" alt="Kartjis" width={80} height={28} className="invert mb-4" />
          <p className="text-sm text-white/70">Platform tiket online sat-set, tanpa ribet!</p>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Platform</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link href="/events" className="hover:text-white">Jelajahi Event</Link></li>
            <li><Link href="#" className="hover:text-white">Buat Event</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Perusahaan</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link href="#" className="hover:text-white">Tentang Kami</Link></li>
            <li><Link href="#" className="hover:text-white">Kontak</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-3">Legal</h4>
          <ul className="space-y-2 text-sm text-white/70">
            <li><Link href="#" className="hover:text-white">Syarat & Ketentuan</Link></li>
            <li><Link href="#" className="hover:text-white">Kebijakan Privasi</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-sm text-white/50">
        © 2026 Kartjis.ID. All rights reserved.
      </div>
    </footer>
  );
}
```

**Step 5: Buat `src/lib/utils.ts`**

```typescript
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string | null): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(date));
}
```

**Step 9: Verifikasi layout di browser**

```bash
npm run dev
```

Buka `http://localhost:3000` — Navbar dan Footer harus tampil. Inspeksi element tombol Navbar → harus punya border dan styling Kartjis (bukan shadcn default).

**Step 10: Commit**

```bash
git add app/globals.css app/layout.tsx components/layout/ components/ui/
git commit -m "feat: design system with shadcn/ui Kartjis overrides, Navbar, Footer"
```

---

## Task 3: Landing Page (`/`)

**Files:**
- Modify: `app/page.tsx`
- Create: `components/home/EventCarousel.tsx`
- Create: `components/home/EventCarouselClient.tsx` (Client — carousel arrows)
- Create: `components/home/NearbyEvents.tsx`
- Create: `components/home/CTABanner.tsx`
- Create: `components/event/EventCard.tsx` (menggunakan shadcn `Card` yang sudah di-override)

**shadcn components used:** `Card`, `Badge`, `Button` (sudah di-override di Task 2)

**Konteks — dari mockup `landing-page.png`:**

Layout landing page terdiri dari 3 section:
1. **Hero Carousel** — satu event featured besar dengan gambar, nama, tanggal, waktu, tombol "Beli Sekarang". Ada panah kiri/kanan. Dots indicator di bawah. Background card: gradient/warna cerah berdasarkan event.
2. **"Event Terdekat"** — horizontal scroll grid cards event. Setiap card: thumbnail (border rounded + border 2px warna kategori), nama event, badge kategori (colored), tanggal, waktu, lokasi.
3. **CTA Banner** — Background biru muda, teks "Beli Tiket Di KARTJIS dijamin Sat-Set tanpa ribet !!!", logo di kanan.

**Struktur tabel `events` yang digunakan:**
```
id, name, code, city, location, thumbnail_image, slide_image,
start_date, end_date, event_status_id, category
```

**Tabel `ticket_categories` untuk harga:**
```
id, event_id, name, price, stock, ticket_category_status_id
```

**Step 1: Fetch data di `src/app/page.tsx`**

```typescript
import { prisma } from "@/lib/prisma";
import EventCarousel from "@/components/home/EventCarousel";
import NearbyEvents from "@/components/home/NearbyEvents";
import CTABanner from "@/components/home/CTABanner";

// Types untuk event yang di-fetch
type EventWithMinPrice = {
  id: string;
  name: string;
  code: string;
  city: string;
  location: string;
  thumbnail_image: string | null;
  slide_image: string | null;
  start_date: Date | null;
  end_date: Date | null;
  category: string | null;
  minPrice: number | null;
};

async function getActiveEvents(): Promise<EventWithMinPrice[]> {
  const events = await prisma.events.findMany({
    where: { event_status_id: 1 },
    select: {
      id: true,
      name: true,
      code: true,
      city: true,
      location: true,
      thumbnail_image: true,
      slide_image: true,
      start_date: true,
      end_date: true,
      category: true,
      ticket_categories: {
        where: { ticket_category_status_id: 1 },
        select: { price: true },
        orderBy: { price: "asc" },
        take: 1,
      },
    },
    orderBy: { start_date: "asc" },
    take: 20,
  });

  return events.map((event) => ({
    ...event,
    minPrice: event.ticket_categories[0]?.price ?? null,
  }));
}

// ⚠️ Import di page.tsx menggunakan @/ yang sekarang resolve ke root (bukan src/)
// import { prisma } from "@/lib/prisma";  ← benar
// import { prisma } from "../lib/prisma"; ← JANGAN pakai relative path

export default async function HomePage() {
  const events = await getActiveEvents();
  const carouselEvents = events.slice(0, 5); // 5 event untuk carousel
  const nearbyEvents = events;              // semua untuk grid

  return (
    <main>
      <EventCarousel events={carouselEvents} />
      <section className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold mb-4">Event Terdekat</h2>
        <NearbyEvents events={nearbyEvents} />
      </section>
      <CTABanner />
    </main>
  );
}
```

**Step 2: Buat `EventCard` component menggunakan shadcn `Card` + `Badge`**

Faithful ke mockup — border berwarna berdasarkan kategori, thumbnail rounded, badge, tanggal, lokasi:

```typescript
// components/event/EventCard.tsx
import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";  // shadcn Card (sudah di-override)
import { Badge } from "@/components/ui/badge";              // shadcn Badge (sudah di-override)
import { formatDate, formatRupiah } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  "Art Entertainment": "border-[#DF135C] text-[#DF135C]",
  "Sport": "border-[#FFBC05] text-[#FFBC05]",
  "Music": "border-[#2E4EEA] text-[#2E4EEA]",
  "Religi": "border-[#CAFF04] text-[#374151]",
  "Seminar": "border-[#6D05FF] text-[#6D05FF]",
  "Komunitas": "border-[#FF9500] text-[#FF9500]",
};

type EventCardProps = {
  id: string;
  name: string;
  code: string;
  city: string;
  location: string;
  thumbnail_image: string | null;
  start_date: Date | null;
  end_date: Date | null;
  category: string | null;
  minPrice: number | null;
};

export default function EventCard({ name, code, city, location, thumbnail_image, start_date, end_date, category, minPrice }: EventCardProps) {
  const categoryColor = category ? (CATEGORY_COLORS[category] ?? "border-[#E5E7EB] text-[#374151]") : "border-[#E5E7EB] text-[#374151]";

  return (
    <Link href={`/events/${code}`} className="block">
      <div className="bg-white rounded-[12px] border-2 border-[#E5E7EB] overflow-hidden hover:border-[#2C1F63] hover:shadow-[4px_4px_0px_#2C1F63] transition-all duration-200">
        {/* Thumbnail */}
        <div className="relative w-full aspect-[4/3] bg-gray-100">
          {thumbnail_image ? (
            <Image
              src={thumbnail_image}
              alt={name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
              No Image
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3">
          {/* Category Badge */}
          {category && (
            <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded border ${categoryColor} mb-2`}>
              {category}
            </span>
          )}

          {/* Event Name */}
          <h3 className="font-bold text-sm leading-tight line-clamp-2 mb-2">{name}</h3>

          {/* Meta Info */}
          <div className="space-y-1 text-xs text-[#6B7280]">
            <div className="flex items-center gap-1">
              <span>📅</span>
              <span>{formatDate(start_date)}</span>
            </div>
            <div className="flex items-center gap-1">
              <span>📍</span>
              <span className="line-clamp-1">{location}, {city}</span>
            </div>
          </div>

          {/* Price */}
          {minPrice !== null && (
            <p className="text-xs font-semibold text-[#2C1F63] mt-2">
              Mulai {formatRupiah(minPrice)}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
```

**Step 3: Buat `EventCarousel` (Server wrapper) + `EventCarouselClient` (Client interaksi)**

`EventCarousel` adalah Server Component yang merender `EventCarouselClient` sebagai Client Component. Faithful ke mockup: card besar dengan background gradient/warna cerah, info event di kiri (nama, tanggal, waktu), thumbnail/slide image di kanan, tombol "Beli Sekarang", arrow prev/next, dots indicator.

**Step 4: Buat `NearbyEvents`**

```typescript
// src/components/home/NearbyEvents.tsx
import EventCard from "@/components/event/EventCard";

export default function NearbyEvents({ events }: { events: EventCardProps[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {events.map((event) => (
        <EventCard key={event.id} {...event} />
      ))}
    </div>
  );
}
```

**Step 5: Buat `CTABanner`**

Faithful ke mockup — background biru muda (`#EFF6FF`), teks bold hitam di kiri, logo Kartjis di kanan:

```typescript
// src/components/home/CTABanner.tsx
import Image from "next/image";

export default function CTABanner() {
  return (
    <section className="bg-[#EFF6FF] py-10 px-4 mt-8">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <h2 className="text-2xl font-bold max-w-md leading-tight">
          Beli Tiket Di KARTJIS dijamin<br />
          <span className="text-[#2C1F63]">Sat-Set tanpa ribet !!!</span>
        </h2>
        <Image src="/logo/logo.png" alt="Kartjis" width={160} height={56} />
      </div>
    </section>
  );
}
```

**Step 6: Verifikasi**

```bash
npm run dev
```

Buka `http://localhost:3000` → Landing page harus menampilkan carousel + grid events dari Supabase.

**Step 7: Commit**

```bash
git add app/page.tsx components/home/ components/event/EventCard.tsx
git commit -m "feat: landing page with event carousel and nearby events grid"
```

---

## Task 4: Event Detail Page (`/events/[slug]`)

**Files:**
- Create: `app/events/[slug]/page.tsx`
- Create: `app/events/[slug]/loading.tsx`
- Create: `app/events/[slug]/not-found.tsx`
- Create: `components/event/TicketSelector.tsx` (Client — shadcn `Button` untuk +/- counter)
- Create: `components/event/ShareButtons.tsx` (Client — shadcn `Button` variant=ghost)
- Create: `components/event/AffiliateCapture.tsx` ← **bridge ke Fase 2**
- Create: `components/event/RelatedEvents.tsx` (Server — shadcn `Card`)

**shadcn components used:** `Card`, `Button`, `Badge`, `Separator`, `Skeleton` (untuk loading state)

**Konteks — dari mockup `kartjis-detail.png`:**

Layout Event Detail:
- **Breadcrumb**: `🏠 / Event / [Nama Event]` di bawah navbar
- **Share buttons**: vertikal di sisi kiri (copy link, Twitter/X, Facebook, WhatsApp)
- **Main content**: 2 kolom
  - Kiri (60%): Gambar event besar (`detail_image`) dengan border/rounded
  - Kanan (40%): Nama event (font bold besar), badge tanggal, badge waktu, badge lokasi (dengan address), tombol CTA besar "Beli Kartjis Rp [harga termurah]" (background `#2C1F63`, teks putih)
- **Below the fold**: Section "Presented by [Nama EO]", "Description" (full text), section "Coba Event Lainnya" (horizontal card carousel)

**Struktur data yang digunakan:**

```
events: id, name, code, city, location, location_link, description,
        detail_image, thumbnail_image, start_date, end_date,
        event_status_id, admin_fee, contact_person

ticket_categories: id, name, price, stock, sales_start_time, sales_end_time,
                   ticket_category_status_id, event_id, maximum_tickets_per_transaction

event_organizers: id, username, event_id
```

**Step 1: Buat `AffiliateCapture.tsx` (Client Component — invisible)**

```typescript
// components/event/AffiliateCapture.tsx
"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * Invisible component — meng-capture parameter ?AFFIL= dari URL
 * dan menyimpannya ke sessionStorage untuk digunakan saat checkout.
 *
 * Ini adalah titik integrasi kritis untuk Fase 2 (Referral System).
 * Jangan hapus atau modifikasi tanpa memahami dampaknya ke affiliate tracking.
 */
export default function AffiliateCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const affiliateCode = searchParams.get("AFFIL");
    if (affiliateCode) {
      sessionStorage.setItem("affiliate_code", affiliateCode);
      // Debug log — hapus di production
      if (process.env.NODE_ENV === "development") {
        console.log(`[AffiliateCapture] Code captured: ${affiliateCode}`);
      }
    }
  }, [searchParams]);

  return null; // Tidak merender apapun di DOM
}
```

**Step 2: Buat `TicketSelector.tsx` (Client Component)**

```typescript
// components/event/TicketSelector.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";   // shadcn Button (sudah di-override)
import { Separator } from "@/components/ui/separator"; // shadcn Separator
import { formatRupiah } from "@/lib/utils";

type TicketCategory = {
  id: string;
  name: string;
  price: number;
  stock: number;
  maximum_tickets_per_transaction: number | null;
  sales_end_time: Date;
};

type TicketSelectorProps = {
  ticketCategories: TicketCategory[];
  eventSlug: string;
  adminFee: number;
};

export default function TicketSelector({ ticketCategories, eventSlug, adminFee }: TicketSelectorProps) {
  const router = useRouter();
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(ticketCategories.map((tc) => [tc.id, 0]))
  );

  const totalTickets = Object.values(quantities).reduce((a, b) => a + b, 0);
  const subtotal = ticketCategories.reduce(
    (sum, tc) => sum + tc.price * (quantities[tc.id] || 0),
    0
  );
  const total = totalTickets > 0 ? subtotal + adminFee : 0;

  function setQty(id: string, delta: number) {
    const tc = ticketCategories.find((t) => t.id === id)!;
    const max = tc.maximum_tickets_per_transaction ?? 10;
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.min(max, Math.max(0, (prev[id] || 0) + delta)),
    }));
  }

  function handleCheckout() {
    const ticketParams = ticketCategories
      .filter((tc) => quantities[tc.id] > 0)
      .map((tc) => `${tc.id}:${quantities[tc.id]}`)
      .join(",");
    router.push(`/events/${eventSlug}/checkout?tickets=${ticketParams}`);
  }

  const minPrice = ticketCategories.length > 0
    ? Math.min(...ticketCategories.map((tc) => tc.price))
    : 0;

  return (
    <div>
      {/* CTA Button (sebelum user pilih tiket) */}
      {totalTickets === 0 && (
        <button
          onClick={() => {
            document.getElementById("ticket-list")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="w-full py-3 bg-[#2C1F63] text-white font-bold rounded-[12px] hover:bg-[#1e1547] transition-colors"
        >
          Beli Kartjis {formatRupiah(minPrice)}
        </button>
      )}

      {/* Ticket List */}
      <div id="ticket-list" className="mt-6 space-y-3">
        {ticketCategories.map((tc) => (
          <div key={tc.id} className="border-2 border-[#E5E7EB] rounded-[12px] p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">{tc.name}</p>
              <p className="text-[#2C1F63] font-bold">{formatRupiah(tc.price)}</p>
              <p className="text-xs text-[#6B7280]">Sisa {tc.stock} tiket</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty(tc.id, -1)}
                disabled={quantities[tc.id] === 0}
                className="w-8 h-8 rounded-full border-2 border-[#E5E7EB] flex items-center justify-center font-bold disabled:opacity-40"
              >
                -
              </button>
              <span className="w-6 text-center font-bold">{quantities[tc.id]}</span>
              <button
                onClick={() => setQty(tc.id, 1)}
                disabled={quantities[tc.id] >= (tc.maximum_tickets_per_transaction ?? 10)}
                className="w-8 h-8 rounded-full border-2 border-[#2C1F63] flex items-center justify-center font-bold disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Sticky Bottom Bar — muncul jika ada tiket dipilih */}
      {totalTickets > 0 && (
        <div className="sticky bottom-0 bg-white border-t-2 border-[#E5E7EB] p-4 mt-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-[#6B7280]">{totalTickets} tiket dipilih</span>
            <span className="font-bold">{formatRupiah(total)}</span>
          </div>
          <button
            onClick={handleCheckout}
            className="w-full py-3 bg-[#2C1F63] text-white font-bold rounded-[12px] hover:bg-[#1e1547] transition-colors"
          >
            Lanjut Beli →
          </button>
        </div>
      )}
    </div>
  );
}
```

**Step 3: Buat `src/app/events/[slug]/page.tsx`**

```typescript
// app/events/[slug]/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";      // shadcn Skeleton
import { Badge } from "@/components/ui/badge";            // shadcn Badge (override)
import TicketSelector from "@/components/event/TicketSelector";
import AffiliateCapture from "@/components/event/AffiliateCapture";
import RelatedEvents from "@/components/event/RelatedEvents";
import ShareButtons from "@/components/event/ShareButtons";
import { formatDate, formatTime } from "@/lib/utils";

async function getEvent(slug: string) {
  const event = await prisma.events.findFirst({
    where: { code: slug, event_status_id: 1 },
    include: {
      ticket_categories: {
        where: { ticket_category_status_id: 1 },
        orderBy: { price: "asc" },
      },
    },
  });
  return event;
}

// Dynamic SEO metadata per event
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const event = await getEvent(params.slug);
  if (!event) return { title: "Event tidak ditemukan — Kartjis" };
  return {
    title: `${event.name} — Kartjis`,
    description: event.description?.slice(0, 160) ?? undefined,
    openGraph: {
      images: event.thumbnail_image ? [event.thumbnail_image] : [],
    },
  };
}

export default async function EventDetailPage({ params }: { params: { slug: string } }) {
  const event = await getEvent(params.slug);
  if (!event) notFound();

  const now = new Date();
  const availableTickets = event.ticket_categories.filter(
    (tc) => new Date(tc.sales_end_time) > now && tc.stock > 0
  );

  return (
    <main className="max-w-7xl mx-auto px-4 py-6">
      {/* AffiliateCapture — invisible, harus di-wrap Suspense karena useSearchParams */}
      <Suspense fallback={null}>
        <AffiliateCapture />
      </Suspense>

      {/* Breadcrumb */}
      <nav className="text-sm text-[#6B7280] mb-6 flex items-center gap-2">
        <Link href="/" className="hover:text-[#2C1F63]">🏠</Link>
        <span>/</span>
        <Link href="/events" className="hover:text-[#2C1F63]">Event</Link>
        <span>/</span>
        <span className="text-[#2C1F63] font-medium">{event.name}</span>
      </nav>

      <div className="flex gap-6">
        {/* Share Buttons — vertikal di kiri */}
        <ShareButtons eventName={event.name} eventSlug={params.slug} />

        {/* Main Content */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Gambar Event — kiri */}
          <div className="lg:col-span-3">
            <div className="relative rounded-[16px] overflow-hidden border-2 border-[#E5E7EB] aspect-video">
              {event.detail_image || event.thumbnail_image ? (
                <Image
                  src={(event.detail_image ?? event.thumbnail_image)!}
                  alt={event.name}
                  fill
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-400">
                  No Image
                </div>
              )}
            </div>
          </div>

          {/* Info + Ticket Selector — kanan */}
          <div className="lg:col-span-2">
            <h1 className="text-2xl font-bold mb-4">{event.name}</h1>

            {/* Info Badges */}
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-sm border border-[#CAFF04] bg-[#CAFF04]/10 rounded-[8px] px-3 py-2">
                <span>📅</span>
                <span className="font-medium">{formatDate(event.start_date)} — {formatDate(event.end_date)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm border border-[#2E4EEA] bg-[#2E4EEA]/10 rounded-[8px] px-3 py-2">
                <span>🕐</span>
                <span className="font-medium">
                  {event.start_date ? new Date(event.start_date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", timeZoneName: "short" }) : "-"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm border border-[#E5E7EB] rounded-[8px] px-3 py-2">
                <span>📍</span>
                <a
                  href={event.location_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-[#2C1F63] hover:underline line-clamp-2"
                >
                  {event.location}, {event.city}
                </a>
              </div>
            </div>

            {/* Ticket Selector */}
            <TicketSelector
              ticketCategories={availableTickets}
              eventSlug={params.slug}
              adminFee={event.admin_fee ?? 10000}
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <section className="mt-10 max-w-3xl">
        {event.contact_person && (
          <p className="text-sm text-[#6B7280] mb-4 flex items-center gap-2">
            <span>🎫</span> Presented by <strong>{event.contact_person}</strong>
          </p>
        )}
        <h2 className="text-xl font-bold mb-3">Description</h2>
        <p className="text-[#374151] leading-relaxed whitespace-pre-line">{event.description}</p>
      </section>

      {/* Related Events */}
      <Suspense fallback={<div className="h-48 animate-pulse bg-gray-100 rounded-[12px] mt-10" />}>
        <RelatedEvents currentEventId={event.id} category={event.category} />
      </Suspense>
    </main>
  );
}
```

**Step 4: Buat `ShareButtons.tsx` (Client Component)**

Faithful ke mockup — vertikal: copy link, Twitter, Facebook, WhatsApp.

**Step 5: Buat `RelatedEvents.tsx` (Server Component)**

Fetch events dengan kategori yang sama, tampilkan sebagai horizontal card carousel dengan tombol panah.

**Step 6: Buat `loading.tsx` skeleton**

```typescript
export default function Loading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 animate-pulse">
      <div className="h-4 w-48 bg-gray-200 rounded mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 aspect-video bg-gray-200 rounded-[16px]" />
        <div className="lg:col-span-2 space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-10 bg-gray-200 rounded" />
          <div className="h-12 bg-gray-200 rounded" />
        </div>
      </div>
    </div>
  );
}
```

**Step 7: Commit**

```bash
git add app/events/ components/event/
git commit -m "feat: event detail page with ticket selector, affiliate capture, and related events"
```

---

## Task 5: Checkout Page (`/events/[slug]/checkout`)

**Files:**
- Create: `app/events/[slug]/checkout/page.tsx`
- Create: `app/events/[slug]/checkout/success/page.tsx`
- Create: `components/checkout/CheckoutForm.tsx` (Client — shadcn `Input`, `Button`, radio cards)
- Create: `components/checkout/OrderSummary.tsx` (Client — shadcn `Card` sticky)
- Create: `components/checkout/ProgressBar.tsx`
- Create: `actions/createOrder.ts` (Server Action)
- Create: `types/checkout.ts`

**shadcn components used:** `Card`, `CardContent`, `CardHeader`, `Input`, `Button`, `Separator`, `Checkbox`

```bash
# Install Checkbox shadcn jika belum:
npx shadcn@latest add checkbox
```

**Konteks — dari mockup `kartjis-checkout.png`:**

Layout Checkout:
- **Navbar checkout**: Logo kiri, progress bar center ("Personal Information >> Checkout"), tanpa search bar
- **Dua panel utama**:
  - **Kiri (65%)**: Banner "Lebih cepat dengan satu data!" (opsional, skip untuk Fase 1), kemudian seksi `Personal Information #1: [Nama Tiket]` dengan form fields: Nama Lengkap, Email, Phone Number, Tanggal Lahir, Jenis Kelamin (radio Laki-Laki/Perempuan). Setiap tiket punya section sendiri (collapsible dengan chevron atas/bawah).
  - **Kanan (35%)**: Card "Pesanan anda" sticky — thumbnail event, nama event, tanggal, lokasi, breakdown tiket × qty + harga, Admin Fee, Total. Tombol "Beli Kartjis Sekarang" (disabled sampai form valid).
- **Footer**: Checkbox T&C dengan teks "By clicking this 'CheckBox' you have agreed to Terms & Condition and Privacy Policy of Kartjis."

**Query param `tickets`**: Format `CAT_ID:QTY,CAT_ID:QTY`

**Step 1: Buat types di `src/types/checkout.ts`**

```typescript
export type TicketBuyerData = {
  ticket_category_id: string;
  ticket_category_name: string;
  ticket_price: number;
  customer_name: string;
  customer_email: string;
  customer_phone_number: string;
  customer_birth_date: string;
  customer_gender: "Laki-Laki" | "Perempuan";
};

export type CreateOrderPayload = {
  event_id: string;
  tickets: TicketBuyerData[];
  affiliate_code?: string; // ← dari sessionStorage, untuk Fase 2
};
```

**Step 2: Buat Server Action `src/actions/createOrder.ts`**

```typescript
// actions/createOrder.ts  ← perhatikan: di root /actions/ bukan /src/actions/
"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import type { CreateOrderPayload } from "@/types/checkout";

function generateOrderId(): string {
  return `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function generateTicketCode(): string {
  return `TKT-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

export async function createOrder(payload: CreateOrderPayload) {
  const { event_id, tickets, affiliate_code } = payload;

  // 1. Hitung total amount
  const subtotal = tickets.reduce((sum, t) => sum + t.ticket_price, 0);
  const adminFee = 10000; // dari events.admin_fee — hardcode untuk Fase 1
  const totalAmount = subtotal + adminFee;

  // 2. Buat order
  const orderId = generateOrderId();
  await prisma.orders.create({
    data: {
      id: orderId,
      date: new Date(),
      total_amount: totalAmount,
      admin_fees: adminFee,
      subtotal_amount: subtotal,
      order_status_id: 1, // pending payment
      // affiliate_id: akan diisi di Fase 2
    },
  });

  // 3. Buat tickets
  for (const ticket of tickets) {
    await prisma.tickets.create({
      data: {
        id: crypto.randomUUID(),
        code: generateTicketCode(),
        event_id,
        order_id: orderId,
        ticket_category_id: ticket.ticket_category_id,
        customer_name: ticket.customer_name,
        customer_email: ticket.customer_email,
        customer_phone_number: ticket.customer_phone_number,
        customer_gender: ticket.customer_gender,
        price: ticket.ticket_price,
      },
    });
  }

  // TODO (Fase 2): Lookup affiliate_code → catat ke affiliate_logs
  // if (affiliate_code) { ... }

  // 4. Redirect ke halaman sukses
  redirect(`/events/checkout/success?order_id=${orderId}`);
}
```

**Step 3: Buat `CheckoutForm.tsx` (Client Component)**

Baca query params `tickets`, fetch detail ticket categories dari server, render form per tiket, baca `sessionStorage.affiliate_code`, submit `createOrder`.

**Step 4: Buat `OrderSummary.tsx`**

Card sticky kanan faithful ke mockup — thumbnail event, nama, breakdown tiket, Admin Fee × jumlah tiket, Total, tombol submit.

**Step 5: Buat `checkout/page.tsx`**

```typescript
// app/events/[slug]/checkout/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import CheckoutForm from "@/components/checkout/CheckoutForm";
import OrderSummary from "@/components/checkout/OrderSummary";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { tickets?: string };
}) {
  if (!searchParams.tickets) notFound();

  // Parse ticket params: "CAT_ID:QTY,CAT_ID:QTY"
  const ticketItems = searchParams.tickets.split(",").map((t) => {
    const [id, qty] = t.split(":");
    return { id, qty: parseInt(qty, 10) };
  });

  // Fetch event + ticket categories
  const event = await prisma.events.findFirst({
    where: { code: params.slug },
    select: {
      id: true, name: true, thumbnail_image: true,
      start_date: true, location: true, city: true, admin_fee: true,
      ticket_categories: {
        where: { id: { in: ticketItems.map((t) => t.id) } },
        select: { id: true, name: true, price: true },
      },
    },
  });

  if (!event) notFound();

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Kiri: Form */}
        <div className="lg:col-span-2">
          <CheckoutForm
            event={event}
            ticketItems={ticketItems}
          />
        </div>

        {/* Kanan: Order Summary */}
        <div className="lg:col-span-1">
          <OrderSummary
            event={event}
            ticketItems={ticketItems}
          />
        </div>
      </div>
    </main>
  );
}
```

**Step 6: Buat halaman sukses**

```typescript
// app/events/checkout/success/page.tsx
import Link from "next/link";

export default function SuccessPage({ searchParams }: { searchParams: { order_id?: string } }) {
  return (
    <main className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="text-6xl mb-6">🎉</div>
      <h1 className="text-2xl font-bold mb-2">Pembelian Berhasil!</h1>
      <p className="text-[#6B7280] mb-4">
        Order ID: <strong>{searchParams.order_id}</strong>
      </p>
      <p className="text-[#6B7280] mb-8">
        Tiket akan dikirim ke email kamu. Terima kasih telah menggunakan Kartjis!
      </p>
      <Link
        href="/"
        className="inline-block px-6 py-3 bg-[#2C1F63] text-white font-bold rounded-[12px] hover:bg-[#1e1547] transition-colors"
      >
        Kembali ke Beranda
      </Link>
    </main>
  );
}
```

**Step 7: Commit**

```bash
git add app/events/ components/checkout/ actions/ types/
git commit -m "feat: checkout page with buyer forms, order summary, and createOrder server action"
```

---

## Task 6: Event Listing Page (`/events`)

**Files:**
- Create: `app/events/page.tsx`
- Create: `app/events/loading.tsx`
- Create: `components/event/EventGrid.tsx`
- Create: `components/event/SearchFilter.tsx` (Client — shadcn `Input` + native select)

**shadcn components used:** `Input`, `Button`, `Skeleton` (untuk loading state)

```bash
# Pastikan Input sudah di-install dari Task 1. Jika belum:
npx shadcn@latest add input
```

**Konteks:**
Halaman listing semua event aktif. Filter via URL search params agar SEO-friendly dan dapat di-bookmark. Server Component untuk data fetching, Client Component hanya untuk search/filter input.

**Step 1: Buat `src/app/events/page.tsx`**

```typescript
import { prisma } from "@/lib/prisma";
import EventGrid from "@/components/event/EventGrid";
import SearchFilter from "@/components/event/SearchFilter";

async function getEvents(q?: string, category?: string) {
  return prisma.events.findMany({
    where: {
      event_status_id: 1,
      ...(q ? { name: { contains: q, mode: "insensitive" } } : {}),
      ...(category && category !== "all" ? { category } : {}),
    },
    select: {
      id: true, name: true, code: true, city: true, location: true,
      thumbnail_image: true, start_date: true, end_date: true, category: true,
      ticket_categories: {
        where: { ticket_category_status_id: 1 },
        select: { price: true },
        orderBy: { price: "asc" },
        take: 1,
      },
    },
    orderBy: { start_date: "asc" },
  });
}

async function getCategories() {
  const result = await prisma.events.groupBy({
    by: ["category"],
    where: { event_status_id: 1, category: { not: null } },
  });
  return result.map((r) => r.category!).filter(Boolean);
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string };
}) {
  const [events, categories] = await Promise.all([
    getEvents(searchParams.q, searchParams.category),
    getCategories(),
  ]);

  const eventsWithMinPrice = events.map((e) => ({
    ...e,
    minPrice: e.ticket_categories[0]?.price ?? null,
  }));

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Jelajahi Event</h1>
      <SearchFilter categories={categories} />
      <div className="mt-6">
        {eventsWithMinPrice.length > 0 ? (
          <EventGrid events={eventsWithMinPrice} />
        ) : (
          <div className="text-center py-16 text-[#6B7280]">
            <p className="text-4xl mb-4">🔍</p>
            <p className="font-semibold">Tidak ada event ditemukan</p>
            <p className="text-sm">Coba kata kunci atau kategori lain</p>
          </div>
        )}
      </div>
    </main>
  );
}
```

**Step 2: Buat `SearchFilter.tsx` (Client Component)**

Input search + dropdown kategori. Update URL saat submit dengan `useRouter().push()`.

**Step 3: Buat `EventGrid.tsx`**

Grid responsive menggunakan `EventCard`.

**Step 4: Commit**

```bash
git add app/events/ components/event/EventGrid.tsx components/event/SearchFilter.tsx
git commit -m "feat: event listing page with search and category filter"
```

---

## Task 7: Polish, Error Pages & SEO

**Files:**
- Create: `app/not-found.tsx`
- Create: `app/error.tsx`
- Create: `app/events/[slug]/not-found.tsx`

**Step 1: Buat global 404 page**

```typescript
// app/not-found.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";  // shadcn Button

export default function NotFound() {
  return (
    <main className="max-w-md mx-auto px-4 py-24 text-center">
      <div className="text-8xl font-bold text-[#E5E7EB] mb-4">404</div>
      <h1 className="text-2xl font-bold mb-2">Halaman tidak ditemukan</h1>
      <p className="text-[#6B7280] mb-8">Mungkin event ini sudah berakhir atau link-nya salah.</p>
      <Link href="/" className="inline-block px-6 py-3 bg-[#2C1F63] text-white font-bold rounded-[12px]">
        Kembali ke Beranda
      </Link>
    </main>
  );
}
```

**Step 2: Buat global Error boundary**

```typescript
// app/error.tsx
"use client";
import { Button } from "@/components/ui/button";  // shadcn Button

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="max-w-md mx-auto px-4 py-24 text-center">
      <div className="text-6xl mb-4">⚠️</div>
      <h1 className="text-2xl font-bold mb-2">Terjadi kesalahan</h1>
      <p className="text-[#6B7280] mb-8">Maaf, ada yang tidak beres. Silakan coba lagi.</p>
      <button onClick={reset} className="px-6 py-3 bg-[#2C1F63] text-white font-bold rounded-[12px]">
        Coba Lagi
      </button>
    </main>
  );
}
```

**Step 3: Test seluruh user flow**

```
[ ] Landing page load — event dari Supabase tampil
[ ] Klik EventCard → navigasi ke Event Detail
[ ] Event Detail: gambar, info badges, ticket selector muncul
[ ] Akses URL dengan ?AFFIL=TEST123 → cek sessionStorage di browser DevTools
[ ] Pilih tiket → klik "Lanjut Beli" → redirect ke Checkout
[ ] Checkout: form muncul per tiket sesuai pilihan
[ ] Isi form → submit → redirect ke halaman sukses
[ ] Event Listing: search & filter bekerja
[ ] Akses URL tidak valid → 404 muncul
[ ] affiliate_code dari sessionStorage ada di createOrder payload (lihat console log dev)
```

**Step 4: Commit akhir Fase 1**

```bash
git add src/app/not-found.tsx src/app/error.tsx src/app/events/[slug]/not-found.tsx
git commit -m "feat(phase1): complete Kartjis core clone — landing, event detail, checkout"
```

---

## Dependency yang Perlu di-Install

```bash
# Step 1 — Prisma ORM + TypeScript runner
npm install @prisma/client
npm install --save-dev prisma tsx

# Step 2 — shadcn/ui dependencies (auto-install saat npx shadcn init, tapi jika manual):
npm install clsx tailwind-merge class-variance-authority @radix-ui/react-slot
npm install @radix-ui/react-separator @radix-ui/react-checkbox

# Step 3 — shadcn init (interactive)
npx shadcn@latest init

# Step 4 — Install semua shadcn components yang dibutuhkan sekaligus
npx shadcn@latest add button card input badge separator skeleton checkbox
```

> **Catatan:** `next/font`, `next/image`, `next/link`, `next/navigation` sudah bundled dengan Next.js 16. Tailwind CSS v4 sudah ada. `shadcn/ui` bukan library — dia meng-copy source code komponen langsung ke `components/ui/` sehingga kita bisa edit bebas.

---

## Checklist Fase 1 Selesai

```
[ ] Task 1: Prisma tersambung ke Supabase, db pull berhasil
[ ] Task 2: Design system tokens active, Navbar + Footer rendered
[ ] Task 3: Landing page menampilkan event real dari DB
[ ] Task 4: Event Detail: info, ticket selector, AffiliateCapture bekerja
[ ] Task 5: Checkout: form, order summary, createOrder berhasil insert ke DB
[ ] Task 6: Event Listing: search + filter bekerja
[ ] Task 7: Error pages exist, full user flow tested

→ Siap lanjut ke Fase 2: Referral & Affiliate System
```
