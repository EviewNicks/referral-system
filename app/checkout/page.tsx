import { notFound } from "next/navigation";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CheckoutClient } from "@/features/checkout";
import { Button } from "@/components/ui/button";

type PageProps = {
  searchParams: Promise<{
    event?: string;
    tickets?: string;
    ref?: string;
  }>;
};

export default async function CheckoutPage({ searchParams }: PageProps) {
  const { event: eventId, tickets: ticketsQuery, ref: refCode } = await searchParams;

  if (!eventId || !ticketsQuery) {
    return <CheckoutErrorState message="Link checkout tidak valid. Parameter event atau tiket tidak ditemukan." />;
  }

  // 1. Fetch Event Details
  const event = await prisma.events.findUnique({
    where: { id: eventId },
    select: {
      id: true,
      name: true,
      city: true,
      location: true,
      thumbnail_image: true,
      admin_fee: true,
      event_status_id: true,
    },
  });

  if (!event || event.event_status_id !== 1) {
    return <CheckoutErrorState message="Event tidak ditemukan atau belum dipublikasikan." />;
  }

  // 2. Parse tickets query string (Format: id:qty,id:qty)
  const ticketRequests: Array<{ id: string; qty: number }> = [];
  try {
    const pairs = ticketsQuery.split(",");
    pairs.forEach((pair) => {
      const [id, qtyStr] = pair.split(":");
      const qty = parseInt(qtyStr, 10);
      if (id && !isNaN(qty) && qty > 0) {
        ticketRequests.push({ id, qty });
      }
    });
  } catch (error) {
    return <CheckoutErrorState message="Format data tiket dalam keranjang tidak valid." />;
  }

  if (ticketRequests.length === 0) {
    return <CheckoutErrorState message="Tidak ada tiket valid yang dipilih untuk dibeli." />;
  }

  // 3. Fetch ticket categories for the event
  const categories = await prisma.ticket_categories.findMany({
    where: {
      id: { in: ticketRequests.map((tr) => tr.id) },
      event_id: eventId,
      ticket_category_status_id: 1, // Must be Active
    },
    select: {
      id: true,
      name: true,
      price: true,
      stock: true,
      maximum_tickets_per_transaction: true,
    },
  });

  // Map requests to detailed categories
  const ticketsToBuy = ticketRequests
    .map((tr) => {
      const cat = categories.find((c) => c.id === tr.id);
      if (!cat) return null;
      return {
        category: {
          id: cat.id,
          name: cat.name,
          price: cat.price,
        },
        quantity: Math.min(tr.qty, cat.stock, cat.maximum_tickets_per_transaction ?? Infinity),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (ticketsToBuy.length === 0) {
    return <CheckoutErrorState message="Semua tiket yang Anda pilih sedang tidak tersedia atau habis terjual." />;
  }

  // Ensure type-safe serialization mapping for event details (admin_fee)
  const serializedEvent = {
    id: event.id,
    name: event.name,
    city: event.city,
    location: event.location,
    thumbnail_image: event.thumbnail_image,
    admin_fee: event.admin_fee,
  };

  return (
    <CheckoutClient
      event={serializedEvent}
      ticketsToBuy={ticketsToBuy}
      refCode={refCode}
    />
  );
}

// Reusable Brutalist Error Screen
function CheckoutErrorState({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 flex flex-col items-center text-center gap-6">
      <div className="h-14 w-14 bg-red-100 border-2 border-red-500 rounded-full flex items-center justify-center text-red-500 shadow-[2px_2px_0px_#000]">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-extrabold text-black">Checkout Gagal</h2>
        <p className="text-sm text-gray-500 font-semibold">{message}</p>
      </div>
      <Link href="/">
        <Button variant="default" className="border-2 border-black font-extrabold bg-[#CAFF04] hover:bg-[#b0df03] text-black">
          Kembali ke Beranda
        </Button>
      </Link>
    </div>
  );
}
