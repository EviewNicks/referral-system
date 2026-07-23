# Rencana Implementasi Fase 3: Auth & RBAC, WhatsApp Automation, dan Payout System (Ponytail Edition)

## Goal Description
Fase 3 melengkapi platform Kartjis dengan 3 pilar utama secara ultra-lean (zero boilerplate, zero unnecessary abstractions):
1. **🔐 Supabase Auth & Multi-Role RBAC System**: Autentikasi & otorisasi bertingkat (`SUPER_ADMIN`, `EO`, `AFFILIATOR`) memanfaatkan Supabase `user_metadata` native.
2. **📲 Otomatisasi Notifikasi WhatsApp (Fonnte API - Non-Blocking)**: Integrasi pesan otomatis Fonnte API secara asinkron tanpa menahan (*fire-and-forget*) alur checkout tiket.
3. **💸 Modul Payout & Pencairan Komisi**: Pengajuan penarikan komisi affiliator berbasis rekening default dan manajemen persetujuan oleh Admin/EO.

---

## User Review Required

> [!IMPORTANT]
> **Pembaruan Skema Database (Prisma)**:
> Menambahkan atribut rekening bank default pada `affiliates` dan tabel `payout_requests` ke `prisma/schema.prisma`.

> [!WARNING]
> **Kunci API WhatsApp (Fonnte)**:
> Diperlukan variabel lingkungan `FONNTE_API_TOKEN` pada berkas `.env.local`.

---

## Proposed Changes

### 📡 1. Database Layer (Prisma & Supabase)
---
#### [MODIFY] `prisma/schema.prisma`
```prisma
// ponytail: Penambahan enum status pencairan komisi yang ramping
enum PayoutStatus {
  PENDING
  APPROVED
  REJECTED
}

// ponytail: Rekening bank default tersimpan langsung di tabel affiliates untuk normalisasi data
model affiliates {
  id                  String            @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  eo_id               String?           @db.Char(36)
  name                String            @db.VarChar(255)
  code                String            @unique @db.VarChar(50)
  whatsapp            String?           @db.VarChar(20)
  bank_name           String?           @db.VarChar(100)
  bank_account_number String?           @db.VarChar(50)
  bank_account_name   String?           @db.VarChar(255)
  created_at          DateTime?         @default(now()) @db.Timestamptz(6)
  updated_at          DateTime?         @default(now()) @db.Timestamptz(6)

  affiliate_logs      affiliate_logs[]
  payout_requests     payout_requests[]
}

// ponytail: Model payout_requests sederhana tanpa atribut redundan
model payout_requests {
  id             String       @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  affiliate_id   String       @db.Uuid
  amount         BigInt
  bank_name      String       @db.VarChar(100)
  account_number String       @db.VarChar(50)
  account_name   String       @db.VarChar(255)
  status         PayoutStatus @default(PENDING)
  proof_url      String?      @db.Text
  notes          String?      @db.Text
  created_at     DateTime?    @default(now()) @db.Timestamptz(6)
  updated_at     DateTime?    @default(now()) @db.Timestamptz(6)

  affiliates     affiliates   @relation(fields: [affiliate_id], references: [id], onDelete: Cascade)
}
```

---

### 🔐 2. Auth & RBAC Module (`middleware.ts` & Supabase SSR)
---
#### [NEW] `lib/supabase/server.ts` & `lib/supabase/client.ts`
Helper inisialisasi Supabase Client menggunakan `@supabase/ssr`.

#### [NEW] `middleware.ts`
```typescript
// ponytail: Middleware proteksi rute halaman minimalis berbasis role user_metadata
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next();
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  // Protect /admin routes (EO & Super Admin only)
  if (path.startsWith("/admin")) {
    const role = user?.user_metadata?.role;
    if (!user || (role !== "EO" && role !== "SUPER_ADMIN")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Protect /affiliate/dashboard routes (Affiliator only)
  if (path.startsWith("/affiliate/dashboard")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return response;
}
```

---

### 📲 3. WhatsApp Non-Blocking Module (`lib/whatsapp.ts`)
---
#### [NEW] `lib/whatsapp.ts`
```typescript
// ponytail: Non-blocking WhatsApp gateway menggunakan standard fetch tanpa library pihak ketiga yang berat
export async function sendWhatsAppMessage({ target, message }: { target: string; message: string }) {
  const token = process.env.FONNTE_API_TOKEN;
  if (!token || !target) return { success: false, message: "Missing token/target" };

  try {
    const res = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: { Authorization: token, "Content-Type": "application/json" },
      body: JSON.stringify({ target, message }),
    });
    return await res.json();
  } catch (err) {
    // ponytail: Silent log agar error jaringan WA tidak merusak alur checkout utama
    console.error("WhatsApp Send Warning (Non-blocking):", err);
    return { success: false, error: err };
  }
}
```

#### [MODIFY] `features/checkout/actions.ts`
```typescript
// ponytail: Panggil sendWhatsAppMessage secara background task (tanpa await) setelah transaksi DB sukses
sendWhatsAppMessage({
  target: customerPhone,
  message: `Halo ${customerName}! Pemesanan tiket ${eventName} berhasil. Lihat E-Tiket Anda: ${orderUrl}`
}).catch(console.error);
```

---

### 💸 4. Modul Payout & Pencairan Komisi (`features/payouts`)
---
#### [NEW] `features/payouts/actions.ts`
Server Actions sederhana untuk request & persetujuan payout:
* `requestPayoutAction`: Affiliator membuat permintaan klaim penarikan saldo komisi.
* `approvePayoutAction`: Admin menyetujui klaim & mengunggah bukti transfer.
* `rejectPayoutAction`: Admin menolak pengajuan klaim penarikan.

#### [NEW] `app/affiliate/dashboard/page.tsx`
Portal khusus Partner Afiliator (Metrik performa rujukan, Link Unik, Form & Histori Payout).

#### [NEW] `app/admin/payouts/page.tsx`
Tabel persetujuan klaim penarikan komisi di Dasbor Admin EO.

---

## Verification Plan

### Automated Tests
* **Compile Check**: `npx tsc --noEmit` -> 0 Type Error.

### Manual Verification
1. **Verifikasi Auth**: Login & proteksi role `/admin` vs `/affiliate/dashboard`.
2. **Verifikasi WhatsApp**: Checkout tiket & uji pengiriman pesan Fonnte.
3. **Verifikasi Payout**: Pengajuan klaim payout di portal partner & persetujuan di dasbor admin.
