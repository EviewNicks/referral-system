import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { EventDetailClient } from "@/features/catalog";
import { AffiliateCapture } from "@/features/affiliates";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;

  // Check Supabase Auth user role
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const role = user?.user_metadata?.role;
  const isAdmin = role === "SUPER_ADMIN" || role === "ADMIN";

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
    id: event.id,
    name: event.name,
    code: event.code,
    category: event.category,
    city: event.city,
    province: event.province,
    location: event.location,
    location_link: event.location_link,
    description: event.description,
    thumbnail_image: event.thumbnail_image,
    detail_image: event.detail_image,
    start_date: event.start_date ? event.start_date.toISOString() : null,
    end_date: event.end_date ? event.end_date.toISOString() : null,
    contact_person: event.contact_person,
    ticket_categories: event.ticket_categories.map(tc => ({
      id: tc.id,
      name: tc.name,
      price: tc.price,
      stock: tc.stock,
      maximum_tickets_per_transaction: tc.maximum_tickets_per_transaction ?? tc.stock,
    }))
  };

  return (
    <>
      <AffiliateCapture />
      <EventDetailClient event={serializedEvent} isAdmin={isAdmin} />
    </>
  );
}
