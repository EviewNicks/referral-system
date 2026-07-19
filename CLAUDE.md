# CLAUDE.md — Referral System EO Universe

Developer guide and development commands for the Event Ticket Referral Platform.

---

## 🛠️ Command Reference

### Development & Build
*   **Run Development Server**: `npm run dev` (starts server locally at `http://localhost:3002`)
*   **Build Production Bundle**: `npm run build`
*   **Start Production Server**: `npm start`
*   **Typecheck Codebase**: `npx tsc --noEmit`
*   **Lint Code**: `npm run lint`

### Database (Prisma ORM)
*   **Sync Database Schema**: `npx prisma db push`
*   **Generate Prisma Client**: `npx prisma generate`
*   **Open Database Studio**: `npx prisma studio`

---

## 📐 Architecture Guidelines (Modular Features)

This project strictly adheres to the **Modular Feature Architecture** defined in [architecture.md](file:///D:/2-Project/referral-system/docs/guide/architecture.md):

*   **App Routing (`/app`)**: Contains routing segments, pages, layouts, and server actions/APIs. Pages must not hold heavy inline components.
*   **Feature Modules (`/features/[feature-name]`)**: Holds business-related code (components, actions, hooks, services, types) grouped by specific features:
    *   `catalog` — Catalog page, Event details client UI, carousel slides, and cards.
    *   `checkout` — Ticket purchase forms, inputs, validations, and server order creations.
    *   `orders` — Customer e-tickets, QR codes, receipts, and layout templates.
    *   `admin` — Admin dashboard layouts, filters, tables, and visualization charts.
*   **Entry Points (`index.ts`)**: Each feature module has an `index.ts` file that manages public exports. App router files should import only from `@/features/[feature]`.
*   **Shared Globals (`/components`, `/lib`)**: Global layouts (`Navbar`, `Footer`) and base Shadcn-UI components (`/components/ui`) are kept shared outside of features.

---

## 🎨 Code Style & Quality Standards

1.  **TypeScript First**:
    *   Strict type definition. Avoid `any`.
    *   Handle nullable types correctly (e.g. optional fields fallback with `?? Infinity` or standard defaults).
2.  **Server Components**:
    *   Use Server Components by default for pages, DB queries, and print layouts to minimize bundle size.
    *   Add `"use client"` directives only when React hook states, browser events, or custom animation is required.
3.  **UI Styles**:
    *   Use Tailwind CSS. Avoid raw CSS or inline values.
    *   Maintain the clean, modern SaaS visual identity (soft borders, rounded corners, soft pastel tints) matching the target mockups.
