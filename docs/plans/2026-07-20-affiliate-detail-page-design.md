# Design Document - Affiliate Detail Page & Main List Action Refactor

## 🎯 Goal
Implement the high-fidelity Affiliate Detail Page (/admin/referral/[code]) according to `dashboard-referral-detail.png` mockup specifications, and update the action columns in the main `/admin/referral` table list to replace generating links and deleting partner buttons with a single view detail icon.

---

## 🛠️ Architecture & Specifications

### 1. Route Pattern: Option A (`/admin/referral/[code]`)
*   **Path**: `/app/admin/referral/[code]/page.tsx`
*   **Behavior**: A dynamic route that reads the `code` parameter from the URL (e.g. `/admin/referral/ANDI2026`), fetches affiliate details and their referred transaction logs on the server side, and passes it to the client presentation component.

### 2. Main Page Actions Refactor (`AffiliatesList.tsx`)
*   **Remove**: The `Link2` icon (Generate Link popup trigger) and `Trash2` icon (Delete partner trigger) will be removed from the action column.
*   **Add**: A single `Eye` icon button (from `lucide-react`) next to the active toggle. When clicked, it routes to `/admin/referral/[code]`.
*   **Keep**: The `ToggleRight` / `ToggleLeft` active status switch button remains as is.

### 3. Detail Page Layout Structure
The detail page is integrated inside the modular dashboard sidebar.
*   **Profile Header**:
    *   Displays the partner's full name (`text-2xl font-extrabold`).
    *   Displays the unique affiliate code badge (`text-xs font-extrabold text-[#7C3AED] bg-[#FAF8FE] border border-[#7C3AED]/20 px-3 py-1 rounded-full`).
    *   Active/Inactive status indicator.
    *   No avatar profile images (hidden/removed).
*   **Key Statistics Cards (3 Cards)**:
    1.  **Total Pendapatan Komisi** (IDR): Accumulative commission from all orders computed dynamically based on the rate.
    2.  **Total Transaksi** (Count): Count of successful orders using this referral code.
    3.  **Persentase Komisi** (%): The custom `commission_rate` for this partner.
*   **Referred Transactions Table**:
    Lists all orders referred by this affiliate code.
    *   *Columns*:
        1.  `Order ID` (bold, redirects to `/orders/[id]` in new tab)
        2.  `Nama Pembeli`
        3.  `Tanggal Transaksi`
        4.  `Jumlah Tiket`
        5.  `Nominal Transaksi`
        6.  `Komisi Afiliator` (amount computed: transaction value * commission rate / 100)

---

## 🔒 Verification Plan
1.  **TypeScript Compilation**: Run `npx tsc --noEmit` to ensure zero compilation or parameter type errors.
2.  **Next.js Production Build**: Run `npm run build` to verify routes bundle correctly.
3.  **UI Verification**: Visit `/admin/referral/[code]` directly, check layout responsiveness and visual neobrutalism consistency.
