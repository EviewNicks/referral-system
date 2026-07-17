import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import EventDetailClient from "@/components/event/EventDetailClient";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;

  // Find event by code or ID
  const event = await prisma.events.findFirst({
    where: {
      OR: [
        { code: slug },
        { id: slug }
      ],
      event_status_id: 1, // Must be Published
    },
    include: {
      ticket_categories: {
        where: {
          ticket_category_status_id: 1, // Must be Active
        },
        orderBy: {
          price: "asc",
        },
      },
    },
  });

  if (!event) {
    notFound();
  }

  // Ensure type-safe serialization mapping for RSC to Client component
  const serializedEvent = {
    ...event,
    start_date: event.start_date ? event.start_date.toISOString() : null,
    end_date: event.end_date ? event.end_date.toISOString() : null,
    ticket_categories: event.ticket_categories.map(tc => ({
      id: tc.id,
      name: tc.name,
      price: tc.price,
      stock: tc.stock,
      maximum_tickets_per_transaction: tc.maximum_tickets_per_transaction,
    }))
  };

  return <EventDetailClient event={serializedEvent} />;
}
