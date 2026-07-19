import { prisma } from "@/lib/prisma";
import { EventCarousel, NearbyEvents, CTABanner } from "@/features/catalog";

async function getEvents() {
  const events = await prisma.events.findMany({
    where: {
      event_status_id: 1, // Published
    },
    select: {
      id: true,
      name: true,
      code: true,
      category: true,
      city: true,
      location: true,
      thumbnail_image: true,
      slide_image: true,
      start_date: true,
      ticket_categories: {
        where: {
          ticket_category_status_id: 1, // Active
        },
        select: {
          price: true,
        },
        orderBy: {
          price: "asc",
        },
        take: 1,
      },
    },
    orderBy: {
      start_date: "asc",
    },
  });

  return events.map((e) => ({
    ...e,
    minPrice: e.ticket_categories[0]?.price ?? null,
  }));
}

export default async function Home() {
  const events = await getEvents();
  
  // Filter events that have slide images for the hero carousel, fall back to first 5 events
  const carouselEvents = events.filter((e) => e.slide_image).slice(0, 5);
  const heroEvents = carouselEvents.length > 0 ? carouselEvents : events.slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">
      {/* Hero Carousel */}
      {heroEvents.length > 0 && (
        <section className="w-full">
          <EventCarousel events={heroEvents} />
        </section>
      )}

      {/* Grid Events List */}
      <NearbyEvents events={events} />

      {/* CTA Bottom Banner */}
      <CTABanner />
    </div>
  );
}
