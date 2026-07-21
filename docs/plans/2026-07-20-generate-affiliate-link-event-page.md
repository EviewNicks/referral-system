# Generate Affiliate Link on Event Page Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Load executing-plans to implement this plan task-by-task.

**Goal:** Allow administrators visiting an event detail page with the secret query parameter (`?secret=2453ard`) to select a partner and generate a tracked affiliate URL using a popup dialog matching the mockup design (`affiliate-link.png`).

**Architecture:**
*   **Server Verification**: Parse parameters in `app/events/[slug]/page.tsx` and check admin credentials securely using environment variables, passing `isAdmin` to the client.
*   **Dynamic Component Layer**: Incorporate an "Affiliate Link" button and interactive dialog inside `features/catalog/components/EventDetailClient.tsx` that queries active partners dynamically using the `getAffiliatesAction` server action.

**Tech Stack:** Next.js App Router (React, Server Actions), Tailwind CSS, Lucide icons, Prisma.

---

### Task 1: Pass Admin Authorization Prop from Server Page
**Files:**
*   Modify: `app/events/[slug]/page.tsx`

**Step 1: Write server-side check and pass down props**
Update `EventDetailPage` to parse `searchParams`, compare the secret query parameter with `process.env.ADMIN_SECRET_KEY`, and pass the boolean `isAdmin` down to `EventDetailClient`.

```typescript
type Props = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    secret?: string;
  }>;
};

export default async function EventDetailPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { secret } = await searchParams;

  const isAdmin = !!(secret && secret === process.env.ADMIN_SECRET_KEY);

  // ... fetch event as before ...

  return (
    <>
      <AffiliateCapture />
      <EventDetailClient event={serializedEvent} isAdmin={isAdmin} />
    </>
  );
}
```

**Step 2: Verify typescript compilation**
Run: `npx tsc --noEmit`
Expected: Compile error because `EventDetailClient` does not accept `isAdmin` prop yet.

---

### Task 2: Implement Admin Affiliate Button and Modal Dialog
**Files:**
*   Modify: `features/catalog/components/EventDetailClient.tsx`

**Step 1: Declare props, fetch partners and build dialog layout**
1. Update `EventDetailClientProps` to accept `isAdmin?: boolean`.
2. Add state hook `const [isAffiliateModalOpen, setIsAffiliateModalOpen] = useState(false)`.
3. Add state hook `const [affiliates, setAffiliates] = useState<any[]>([]);` and loading/error states.
4. Fetch active affiliates when the modal opens using `getAffiliatesAction()` and filter for `is_active === true`.
5. Implement the dropdown select control matching the look of the mockup:
    *   Show custom avatar initials.
    *   Show partner name on the left and bold custom code on the right.
6. Generate the link dynamically:
    *   `${window.location.origin}/events/${event.code}?AFFIL=${selectedAffiliateCode}` (use window.location if client-side).
7. Implement Copy to Clipboard logic for both the copy button and the full dark footer button "Salin Link".

**Step 2: Verify compilation**
Run: `npx tsc --noEmit`
Expected: PASS

---

### Task 3: Build and Package Verification
**Files:**
*   N/A

**Step 1: Run production build check**
Run: `npm run build`
Expected: Production build finishes successfully with 0 errors.
